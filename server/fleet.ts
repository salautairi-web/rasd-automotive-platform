import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rentalMaintenanceAlerts, rentalMaintenanceTasks, rentalVehicleDamages, rentalVehicleExpenses, rentalVehicleProfitability, rentalVehicles } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const requireFleet = (role: string) => { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Fleet privilege required" }); };

export const fleetRouter = router({
  overview: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    requireFleet(ctx.user.role);
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
});
