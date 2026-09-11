import { TRPCError } from "@trpc/server";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { biMetricDefinitions, biMetricFacts } from "../drizzle/schema";
import { getBiDomain, biDomainCatalog } from "../shared/biDomains";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

function central(role: string) { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Central BI privilege required" }); }
const input = z.object({ domain: z.string().min(2).max(40), from: z.coerce.date(), to: z.coerce.date(), businessEntityId: z.number().int().positive().optional() });

export const biDomainsRouter = router({
  catalog: protectedProcedure.query(async ({ ctx }) => { central(ctx.user.role); return biDomainCatalog.map(({ key, nameAr, metrics }) => ({ key, nameAr, metrics: [...metrics] })); }),
  dashboard: protectedProcedure.input(input).query(async ({ ctx, input }) => {
    central(ctx.user.role);
    const domain = getBiDomain(input.domain);
    if (!domain) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown BI domain" });
    const db = await getDb();
    if (!db) return { domain: { key: domain.key, nameAr: domain.nameAr }, filters: input, metrics: [], availableMetrics: domain.metrics, facts: 0, drilldown: [], freshness: null };
    const scope = and(gte(biMetricFacts.periodEnd, input.from), lte(biMetricFacts.periodStart, input.to), inArray(biMetricDefinitions.metricKey, [...domain.metrics]), input.businessEntityId ? eq(biMetricFacts.businessEntityId, input.businessEntityId) : undefined);
    const [metrics, facts, freshness] = await Promise.all([
      db.select({ key: biMetricDefinitions.metricKey, nameAr: biMetricDefinitions.nameAr, unit: biMetricDefinitions.unit, value: sql<string>`coalesce(sum(${biMetricFacts.valueNumeric}),0)`, sourceSystem: biMetricDefinitions.ownerSystem, version: biMetricFacts.metricVersion }).from(biMetricFacts).innerJoin(biMetricDefinitions, eq(biMetricDefinitions.id, biMetricFacts.metricDefinitionId)).where(scope).groupBy(biMetricDefinitions.metricKey, biMetricDefinitions.nameAr, biMetricDefinitions.unit, biMetricDefinitions.ownerSystem, biMetricFacts.metricVersion).limit(100),
      db.select({ count: sql<number>`count(*)` }).from(biMetricFacts).innerJoin(biMetricDefinitions, eq(biMetricDefinitions.id, biMetricFacts.metricDefinitionId)).where(scope),
      db.select({ lastRefresh: sql<Date>`max(${biMetricFacts.refreshedAt})` }).from(biMetricFacts).innerJoin(biMetricDefinitions, eq(biMetricDefinitions.id, biMetricFacts.metricDefinitionId)).where(scope),
    ]);
    const drilldown = await db.select({ entityId: biMetricFacts.businessEntityId, key: biMetricDefinitions.metricKey, value: sql<string>`coalesce(sum(${biMetricFacts.valueNumeric}),0)` }).from(biMetricFacts).innerJoin(biMetricDefinitions, eq(biMetricDefinitions.id, biMetricFacts.metricDefinitionId)).where(scope).groupBy(biMetricFacts.businessEntityId, biMetricDefinitions.metricKey).limit(100);
    return { domain: { key: domain.key, nameAr: domain.nameAr }, filters: input, availableMetrics: domain.metrics, metrics: metrics.map(row => ({ ...row, value: Number(row.value) })), facts: Number(facts[0]?.count ?? 0), drilldown: drilldown.map(row => ({ ...row, value: Number(row.value) })), freshness: freshness[0]?.lastRefresh ?? null };
  }),
});
