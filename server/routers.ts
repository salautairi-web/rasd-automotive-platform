import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAuditLog, enqueueEvent, getRasdOverview } from "./db";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { storagePut } from "./storage";
import { documents, customers, vehicles, products } from "../drizzle/schema";
import { getDb } from "./db";
import { nextRasdNumber } from "./numbering";
import { storageGetSignedUrl } from "./storage";
import { eq } from "drizzle-orm";

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
    createCustomer: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), nameAr: z.string().trim().min(2).max(180), phone: z.string().trim().max(40).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const customerNo = await nextRasdNumber({ organizationId: input.organizationId, entityKey: "customer" }); await db.insert(customers).values({ organizationId: input.organizationId, customerNo, nameAr: input.nameAr, phone: input.phone }); return { customerNo }; }),
    createVehicle: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), vin: z.string().trim().min(8).max(64), make: z.string().trim().min(2).max(80), model: z.string().trim().min(1).max(80), modelYear: z.number().int().optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const vehicleNo = await nextRasdNumber({ organizationId: input.organizationId, entityKey: "vehicle" }); await db.insert(vehicles).values({ ...input, vehicleNo }); return { vehicleNo }; }),
    createProduct: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), sku: z.string().trim().min(1).max(80), nameAr: z.string().trim().min(2).max(180), category: z.string().trim().max(80).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const productNo = await nextRasdNumber({ organizationId: input.organizationId, entityKey: "product" }); await db.insert(products).values({ ...input, productNo }); return { productNo }; }),
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
  rasd: router({
    overview: protectedProcedure.query(async () => getRasdOverview()),
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
