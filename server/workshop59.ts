import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { workshopCheckins59, workshopEstimates59, workshopJobCards59, workshopOperations59, workshopQuality59, workshopDeliveries59 } from "../drizzle/schema";
import { calculateWorkshopEstimate, canDeliverWorkshopJob, canTransitionWorkshopJob } from "../shared/workshop59";

const scope = z.object({ businessEntityId: z.number().int().positive() });
const idempotencyKey = z.string().trim().min(8).max(160);

export const workshop59Router = router({
  dashboard: protectedProcedure.input(scope).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [jobs, checkins, operations, quality] = await Promise.all([
      db.select().from(workshopJobCards59).where(eq(workshopJobCards59.businessEntityId, input.businessEntityId)).orderBy(desc(workshopJobCards59.updatedAt)).limit(50),
      db.select().from(workshopCheckins59).where(eq(workshopCheckins59.businessEntityId, input.businessEntityId)).orderBy(desc(workshopCheckins59.createdAt)).limit(20),
      db.select().from(workshopOperations59).where(eq(workshopOperations59.businessEntityId, input.businessEntityId)).limit(100),
      db.select().from(workshopQuality59).where(eq(workshopQuality59.businessEntityId, input.businessEntityId)).orderBy(desc(workshopQuality59.createdAt)).limit(20),
    ]);
    return { jobs, checkins, operations, quality, counts: { openJobs: jobs.filter(j => !["closed", "delivered"].includes(j.status)).length, awaitingApproval: jobs.filter(j => j.status === "awaiting_approval").length, inProgress: jobs.filter(j => j.status === "in_progress").length, failedQc: quality.filter(q => q.result === "failed" || q.result === "rework").length } };
  }),
  createCheckin: protectedProcedure.input(scope.extend({ customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), workshopCenterId: z.number().int().positive().optional(), appointmentId: z.number().int().positive().optional(), mileage: z.number().int().nonnegative(), fuelLevel: z.string().max(40).optional(), complaint: z.string().trim().min(3).max(2000), consent: z.literal(true), existingDamageJson: z.string().max(12000).optional(), evidenceJson: z.string().max(12000).optional(), idempotencyKey })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select().from(workshopCheckins59).where(and(eq(workshopCheckins59.businessEntityId, input.businessEntityId), eq(workshopCheckins59.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return existing[0];
    const [row] = await db.insert(workshopCheckins59).values({ ...input, createdBy: ctx.user.id }).$returningId();
    return row;
  }),
  createEstimate: protectedProcedure.input(scope.extend({ checkinId: z.number().int().positive().optional(), vehicleId: z.number().int().positive(), customerId: z.number().int().positive(), version: z.number().int().positive().default(1), laborMinor: z.number().int().nonnegative(), partsMinor: z.number().int().nonnegative(), subcontractMinor: z.number().int().nonnegative(), consumablesMinor: z.number().int().nonnegative(), taxMinor: z.number().int().nonnegative(), discountMinor: z.number().int().nonnegative(), currency: z.string().length(3).default("OMR"), validUntil: z.coerce.date().optional() })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const totalMinor = calculateWorkshopEstimate(input);
    const [row] = await db.insert(workshopEstimates59).values({ ...input, totalMinor, createdBy: ctx.user.id }).$returningId();
    return { ...row, totalMinor };
  }),
  createJobCard: protectedProcedure.input(scope.extend({ jobNo: z.string().trim().min(3).max(100), customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), estimateId: z.number().int().positive().optional(), priority: z.enum(["low", "normal", "high", "critical"]).default("normal"), promisedAt: z.coerce.date().optional(), advisorUserId: z.number().int().positive().optional(), bayId: z.number().int().positive().optional(), idempotencyKey })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select().from(workshopJobCards59).where(and(eq(workshopJobCards59.businessEntityId, input.businessEntityId), eq(workshopJobCards59.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return existing[0];
    const [row] = await db.insert(workshopJobCards59).values({ ...input, createdBy: ctx.user.id }).$returningId();
    return row;
  }),
  transitionJobCard: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), from: z.enum(["received", "diagnosing", "awaiting_approval", "awaiting_parts", "in_progress", "qc", "road_test", "ready", "delivered", "closed", "warranty_repeat"]), to: z.enum(["received", "diagnosing", "awaiting_approval", "awaiting_parts", "in_progress", "qc", "road_test", "ready", "delivered", "closed", "warranty_repeat"]) })).mutation(async ({ input }) => {
    if (!canTransitionWorkshopJob(input.from, input.to)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "انتقال حالة أمر العمل غير مسموح" });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(workshopJobCards59).set({ status: input.to }).where(and(eq(workshopJobCards59.id, input.jobCardId), eq(workshopJobCards59.businessEntityId, input.businessEntityId)));
    return { ok: true, status: input.to };
  }),
  recordQuality: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), result: z.enum(["pending", "passed", "failed", "rework"]), checklistJson: z.string().min(2).max(20000), evidenceJson: z.string().max(12000).optional(), defect: z.string().max(2000).optional() })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [row] = await db.insert(workshopQuality59).values({ ...input, inspectorUserId: ctx.user.id }).$returningId();
    return row;
  }),
  deliver: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), customerId: z.number().int().positive(), invoiceStatus: z.enum(["pending", "issued", "paid"]), paymentStatus: z.enum(["pending", "partial", "paid", "waived"]), customerAcknowledgement: z.literal(true), mileage: z.number().int().nonnegative(), documentsJson: z.string().max(12000), qcPassed: z.literal(true), requiredDocumentsPresent: z.literal(true), idempotencyKey })).mutation(async ({ input, ctx }) => {
    if (!canDeliverWorkshopJob({ status: "ready", invoiceStatus: input.invoiceStatus, paymentStatus: input.paymentStatus, customerAcknowledgement: input.customerAcknowledgement, requiredDocumentsPresent: input.requiredDocumentsPresent, qcPassed: input.qcPassed })) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن تسليم المركبة قبل استيفاء فحوص الجودة والدفع والمستندات" });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select().from(workshopDeliveries59).where(and(eq(workshopDeliveries59.businessEntityId, input.businessEntityId), eq(workshopDeliveries59.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return existing[0];
    const [row] = await db.insert(workshopDeliveries59).values({ ...input, deliveredBy: ctx.user.id, deliveredAt: new Date() }).$returningId();
    return row;
  }),
});
