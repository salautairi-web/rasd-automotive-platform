import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { biDataQualityIssues, biDataMarts, biDashboards, biForecasts, biIngestionJobs, biLineage, biMetricDefinitions, biRefreshJobs, biSources } from "../drizzle/schema";

function central(role: string) { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Central BI privilege required" }); }
const entityInput = z.object({ businessEntityId: z.number().int().positive().optional() });

export const biWarehouseRouter = router({
  overview: protectedProcedure.input(entityInput).query(async ({ ctx, input }) => {
    central(ctx.user.role); const db = await getDb();
    if (!db) return { sources: [], marts: [], dashboards: [], refreshes: [], quality: { critical: 0, warning: 0 }, forecasts: [], lineageCount: 0 };
    const [sources, marts, dashboards, refreshes, quality, forecasts, lineage] = await Promise.all([
      db.select({ id: biSources.id, key: biSources.sourceKey, nameAr: biSources.nameAr, status: biSources.status, contractVersion: biSources.contractVersion }).from(biSources).limit(40),
      db.select({ id: biDataMarts.id, key: biDataMarts.martKey, nameAr: biDataMarts.nameAr, domain: biDataMarts.domain, status: biDataMarts.status, version: biDataMarts.version }).from(biDataMarts).limit(40),
      db.select({ id: biDashboards.id, key: biDashboards.dashboardKey, nameAr: biDashboards.nameAr, type: biDashboards.dashboardType, status: biDashboards.status, certified: biDashboards.certified }).from(biDashboards).limit(40),
      db.select().from(biRefreshJobs).orderBy(desc(biRefreshJobs.createdAt)).limit(20),
      db.select({ critical: sql<number>`sum(case when ${biDataQualityIssues.severity}='critical' and ${biDataQualityIssues.resolvedAt} is null then 1 else 0 end)`, warning: sql<number>`sum(case when ${biDataQualityIssues.severity}='warning' and ${biDataQualityIssues.resolvedAt} is null then 1 else 0 end)` }).from(biDataQualityIssues).where(input.businessEntityId ? eq(biDataQualityIssues.businessEntityId, input.businessEntityId) : sql`1=1`),
      db.select({ id: biForecasts.id, key: biForecasts.forecastKey, metricKey: biForecasts.metricKey, entityId: biForecasts.businessEntityId, scenario: biForecasts.scenario, value: biForecasts.valueNumeric, confidenceBps: biForecasts.confidenceBps, review: biForecasts.humanReviewStatus }).from(biForecasts).where(input.businessEntityId ? eq(biForecasts.businessEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(biForecasts.createdAt)).limit(20),
      db.select({ count: sql<number>`count(*)` }).from(biLineage),
    ]);
    return { sources, marts, dashboards, refreshes, quality: { critical: Number(quality[0]?.critical ?? 0), warning: Number(quality[0]?.warning ?? 0) }, forecasts: forecasts.map(x => ({ ...x, value: Number(x.value ?? 0) })), lineageCount: Number(lineage[0]?.count ?? 0) };
  }),
  ingestJobs: protectedProcedure.input(z.object({ sourceId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => { central(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select().from(biIngestionJobs).where(input.sourceId ? eq(biIngestionJobs.sourceId, input.sourceId) : sql`1=1`).orderBy(desc(biIngestionJobs.createdAt)).limit(50); }),
  metricCatalog: protectedProcedure.query(async ({ ctx }) => { central(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select({ id: biMetricDefinitions.id, key: biMetricDefinitions.metricKey, nameAr: biMetricDefinitions.nameAr, category: biMetricDefinitions.category, unit: biMetricDefinitions.unit, status: biMetricDefinitions.status, version: biMetricDefinitions.currentVersion }).from(biMetricDefinitions).limit(100); }),
});
