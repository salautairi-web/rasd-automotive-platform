import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { biDimensions, biExportAudit, biKpiDefinitions, biKpiVersions, biLineage, biQualityAssessments, biReconciliations, biScenarios, biSemanticMetrics, biWarehouseFacts } from "../drizzle/schema";

function central(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Central BI privilege required" });
}

const scopeInput = z.object({ businessEntityId: z.number().int().positive().optional() });

export const bi45Router = router({
  cockpit: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => {
    central(ctx.user.role);
    const db = await getDb();
    if (!db) return { facts: 0, dimensions: 0, certifiedMetrics: 0, activeKpis: 0, openDifferences: 0, quality: null, scenarios: [], lineage: 0 };
    const [facts, dimensions, certifiedMetrics, activeKpis, openDifferences, quality, scenarios, lineage] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(biWarehouseFacts).where(input.businessEntityId ? eq(biWarehouseFacts.businessEntityId, input.businessEntityId) : sql`1=1`),
      db.select({ count: sql<number>`count(*)` }).from(biDimensions).where(sql`1=1`),
      db.select({ count: sql<number>`count(*)` }).from(biSemanticMetrics).where(eq(biSemanticMetrics.status, "certified")),
      db.select({ count: sql<number>`count(*)` }).from(biKpiDefinitions).where(eq(biKpiDefinitions.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(biReconciliations).where(sql`${biReconciliations.status} in ('difference','failed') and ${input.businessEntityId ? sql`${biReconciliations.businessEntityId} = ${input.businessEntityId}` : sql`1=1`}`),
      db.select({ completeness: sql<number>`avg(${biQualityAssessments.completenessBps})`, accuracy: sql<number>`avg(${biQualityAssessments.accuracyBps})`, timeliness: sql<number>`avg(${biQualityAssessments.timelinessBps})`, consistency: sql<number>`avg(${biQualityAssessments.consistencyBps})` }).from(biQualityAssessments).where(input.businessEntityId ? eq(biQualityAssessments.businessEntityId, input.businessEntityId) : sql`1=1`),
      db.select({ key: biScenarios.scenarioKey, nameAr: biScenarios.nameAr, type: biScenarios.scenarioType, status: biScenarios.approvalStatus, entityId: biScenarios.businessEntityId }).from(biScenarios).where(input.businessEntityId ? eq(biScenarios.businessEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(biScenarios.createdAt)).limit(12),
      db.select({ count: sql<number>`count(*)` }).from(biLineage),
    ]);
    return { facts: Number(facts[0]?.count ?? 0), dimensions: Number(dimensions[0]?.count ?? 0), certifiedMetrics: Number(certifiedMetrics[0]?.count ?? 0), activeKpis: Number(activeKpis[0]?.count ?? 0), openDifferences: Number(openDifferences[0]?.count ?? 0), quality: quality[0] ? { completeness: Number(quality[0].completeness ?? 0), accuracy: Number(quality[0].accuracy ?? 0), timeliness: Number(quality[0].timeliness ?? 0), consistency: Number(quality[0].consistency ?? 0) } : null, scenarios, lineage: Number(lineage[0]?.count ?? 0) };
  }),
  kpis: protectedProcedure.query(async ({ ctx }) => { central(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select({ id: biKpiDefinitions.id, key: biKpiDefinitions.kpiKey, nameAr: biKpiDefinitions.nameAr, definition: biKpiDefinitions.definition, formula: biKpiDefinitions.formulaJson, sourceMetricKey: biKpiDefinitions.sourceMetricKey, frequency: biKpiDefinitions.frequency, status: biKpiDefinitions.status }).from(biKpiDefinitions).orderBy(biKpiDefinitions.kpiKey).limit(100); }),
  semanticMetrics: protectedProcedure.query(async ({ ctx }) => { central(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select({ id: biSemanticMetrics.id, key: biSemanticMetrics.metricKey, nameAr: biSemanticMetrics.nameAr, unit: biSemanticMetrics.unit, status: biSemanticMetrics.status, version: biSemanticMetrics.version, sourceMartKey: biSemanticMetrics.sourceMartKey }).from(biSemanticMetrics).orderBy(biSemanticMetrics.metricKey).limit(100); }),
  reconciliations: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => { central(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select().from(biReconciliations).where(input.businessEntityId ? eq(biReconciliations.businessEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(biReconciliations.createdAt)).limit(50); }),
  quality: protectedProcedure.input(scopeInput).query(async ({ ctx, input }) => { central(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select().from(biQualityAssessments).where(input.businessEntityId ? eq(biQualityAssessments.businessEntityId, input.businessEntityId) : sql`1=1`).orderBy(desc(biQualityAssessments.evaluatedAt)).limit(50); }),
  lineage: protectedProcedure.input(z.object({ metricKey: z.string().min(1).max(100).optional(), dashboardKey: z.string().min(1).max(100).optional() })).query(async ({ ctx, input }) => { central(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select().from(biLineage).where(input.metricKey ? eq(biLineage.metricKey, input.metricKey) : input.dashboardKey ? eq(biLineage.dashboardKey, input.dashboardKey) : sql`1=1`).orderBy(desc(biLineage.createdAt)).limit(100); }),
  auditExport: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive().optional(), dashboardKey: z.string().min(2).max(100), format: z.enum(["csv", "pdf", "xlsx"]), filtersJson: z.string().max(4000), rowCount: z.number().int().nonnegative().default(0), decision: z.enum(["allowed", "denied"]) })).mutation(async ({ ctx, input }) => { central(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable"); await db.insert(biExportAudit).values({ ...input, userId: ctx.user.id }); return { accepted: true as const }; }),
});

export type Bi45Router = typeof bi45Router;
