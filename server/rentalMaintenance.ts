import type { Request, Response } from "express";
import { and, eq, lte, or, sql } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { rentalInsurancePolicies, rentalMaintenanceAlerts, rentalMaintenanceAutomations, rentalMaintenanceProfiles, rentalVehicles } from "../drizzle/schema";

export async function rentalMaintenanceAlertsHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb(); if (!db) return res.status(503).json({ error: "database-unavailable" });
    const [automation] = await db.select().from(rentalMaintenanceAutomations).where(eq(rentalMaintenanceAutomations.scheduleCronTaskUid, user.taskUid)).limit(1);
    if (!automation || !automation.enabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });
    const threshold = new Date(Date.now() + automation.alertDaysBefore * 86400000);
    const profiles = await db.select({ vehicleId: rentalMaintenanceProfiles.vehicleId, dueDate: rentalMaintenanceProfiles.nextServiceDate, dueOdometer: rentalMaintenanceProfiles.nextServiceOdometer, odometer: rentalVehicles.odometer }).from(rentalMaintenanceProfiles).innerJoin(rentalVehicles, and(eq(rentalVehicles.id, rentalMaintenanceProfiles.vehicleId), eq(rentalVehicles.businessEntityId, automation.businessEntityId))).where(and(eq(rentalMaintenanceProfiles.businessEntityId, automation.businessEntityId), or(lte(rentalMaintenanceProfiles.nextServiceDate, threshold), sql`${rentalVehicles.odometer} + ${automation.alertKmBefore} >= ${rentalMaintenanceProfiles.nextServiceOdometer}`)));
    let created = 0;
    for (const profile of profiles) { const type = profile.dueDate && profile.dueDate.getTime() < Date.now() ? "overdue" : profile.dueOdometer != null && profile.odometer >= profile.dueOdometer ? "odometer_threshold" : "due_soon"; const dedupeKey = `maintenance:${profile.vehicleId}:${type}:${profile.dueDate?.toISOString().slice(0,10) ?? profile.dueOdometer ?? 'none'}`; await db.insert(rentalMaintenanceAlerts).values({ businessEntityId: automation.businessEntityId, vehicleId: profile.vehicleId, alertType: type, dueDate: profile.dueDate, dueOdometer: profile.dueOdometer, dedupeKey }).onDuplicateKeyUpdate({ set: { status: "open" } }); created++; }
    const policies = await db.select().from(rentalInsurancePolicies).where(and(eq(rentalInsurancePolicies.businessEntityId, automation.businessEntityId), eq(rentalInsurancePolicies.status, "active"), lte(rentalInsurancePolicies.expiresAt, threshold)));
    for (const policy of policies) { const dedupeKey = `insurance:${policy.vehicleId}:${policy.policyNo}:${policy.expiresAt.toISOString().slice(0,10)}`; await db.insert(rentalMaintenanceAlerts).values({ businessEntityId: automation.businessEntityId, vehicleId: policy.vehicleId, alertType: "insurance_expiry", dueDate: policy.expiresAt, dedupeKey }).onDuplicateKeyUpdate({ set: { status: "open" } }); created++; }
    await db.update(rentalMaintenanceAutomations).set({ lastRunAt: new Date() }).where(eq(rentalMaintenanceAutomations.id, automation.id));
    return res.json({ ok: true, evaluated: profiles.length + policies.length, alertsUpserted: created });
  } catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : "unknown", stack: error instanceof Error ? error.stack : undefined, context: { url: req.originalUrl }, timestamp: new Date().toISOString() }); }
}
