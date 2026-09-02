import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { iamSecurityEvents, rentalMaintenanceAlerts, rentalMaintenanceTasks, rentalVehicleDamages, rentalVehicleExpenses, rentalVehicleProfitability, rentalVehicles } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { assertEntityMembership, assertEntityAccess } from "./entityAccess";
import { hashIdempotencyRequest, readIdempotency, storeIdempotency } from "./idempotency";
import { getDb } from "./db";

const entityInput = z.object({ businessEntityId: z.number().int().positive() });

export const fleetRouter = router({
  overview: protectedProcedure.input(entityInput).query(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.read");
    const db = await getDb();
    if (!db) return { vehicles: [], alerts: [], profitability: [], damages: [], expenses: [], maintenance: [], totals: { fleetSize: 0, available: 0, rented: 0, maintenance: 0, accidents: 0, openAlerts: 0, netContributionMinor: 0 } };
    const [vehicles, alerts, profitability, damages, expenses, maintenance] = await Promise.all([
      db.select().from(rentalVehicles).where(eq(rentalVehicles.businessEntityId, input.businessEntityId)).orderBy(desc(rentalVehicles.id)).limit(100),
      db.select().from(rentalMaintenanceAlerts).where(and(eq(rentalMaintenanceAlerts.businessEntityId, input.businessEntityId), eq(rentalMaintenanceAlerts.status, "open"))).orderBy(desc(rentalMaintenanceAlerts.createdAt)).limit(50),
      db.select().from(rentalVehicleProfitability).where(eq(rentalVehicleProfitability.businessEntityId, input.businessEntityId)).orderBy(desc(rentalVehicleProfitability.calculatedAt)).limit(100),
      db.select().from(rentalVehicleDamages).where(eq(rentalVehicleDamages.businessEntityId, input.businessEntityId)).orderBy(desc(rentalVehicleDamages.id)).limit(50),
      db.select().from(rentalVehicleExpenses).where(eq(rentalVehicleExpenses.businessEntityId, input.businessEntityId)).orderBy(desc(rentalVehicleExpenses.incurredAt)).limit(50),
      db.select().from(rentalMaintenanceTasks).where(eq(rentalMaintenanceTasks.businessEntityId, input.businessEntityId)).orderBy(desc(rentalMaintenanceTasks.id)).limit(50),
    ]);
    return { vehicles, alerts, profitability, damages, expenses, maintenance, totals: { fleetSize: vehicles.length, available: vehicles.filter(v => v.status === "available" || v.status === "ready").length, rented: vehicles.filter(v => v.status === "rented").length, maintenance: vehicles.filter(v => v.status === "maintenance").length, accidents: vehicles.filter(v => v.status === "accident").length, openAlerts: alerts.length, netContributionMinor: profitability.reduce((sum, row) => sum + row.netContributionMinor, 0) } };
  }),
  setVehicleStatus: protectedProcedure.input(entityInput.extend({ vehicleId: z.number().int().positive(), status: z.enum(["available", "ready", "rented", "maintenance", "accident", "inactive"]), idempotencyKey: z.string().trim().min(8).max(160), correlationId: z.string().trim().min(8).max(100).optional() })).mutation(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.manage");
    const db = await getDb();
    if (!db) throw new Error("database_unavailable");
    const correlationId = input.correlationId ?? `fleet-${nanoid(12)}`;
    const requestHash = hashIdempotencyRequest([ctx.user.id, input.businessEntityId, input.vehicleId, input.status, correlationId]);
    const prior = await readIdempotency(input.idempotencyKey, requestHash);
    if (prior) return { ...prior, replay: true as const };
    const result = await db.transaction(async tx => {
      const [vehicle] = await tx.select({ id: rentalVehicles.id, status: rentalVehicles.status }).from(rentalVehicles).where(and(eq(rentalVehicles.id, input.vehicleId), eq(rentalVehicles.businessEntityId, input.businessEntityId))).limit(1);
      if (!vehicle) throw new Error("vehicle_not_found_in_entity");
      if (vehicle.status === input.status) return { vehicleId: vehicle.id, previousStatus: vehicle.status, status: vehicle.status, correlationId, replay: true as const };
      const updated = await tx.update(rentalVehicles).set({ status: input.status }).where(and(eq(rentalVehicles.id, input.vehicleId), eq(rentalVehicles.businessEntityId, input.businessEntityId), eq(rentalVehicles.status, vehicle.status)));
      if (!updated[0].affectedRows) throw new Error("vehicle_status_conflict");
      return { vehicleId: vehicle.id, previousStatus: vehicle.status, status: input.status, correlationId, replay: false as const };
    });
    await storeIdempotency(input.idempotencyKey, "fleet.setVehicleStatus", requestHash, result);
    await db.insert(iamSecurityEvents).values({ userId: ctx.user.id, businessEntityId: input.businessEntityId, eventType: "FleetVehicleStatusChanged", outcome: "success", resourceType: "rental_vehicle", resourceId: String(result.vehicleId), correlationId, detailsJson: JSON.stringify({ previousStatus: result.previousStatus, status: result.status }) });
    return result;
  }),
  assertMembership: protectedProcedure.input(entityInput).query(async ({ ctx, input }) => {
    await assertEntityMembership(ctx.user.id, ctx.user.role, input.businessEntityId);
    return { allowed: true as const, businessEntityId: input.businessEntityId };
  }),
});
