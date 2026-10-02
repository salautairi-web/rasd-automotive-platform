import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { workshopCheckins59, workshopEstimates59, workshopJobCards59, workshopOperations59, workshopQuality59, workshopDeliveries59, workshopInspections59, workshopDtc59, workshopPartRequests59, workshopEstimateConsents59, workshopRoadTests59, workshopWarranties59, partsInventory, partsInventoryMovements, customers, vehicles, workshopAppointments, workshopBays59, workshopSchedules59, workshopTechnicians } from "../drizzle/schema";
import { calculateWorkshopEstimate, canDeliverWorkshopJob, canTransitionWorkshopJob, estimateStatusAfterDecision, isValidWorkshopMileage } from "../shared/workshop59";

const scope = z.object({ businessEntityId: z.number().int().positive() });
const idempotencyKey = z.string().trim().min(8).max(160);

export const workshop59Router = router({
  referenceData: protectedProcedure.input(scope).query(async ({ input }) => {
    const db = await getDb(); if (!db) return { customers: [], vehicles: [], bays: [], technicians: [] };
    const [customerRows, vehicleRows, bays, technicians] = await Promise.all([
      db.select({ id: customers.id, customerNo: customers.customerNo, nameAr: customers.nameAr, phone: customers.phone }).from(customers).where(and(eq(customers.businessEntityId, input.businessEntityId), eq(customers.status, "active"))).orderBy(desc(customers.createdAt)).limit(200),
      db.select({ id: vehicles.id, vehicleNo: vehicles.vehicleNo, vin: vehicles.vin, make: vehicles.make, model: vehicles.model, modelYear: vehicles.modelYear, lifecycleStatus: vehicles.lifecycleStatus }).from(vehicles).where(eq(vehicles.businessEntityId, input.businessEntityId)).orderBy(desc(vehicles.createdAt)).limit(200),
      db.select().from(workshopBays59).where(and(eq(workshopBays59.businessEntityId, input.businessEntityId), eq(workshopBays59.status, "active"))).orderBy(workshopBays59.bayCode),
      db.select().from(workshopTechnicians).where(and(eq(workshopTechnicians.businessEntityId, input.businessEntityId), eq(workshopTechnicians.available, 1))).orderBy(workshopTechnicians.nameAr),
    ]);
    return { customers: customerRows, vehicles: vehicleRows, bays, technicians };
  }),
  appointmentsBoard: protectedProcedure.input(scope.extend({ from: z.coerce.date(), to: z.coerce.date() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) return { appointments: [], schedules: [], bays: [], technicians: [] };
    const [appointments, schedules, bays, technicians] = await Promise.all([
      db.select().from(workshopAppointments).where(and(eq(workshopAppointments.businessEntityId, input.businessEntityId), sql`${workshopAppointments.scheduledAt} >= ${input.from}`, sql`${workshopAppointments.scheduledAt} < ${input.to}`)).orderBy(workshopAppointments.scheduledAt),
      db.select().from(workshopSchedules59).where(and(eq(workshopSchedules59.businessEntityId, input.businessEntityId), sql`${workshopSchedules59.startsAt} < ${input.to}`, sql`${workshopSchedules59.endsAt} > ${input.from}`)).orderBy(workshopSchedules59.startsAt),
      db.select().from(workshopBays59).where(eq(workshopBays59.businessEntityId, input.businessEntityId)).orderBy(workshopBays59.bayCode),
      db.select().from(workshopTechnicians).where(eq(workshopTechnicians.businessEntityId, input.businessEntityId)).orderBy(workshopTechnicians.nameAr),
    ]);
    return { appointments, schedules, bays, technicians };
  }),
  scheduleAppointment: protectedProcedure.input(scope.extend({ customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), serviceType: z.string().trim().min(2).max(120), startsAt: z.coerce.date(), endsAt: z.coerce.date(), bayId: z.number().int().positive(), technicianId: z.number().int().positive().optional(), technicianUserId: z.number().int().positive().optional(), jobCardId: z.number().int().positive().optional(), notes: z.string().max(2000).optional(), idempotencyKey })).mutation(async ({ input, ctx }) => {
    if (input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "وقت نهاية الموعد يجب أن يكون بعد بدايته" });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const replay = await db.select().from(workshopSchedules59).where(and(eq(workshopSchedules59.businessEntityId, input.businessEntityId), eq(workshopSchedules59.idempotencyKey, input.idempotencyKey))).limit(1);
    if (replay[0]) return replay[0];
    const [customer, vehicle, bay] = await Promise.all([
      db.select({ id: customers.id }).from(customers).where(and(eq(customers.id, input.customerId), eq(customers.businessEntityId, input.businessEntityId), eq(customers.status, "active"))).limit(1),
      db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.businessEntityId, input.businessEntityId))).limit(1),
      db.select().from(workshopBays59).where(and(eq(workshopBays59.id, input.bayId), eq(workshopBays59.businessEntityId, input.businessEntityId), eq(workshopBays59.status, "active"))).limit(1),
    ]);
    if (!customer[0] || !vehicle[0] || !bay[0]) throw new TRPCError({ code: "FORBIDDEN", message: "العميل أو المركبة أو الباي خارج نطاق الكيان أو غير نشط" });
    if (input.technicianId) {
      const technician = await db.select({ id: workshopTechnicians.id }).from(workshopTechnicians).where(and(eq(workshopTechnicians.id, input.technicianId), eq(workshopTechnicians.businessEntityId, input.businessEntityId), eq(workshopTechnicians.available, 1))).limit(1);
      if (!technician[0]) throw new TRPCError({ code: "FORBIDDEN", message: "الفني غير متاح ضمن الكيان" });
    }
    const conflicts = await db.select({ id: workshopSchedules59.id }).from(workshopSchedules59).where(and(eq(workshopSchedules59.businessEntityId, input.businessEntityId), sql`${workshopSchedules59.status} <> 'cancelled'`, sql`${workshopSchedules59.startsAt} < ${input.endsAt}`, sql`${workshopSchedules59.endsAt} > ${input.startsAt}`, sql`(${workshopSchedules59.bayId} = ${input.bayId} OR (${input.technicianId ? sql`${workshopSchedules59.technicianId} = ${input.technicianId}` : sql`1 = 0`}))`)).limit(1);
    if (conflicts[0]) throw new TRPCError({ code: "CONFLICT", message: "يوجد تعارض في الباي أو جدول الفني خلال هذه الفترة" });
    const appointmentNo = `WS-APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const appointmentResult = await db.insert(workshopAppointments).values({ businessEntityId: input.businessEntityId, appointmentNo, customerId: input.customerId, vehicleId: input.vehicleId, scheduledAt: input.startsAt, serviceType: input.serviceType, status: "scheduled" });
    const appointmentId = Number(appointmentResult[0].insertId);
    const [row] = await db.insert(workshopSchedules59).values({ businessEntityId: input.businessEntityId, appointmentId, jobCardId: input.jobCardId, bayId: input.bayId, technicianId: input.technicianId, technicianUserId: input.technicianUserId, startsAt: input.startsAt, endsAt: input.endsAt, notes: input.notes, idempotencyKey: input.idempotencyKey, createdBy: ctx.user.id }).$returningId();
    return { ...row, appointmentId, appointmentNo };
  }),
  performanceReport: protectedProcedure.input(scope.extend({ from: z.coerce.date(), to: z.coerce.date() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) return { summary: { revenueMinor: 0, laborCostMinor: 0, partsCostMinor: 0, grossMarginMinor: 0, completedJobs: 0, openJobs: 0, averageCycleHours: 0, comebackRateBps: 0, firstTimeFixRateBps: 0 }, byStatus: [], technicianPerformance: [] };
    const [jobs, estimates, operations, partRequests, inventory] = await Promise.all([
      db.select().from(workshopJobCards59).where(and(eq(workshopJobCards59.businessEntityId, input.businessEntityId), sql`${workshopJobCards59.createdAt} >= ${input.from}`, sql`${workshopJobCards59.createdAt} < ${input.to}`)),
      db.select().from(workshopEstimates59).where(and(eq(workshopEstimates59.businessEntityId, input.businessEntityId), sql`${workshopEstimates59.createdAt} >= ${input.from}`, sql`${workshopEstimates59.createdAt} < ${input.to}`)),
      db.select().from(workshopOperations59).where(eq(workshopOperations59.businessEntityId, input.businessEntityId)),
      db.select().from(workshopPartRequests59).where(and(eq(workshopPartRequests59.businessEntityId, input.businessEntityId), sql`${workshopPartRequests59.createdAt} >= ${input.from}`, sql`${workshopPartRequests59.createdAt} < ${input.to}`)),
      db.select().from(partsInventory).where(eq(partsInventory.businessEntityId, input.businessEntityId)),
    ]);
    const revenueMinor = estimates.filter(e => ["issued", "approved", "partially_approved"].includes(e.status)).reduce((sum, e) => sum + e.totalMinor, 0);
    const laborCostMinor = operations.filter(o => jobs.some(j => j.id === o.jobCardId)).reduce((sum, o) => sum + o.laborCostMinor, 0);
    const inventoryCost = new Map(inventory.map(item => [`${item.warehouseId}:${item.productId}`, item.averageCostMinor]));
    const partsCostMinor = partRequests.filter(r => r.status === "issued").reduce((sum, r) => sum + (inventoryCost.get(`${r.warehouseId}:${r.productId}`) ?? 0) * r.quantity, 0);
    const completed = jobs.filter(j => ["delivered", "closed"].includes(j.status));
    const comeback = jobs.filter(j => j.status === "warranty_repeat").length;
    const firstTimeFix = completed.length - comeback;
    const cycleHours = jobs.length ? Math.round(jobs.reduce((sum, j) => sum + ((j.updatedAt.getTime() - j.createdAt.getTime()) / 3600000), 0) / jobs.length) : 0;
    const byStatus = Array.from(new Set(jobs.map(j => j.status))).map(status => ({ status, count: jobs.filter(j => j.status === status).length }));
    const technicianIds = Array.from(new Set(operations.map(o => o.technicianUserId).filter((id): id is number => id !== null)));
    const technicianPerformance = technicianIds.map(technicianId => { const rows = operations.filter(o => o.technicianUserId === technicianId); return { technicianId, operations: rows.length, completed: rows.filter(o => o.status === "completed").length, rework: rows.filter(o => o.status === "rework").length, actualHours: rows.reduce((sum, o) => sum + Number(o.actualHours ?? 0), 0), laborCostMinor: rows.reduce((sum, o) => sum + o.laborCostMinor, 0) }; });
    return { summary: { revenueMinor, laborCostMinor, partsCostMinor, grossMarginMinor: revenueMinor - laborCostMinor - partsCostMinor, completedJobs: completed.length, openJobs: jobs.filter(j => !["closed", "delivered"].includes(j.status)).length, averageCycleHours: cycleHours, comebackRateBps: jobs.length ? Math.round(comeback / jobs.length * 10000) : 0, firstTimeFixRateBps: jobs.length ? Math.round(Math.max(0, firstTimeFix) / jobs.length * 10000) : 0 }, byStatus, technicianPerformance };
  }),
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
  createEstimate: protectedProcedure.input(scope.extend({ checkinId: z.number().int().positive().optional(), jobCardId: z.number().int().positive().optional(), vehicleId: z.number().int().positive(), customerId: z.number().int().positive(), version: z.number().int().positive().default(1), laborMinor: z.number().int().nonnegative(), partsMinor: z.number().int().nonnegative(), subcontractMinor: z.number().int().nonnegative(), consumablesMinor: z.number().int().nonnegative(), taxMinor: z.number().int().nonnegative(), discountMinor: z.number().int().nonnegative(), currency: z.string().length(3).default("OMR"), validUntil: z.coerce.date().optional() })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const totalMinor = calculateWorkshopEstimate(input);
    const result = await db.insert(workshopEstimates59).values({ ...input, totalMinor, createdBy: ctx.user.id });
    const estimateId = Number(result[0].insertId);
    if (input.jobCardId) {
      const job = await db.select({ id: workshopJobCards59.id }).from(workshopJobCards59).where(and(eq(workshopJobCards59.id, input.jobCardId), eq(workshopJobCards59.businessEntityId, input.businessEntityId))).limit(1);
      if (!job[0]) throw new TRPCError({ code: "FORBIDDEN", message: "أمر العمل خارج نطاق الكيان" });
      await db.update(workshopJobCards59).set({ estimateId }).where(and(eq(workshopJobCards59.id, input.jobCardId), eq(workshopJobCards59.businessEntityId, input.businessEntityId)));
    }
    return { id: estimateId, ...input, totalMinor };
  }),
  openJobCard: protectedProcedure.input(scope.extend({ jobNo: z.string().trim().min(3).max(100), customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), checkinId: z.number().int().positive().optional(), priority: z.enum(["low", "normal", "high", "critical"]).default("normal"), promisedAt: z.coerce.date().optional(), idempotencyKey })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select().from(workshopJobCards59).where(and(eq(workshopJobCards59.businessEntityId, input.businessEntityId), eq(workshopJobCards59.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return existing[0];
    const [row] = await db.insert(workshopJobCards59).values({ businessEntityId: input.businessEntityId, jobNo: input.jobNo, customerId: input.customerId, vehicleId: input.vehicleId, priority: input.priority, promisedAt: input.promisedAt, idempotencyKey: input.idempotencyKey, createdBy: ctx.user.id }).$returningId();
    if (input.checkinId) await db.update(workshopCheckins59).set({ status: "converted" }).where(and(eq(workshopCheckins59.id, input.checkinId), eq(workshopCheckins59.businessEntityId, input.businessEntityId)));
    return row;
  }),
  createJobCard: protectedProcedure.input(scope.extend({ jobNo: z.string().trim().min(3).max(100), customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), estimateId: z.number().int().positive().optional(), priority: z.enum(["low", "normal", "high", "critical"]).default("normal"), promisedAt: z.coerce.date().optional(), advisorUserId: z.number().int().positive().optional(), bayId: z.number().int().positive().optional(), idempotencyKey })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select().from(workshopJobCards59).where(and(eq(workshopJobCards59.businessEntityId, input.businessEntityId), eq(workshopJobCards59.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing[0]) return existing[0];
    const [row] = await db.insert(workshopJobCards59).values({ ...input, createdBy: ctx.user.id }).$returningId();
    return row;
  }),
  jobDetails: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const job = await db.select().from(workshopJobCards59).where(and(eq(workshopJobCards59.id, input.jobCardId), eq(workshopJobCards59.businessEntityId, input.businessEntityId))).limit(1);
    if (!job[0]) throw new TRPCError({ code: "NOT_FOUND", message: "أمر العمل غير موجود ضمن الكيان" });
    const [checkins, estimates, operations, inspections, dtcs, parts, consents, roadTests, warranties, quality, deliveries] = await Promise.all([
      db.select().from(workshopCheckins59).where(and(eq(workshopCheckins59.businessEntityId, input.businessEntityId), eq(workshopCheckins59.vehicleId, job[0].vehicleId))).orderBy(desc(workshopCheckins59.createdAt)).limit(10),
      db.select().from(workshopEstimates59).where(and(eq(workshopEstimates59.businessEntityId, input.businessEntityId), eq(workshopEstimates59.vehicleId, job[0].vehicleId))).orderBy(desc(workshopEstimates59.version)).limit(20),
      db.select().from(workshopOperations59).where(and(eq(workshopOperations59.businessEntityId, input.businessEntityId), eq(workshopOperations59.jobCardId, input.jobCardId))).orderBy(desc(workshopOperations59.createdAt)),
      db.select().from(workshopInspections59).where(and(eq(workshopInspections59.businessEntityId, input.businessEntityId), eq(workshopInspections59.jobCardId, input.jobCardId))).orderBy(desc(workshopInspections59.createdAt)),
      db.select().from(workshopDtc59).where(and(eq(workshopDtc59.businessEntityId, input.businessEntityId), eq(workshopDtc59.jobCardId, input.jobCardId))).orderBy(desc(workshopDtc59.createdAt)),
      db.select().from(workshopPartRequests59).where(and(eq(workshopPartRequests59.businessEntityId, input.businessEntityId), eq(workshopPartRequests59.jobCardId, input.jobCardId))).orderBy(desc(workshopPartRequests59.createdAt)),
      db.select().from(workshopEstimateConsents59).where(eq(workshopEstimateConsents59.businessEntityId, input.businessEntityId)).orderBy(desc(workshopEstimateConsents59.consentedAt)).limit(20),
      db.select().from(workshopRoadTests59).where(and(eq(workshopRoadTests59.businessEntityId, input.businessEntityId), eq(workshopRoadTests59.jobCardId, input.jobCardId))).orderBy(desc(workshopRoadTests59.createdAt)),
      db.select().from(workshopWarranties59).where(and(eq(workshopWarranties59.businessEntityId, input.businessEntityId), eq(workshopWarranties59.jobCardId, input.jobCardId))).orderBy(desc(workshopWarranties59.createdAt)),
      db.select().from(workshopQuality59).where(and(eq(workshopQuality59.businessEntityId, input.businessEntityId), eq(workshopQuality59.jobCardId, input.jobCardId))).orderBy(desc(workshopQuality59.createdAt)),
      db.select().from(workshopDeliveries59).where(and(eq(workshopDeliveries59.businessEntityId, input.businessEntityId), eq(workshopDeliveries59.jobCardId, input.jobCardId))).orderBy(desc(workshopDeliveries59.createdAt)),
    ]);
    return { job: job[0], checkins, estimates, operations, inspections, dtcs, parts, consents: consents.filter(consent => estimates.some(estimate => estimate.id === consent.estimateId)), roadTests, warranties, quality, deliveries };
  }),
  transitionJobCard: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), from: z.enum(["received", "diagnosing", "awaiting_approval", "awaiting_parts", "in_progress", "qc", "road_test", "ready", "delivered", "closed", "warranty_repeat"]), to: z.enum(["received", "diagnosing", "awaiting_approval", "awaiting_parts", "in_progress", "qc", "road_test", "ready", "delivered", "closed", "warranty_repeat"]) })).mutation(async ({ input }) => {
    if (!canTransitionWorkshopJob(input.from, input.to)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "انتقال حالة أمر العمل غير مسموح" });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const current = await db.select({ status: workshopJobCards59.status }).from(workshopJobCards59).where(and(eq(workshopJobCards59.id, input.jobCardId), eq(workshopJobCards59.businessEntityId, input.businessEntityId))).limit(1);
    if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "أمر العمل غير موجود" });
    if (current[0].status !== input.from) throw new TRPCError({ code: "CONFLICT", message: "حالة أمر العمل تغيرت؛ أعد تحميل الشاشة" });
    await db.update(workshopJobCards59).set({ status: input.to }).where(and(eq(workshopJobCards59.id, input.jobCardId), eq(workshopJobCards59.businessEntityId, input.businessEntityId), eq(workshopJobCards59.status, input.from)));
    return { ok: true, from: input.from, status: input.to };
  }),
  createOperation: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), technicianUserId: z.number().int().positive().optional(), operation: z.string().trim().min(2).max(180), standardHours: z.string().max(20).default("0"), laborCostMinor: z.number().int().nonnegative().default(0) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [job] = await db.select({ id: workshopJobCards59.id }).from(workshopJobCards59).where(and(eq(workshopJobCards59.id, input.jobCardId), eq(workshopJobCards59.businessEntityId, input.businessEntityId))).limit(1); if (!job) throw new TRPCError({ code: "FORBIDDEN", message: "أمر العمل خارج نطاق الكيان" }); const [row] = await db.insert(workshopOperations59).values({ businessEntityId: input.businessEntityId, jobCardId: input.jobCardId, technicianUserId: input.technicianUserId, operation: input.operation, standardHours: input.standardHours, laborCostMinor: input.laborCostMinor }).$returningId(); return row; }),
  updateOperation: protectedProcedure.input(scope.extend({ operationId: z.number().int().positive(), status: z.enum(["planned", "in_progress", "paused", "completed", "rework"]), actualHours: z.string().max(20).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [operation] = await db.select().from(workshopOperations59).where(and(eq(workshopOperations59.id, input.operationId), eq(workshopOperations59.businessEntityId, input.businessEntityId))).limit(1); if (!operation) throw new TRPCError({ code: "NOT_FOUND", message: "عملية الورشة غير موجودة" }); await db.update(workshopOperations59).set({ status: input.status, actualHours: input.actualHours ?? operation.actualHours, startedAt: input.status === "in_progress" && !operation.startedAt ? new Date() : operation.startedAt, endedAt: input.status === "completed" || input.status === "rework" ? new Date() : operation.endedAt }).where(and(eq(workshopOperations59.id, input.operationId), eq(workshopOperations59.businessEntityId, input.businessEntityId))); return { ok: true, status: input.status }; }),
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
  createInspection: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), vehicleId: z.number().int().positive(), templateCode: z.string().trim().min(2).max(80), findingsJson: z.string().min(2).max(30000), mediaRefsJson: z.string().max(16000).optional(), summary: z.string().max(4000).optional(), status: z.enum(["draft", "completed", "customer_shared", "superseded"]).default("draft") })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [row] = await db.insert(workshopInspections59).values({ ...input, inspectorUserId: ctx.user.id, completedAt: input.status === "completed" ? new Date() : undefined }).$returningId(); return row;
  }),
  recordDtc: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), inspectionId: z.number().int().positive().optional(), code: z.string().trim().min(2).max(40), system: z.string().max(80).optional(), description: z.string().trim().min(2).max(2000), severity: z.enum(["info", "low", "medium", "high", "critical"]).default("medium"), rootCause: z.string().max(2000).optional(), recommendation: z.string().max(2000).optional(), evidenceJson: z.string().max(12000).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [row] = await db.insert(workshopDtc59).values(input).$returningId(); return row; }),
  requestPart: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), warehouseId: z.number().int().positive(), productId: z.number().int().positive(), quantity: z.number().int().positive(), lotCode: z.string().max(100).optional(), serialNo: z.string().max(120).optional(), idempotencyKey })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const existing = await db.select().from(workshopPartRequests59).where(and(eq(workshopPartRequests59.businessEntityId, input.businessEntityId), eq(workshopPartRequests59.idempotencyKey, input.idempotencyKey))).limit(1); if (existing[0]) return existing[0];
    const balance = await db.select().from(partsInventory).where(and(eq(partsInventory.businessEntityId, input.businessEntityId), eq(partsInventory.warehouseId, input.warehouseId), eq(partsInventory.productId, input.productId))).limit(1); const stock = balance[0]; if (!stock || stock.availableQty < input.quantity) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "الكمية المتاحة من القطعة غير كافية" });
    const [request] = await db.insert(workshopPartRequests59).values({ ...input, status: "reserved", requestedBy: ctx.user.id }).$returningId(); await db.update(partsInventory).set({ availableQty: sql`${partsInventory.availableQty} - ${input.quantity}`, reservedQty: sql`${partsInventory.reservedQty} + ${input.quantity}` }).where(eq(partsInventory.id, stock.id)); await db.insert(partsInventoryMovements).values({ businessEntityId: input.businessEntityId, warehouseId: input.warehouseId, productId: input.productId, movementType: "reservation", quantity: input.quantity, sourceType: "workshop_part_request_59", sourceId: String(request.id), idempotencyKey: `workshop-reserve-${input.idempotencyKey}` }); return request;
  }),
  issuePart: protectedProcedure.input(scope.extend({ requestId: z.number().int().positive(), quantity: z.number().int().positive(), idempotencyKey })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const previous = await db.select().from(partsInventoryMovements).where(and(eq(partsInventoryMovements.businessEntityId, input.businessEntityId), eq(partsInventoryMovements.idempotencyKey, input.idempotencyKey))).limit(1); if (previous[0]) return { ok: true, status: "issued" as const, replayed: true }; const request = await db.select().from(workshopPartRequests59).where(and(eq(workshopPartRequests59.id, input.requestId), eq(workshopPartRequests59.businessEntityId, input.businessEntityId))).limit(1); if (!request[0] || request[0].status !== "reserved") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "طلب القطعة غير محجوز للصرف" }); await db.update(workshopPartRequests59).set({ status: "issued" }).where(eq(workshopPartRequests59.id, input.requestId)); await db.update(partsInventory).set({ reservedQty: sql`GREATEST(${partsInventory.reservedQty} - ${input.quantity}, 0)` }).where(and(eq(partsInventory.businessEntityId, input.businessEntityId), eq(partsInventory.warehouseId, request[0].warehouseId), eq(partsInventory.productId, request[0].productId))); await db.insert(partsInventoryMovements).values({ businessEntityId: input.businessEntityId, warehouseId: request[0].warehouseId, productId: request[0].productId, movementType: "issue", quantity: input.quantity, sourceType: "workshop_part_request_59", sourceId: String(input.requestId), idempotencyKey: input.idempotencyKey }); return { ok: true, status: "issued" as const, replayed: false }; }),
  returnPart: protectedProcedure.input(scope.extend({ requestId: z.number().int().positive(), quantity: z.number().int().positive(), idempotencyKey })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const request = await db.select().from(workshopPartRequests59).where(and(eq(workshopPartRequests59.id, input.requestId), eq(workshopPartRequests59.businessEntityId, input.businessEntityId))).limit(1); if (!request[0] || request[0].status !== "reserved") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "طلب القطعة غير قابل للإرجاع" }); await db.update(workshopPartRequests59).set({ status: "returned" }).where(eq(workshopPartRequests59.id, input.requestId)); await db.update(partsInventory).set({ availableQty: sql`${partsInventory.availableQty} + ${input.quantity}`, reservedQty: sql`GREATEST(${partsInventory.reservedQty} - ${input.quantity}, 0)` }).where(and(eq(partsInventory.businessEntityId, input.businessEntityId), eq(partsInventory.warehouseId, request[0].warehouseId), eq(partsInventory.productId, request[0].productId))); return { ok: true, status: "returned" as const }; }),
  recordEstimateConsent: protectedProcedure.input(scope.extend({ estimateId: z.number().int().positive(), customerId: z.number().int().positive(), decision: z.enum(["approved", "rejected", "change_requested"]), version: z.number().int().positive(), estimateChecksum: z.string().trim().min(16).max(128), reason: z.string().max(2000).optional(), channel: z.string().max(40).default("portal"), ipHash: z.string().max(128).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [row] = await db.insert(workshopEstimateConsents59).values(input).$returningId(); await db.update(workshopEstimates59).set({ status: input.decision === "approved" ? "approved" : input.decision === "rejected" ? "rejected" : "partially_approved", approvalAt: input.decision === "approved" ? new Date() : undefined }).where(and(eq(workshopEstimates59.id, input.estimateId), eq(workshopEstimates59.businessEntityId, input.businessEntityId), eq(workshopEstimates59.version, input.version))); return row; }),
  authorizeRoadTest: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), driverUserId: z.number().int().positive(), startMileage: z.number().int().nonnegative(), routeJson: z.string().max(12000).optional() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [row] = await db.insert(workshopRoadTests59).values({ ...input, authorizedBy: ctx.user.id }).$returningId(); return row; }),
  completeRoadTest: protectedProcedure.input(scope.extend({ roadTestId: z.number().int().positive(), endMileage: z.number().int().nonnegative(), findings: z.string().max(3000).optional(), evidenceJson: z.string().max(12000).optional(), incident: z.boolean().default(false) })).mutation(async ({ input }) => { if (input.endMileage < 0) throw new TRPCError({ code: "BAD_REQUEST" }); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); await db.update(workshopRoadTests59).set({ endMileage: input.endMileage, findings: input.findings, evidenceJson: input.evidenceJson, incident: input.incident, status: "completed", completedAt: new Date() }).where(and(eq(workshopRoadTests59.id, input.roadTestId), eq(workshopRoadTests59.businessEntityId, input.businessEntityId))); return { ok: true, status: "completed" as const }; }),
  createWarranty: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), vehicleId: z.number().int().positive(), warrantyType: z.string().trim().min(2).max(80), coverageJson: z.string().min(2).max(12000), claimNo: z.string().max(100).optional(), comebackOfJobCardId: z.number().int().positive().optional(), rootCause: z.string().max(2000).optional(), responsibility: z.string().max(80).optional(), correctiveAction: z.string().max(4000).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [row] = await db.insert(workshopWarranties59).values(input).$returningId(); return row; }),
  uploadInspectionMedia: protectedProcedure.input(scope.extend({ jobCardId: z.number().int().positive(), fileName: z.string().trim().min(1).max(180), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), dataUrl: z.string().min(100).max(12000000) })).mutation(async ({ input }) => { const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/); if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "صيغة الصورة غير صالحة" }); const result = await storagePut(`workshop-59/${input.businessEntityId}/${input.jobCardId}/${input.fileName}`, Buffer.from(match[1], "base64"), input.contentType); return { ...result, jobCardId: input.jobCardId }; }),
});
