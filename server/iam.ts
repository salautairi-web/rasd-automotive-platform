import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { iamAccessReviews, iamMemberships, iamPermissions, iamPolicies, iamRolePermissions, iamRoles, iamSecurityEvents, iamMfaMethods, iamMfaChallenges, iamSessions, iamTrustedDevices, iamStepUpPolicies, iamStepUpVerifications, iamSessionAudit } from "../drizzle/schema";
import { createMfaChallenge, hashMfaValue, isChallengeUsable, isStepUpFresh, sessionStatus, verifyMfaValue } from "../shared/mfa";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const requireAdmin = (role: string) => { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية إدارة الهوية مطلوبة" }); };
const entityInput = z.object({ businessEntityId: z.number().int().positive() });

export async function hasEntityMembership(userId: number, businessEntityId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: iamMemberships.id }).from(iamMemberships).innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id)).where(and(eq(iamMemberships.userId, userId), eq(iamMemberships.businessEntityId, businessEntityId), eq(iamMemberships.status, "active"), eq(iamRoles.status, "active"))).limit(1);
  return Boolean(rows[0]);
}

export const iamRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { users: 0, activeMemberships: 0, roles: 0, pendingReviews: 0, deniedEvents: 0, criticalEvents: 0 };
    const [memberships, roles, reviews, events] = await Promise.all([
      db.select({ users: sql<number>`count(distinct ${iamMemberships.userId})`, active: sql<number>`sum(case when ${iamMemberships.status}='active' then 1 else 0 end)` }).from(iamMemberships),
      db.select({ total: sql<number>`count(*)` }).from(iamRoles).where(eq(iamRoles.status, "active")),
      db.select({ total: sql<number>`count(*)` }).from(iamAccessReviews).where(eq(iamAccessReviews.decision, "pending")),
      db.select({ denied: sql<number>`sum(case when ${iamSecurityEvents.outcome}='denied' then 1 else 0 end)`, critical: sql<number>`sum(case when ${iamSecurityEvents.eventType} in ('MFAFailed','PermissionChanged','CrossEntityDenied') then 1 else 0 end)` }).from(iamSecurityEvents),
    ]);
    return { users: Number(memberships[0]?.users ?? 0), activeMemberships: Number(memberships[0]?.active ?? 0), roles: Number(roles[0]?.total ?? 0), pendingReviews: Number(reviews[0]?.total ?? 0), deniedEvents: Number(events[0]?.denied ?? 0), criticalEvents: Number(events[0]?.critical ?? 0) };
  }),
  memberships: protectedProcedure.input(z.object({ userId: z.number().int().positive().optional(), businessEntityId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
    const userId = input.userId ?? ctx.user.id;
    if (input.userId && input.userId !== ctx.user.id) requireAdmin(ctx.user.role);
    const db = await getDb();
    return db ? db.select().from(iamMemberships).where(and(eq(iamMemberships.userId, userId), input.businessEntityId ? eq(iamMemberships.businessEntityId, input.businessEntityId) : sql`1=1`)).orderBy(desc(iamMemberships.createdAt)).limit(100) : [];
  }),
  roles: protectedProcedure.query(async ({ ctx }) => { requireAdmin(ctx.user.role); const db = await getDb(); return db ? db.select().from(iamRoles).where(eq(iamRoles.status, "active")).orderBy(iamRoles.roleKey).limit(100) : []; }),
  permissions: protectedProcedure.query(async ({ ctx }) => { requireAdmin(ctx.user.role); const db = await getDb(); return db ? db.select().from(iamPermissions).orderBy(iamPermissions.permissionKey).limit(200) : []; }),
  createRole: protectedProcedure.input(z.object({ roleKey: z.string().min(3).max(100), nameAr: z.string().min(2).max(160), scopeType: z.enum(["central", "company", "entity", "branch", "own", "assigned"]), permissionIds: z.array(z.number().int().positive()).default([]) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role);
    if (input.scopeType === "central" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const existing = await db.select({ id: iamRoles.id }).from(iamRoles).where(eq(iamRoles.roleKey, input.roleKey)).limit(1);
    if (existing[0]) return { id: existing[0].id, replay: true as const };
    const roleResult = await db.insert(iamRoles).values({ roleKey: input.roleKey, nameAr: input.nameAr, scopeType: input.scopeType, systemRole: false });
    const roleId = Number(roleResult[0].insertId);
    if (input.permissionIds.length) await db.insert(iamRolePermissions).values(input.permissionIds.map(permissionId => ({ roleId, permissionId })));
    return { id: roleId, replay: false as const };
  }),
  grantMembership: protectedProcedure.input(z.object({ userId: z.number().int().positive(), businessEntityId: z.number().int().positive(), roleId: z.number().int().positive(), scope: z.record(z.string(), z.unknown()).default({}), defaultEntity: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const [role] = await db.select().from(iamRoles).where(eq(iamRoles.id, input.roleId)).limit(1);
    if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "الدور غير موجود" });
    if (role.scopeType === "central" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن لمسؤول كيان منح دور مركزي" });
    const [existing] = await db.select({ id: iamMemberships.id }).from(iamMemberships).where(and(eq(iamMemberships.userId, input.userId), eq(iamMemberships.businessEntityId, input.businessEntityId), eq(iamMemberships.roleId, input.roleId))).limit(1);
    if (existing) return { id: existing.id, replay: true as const };
    const result = await db.insert(iamMemberships).values({ userId: input.userId, businessEntityId: input.businessEntityId, roleId: input.roleId, scopeJson: JSON.stringify(input.scope), defaultEntity: input.defaultEntity });
    await db.insert(iamSecurityEvents).values({ userId: ctx.user.id, businessEntityId: input.businessEntityId, eventType: "MembershipGranted", outcome: "success", resourceType: "membership", resourceId: String(result[0].insertId), correlationId: `iam-${nanoid(12)}`, detailsJson: JSON.stringify({ subjectUserId: input.userId, roleId: input.roleId }) });
    return { id: Number(result[0].insertId), replay: false as const };
  }),
  authorize: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), permissionKey: z.string().min(3), resourceOwnerUserId: z.number().int().positive().optional(), sensitive: z.boolean().default(false) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { allowed: false, reason: "database_unavailable", permissionKey: input.permissionKey, sensitive: input.sensitive, entityId: input.businessEntityId };
    const [grant] = await db.select({ permissionId: iamPermissions.id, scopeType: iamRoles.scopeType }).from(iamMemberships).innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id)).innerJoin(iamRolePermissions, eq(iamRolePermissions.roleId, iamRoles.id)).innerJoin(iamPermissions, eq(iamRolePermissions.permissionId, iamPermissions.id)).where(and(eq(iamMemberships.userId, ctx.user.id), eq(iamMemberships.businessEntityId, input.businessEntityId), eq(iamMemberships.status, "active"), eq(iamRoles.status, "active"), eq(iamPermissions.permissionKey, input.permissionKey))).limit(1);
    const allowed = Boolean(grant);
    const ownerAllowed = !input.resourceOwnerUserId || input.resourceOwnerUserId === ctx.user.id || ["entity", "company", "central"].includes(grant?.scopeType ?? "");
    return { allowed: allowed && ownerAllowed, reason: allowed && ownerAllowed ? "scoped_permission" : "default_deny", permissionKey: input.permissionKey, sensitive: input.sensitive, entityId: input.businessEntityId };
  }),
  recordSecurityEvent: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive().optional(), eventType: z.string().min(3).max(100), outcome: z.enum(["success", "failure", "denied"]), resourceType: z.string().max(100).optional(), resourceId: z.string().max(120).optional(), details: z.record(z.string(), z.unknown()).default({}) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const correlationId = `sec-${nanoid(12)}`;
    await db.insert(iamSecurityEvents).values({ userId: ctx.user.id, businessEntityId: input.businessEntityId, eventType: input.eventType, outcome: input.outcome, resourceType: input.resourceType, resourceId: input.resourceId, correlationId, detailsJson: JSON.stringify(input.details) });
    return { recorded: true as const, correlationId };
  }),
  accessReviews: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => { requireAdmin(ctx.user.role); const db = await getDb(); return db ? db.select().from(iamAccessReviews).where(input.businessEntityId ? eq(iamAccessReviews.businessEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(iamAccessReviews.id)).limit(100) : []; }),
  mfaMethods: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); return db ? db.select({ id: iamMfaMethods.id, methodKey: iamMfaMethods.methodKey, methodType: iamMfaMethods.methodType, label: iamMfaMethods.label, status: iamMfaMethods.status, enrolledAt: iamMfaMethods.enrolledAt, lastVerifiedAt: iamMfaMethods.lastVerifiedAt }).from(iamMfaMethods).where(eq(iamMfaMethods.userId, ctx.user.id)).orderBy(desc(iamMfaMethods.createdAt)) : []; }),
  beginMfaEnrollment: protectedProcedure.input(z.object({ methodKey: z.string().min(3).max(160), methodType: z.enum(["totp", "webauthn", "push"]), label: z.string().max(120).optional() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const existing = await db.select({ id: iamMfaMethods.id, status: iamMfaMethods.status }).from(iamMfaMethods).where(and(eq(iamMfaMethods.userId, ctx.user.id), eq(iamMfaMethods.methodKey, input.methodKey))).limit(1); if (existing[0]) return { methodId: existing[0].id, challengeId: null, replay: true as const }; const result = await db.insert(iamMfaMethods).values({ userId: ctx.user.id, methodKey: input.methodKey, methodType: input.methodType, label: input.label, status: "pending" }); const methodId = Number(result[0].insertId); const challenge = createMfaChallenge(); const challengeId = `MFA-${nanoid(16)}`; await db.insert(iamMfaChallenges).values({ challengeId, userId: ctx.user.id, methodId, purpose: "enrollment", challengeHash: challenge.hash, expiresAt: new Date(Date.now() + 10 * 60_000) }); return { methodId, challengeId, verificationMaterial: input.methodType === "webauthn" ? challenge.raw : undefined, replay: false as const }; }),
  verifyMfaChallenge: protectedProcedure.input(z.object({ challengeId: z.string().min(8).max(120), value: z.string().min(6).max(1000) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [challenge] = await db.select().from(iamMfaChallenges).where(and(eq(iamMfaChallenges.challengeId, input.challengeId), eq(iamMfaChallenges.userId, ctx.user.id))).limit(1); if (!challenge) throw new TRPCError({ code: "NOT_FOUND", message: "تحدي MFA غير موجود" }); if (!isChallengeUsable(challenge, new Date())) { await db.update(iamMfaChallenges).set({ status: challenge.expiresAt <= new Date() ? "expired" : "locked" }).where(eq(iamMfaChallenges.id, challenge.id)); throw new TRPCError({ code: "CONFLICT", message: "تحدي MFA منتهٍ أو مقفل" }); } const valid = challenge.challengeHash ? verifyMfaValue(input.value, challenge.challengeHash) : challenge.codeHash ? verifyMfaValue(input.value, challenge.codeHash) : false; if (!valid) { const attempts = challenge.attempts + 1; await db.update(iamMfaChallenges).set({ attempts, status: attempts >= challenge.maxAttempts ? "locked" : "pending" }).where(eq(iamMfaChallenges.id, challenge.id)); throw new TRPCError({ code: "UNAUTHORIZED", message: "قيمة MFA غير صحيحة" }); } await db.transaction(async tx => { await tx.update(iamMfaChallenges).set({ status: "verified", verifiedAt: new Date() }).where(eq(iamMfaChallenges.id, challenge.id)); await tx.update(iamMfaMethods).set({ status: "active", enrolledAt: new Date(), lastVerifiedAt: new Date() }).where(eq(iamMfaMethods.id, challenge.methodId)); }); return { verified: true as const, challengeId: challenge.challengeId }; }),
  sessions: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); return db ? db.select({ id: iamSessions.id, businessEntityId: iamSessions.businessEntityId, deviceId: iamSessions.deviceId, status: iamSessions.status, lastSeenAt: iamSessions.lastSeenAt, expiresAt: iamSessions.expiresAt, createdAt: iamSessions.createdAt }).from(iamSessions).where(eq(iamSessions.userId, ctx.user.id)).orderBy(desc(iamSessions.lastSeenAt)).limit(100) : []; }),
  revokeSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [session] = await db.select({ id: iamSessions.id }).from(iamSessions).where(and(eq(iamSessions.id, input.sessionId), eq(iamSessions.userId, ctx.user.id), eq(iamSessions.status, "active"))).limit(1); if (!session) throw new TRPCError({ code: "FORBIDDEN" }); await db.update(iamSessions).set({ status: "revoked", revokedAt: new Date() }).where(eq(iamSessions.id, session.id)); await db.insert(iamSessionAudit).values({ userId: ctx.user.id, sessionId: session.id, action: "session.revoke", outcome: "success", correlationId: `sess-${nanoid(12)}` }); return { revoked: true as const }; }),
  trustedDevices: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); return db ? db.select({ id: iamTrustedDevices.id, label: iamTrustedDevices.label, platform: iamTrustedDevices.platform, trustLevel: iamTrustedDevices.trustLevel, status: iamTrustedDevices.status, lastVerifiedAt: iamTrustedDevices.lastVerifiedAt }).from(iamTrustedDevices).where(and(eq(iamTrustedDevices.userId, ctx.user.id), eq(iamTrustedDevices.status, "active"))).orderBy(desc(iamTrustedDevices.createdAt)) : []; }),
  revokeTrustedDevice: protectedProcedure.input(z.object({ deviceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); await db.update(iamTrustedDevices).set({ status: "revoked" }).where(and(eq(iamTrustedDevices.id, input.deviceId), eq(iamTrustedDevices.userId, ctx.user.id))); return { revoked: true as const }; }),
  evaluateStepUp: protectedProcedure.input(z.object({ permissionKey: z.string().min(3), sensitivity: z.enum(["normal", "sensitive", "critical"]), sessionId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => { const db = await getDb(); if (!db) return { required: input.sensitivity !== "normal", verified: false, reason: "database_unavailable" }; if (input.sensitivity === "normal") return { required: false, verified: true, reason: "normal_action" }; const [policy] = await db.select().from(iamStepUpPolicies).where(and(eq(iamStepUpPolicies.permissionKey, input.permissionKey), eq(iamStepUpPolicies.status, "active"))).limit(1); const [verification] = await db.select().from(iamStepUpVerifications).where(and(eq(iamStepUpVerifications.userId, ctx.user.id), eq(iamStepUpVerifications.permissionKey, input.permissionKey), eq(iamStepUpVerifications.status, "verified"))).orderBy(desc(iamStepUpVerifications.verifiedAt)).limit(1); const verified = Boolean(verification && isStepUpFresh(verification.verifiedAt, verification.expiresAt)); return { required: Boolean(policy) || true, verified, reason: verified ? "fresh_mfa" : "step_up_required" }; }),
  decideReview: protectedProcedure.input(z.object({ reviewId: z.number().int().positive(), decision: z.enum(["approved", "revoked"]), reason: z.string().min(3).max(500) })).mutation(async ({ ctx, input }) => { requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable"); await db.update(iamAccessReviews).set({ decision: input.decision, reason: input.reason, decidedAt: new Date() }).where(and(eq(iamAccessReviews.id, input.reviewId), eq(iamAccessReviews.decision, "pending"))); return { decision: input.decision }; }),
});
