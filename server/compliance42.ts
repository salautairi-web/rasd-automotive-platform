import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  complianceContractObligations42,
  complianceContracts42,
  complianceControls42,
  complianceFindings42,
  compliancePermits42,
  complianceRemediation42,
  complianceRequirements42,
  governanceConflicts42,
  governanceResolutions42,
  governanceMembers42,
  regulatoryReports42,
  regulatorySubmissions42,
} from "../drizzle/schema";
import { getDb } from "./db";
import { assertEntityAccess } from "./entityAccess";
import { protectedProcedure, router } from "./_core/trpc";

const entityInput = z.object({ businessEntityId: z.number().int().positive() });
const idempotency = z.string().trim().min(8).max(160);
const requireAdminForGovernance = (role: string) => {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Governance privilege required" });
};

export const compliance42Router = router({
  overview: protectedProcedure.input(entityInput).query(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.read");
    const db = await getDb();
    if (!db) return { requirements: [], permits: [], contracts: [], obligations: [], controls: [], findings: [], remediation: [], conflicts: [], resolutions: [], members: [], reports: [], submissions: [], totals: { permits: 0, expiringPermits: 0, contracts: 0, renewingContracts: 0, openFindings: 0, overdueRemediation: 0, openConflicts: 0, pendingReports: 0, pendingSubmissions: 0 } };
    const [permits, contracts, obligations, controls, findings, remediation, conflicts, resolutions, reports] = await Promise.all([
      db.select().from(compliancePermits42).where(eq(compliancePermits42.businessEntityId, input.businessEntityId)).orderBy(desc(compliancePermits42.expiryDate)).limit(100),
      db.select().from(complianceContracts42).where(eq(complianceContracts42.businessEntityId, input.businessEntityId)).orderBy(desc(complianceContracts42.endDate)).limit(100),
      db.select().from(complianceContractObligations42).where(eq(complianceContractObligations42.businessEntityId, input.businessEntityId)).orderBy(desc(complianceContractObligations42.dueDate)).limit(100),
      db.select().from(complianceControls42).where(eq(complianceControls42.businessEntityId, input.businessEntityId)).orderBy(desc(complianceControls42.createdAt)).limit(100),
      db.select().from(complianceFindings42).where(eq(complianceFindings42.businessEntityId, input.businessEntityId)).orderBy(desc(complianceFindings42.createdAt)).limit(100),
      db.select().from(complianceRemediation42).where(eq(complianceRemediation42.businessEntityId, input.businessEntityId)).orderBy(desc(complianceRemediation42.dueDate)).limit(100),
      db.select().from(governanceConflicts42).where(eq(governanceConflicts42.businessEntityId, input.businessEntityId)).orderBy(desc(governanceConflicts42.createdAt)).limit(100),
      db.select().from(governanceResolutions42).where(eq(governanceResolutions42.businessEntityId, input.businessEntityId)).orderBy(desc(governanceResolutions42.createdAt)).limit(100),
      db.select().from(regulatoryReports42).where(eq(regulatoryReports42.businessEntityId, input.businessEntityId)).orderBy(desc(regulatoryReports42.createdAt)).limit(100),
    ]);
    const requirements = await db.select().from(complianceRequirements42).where(eq(complianceRequirements42.status, "active")).orderBy(desc(complianceRequirements42.updatedAt)).limit(100);
    const [members, submissions] = await Promise.all([
      db.select().from(governanceMembers42).where(eq(governanceMembers42.businessEntityId, input.businessEntityId)).orderBy(desc(governanceMembers42.createdAt)).limit(100),
      db.select().from(regulatorySubmissions42).where(eq(regulatorySubmissions42.businessEntityId, input.businessEntityId)).orderBy(desc(regulatorySubmissions42.dueDate)).limit(100),
    ]);
    return {
      requirements, permits, contracts, obligations, controls, findings, remediation, conflicts, resolutions, members, reports, submissions,
      totals: {
        permits: permits.length,
        expiringPermits: permits.filter((item) => ["expiring", "expired"].includes(item.status)).length,
        contracts: contracts.length,
        renewingContracts: contracts.filter((item) => ["expiring", "expired"].includes(item.status)).length,
        openFindings: findings.filter((item) => item.status !== "closed").length,
        overdueRemediation: remediation.filter((item) => ["submitted", "in_progress"].includes(item.status) && item.dueDate < new Date()).length,
        openConflicts: conflicts.filter((item) => item.status !== "closed").length,
        pendingReports: reports.filter((item) => ["draft", "pending_approval"].includes(item.approvalStatus)).length,
        pendingSubmissions: submissions.filter((item) => ["received", "in_progress"].includes(item.status)).length,
      },
    };
  }),

  createPermit: protectedProcedure.input(entityInput.extend({ permitKey: z.string().trim().min(2).max(140), requirementId: z.number().int().positive().optional(), authorityId: z.number().int().positive().optional(), activityKey: z.string().trim().max(120).optional(), permitNumberMasked: z.string().trim().max(180).optional(), issueDate: z.coerce.date().optional(), expiryDate: z.coerce.date().optional(), conditionsJson: z.string().max(8000).optional(), ownerUserId: z.number().int().positive().optional(), idempotencyKey: idempotency })).mutation(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const existing = await db.select().from(compliancePermits42).where(and(eq(compliancePermits42.businessEntityId, input.businessEntityId), eq(compliancePermits42.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return { permit: existing[0], replayed: true };
    const [permit] = await db.insert(compliancePermits42).values({ ...input, status: "draft" }).$returningId();
    return { permit, replayed: false };
  }),

  createContract: protectedProcedure.input(entityInput.extend({ contractKey: z.string().trim().min(2).max(140), contractType: z.string().trim().min(2).max(100), counterpartyName: z.string().trim().min(2).max(240), valueMinor: z.number().int().nonnegative().optional(), currency: z.string().trim().length(3).default("SAR"), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), noticeDays: z.number().int().nonnegative().optional(), renewalDate: z.coerce.date().optional(), ownerUserId: z.number().int().positive().optional(), documentId: z.number().int().positive().optional(), idempotencyKey: idempotency })).mutation(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const existing = await db.select().from(complianceContracts42).where(and(eq(complianceContracts42.businessEntityId, input.businessEntityId), eq(complianceContracts42.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return { contract: existing[0], replayed: true };
    const [contract] = await db.insert(complianceContracts42).values({ ...input, status: "draft" }).$returningId();
    return { contract, replayed: false };
  }),

  createControl: protectedProcedure.input(entityInput.extend({ controlKey: z.string().trim().min(2).max(140), objectiveAr: z.string().trim().min(3).max(240), controlType: z.enum(["preventive", "detective", "corrective"]), frequency: z.enum(["continuous", "monthly", "quarterly", "annual", "event_based"]), ownerUserId: z.number().int().positive().optional(), procedureText: z.string().max(10000).optional() })).mutation(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const existing = await db.select().from(complianceControls42).where(and(eq(complianceControls42.businessEntityId, input.businessEntityId), eq(complianceControls42.controlKey, input.controlKey))).limit(1);
    if (existing[0]) return { control: existing[0], replayed: true };
    const [control] = await db.insert(complianceControls42).values({ ...input, status: "active" }).$returningId();
    return { control, replayed: false };
  }),

  createFinding: protectedProcedure.input(entityInput.extend({ sourceType: z.string().trim().min(2).max(100), sourceId: z.number().int().positive().optional(), titleAr: z.string().trim().min(3).max(240), severity: z.enum(["low", "medium", "high", "critical"]), rootCause: z.string().max(10000).optional(), dueDate: z.coerce.date().optional(), ownerUserId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [finding] = await db.insert(complianceFindings42).values({ ...input, status: "open" }).$returningId();
    return { finding };
  }),

  createRemediation: protectedProcedure.input(entityInput.extend({ findingId: z.number().int().positive(), actionAr: z.string().trim().min(5).max(500), ownerUserId: z.number().int().positive(), dueDate: z.coerce.date(), priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"), evidenceDocumentId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [finding] = await db.select().from(complianceFindings42).where(and(eq(complianceFindings42.id, input.findingId), eq(complianceFindings42.businessEntityId, input.businessEntityId))).limit(1);
    if (!finding) throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found in this entity" });
    const [remediation] = await db.insert(complianceRemediation42).values({ ...input, status: "planned" }).$returningId();
    await db.update(complianceFindings42).set({ status: "remediating" }).where(and(eq(complianceFindings42.id, input.findingId), eq(complianceFindings42.businessEntityId, input.businessEntityId)));
    return { remediation };
  }),

  createResolution: protectedProcedure.input(entityInput.extend({ resolutionKey: z.string().trim().min(2).max(140), meetingDate: z.coerce.date().optional(), titleAr: z.string().trim().min(3).max(240), decisionText: z.string().trim().min(5).max(12000), authorityScope: z.string().trim().max(160).optional(), evidenceDocumentId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
    requireAdminForGovernance(ctx.user.role);
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [resolution] = await db.insert(governanceResolutions42).values({ ...input, status: "draft" }).$returningId();
    return { resolution };
  }),

  createConflict: protectedProcedure.input(entityInput.extend({ subjectUserId: z.number().int().positive(), disclosureType: z.string().trim().min(2).max(100), description: z.string().trim().min(5).max(10000), relatedPartyRef: z.string().trim().max(180).optional(), severity: z.enum(["low", "medium", "high"]).default("medium") })).mutation(async ({ ctx, input }) => {
    await assertEntityAccess(ctx.user.id, ctx.user.role, input.businessEntityId, "compliance.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
    const [conflict] = await db.insert(governanceConflicts42).values({ ...input, status: "declared" }).$returningId();
    return { conflict };
  }),
});
