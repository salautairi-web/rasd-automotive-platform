import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAuditLog, enqueueEvent, getRasdOverview } from "./db";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { storagePut } from "./storage";
import { documents, customers, vehicles, products, organizations, integrationEvents, tasks, workflows, auditLogs, businessEntities, accountingBooks, journalEntries, journalLines, portfolioMetrics } from "../drizzle/schema";
import { getDb } from "./db";
import { nextRasdNumber } from "./numbering";
import { storageGetSignedUrl } from "./storage";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { validateBalancedJournal } from "../shared/erp";

const correlationSchema = z.string().trim().min(8).max(80).optional();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  masterData: router({
    createCustomer: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), businessEntityId: z.number().int().positive(), nameAr: z.string().trim().min(2).max(180), phone: z.string().trim().max(40).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const customerNo = await nextRasdNumber({ organizationId: input.organizationId, entityKey: "customer" }); await db.insert(customers).values({ organizationId: input.organizationId, businessEntityId: input.businessEntityId, customerNo, nameAr: input.nameAr, phone: input.phone }); return { customerNo }; }),
    createVehicle: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), businessEntityId: z.number().int().positive(), vin: z.string().trim().min(8).max(64), make: z.string().trim().min(2).max(80), model: z.string().trim().min(1).max(80), modelYear: z.number().int().optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const vehicleNo = await nextRasdNumber({ organizationId: input.organizationId, entityKey: "vehicle" }); await db.insert(vehicles).values({ ...input, vehicleNo }); return { vehicleNo }; }),
    createProduct: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), businessEntityId: z.number().int().positive(), sku: z.string().trim().min(1).max(80), nameAr: z.string().trim().min(2).max(180), category: z.string().trim().max(80).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const productNo = await nextRasdNumber({ organizationId: input.organizationId, entityKey: "product" }); await db.insert(products).values({ ...input, productNo }); return { productNo }; }),
  }),
  numbering: router({
    next: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), entityKey: z.enum(["customer", "vehicle", "product", "invoice", "workorder"]) })).query(({ input }) => nextRasdNumber(input)),
  }),
  documents: router({
    list: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), entityType: z.string().trim().min(2).max(80).optional(), entityId: z.string().trim().min(1).max(80).optional() })).query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      return db.select({ id: documents.id, fileName: documents.fileName, mimeType: documents.mimeType, entityType: documents.entityType, entityId: documents.entityId, storageKey: documents.storageKey, createdAt: documents.createdAt }).from(documents).where(eq(documents.organizationId, input.organizationId));
    }),
    download: protectedProcedure.input(z.object({ storageKey: z.string().trim().min(1).max(400) })).query(async ({ input }) => ({ url: await storageGetSignedUrl(input.storageKey) })),
    upload: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), entityType: z.string().trim().min(2).max(80), entityId: z.string().trim().min(1).max(80), fileName: z.string().trim().min(1).max(220), mimeType: z.string().trim().min(3).max(120), contentBase64: z.string().min(1).max(8_000_000) })).mutation(async ({ input, ctx }) => {
      const db = await getDb(); if (!db) throw new Error("database_unavailable");
      const stored = await storagePut(`rasd/${input.organizationId}/${input.entityType}/${input.fileName}`, Buffer.from(input.contentBase64, "base64"), input.mimeType);
      await db.insert(documents).values({ organizationId: input.organizationId, entityType: input.entityType, entityId: input.entityId, fileName: input.fileName, mimeType: input.mimeType, storageKey: stored.key, storageUrl: stored.url, uploadedBy: ctx.user.id });
      return { success: true, key: stored.key, url: stored.url } as const;
    }),
  }),
  erp: router({
    entities: protectedProcedure.query(async () => { const db = await getDb(); if (!db) return []; return db.select().from(businessEntities); }),
    createEntity: adminProcedure.input(z.object({ entityId: z.string().trim().min(3).max(40), code: z.string().trim().min(2).max(40), nameAr: z.string().trim().min(2).max(180), nameEn: z.string().trim().max(180).optional(), entityType: z.enum(["company", "subsidiary", "business_project", "business_activity", "investment_vehicle", "future"]), currency: z.string().trim().length(3).default("OMR"), timezone: z.string().trim().min(3).max(64).default("Asia/Muscat") })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); await db.insert(businessEntities).values(input); return { entityId: input.entityId, created: true }; }),
    accountingBooks: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; return db.select().from(accountingBooks).where(eq(accountingBooks.businessEntityId, input.businessEntityId)); }),
    createJournal: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), entryNo: z.string().trim().min(3).max(60), sourceSystem: z.string().trim().min(2).max(60), sourceType: z.string().trim().min(2).max(60), sourceId: z.string().trim().min(1).max(80), currency: z.string().trim().length(3), correlationId: z.string().trim().min(8).max(80), lines: z.array(z.object({ accountId: z.number().int().positive(), debitMinor: z.number().int().min(0), creditMinor: z.number().int().min(0), description: z.string().max(255).optional() })).min(2) })).mutation(async ({ input }) => { const balance = validateBalancedJournal(input.lines); const debit = balance.debitMinor; const credit = balance.creditMinor; if (!balance.valid) throw new TRPCError({ code: "BAD_REQUEST", message: "Debit and credit totals must match and be positive" }); const db = await getDb(); if (!db) throw new Error("database_unavailable"); return db.transaction(async (tx) => { const inserted = await tx.insert(journalEntries).values({ businessEntityId: input.businessEntityId, entryNo: input.entryNo, sourceSystem: input.sourceSystem, sourceType: input.sourceType, sourceId: input.sourceId, correlationId: input.correlationId, status: "validated" }); const journalEntryId = Number(inserted[0].insertId); await tx.insert(journalLines).values(input.lines.map((line) => ({ ...line, journalEntryId, currency: input.currency }))); return { journalEntryId, status: "validated" as const, debitMinor: debit, creditMinor: credit }; }); }),
    postJournal: protectedProcedure.input(z.object({ journalEntryId: z.number().int().positive() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const result = await db.update(journalEntries).set({ status: "posted", postedAt: new Date() }).where(and(eq(journalEntries.id, input.journalEntryId), eq(journalEntries.status, "validated"))); if (!result[0].affectedRows) throw new TRPCError({ code: "CONFLICT", message: "Only a validated journal can be posted" }); return { journalEntryId: input.journalEntryId, status: "posted" as const }; }),
    reverseJournal: protectedProcedure.input(z.object({ journalEntryId: z.number().int().positive() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const result = await db.update(journalEntries).set({ status: "reversed" }).where(and(eq(journalEntries.id, input.journalEntryId), eq(journalEntries.status, "posted"))); if (!result[0].affectedRows) throw new TRPCError({ code: "CONFLICT", message: "Only a posted journal can be reversed" }); return { journalEntryId: input.journalEntryId, status: "reversed" as const }; }),
    portfolio: protectedProcedure.input(z.object({ periodCode: z.string().trim().min(4).max(20) })).query(async ({ input }) => { const db = await getDb(); if (!db) return { periodCode: input.periodCode, entities: [], totals: { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0, roiBps: 0 } }; const rows = await db.select().from(portfolioMetrics).where(eq(portfolioMetrics.periodCode, input.periodCode)); return { periodCode: input.periodCode, entities: rows, totals: rows.reduce((a, r) => ({ revenueMinor: a.revenueMinor + r.revenueMinor, profitMinor: a.profitMinor + r.profitMinor, capitalInvestedMinor: a.capitalInvestedMinor + r.capitalInvestedMinor, roiBps: a.roiBps + r.roiBps }), { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0, roiBps: 0 }) }; }),
    executiveOverview: protectedProcedure.input(z.object({ periodCode: z.string().trim().min(4).max(20) })).query(async ({ input }) => { const db = await getDb(); if (!db) return { periodCode: input.periodCode, portfolio: { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0 }, integrations: { pending: 0, failed: 0 }, tasks: { open: 0 } }; const [portfolio, integrations, tasksOpen] = await Promise.all([db.select({ revenueMinor: sql<number>`coalesce(sum(${portfolioMetrics.revenueMinor}),0)`, profitMinor: sql<number>`coalesce(sum(${portfolioMetrics.profitMinor}),0)`, capitalInvestedMinor: sql<number>`coalesce(sum(${portfolioMetrics.capitalInvestedMinor}),0)` }).from(portfolioMetrics).where(eq(portfolioMetrics.periodCode, input.periodCode)), db.select({ pending: sql<number>`coalesce(sum(case when ${integrationEvents.status} = 'pending' then 1 else 0 end),0)`, failed: sql<number>`coalesce(sum(case when ${integrationEvents.status} = 'failed' then 1 else 0 end),0)` }).from(integrationEvents), db.select({ open: sql<number>`coalesce(sum(case when ${tasks.status} <> 'completed' then 1 else 0 end),0)` }).from(tasks)]); return { periodCode: input.periodCode, portfolio: portfolio[0] ?? { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0 }, integrations: integrations[0] ?? { pending: 0, failed: 0 }, tasks: tasksOpen[0] ?? { open: 0 } }; }),
  }),
  rasd: router({
    overview: protectedProcedure.query(async () => getRasdOverview()),
    moduleRows: protectedProcedure.input(z.object({ path: z.string(), organizationId: z.number().int().positive(), businessEntityId: z.number().int().positive(), periodCode: z.string().trim().min(4).max(20).default("2026") })).query(async ({ input, ctx }) => {
      if (input.path === "/integrations" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "integration.read permission required" });
      const db = await getDb(); if (!db) return [];
      if (input.path === "/organization") return db.select({ code: organizations.code, nameAr: organizations.nameAr, status: organizations.status }).from(organizations).where(eq(organizations.id, input.organizationId));
      if (input.path === "/erp/entities") return db.select({ entityId: businessEntities.entityId, nameAr: businessEntities.nameAr, entityType: businessEntities.entityType, status: businessEntities.status }).from(businessEntities);
      if (input.path === "/erp/accounting") return db.select({ bookCode: accountingBooks.bookCode, nameAr: accountingBooks.nameAr, currency: accountingBooks.currency, status: accountingBooks.status }).from(accountingBooks);
      if (input.path === "/erp/portfolio") return db.select({ businessEntityId: portfolioMetrics.businessEntityId, periodCode: portfolioMetrics.periodCode, revenueMinor: portfolioMetrics.revenueMinor, profitMinor: portfolioMetrics.profitMinor }).from(portfolioMetrics).where(eq(portfolioMetrics.periodCode, input.periodCode));
      if (input.path === "/master-data") {
        const [customerRows, vehicleRows, productRows] = await Promise.all([
          db.select({ id: customers.customerNo, name: customers.nameAr, category: sql<string>`'عميل'`, owner: sql<string>`'الهوية المركزية'` }).from(customers).where(and(eq(customers.organizationId, input.organizationId), eq(customers.businessEntityId, input.businessEntityId))).limit(50),
          db.select({ id: vehicles.vehicleNo, name: sql<string>`concat(${vehicles.make}, ' ', ${vehicles.model})`, category: sql<string>`'مركبة'`, owner: sql<string>`'الهوية المركزية'` }).from(vehicles).where(and(eq(vehicles.organizationId, input.organizationId), eq(vehicles.businessEntityId, input.businessEntityId))).limit(50),
          db.select({ id: products.productNo, name: products.nameAr, category: sql<string>`'منتج'`, owner: sql<string>`'الهوية المركزية'` }).from(products).where(and(eq(products.organizationId, input.organizationId), eq(products.businessEntityId, input.businessEntityId))).limit(50),
        ]); return [...customerRows, ...vehicleRows, ...productRows];
      }
      if (input.path === "/integrations") return db.select({ eventType: integrationEvents.eventType, sourceSystem: integrationEvents.sourceSystem, status: integrationEvents.status, retryCount: integrationEvents.retryCount }).from(integrationEvents).limit(50);
      if (input.path === "/tasks") return db.select({ titleAr: tasks.titleAr, taskType: tasks.taskType, priority: tasks.priority, status: tasks.status }).from(tasks).where(eq(tasks.organizationId, input.organizationId)).limit(50);
      if (input.path === "/workflows") return db.select({ workflowKey: workflows.workflowKey, nameAr: workflows.nameAr, status: workflows.status }).from(workflows).where(eq(workflows.organizationId, input.organizationId)).limit(50);
      if (input.path === "/documents") return db.select({ fileName: documents.fileName, entityType: documents.entityType, entityId: documents.entityId, mimeType: documents.mimeType }).from(documents).where(eq(documents.organizationId, input.organizationId)).limit(50);
      if (input.path === "/audit") return db.select({ action: auditLogs.action, systemKey: auditLogs.systemKey, entityId: auditLogs.entityId, result: sql<string>`'ناجح'` }).from(auditLogs).where(eq(auditLogs.organizationId, input.organizationId)).limit(50);
      return [];
    }),
    intakeEvent: adminProcedure.input(z.object({
      eventId: z.string().trim().min(8).max(80), eventType: z.string().trim().min(3).max(100),
      sourceSystem: z.string().trim().min(2).max(48), entityType: z.string().trim().min(2).max(80),
      entityId: z.string().trim().min(1).max(80), payload: z.record(z.string(), z.unknown()).default({}), correlationId: correlationSchema, idempotencyKey: z.string().trim().min(8).max(160),
    })).mutation(async ({ input, ctx }) => {
      const correlationId = input.correlationId ?? nanoid(16);
      const payload = JSON.stringify(input.payload);
      const requestHash = createHash("sha256").update(`${input.eventId}:${input.eventType}:${payload}`).digest("hex");
      const result = await enqueueEvent({ ...input, correlationId, payload, requestHash });
      if (result.accepted) await createAuditLog({ userId: ctx.user.id, systemKey: "integration", entityType: "event", entityId: input.eventId, action: "enqueue", correlationId, newValue: JSON.stringify({ eventType: input.eventType }) });
      return { ...result, correlationId };
    }),
  }),
});
export type AppRouter = typeof appRouter;
