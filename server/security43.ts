import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { iamAbacPolicies43, iamConditionalAccess43, iamPrivilegeRequests43, securityBreakGlass43, securityIncidents43, securityRiskSignals43, iamSecurityEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { hasEntityMembership } from "./iam";
import { evaluateAbacDecision, evaluateConditionalAccess, isBreakGlassActive, isPrivilegeRequestActive, type AccessContext43 } from "../shared/security43";

const entityId = z.number().int().positive().nullable().optional();
const requireAdmin = (role: string) => { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية الأمن المؤسسي مطلوبة" }); };
async function assertEntity(ctx: { user: { id: number; role: string } }, businessEntityId: number | null | undefined) {
  if (businessEntityId == null || ctx.user.role === "admin") return;
  if (!await hasEntityMembership(ctx.user.id, businessEntityId)) throw new TRPCError({ code: "FORBIDDEN", message: "لا توجد عضوية في نطاق الكيان" });
}

export const security43Router = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { policies: 0, conditionalPolicies: 0, pendingPrivilege: 0, openRisks: 0, openIncidents: 0, activeBreakGlass: 0 };
    const [policies, conditions, privileges, risks, incidents, breakGlass] = await Promise.all([
      db.select({ total: sql<number>`count(*)` }).from(iamAbacPolicies43).where(eq(iamAbacPolicies43.status, "active")),
      db.select({ total: sql<number>`count(*)` }).from(iamConditionalAccess43).where(eq(iamConditionalAccess43.status, "active")),
      db.select({ total: sql<number>`count(*)` }).from(iamPrivilegeRequests43).where(eq(iamPrivilegeRequests43.status, "requested")),
      db.select({ total: sql<number>`count(*)` }).from(securityRiskSignals43).where(eq(securityRiskSignals43.status, "open")),
      db.select({ total: sql<number>`count(*)` }).from(securityIncidents43).where(sql`${securityIncidents43.phase} <> 'closed'`),
      db.select({ total: sql<number>`count(*)` }).from(securityBreakGlass43).where(sql`${securityBreakGlass43.status} in ('approved','active') and ${securityBreakGlass43.expiresAt} > now()`),
    ]);
    return { policies: Number(policies[0]?.total ?? 0), conditionalPolicies: Number(conditions[0]?.total ?? 0), pendingPrivilege: Number(privileges[0]?.total ?? 0), openRisks: Number(risks[0]?.total ?? 0), openIncidents: Number(incidents[0]?.total ?? 0), activeBreakGlass: Number(breakGlass[0]?.total ?? 0) };
  }),
  policies: protectedProcedure.query(async ({ ctx }) => { requireAdmin(ctx.user.role); const db = await getDb(); return db ? db.select().from(iamAbacPolicies43).orderBy(desc(iamAbacPolicies43.updatedAt)).limit(100) : []; }),
  conditionalPolicies: protectedProcedure.query(async ({ ctx }) => { requireAdmin(ctx.user.role); const db = await getDb(); return db ? db.select().from(iamConditionalAccess43).orderBy(desc(iamConditionalAccess43.id)).limit(100) : []; }),
  privilegeRequests: protectedProcedure.input(z.object({ businessEntityId: entityId })).query(async ({ ctx, input }) => { await assertEntity(ctx, input.businessEntityId); const db = await getDb(); return db ? db.select().from(iamPrivilegeRequests43).where(input.businessEntityId == null ? sql`1=1` : eq(iamPrivilegeRequests43.businessEntityId, input.businessEntityId)).orderBy(desc(iamPrivilegeRequests43.createdAt)).limit(100) : []; }),
  riskSignals: protectedProcedure.input(z.object({ businessEntityId: entityId })).query(async ({ ctx, input }) => { await assertEntity(ctx, input.businessEntityId); const db = await getDb(); return db ? db.select().from(securityRiskSignals43).where(input.businessEntityId == null ? sql`1=1` : eq(securityRiskSignals43.businessEntityId, input.businessEntityId)).orderBy(desc(securityRiskSignals43.observedAt)).limit(100) : []; }),
  incidents: protectedProcedure.input(z.object({ businessEntityId: entityId })).query(async ({ ctx, input }) => { await assertEntity(ctx, input.businessEntityId); const db = await getDb(); return db ? db.select().from(securityIncidents43).where(input.businessEntityId == null ? sql`1=1` : eq(securityIncidents43.businessEntityId, input.businessEntityId)).orderBy(desc(securityIncidents43.detectedAt)).limit(100) : []; }),
  evaluateAccess: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive().nullable(), permissionKey: z.string().min(3), deviceTrusted: z.boolean(), mfaFresh: z.boolean(), riskScore: z.number().int().min(0).max(100), withinTimeWindow: z.boolean(), requesterIsApprover: z.boolean().default(false), rules: z.array(z.object({ effect: z.enum(["allow", "deny"]), attribute: z.enum(["userId", "businessEntityId", "permissionKey", "deviceTrusted", "mfaFresh", "riskScore", "withinTimeWindow", "requesterIsApprover"]), operator: z.enum(["equals", "gte", "lte", "true", "false"]), value: z.union([z.string(), z.number(), z.boolean()]).optional() })).default([]), requireMfa: z.boolean().default(false), requireFreshDevice: z.boolean().default(false), maxRiskScore: z.number().int().min(0).max(100).optional(), requireTimeWindow: z.boolean().default(false) })).query(async ({ ctx, input }) => {
    await assertEntity(ctx, input.businessEntityId);
    const context: AccessContext43 = { userId: ctx.user.id, ...input };
    const abac = evaluateAbacDecision(context, input.rules);
    const conditional = evaluateConditionalAccess(context, { requireMfa: input.requireMfa, requireFreshDevice: input.requireFreshDevice, maxRiskScore: input.maxRiskScore, requireTimeWindow: input.requireTimeWindow });
    const allowed = abac === "allow" && conditional === "allow";
    return { allowed, abac, conditional, reason: allowed ? "allowed_by_policy" : conditional === "challenge" ? "step_up_required" : "default_deny" };
  }),
  requestPrivilege: protectedProcedure.input(z.object({ businessEntityId: entityId, permissionKey: z.string().min(3), targetRoleId: z.number().int().positive().optional(), reason: z.string().min(10).max(1000), evidenceRef: z.string().max(240).optional(), startsAt: z.coerce.date(), expiresAt: z.coerce.date(), idempotencyKey: z.string().min(8).max(160) })).mutation(async ({ ctx, input }) => {
    await assertEntity(ctx, input.businessEntityId);
    if (input.expiresAt <= input.startsAt || input.expiresAt.getTime() - input.startsAt.getTime() > 8 * 60 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "مدة الامتياز يجب أن تكون موجبة ولا تتجاوز 8 ساعات" });
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const existing = await db.select({ id: iamPrivilegeRequests43.id, status: iamPrivilegeRequests43.status }).from(iamPrivilegeRequests43).where(and(eq(iamPrivilegeRequests43.requesterUserId, ctx.user.id), eq(iamPrivilegeRequests43.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return { id: existing[0].id, status: existing[0].status, replay: true as const };
    const result = await db.insert(iamPrivilegeRequests43).values({ businessEntityId: input.businessEntityId ?? undefined, requesterUserId: ctx.user.id, targetRoleId: input.targetRoleId, permissionKey: input.permissionKey, reason: input.reason, evidenceRef: input.evidenceRef, startsAt: input.startsAt, expiresAt: input.expiresAt, idempotencyKey: input.idempotencyKey });
    return { id: Number(result[0].insertId), status: "requested" as const, replay: false as const };
  }),
  decidePrivilege: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), decision: z.enum(["approved", "rejected", "revoked"]) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const [request] = await db.select().from(iamPrivilegeRequests43).where(eq(iamPrivilegeRequests43.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "طلب الامتياز غير موجود" });
    if (request.requesterUserId === ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن اعتماد طلبك بنفسك" });
    await db.update(iamPrivilegeRequests43).set({ status: input.decision, approverUserId: ctx.user.id, decidedAt: new Date() }).where(eq(iamPrivilegeRequests43.id, request.id));
    return { decided: true as const, status: input.decision };
  }),
  requestBreakGlass: protectedProcedure.input(z.object({ businessEntityId: entityId, reason: z.string().min(15).max(1000), scope: z.record(z.string(), z.unknown()), startsAt: z.coerce.date(), expiresAt: z.coerce.date() })).mutation(async ({ ctx, input }) => {
    await assertEntity(ctx, input.businessEntityId); if (input.expiresAt <= input.startsAt || input.expiresAt.getTime() - input.startsAt.getTime() > 60 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "صلاحية الطوارئ يجب ألا تتجاوز ساعة" });
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const result = await db.insert(securityBreakGlass43).values({ businessEntityId: input.businessEntityId ?? undefined, requesterUserId: ctx.user.id, reason: input.reason, scopeJson: JSON.stringify(input.scope), startsAt: input.startsAt, expiresAt: input.expiresAt });
    await db.insert(iamSecurityEvents).values({ userId: ctx.user.id, businessEntityId: input.businessEntityId ?? undefined, eventType: "BreakGlassRequested", outcome: "success", resourceType: "break_glass", resourceId: String(result[0].insertId), correlationId: `bg-${nanoid(12)}`, detailsJson: JSON.stringify(input.scope) });
    return { id: Number(result[0].insertId), status: "requested" as const };
  }),
  approveBreakGlass: protectedProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const [request] = await db.select().from(securityBreakGlass43).where(eq(securityBreakGlass43.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "طلب الطوارئ غير موجود" });
    if (request.requesterUserId === ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن اعتماد طلب الطوارئ بنفسك" });
    if (request.expiresAt <= new Date()) throw new TRPCError({ code: "CONFLICT", message: "انتهت صلاحية الطلب" });
    await db.update(securityBreakGlass43).set({ status: "approved", approverUserId: ctx.user.id }).where(eq(securityBreakGlass43.id, request.id));
    return { approved: true as const };
  }),
  createIncident: protectedProcedure.input(z.object({ businessEntityId: entityId, incidentKey: z.string().min(3).max(140), titleAr: z.string().min(5).max(260), severity: z.enum(["low", "medium", "high", "critical"]), evidence: z.record(z.string(), z.unknown()).default({}), idempotencyKey: z.string().min(8).max(160) })).mutation(async ({ ctx, input }) => {
    await assertEntity(ctx, input.businessEntityId); const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const existing = await db.select({ id: securityIncidents43.id }).from(securityIncidents43).where(and(eq(securityIncidents43.businessEntityId, input.businessEntityId as number), eq(securityIncidents43.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return { id: existing[0].id, replay: true as const };
    const result = await db.insert(securityIncidents43).values({ businessEntityId: input.businessEntityId ?? undefined, incidentKey: input.incidentKey, titleAr: input.titleAr, severity: input.severity, evidenceJson: JSON.stringify(input.evidence), idempotencyKey: input.idempotencyKey });
    return { id: Number(result[0].insertId), replay: false as const };
  }),
  advanceIncident: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), phase: z.enum(["detected", "contained", "investigating", "recovering", "closed"]), rootCause: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable");
    await db.update(securityIncidents43).set({ phase: input.phase, rootCause: input.rootCause, resolvedAt: input.phase === "closed" ? new Date() : undefined }).where(eq(securityIncidents43.id, input.incidentId));
    return { updated: true as const };
  }),
});
