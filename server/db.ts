import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, organizations, branches, businessUnits, customers, vehicles, products, integrationEvents, tasks, auditLogs, idempotencyKeys } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date(); updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }

export async function getRasdOverview() {
  const db = await getDb();
  if (!db) return { organizationCount: 0, branchCount: 0, customerCount: 0, vehicleCount: 0, productCount: 0, openTaskCount: 0, pendingEventCount: 0, failedEventCount: 0, organizations: [], events: [] };
  const count = async (table: any, where?: any) => { const rows = await db.select({ value: sql<number>`count(*)` }).from(table).where(where); return Number(rows[0]?.value ?? 0); };
  const [organizationCount, branchCount, customerCount, vehicleCount, productCount, openTaskCount, pendingEventCount, failedEventCount] = await Promise.all([
    count(organizations), count(branches), count(customers), count(vehicles), count(products), count(tasks, sql`status in ('open','in_progress','escalated')`), count(integrationEvents, eq(integrationEvents.status, "pending")), count(integrationEvents, eq(integrationEvents.status, "failed")),
  ]);
  const [orgRows, events] = await Promise.all([
    db.select({ code: organizations.code, nameAr: organizations.nameAr, status: organizations.status }).from(organizations).orderBy(desc(organizations.createdAt)).limit(5),
    db.select({ eventType: integrationEvents.eventType, sourceSystem: integrationEvents.sourceSystem, status: integrationEvents.status, retryCount: integrationEvents.retryCount, createdAt: integrationEvents.createdAt }).from(integrationEvents).orderBy(desc(integrationEvents.createdAt)).limit(6),
  ]);
  return { organizationCount, branchCount, customerCount, vehicleCount, productCount, openTaskCount, pendingEventCount, failedEventCount, organizations: orgRows, events };
}

export async function createAuditLog(input: { userId?: number; organizationId?: number; systemKey: string; entityType: string; entityId: string; action: string; correlationId?: string; requestId?: string; newValue?: string; }) {
  const db = await getDb(); if (!db) return;
  await db.insert(auditLogs).values(input);
}

export async function enqueueEvent(input: { eventId: string; eventType: string; sourceSystem: string; entityType: string; entityId: string; correlationId: string; payload: string; idempotencyKey: string; requestHash: string }) {
  const db = await getDb(); if (!db) return { accepted: false, reason: "database_unavailable" as const };
  const prior = await db.select({ requestHash: idempotencyKeys.requestHash, responsePayload: idempotencyKeys.responsePayload }).from(idempotencyKeys).where(eq(idempotencyKeys.key, input.idempotencyKey)).limit(1);
  if (prior[0] && prior[0].requestHash !== input.requestHash) return { accepted: false, duplicate: true, status: "idempotency_conflict" as const };
  if (prior[0]) return { accepted: false, duplicate: true, status: "idempotent_replay" as const };
  await db.insert(idempotencyKeys).values({ key: input.idempotencyKey, operation: "integration.intakeEvent", requestHash: input.requestHash });
  const existing = await db.select({ eventId: integrationEvents.eventId, status: integrationEvents.status }).from(integrationEvents).where(eq(integrationEvents.eventId, input.eventId)).limit(1);
  if (existing[0]) return { accepted: false, duplicate: true, status: existing[0].status };
  await db.insert(integrationEvents).values({ eventId: input.eventId, eventType: input.eventType, sourceSystem: input.sourceSystem, entityType: input.entityType, entityId: input.entityId, correlationId: input.correlationId, payload: input.payload });
  const responsePayload = JSON.stringify({ accepted: true, duplicate: false });
  await db.update(idempotencyKeys).set({ responsePayload }).where(eq(idempotencyKeys.key, input.idempotencyKey));
  return { accepted: true, duplicate: false };
}
