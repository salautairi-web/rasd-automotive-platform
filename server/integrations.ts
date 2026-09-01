import { and, desc, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { integrationApis, integrationAudit, integrationBusEvents, integrationDeadLetters, integrationIncidents, integrationRequests, integrationServices, integrationWebhooks } from "../drizzle/schema";
import { getDb } from "./db";
import { buildGatewayContext, validateGatewayRequest } from "../shared/gateway";
import { protectedProcedure, router } from "./_core/trpc";

const adminOnly = (role: string) => {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية إدارة التكاملات مطلوبة" });
};
const jsonObject = z.record(z.string(), z.unknown());
const scopeInput = z.object({ businessEntityId: z.number().int().positive().optional() });
const hashPayload = (payload: Record<string, unknown>) => createHash("sha256").update(JSON.stringify(payload)).digest("hex");

export const integrationsRouter = router({
  dashboard: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    if (!db) return { services: 0, activeServices: 0, apis: 0, queuedEvents: 0, failedEvents: 0, openDeadLetters: 0, failedWebhooks: 0, openIncidents: 0, recentEvents: [] };
    const scope = input.businessEntityId ? eq(integrationServices.businessEntityId, input.businessEntityId) : undefined;
    const [services, apis, events, deadLetters, webhooks, incidents] = await Promise.all([
      db.select({ total: sql<number>`count(*)`, active: sql<number>`sum(case when ${integrationServices.status}='active' then 1 else 0 end)` }).from(integrationServices).where(scope),
      db.select({ total: sql<number>`count(*)` }).from(integrationApis),
      db.select({ queued: sql<number>`sum(case when ${integrationBusEvents.status} in ('queued','processing') then 1 else 0 end)`, failed: sql<number>`sum(case when ${integrationBusEvents.status} in ('failed','dead_lettered') then 1 else 0 end)` }).from(integrationBusEvents),
      db.select({ total: sql<number>`count(*)` }).from(integrationDeadLetters).where(and(eq(integrationDeadLetters.status, "open"), input.businessEntityId ? eq(integrationDeadLetters.businessEntityId, input.businessEntityId) : sql`1=1`)),
      db.select({ total: sql<number>`count(*)` }).from(integrationWebhooks).where(input.businessEntityId ? eq(integrationWebhooks.businessEntityId, input.businessEntityId) : sql`1=1`),
      db.select({ total: sql<number>`count(*)` }).from(integrationIncidents).where(and(eq(integrationIncidents.status, "open"), input.businessEntityId ? eq(integrationIncidents.businessEntityId, input.businessEntityId) : sql`1=1`)),
    ]);
    const recentEvents = await db.select({ eventId: integrationBusEvents.eventId, eventType: integrationBusEvents.eventType, status: integrationBusEvents.status, correlationId: integrationBusEvents.correlationId, occurredAt: integrationBusEvents.occurredAt }).from(integrationBusEvents).orderBy(desc(integrationBusEvents.occurredAt)).limit(8);
    return { services: Number(services[0]?.total ?? 0), activeServices: Number(services[0]?.active ?? 0), apis: Number(apis[0]?.total ?? 0), queuedEvents: Number(events[0]?.queued ?? 0), failedEvents: Number(events[0]?.failed ?? 0), openDeadLetters: Number(deadLetters[0]?.total ?? 0), failedWebhooks: Number(webhooks[0]?.total ?? 0), openIncidents: Number(incidents[0]?.total ?? 0), recentEvents };
  }),
  services: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    return db ? db.select().from(integrationServices).where(input.businessEntityId ? eq(integrationServices.businessEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(integrationServices.createdAt)).limit(100) : [];
  }),
  apis: protectedProcedure.input(z.object({ serviceId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    return db ? db.select().from(integrationApis).where(eq(integrationApis.serviceId, input.serviceId)).limit(100) : [];
  }),
  events: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    return db ? db.select().from(integrationBusEvents).where(input.businessEntityId ? eq(integrationBusEvents.sourceEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(integrationBusEvents.occurredAt)).limit(100) : [];
  }),
  createService: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive().optional(), serviceKey: z.string().min(3).max(100), nameAr: z.string().min(2).max(180), ownerSystem: z.string().min(2).max(100), baseUrl: z.string().url().optional(), version: z.string().min(1).max(40).default("v1"), capabilities: z.array(z.string()).default([]), authMethod: z.enum(["oauth2", "oidc", "api_key", "jwt", "mtls", "internal"]).default("internal") })).mutation(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    if (!db) throw new Error("database_unavailable");
    const existing = await db.select({ id: integrationServices.id }).from(integrationServices).where(and(input.businessEntityId ? eq(integrationServices.businessEntityId, input.businessEntityId) : sql`${integrationServices.businessEntityId} is null`, eq(integrationServices.serviceKey, input.serviceKey))).limit(1);
    if (existing[0]) return { id: existing[0].id, replay: true as const };
    const result = await db.insert(integrationServices).values({ businessEntityId: input.businessEntityId, serviceKey: input.serviceKey, nameAr: input.nameAr, ownerSystem: input.ownerSystem, baseUrl: input.baseUrl, version: input.version, capabilitiesJson: JSON.stringify(input.capabilities), authMethod: input.authMethod });
    return { id: Number(result[0].insertId), replay: false as const };
  }),
  registerApi: protectedProcedure.input(z.object({ serviceId: z.number().int().positive(), apiKey: z.string().min(3).max(120), nameAr: z.string().min(2).max(180), version: z.string().min(1).max(40).default("v1"), method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]), endpoint: z.string().min(1).max(240), scope: z.enum(["central", "entity", "cross_entity"]).default("entity"), schema: jsonObject.default({}), permissions: z.array(z.string()).default([]), rateLimitPerMinute: z.number().int().positive().max(100000).default(60) })).mutation(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    if (!db) throw new Error("database_unavailable");
    const existing = await db.select({ id: integrationApis.id }).from(integrationApis).where(and(eq(integrationApis.serviceId, input.serviceId), eq(integrationApis.apiKey, input.apiKey), eq(integrationApis.version, input.version))).limit(1);
    if (existing[0]) return { id: existing[0].id, replay: true as const };
    const result = await db.insert(integrationApis).values({ serviceId: input.serviceId, apiKey: input.apiKey, nameAr: input.nameAr, version: input.version, method: input.method, endpoint: input.endpoint, scope: input.scope, schemaJson: JSON.stringify(input.schema), permissionsJson: JSON.stringify(input.permissions), rateLimitPerMinute: input.rateLimitPerMinute });
    return { id: Number(result[0].insertId), replay: false as const };
  }),
  publishEvent: protectedProcedure.input(z.object({ eventType: z.string().min(3).max(120), eventVersion: z.string().min(1).max(40).default("1"), sourceSystem: z.string().min(2).max(100), sourceEntityId: z.number().int().positive().optional(), targetSystem: z.string().max(100).optional(), targetEntityId: z.number().int().positive().optional(), aggregateId: z.string().max(120).optional(), commandId: z.string().max(100).optional(), correlationId: z.string().min(8).max(100), idempotencyKey: z.string().min(8).max(180), payload: jsonObject })).mutation(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    if (!db) throw new Error("database_unavailable");
    const payloadHash = hashPayload(input.payload);
    const prior = await db.select({ eventId: integrationBusEvents.eventId, payloadHash: integrationBusEvents.payloadHash, status: integrationBusEvents.status }).from(integrationBusEvents).where(eq(integrationBusEvents.idempotencyKey, input.idempotencyKey)).limit(1);
    if (prior[0] && prior[0].payloadHash !== payloadHash) throw new TRPCError({ code: "CONFLICT", message: "مفتاح Idempotency مستخدم بحمولة مختلفة" });
    if (prior[0]) return { eventId: prior[0].eventId, status: prior[0].status, replay: true as const };
    const eventId = `EVT-${nanoid(14)}`;
    await db.insert(integrationBusEvents).values({ eventId, eventType: input.eventType, eventVersion: input.eventVersion, sourceSystem: input.sourceSystem, sourceEntityId: input.sourceEntityId, targetSystem: input.targetSystem, targetEntityId: input.targetEntityId, aggregateId: input.aggregateId, commandId: input.commandId, correlationId: input.correlationId, payload: JSON.stringify(input.payload), payloadHash, idempotencyKey: input.idempotencyKey });
    await db.insert(integrationAudit).values({ businessEntityId: input.sourceEntityId, requestId: `PUB-${nanoid(10)}`, correlationId: input.correlationId, sourceSystem: input.sourceSystem, targetSystem: input.targetSystem ?? "EVENT_BUS", actorRef: `user:${ctx.user.id}`, operation: "event.publish", result: "accepted", payloadHash });
    return { eventId, status: "queued" as const, replay: false as const };
  }),
  deadLetters: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    return db ? db.select().from(integrationDeadLetters).where(and(eq(integrationDeadLetters.status, "open"), input.businessEntityId ? eq(integrationDeadLetters.businessEntityId, input.businessEntityId) : sql`1=1`)).orderBy(desc(integrationDeadLetters.createdAt)).limit(100) : [];
  }),
  incidents: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    return db ? db.select().from(integrationIncidents).where(input.businessEntityId ? eq(integrationIncidents.businessEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(integrationIncidents.createdAt)).limit(100) : [];
  }),
  recordRequest: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive().optional(), sourceSystem: z.string().min(2), targetSystem: z.string().min(2), apiKey: z.string().max(120).optional(), method: z.string().min(3).max(10), endpoint: z.string().min(1).max(500), correlationId: z.string().min(8).max(100), idempotencyKey: z.string().max(180).optional(), requestHash: z.string().max(128).optional() })).mutation(async ({ ctx, input }) => {
    adminOnly(ctx.user.role);
    const db = await getDb();
    if (!db) throw new Error("database_unavailable");
    const gatewayContext = buildGatewayContext({ method: input.method, endpoint: input.endpoint, correlationId: input.correlationId });
    const gate = validateGatewayRequest({ ...gatewayContext, businessEntityId: input.businessEntityId, requiredScope: input.businessEntityId ? "entity" : "central", actorRole: ctx.user.role, entityMembership: true, rateCount: 0, rateLimitPerMinute: 60 });
    const requestId = gatewayContext.requestId;
    if (!gate.accepted) { await db.insert(integrationAudit).values({ businessEntityId: input.businessEntityId, requestId, correlationId: gatewayContext.correlationId, sourceSystem: input.sourceSystem, targetSystem: input.targetSystem, actorRef: `user:${ctx.user.id}`, operation: "gateway.request", result: "rejected", errorCode: gate.code, payloadHash: input.requestHash }); throw new TRPCError({ code: "BAD_REQUEST", message: gate.code }); }
    await db.insert(integrationRequests).values({ ...input, requestId, correlationId: gatewayContext.correlationId, status: "received" });
    return { requestId, correlationId: gatewayContext.correlationId, accepted: true as const };
  }),
});

export const integrationErrorResponse = (error: unknown, correlationId: string) => ({ code: error instanceof TRPCError ? error.code : "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unknown integration error", correlationId });
