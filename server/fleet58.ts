import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { fleetDriverAssignments58, fleetDriverProfiles58, fleetFuelAnomalies58, fleetFuelEntries, fleetLifecycleEvents58, fleetTelemetryPolicies58, fleetUtilizationSnapshots58, rentalVehicles } from "../drizzle/schema";
import { calculateFuelAnalytics58, driverCompliance58, isFuelAnomaly58, lifecycleTransition58, telemetryAccess58 } from "../shared/fleet58";
import { getDb } from "./db";
import { assertEntityAccess } from "./entityAccess";
import { protectedProcedure, router } from "./_core/trpc";

const inputEntity = z.object({ businessEntityId: z.number().int().positive() });
const requireFleet58 = (role: string) => { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Fleet privilege required" }); };

export const fleet58Router = router({
  overview: protectedProcedure.input(inputEntity).query(async ({ ctx, input }) => {
    requireFleet58(ctx.user.role); await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.view"); const db = await getDb();
    if (!db) return { drivers: [], assignments: [], anomalies: [], policies: [], utilization: [], compliance: { expiring: 0, expired: 0, trainingGaps: 0 } };
    const [drivers, assignments, anomalies, policies, utilization] = await Promise.all([
      db.select().from(fleetDriverProfiles58).where(eq(fleetDriverProfiles58.businessEntityId, input.businessEntityId)).orderBy(desc(fleetDriverProfiles58.id)).limit(100),
      db.select().from(fleetDriverAssignments58).where(eq(fleetDriverAssignments58.businessEntityId, input.businessEntityId)).orderBy(desc(fleetDriverAssignments58.id)).limit(100),
      db.select().from(fleetFuelAnomalies58).where(and(eq(fleetFuelAnomalies58.businessEntityId, input.businessEntityId), eq(fleetFuelAnomalies58.status, "open"))).orderBy(desc(fleetFuelAnomalies58.id)).limit(100),
      db.select().from(fleetTelemetryPolicies58).where(eq(fleetTelemetryPolicies58.businessEntityId, input.businessEntityId)).orderBy(desc(fleetTelemetryPolicies58.id)).limit(20),
      db.select().from(fleetUtilizationSnapshots58).where(eq(fleetUtilizationSnapshots58.businessEntityId, input.businessEntityId)).orderBy(desc(fleetUtilizationSnapshots58.createdAt)).limit(100),
    ]);
    const now = new Date();
    const compliance = { expiring: drivers.filter(d => driverCompliance58(d.licenseExpiresAt, d.trainingStatus, now).warning).length, expired: drivers.filter(d => !driverCompliance58(d.licenseExpiresAt, d.trainingStatus, now).licenseOk).length, trainingGaps: drivers.filter(d => d.trainingStatus !== "valid").length };
    return { drivers, assignments, anomalies, policies, utilization, compliance };
  }),
  upsertDriverProfile: protectedProcedure.input(inputEntity.extend({ driverId: z.number().int().positive(), licenseClass: z.string().trim().min(1).max(40), licenseReference: z.string().trim().min(2).max(120), licenseExpiresAt: z.coerce.date().nullable().optional(), trainingStatus: z.enum(["valid", "expiring", "expired", "not_started"]).default("not_started"), status: z.enum(["active", "suspended", "expired"]).default("active"), notes: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    requireFleet58(ctx.user.role); await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.manage"); const db = await getDb(); if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [existing] = await db.select().from(fleetDriverProfiles58).where(and(eq(fleetDriverProfiles58.businessEntityId, input.businessEntityId), eq(fleetDriverProfiles58.driverId, input.driverId))).limit(1);
    if (existing) { await db.update(fleetDriverProfiles58).set({ licenseClass: input.licenseClass, licenseReference: input.licenseReference, licenseExpiresAt: input.licenseExpiresAt, trainingStatus: input.trainingStatus, status: input.status, notes: input.notes }).where(eq(fleetDriverProfiles58.id, existing.id)); return { profile: { ...existing, ...input }, updated: true }; }
    const [profile] = await db.insert(fleetDriverProfiles58).values({ ...input, licenseExpiresAt: input.licenseExpiresAt }).$returningId(); return { profile: { ...profile, ...input }, updated: false };
  }),
  assignDriver: protectedProcedure.input(inputEntity.extend({ vehicleId: z.number().int().positive(), driverId: z.number().int().positive(), branchId: z.number().int().positive().optional(), purpose: z.string().trim().min(2).max(180), startAt: z.coerce.date(), endAt: z.coerce.date().optional(), odometerAtStart: z.number().int().nonnegative(), acknowledgement: z.boolean().default(false), idempotencyKey: z.string().trim().min(8).max(160) })).mutation(async ({ ctx, input }) => {
    requireFleet58(ctx.user.role); await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.manage"); const db = await getDb(); if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [vehicle] = await db.select().from(rentalVehicles).where(and(eq(rentalVehicles.id, input.vehicleId), eq(rentalVehicles.businessEntityId, input.businessEntityId))).limit(1); if (!vehicle) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found in this entity" });
    const [replay] = await db.select().from(fleetDriverAssignments58).where(and(eq(fleetDriverAssignments58.businessEntityId, input.businessEntityId), eq(fleetDriverAssignments58.idempotencyKey, input.idempotencyKey))).limit(1); if (replay) return { assignment: replay, replayed: true };
    const [assignment] = await db.insert(fleetDriverAssignments58).values({ ...input, createdByUserId: ctx.user.id }).$returningId(); return { assignment: { ...assignment, ...input }, replayed: false };
  }),
  setTelemetryPolicy: protectedProcedure.input(inputEntity.extend({ purpose: z.enum(["maintenance", "safety", "utilization", "incident", "rental"]), retentionDays: z.number().int().min(1).max(3650), allowLiveTracking: z.boolean().default(false), maskCoordinates: z.boolean().default(true), allowedRoles: z.array(z.string().min(1)).min(1), status: z.enum(["active", "inactive"]).default("active") })).mutation(async ({ ctx, input }) => {
    requireFleet58(ctx.user.role); await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.manage"); const db = await getDb(); if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [existing] = await db.select().from(fleetTelemetryPolicies58).where(and(eq(fleetTelemetryPolicies58.businessEntityId, input.businessEntityId), eq(fleetTelemetryPolicies58.purpose, input.purpose))).limit(1);
    const values = { ...input, allowedRoles: JSON.stringify(input.allowedRoles) };
    if (existing) { await db.update(fleetTelemetryPolicies58).set(values).where(eq(fleetTelemetryPolicies58.id, existing.id)); return { policy: { ...existing, ...input }, updated: true }; }
    const [policy] = await db.insert(fleetTelemetryPolicies58).values(values).$returningId(); return { policy: { ...policy, ...input }, updated: false };
  }),
  recordLifecycle: protectedProcedure.input(inputEntity.extend({ vehicleId: z.number().int().positive(), fromStatus: z.string().trim().min(2).max(40), toStatus: z.string().trim().min(2).max(40), reason: z.string().trim().min(3).max(240), source: z.string().trim().min(2).max(80), idempotencyKey: z.string().trim().min(8).max(160) })).mutation(async ({ ctx, input }) => {
    requireFleet58(ctx.user.role); await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.manage"); const db = await getDb(); if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [vehicle] = await db.select().from(rentalVehicles).where(and(eq(rentalVehicles.id, input.vehicleId), eq(rentalVehicles.businessEntityId, input.businessEntityId))).limit(1); if (!vehicle) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found in this entity" });
    if (!lifecycleTransition58(input.fromStatus as never, input.toStatus as never)) throw new TRPCError({ code: "CONFLICT", message: "Invalid lifecycle transition" });
    const [replay] = await db.select().from(fleetLifecycleEvents58).where(and(eq(fleetLifecycleEvents58.businessEntityId, input.businessEntityId), eq(fleetLifecycleEvents58.idempotencyKey, input.idempotencyKey))).limit(1); if (replay) return { event: replay, replayed: true };
    const [event] = await db.insert(fleetLifecycleEvents58).values({ ...input, actorUserId: ctx.user.id }).$returningId(); return { event: { ...event, ...input }, replayed: false };
  }),
  telemetryAccess: protectedProcedure.input(inputEntity.extend({ purpose: z.enum(["maintenance", "safety", "utilization", "incident", "rental"]), role: z.string().min(1) })).query(async ({ ctx, input }) => {
    requireFleet58(ctx.user.role); await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.view"); const db = await getDb(); if (!db) return { allowed: false, liveTrackingAllowed: false, coordinatesMasked: true };
    const [policy] = await db.select().from(fleetTelemetryPolicies58).where(and(eq(fleetTelemetryPolicies58.businessEntityId, input.businessEntityId), eq(fleetTelemetryPolicies58.purpose, input.purpose), eq(fleetTelemetryPolicies58.status, "active"))).limit(1);
    if (!policy) return { allowed: false, liveTrackingAllowed: false, coordinatesMasked: true };
    const allowedRoles = JSON.parse(policy.allowedRoles) as string[]; return telemetryAccess58({ ...input, allowLiveTracking: policy.allowLiveTracking, maskCoordinates: policy.maskCoordinates, allowedRoles });
  }),
  utilizationSummary: protectedProcedure.input(inputEntity.extend({ vehicleId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
    requireFleet58(ctx.user.role); await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "fleet.view"); const db = await getDb(); if (!db) return []; return db.select().from(fleetUtilizationSnapshots58).where(input.vehicleId ? and(eq(fleetUtilizationSnapshots58.businessEntityId, input.businessEntityId), eq(fleetUtilizationSnapshots58.vehicleId, input.vehicleId)) : eq(fleetUtilizationSnapshots58.businessEntityId, input.businessEntityId)).orderBy(desc(fleetUtilizationSnapshots58.createdAt)).limit(200);
  }),
});
