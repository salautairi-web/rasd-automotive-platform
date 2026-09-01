import { and, desc, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { iamMemberships, mobileAudit, mobileDevices, mobilePushTokens, mobileSyncConflicts, mobileSyncCursors, mobileSyncQueue } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const deviceInput = z.object({ deviceKey: z.string().min(8).max(160), businessEntityId: z.number().int().positive().optional(), platform: z.enum(["ios", "android", "web"]), appVersion: z.string().min(1).max(40) });
const correlation = () => `mobile-${nanoid(12)}`;

async function requireEntityAccess(userId: number, entityId: number) {
  const db = await getDb(); if (!db) return false;
  const rows = await db.select({ id: iamMemberships.id }).from(iamMemberships).where(and(eq(iamMemberships.userId, userId), eq(iamMemberships.businessEntityId, entityId), eq(iamMemberships.status, "active"))).limit(1);
  return Boolean(rows[0]);
}

export const mobileRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb(); if (!db) return { activeDevices: 0, offlineDevices: 0, queuedSync: 0, conflicts: 0, pushTokens: 0 };
    const [devices, queue, conflicts, tokens] = await Promise.all([
      db.select({ active: sql<number>`sum(case when ${mobileDevices.status}='active' then 1 else 0 end)`, offline: sql<number>`sum(case when ${mobileDevices.status}='offline' then 1 else 0 end)` }).from(mobileDevices),
      db.select({ total: sql<number>`count(*)` }).from(mobileSyncQueue).where(eq(mobileSyncQueue.status, "queued")),
      db.select({ total: sql<number>`count(*)` }).from(mobileSyncConflicts).where(eq(mobileSyncConflicts.resolution, "pending")),
      db.select({ total: sql<number>`count(*)` }).from(mobilePushTokens).where(eq(mobilePushTokens.status, "active")),
    ]);
    return { activeDevices: Number(devices[0]?.active ?? 0), offlineDevices: Number(devices[0]?.offline ?? 0), queuedSync: Number(queue[0]?.total ?? 0), conflicts: Number(conflicts[0]?.total ?? 0), pushTokens: Number(tokens[0]?.total ?? 0) };
  }),
  registerDevice: protectedProcedure.input(deviceInput).mutation(async ({ ctx, input }) => {
    if (input.businessEntityId && ctx.user.role !== "admin" && !(await requireEntityAccess(ctx.user.id, input.businessEntityId))) throw new TRPCError({ code: "FORBIDDEN", message: "لا يملك المستخدم عضوية في هذا الكيان" });
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const existing = await db.select({ id: mobileDevices.id }).from(mobileDevices).where(eq(mobileDevices.deviceKey, input.deviceKey)).limit(1);
    if (existing[0]) { await db.update(mobileDevices).set({ userId: ctx.user.id, businessEntityId: input.businessEntityId, platform: input.platform, appVersion: input.appVersion, status: "active", lastSeenAt: new Date() }).where(eq(mobileDevices.id, existing[0].id)); return { id: existing[0].id, replay: true as const }; }
    const result = await db.insert(mobileDevices).values({ ...input, userId: ctx.user.id });
    return { id: Number(result[0].insertId), replay: false as const };
  }),
  registerPushToken: protectedProcedure.input(z.object({ deviceId: z.number().int().positive(), token: z.string().min(8).max(1000), provider: z.string().min(2).max(40) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const [device] = await db.select().from(mobileDevices).where(and(eq(mobileDevices.id, input.deviceId), eq(mobileDevices.userId, ctx.user.id))).limit(1);
    if (!device) throw new TRPCError({ code: "FORBIDDEN" });
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const existing = await db.select({ id: mobilePushTokens.id }).from(mobilePushTokens).where(eq(mobilePushTokens.tokenHash, tokenHash)).limit(1);
    if (existing[0]) return { id: existing[0].id, replay: true as const };
    const result = await db.insert(mobilePushTokens).values({ deviceId: input.deviceId, tokenHash, provider: input.provider });
    return { id: Number(result[0].insertId), replay: false as const };
  }),
  queueSync: protectedProcedure.input(z.object({ deviceId: z.number().int().positive(), businessEntityId: z.number().int().positive().optional(), operationKey: z.string().min(3).max(160), operationType: z.string().min(3).max(100), payload: z.record(z.string(), z.unknown()), idempotencyKey: z.string().min(8).max(180) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const [device] = await db.select().from(mobileDevices).where(and(eq(mobileDevices.id, input.deviceId), eq(mobileDevices.userId, ctx.user.id))).limit(1);
    if (!device) throw new TRPCError({ code: "FORBIDDEN" });
    if (input.businessEntityId && ctx.user.role !== "admin" && !(await requireEntityAccess(ctx.user.id, input.businessEntityId))) throw new TRPCError({ code: "FORBIDDEN" });
    const existing = await db.select({ id: mobileSyncQueue.id, status: mobileSyncQueue.status }).from(mobileSyncQueue).where(eq(mobileSyncQueue.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing[0]) return { id: existing[0].id, status: existing[0].status, replay: true as const };
    const result = await db.insert(mobileSyncQueue).values({ deviceId: input.deviceId, businessEntityId: input.businessEntityId, operationKey: input.operationKey, operationType: input.operationType, payloadJson: JSON.stringify(input.payload), idempotencyKey: input.idempotencyKey });
    await db.insert(mobileAudit).values({ userId: ctx.user.id, deviceId: input.deviceId, businessEntityId: input.businessEntityId, action: "sync.queued", resourceType: input.operationType, resourceId: input.operationKey, correlationId: correlation() });
    return { id: Number(result[0].insertId), status: "queued" as const, replay: false as const };
  }),
  syncQueue: protectedProcedure.input(z.object({ deviceId: z.number().int().positive() })).query(async ({ ctx, input }) => { const db = await getDb(); if (!db) return []; const [device] = await db.select().from(mobileDevices).where(and(eq(mobileDevices.id, input.deviceId), eq(mobileDevices.userId, ctx.user.id))).limit(1); if (!device) throw new TRPCError({ code: "FORBIDDEN" }); return db.select().from(mobileSyncQueue).where(and(eq(mobileSyncQueue.deviceId, input.deviceId), sql`${mobileSyncQueue.status} in ('queued','processing','conflict')`)).orderBy(desc(mobileSyncQueue.createdAt)).limit(100); }),
  updateCursor: protectedProcedure.input(z.object({ deviceId: z.number().int().positive(), streamKey: z.string().min(1).max(120), cursor: z.string().min(1).max(160) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [device] = await db.select().from(mobileDevices).where(and(eq(mobileDevices.id, input.deviceId), eq(mobileDevices.userId, ctx.user.id))).limit(1); if (!device) throw new TRPCError({ code: "FORBIDDEN" }); await db.insert(mobileSyncCursors).values(input).onDuplicateKeyUpdate({ set: { cursor: input.cursor } }); return { updated: true as const }; }),
  revokeDevice: protectedProcedure.input(z.object({ deviceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [device] = await db.select().from(mobileDevices).where(eq(mobileDevices.id, input.deviceId)).limit(1); if (!device || (device.userId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" }); await db.update(mobileDevices).set({ status: "revoked" }).where(eq(mobileDevices.id, input.deviceId)); return { revoked: true as const }; }),
});
