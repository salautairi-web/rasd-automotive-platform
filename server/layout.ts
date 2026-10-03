import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb, createAuditLog } from "./db";
import { auditLogs, iamMemberships, iamRoles, uiLayoutPolicies, uiLayoutPreferences, uiLayoutTemplateVersions, uiLayoutTemplates } from "../drizzle/schema";
import { cloneLayoutConfig, defaultLayoutForRole, layoutRoleKeys, type LayoutConfig, type LayoutMode } from "../shared/layoutTemplates";
import { diffLayoutConfigs, layoutVersionRestoreNote, nextLayoutVersion } from "../shared/layoutVersions";

const mode = z.enum(["customer", "user"]);
const id = z.number().int().positive();
const configSchema = z.object({
  domainOrder: z.array(z.string().min(1).max(40)).min(1).max(20),
  visibleDomains: z.array(z.string().min(1).max(40)).max(20),
  serviceOrder: z.record(z.string().max(40), z.array(z.string().max(180)).max(30)),
  systemOrder: z.array(z.string().min(1).max(60)).max(40).optional(),
});
const requireAdmin = (role: string) => { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية إدارة تخطيط الواجهات مطلوبة" }); };

function templateName(roleKey: string) {
  const names: Record<string, string> = { branch_manager: "مدير فرع", finance_manager: "مدير المالية", project_manager: "مدير المشاريع", warehouse_manager: "مدير المستودع", sales_manager: "مدير المبيعات", hr_manager: "مدير الموارد البشرية", hr_specialist: "موظف الموارد البشرية", accountant: "المحاسب", sales_agent: "مندوب المبيعات", warehouse_clerk: "أمين المستودع", workshop_technician: "فني الورشة", rental_agent: "موظف التأجير", customer_service: "خدمة العملاء", auditor_readonly: "مدقق قراءة فقط", workshop_manager: "مدير الورشة", rental_manager: "مدير التأجير", quality_controller: "مراقب الجودة" };
  return names[roleKey] ?? roleKey;
}

async function resolveRoleKey(ctx: { user: { id: number; role: string } }, input: { mode: LayoutMode; roleKey: string; businessEntityId?: number }) {
  if (ctx.user.role === "admin" || input.mode === "customer") return input.roleKey;
  if (!input.businessEntityId) throw new TRPCError({ code: "BAD_REQUEST", message: "كيان الأعمال مطلوب لتحديد الدور" });
  const db = await getDb();
  if (!db) throw new Error("database_unavailable");
  const [membership] = await db.select({ roleKey: iamRoles.roleKey }).from(iamMemberships).innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id)).where(and(eq(iamMemberships.userId, ctx.user.id), eq(iamMemberships.businessEntityId, input.businessEntityId), eq(iamMemberships.status, "active"), eq(iamRoles.status, "active"))).limit(1);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "لا توجد عضوية فعالة لهذا الكيان" });
  return membership.roleKey;
}

function scopeKey(userId: number, roleKey: string, input: { mode: LayoutMode; businessEntityId?: number; branchId?: number }) { return `${userId}:${roleKey}:${input.mode}:${input.businessEntityId ?? 0}:${input.branchId ?? 0}`; }
function policyKey(roleKey: string, input: { mode: LayoutMode; businessEntityId?: number; branchId?: number }) { return `${roleKey}:${input.mode}:${input.businessEntityId ?? 0}:${input.branchId ?? 0}`; }
function parseConfig(raw: string | null | undefined, roleKey: string, currentMode: LayoutMode): LayoutConfig {
  try { return configSchema.parse(raw ? JSON.parse(raw) : defaultLayoutForRole(roleKey, currentMode)); } catch { return defaultLayoutForRole(roleKey, currentMode); }
}
function staticTemplates() { return layoutRoleKeys.map(roleKey => ({ templateKey: `system:${roleKey}:user`, roleKey, mode: "user" as const, nameAr: templateName(roleKey), config: defaultLayoutForRole(roleKey, "user"), isSystem: true, status: "active" as const, latestVersionNo: 0 })); }

export const layoutRouter = router({
  templates: protectedProcedure.input(z.object({ mode: mode.default("user") }).default({ mode: "user" })).query(async ({ input }) => {
    const db = await getDb();
    const rows = db ? await db.select().from(uiLayoutTemplates).where(and(eq(uiLayoutTemplates.mode, input.mode), eq(uiLayoutTemplates.status, "active"))).orderBy(uiLayoutTemplates.nameAr).limit(100) : [];
    if (!rows.length) return staticTemplates().filter(item => item.mode === input.mode);
    const result = await Promise.all(rows.map(async row => {
      const [latest] = await db!.select({ versionNo: uiLayoutTemplateVersions.versionNo }).from(uiLayoutTemplateVersions).where(and(eq(uiLayoutTemplateVersions.templateKey, row.templateKey), eq(uiLayoutTemplateVersions.status, "published"))).orderBy(desc(uiLayoutTemplateVersions.versionNo)).limit(1);
      return { templateKey: row.templateKey, roleKey: row.roleKey, mode: row.mode, nameAr: row.nameAr, config: parseConfig(row.configJson, row.roleKey, row.mode), isSystem: row.isSystem, status: row.status, latestVersionNo: latest?.versionNo ?? 0 };
    }));
    return result;
  }),
  get: protectedProcedure.input(z.object({ mode, roleKey: z.string().min(1).max(100), businessEntityId: id.optional(), branchId: id.optional() })).query(async ({ ctx, input }) => {
    const resolvedRoleKey = await resolveRoleKey(ctx, input); const fallback = defaultLayoutForRole(resolvedRoleKey, input.mode); const db = await getDb();
    if (!db) return { config: fallback, source: "default" as const, enforced: false, roleKey: resolvedRoleKey, policyId: null };
    const policyConditions = and(eq(uiLayoutPolicies.roleKey, resolvedRoleKey), eq(uiLayoutPolicies.mode, input.mode), eq(uiLayoutPolicies.status, "active"), eq(uiLayoutPolicies.enforced, true), or(and(input.businessEntityId ? eq(uiLayoutPolicies.businessEntityId, input.businessEntityId) : isNull(uiLayoutPolicies.businessEntityId), input.branchId ? eq(uiLayoutPolicies.branchId, input.branchId) : isNull(uiLayoutPolicies.branchId)), and(input.businessEntityId ? eq(uiLayoutPolicies.businessEntityId, input.businessEntityId) : isNull(uiLayoutPolicies.businessEntityId), isNull(uiLayoutPolicies.branchId)), and(isNull(uiLayoutPolicies.businessEntityId), isNull(uiLayoutPolicies.branchId))));
    const [policy] = await db.select().from(uiLayoutPolicies).where(policyConditions).orderBy(desc(uiLayoutPolicies.branchId), desc(uiLayoutPolicies.businessEntityId), desc(uiLayoutPolicies.updatedAt)).limit(1);
    if (policy) return { config: parseConfig(policy.configJson, resolvedRoleKey, input.mode), source: "forced" as const, enforced: true, roleKey: resolvedRoleKey, policyId: policy.id };
    const key = scopeKey(ctx.user.id, resolvedRoleKey, input); const [preference] = await db.select().from(uiLayoutPreferences).where(eq(uiLayoutPreferences.scopeKey, key)).limit(1);
    if (preference) return { config: parseConfig(preference.configJson, resolvedRoleKey, input.mode), source: preference.source, enforced: false, roleKey: resolvedRoleKey, policyId: null };
    return { config: fallback, source: "default" as const, enforced: false, roleKey: resolvedRoleKey, policyId: null };
  }),
  savePreference: protectedProcedure.input(z.object({ mode, roleKey: z.string().min(1).max(100), businessEntityId: id.optional(), branchId: id.optional(), config: configSchema, source: z.enum(["personal", "template"]).default("personal") })).mutation(async ({ ctx, input }) => {
    const resolvedRoleKey = await resolveRoleKey(ctx, input); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const key = scopeKey(ctx.user.id, resolvedRoleKey, input);
    const payload = { scopeKey: key, userId: ctx.user.id, roleKey: resolvedRoleKey, mode: input.mode, businessEntityId: input.businessEntityId, branchId: input.branchId, configJson: JSON.stringify(cloneLayoutConfig(input.config)), source: input.source };
    const [existing] = await db.select({ id: uiLayoutPreferences.id }).from(uiLayoutPreferences).where(eq(uiLayoutPreferences.scopeKey, key)).limit(1);
    if (existing) await db.update(uiLayoutPreferences).set({ configJson: payload.configJson, source: input.source, businessEntityId: input.businessEntityId, branchId: input.branchId }).where(eq(uiLayoutPreferences.id, existing.id)); else await db.insert(uiLayoutPreferences).values(payload);
    await createAuditLog({ userId: ctx.user.id, organizationId: 1, systemKey: "layout", entityType: "ui_layout_preference", entityId: key, action: "preference.saved", correlationId: `layout-${Date.now()}`, newValue: payload.configJson });
    return { saved: true as const, source: input.source, roleKey: resolvedRoleKey };
  }),
  policies: protectedProcedure.query(async ({ ctx }) => { requireAdmin(ctx.user.role); const db = await getDb(); return db ? db.select().from(uiLayoutPolicies).orderBy(desc(uiLayoutPolicies.updatedAt)).limit(200) : []; }),
  policyAudit: protectedProcedure.query(async ({ ctx }) => { requireAdmin(ctx.user.role); const db = await getDb(); if (!db) return []; return db.select().from(auditLogs).where(and(eq(auditLogs.systemKey, "layout"), inArray(auditLogs.entityType, ["ui_layout_policy", "ui_layout_template_version", "ui_layout_preference"]))).orderBy(desc(auditLogs.createdAt)).limit(300); }),
  upsertPolicy: protectedProcedure.input(z.object({ roleKey: z.string().min(1).max(100), mode, businessEntityId: id.optional(), branchId: id.optional(), config: configSchema, templateKey: z.string().max(120).optional(), enforced: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const key = policyKey(input.roleKey, input); const configJson = JSON.stringify(cloneLayoutConfig(input.config));
    const [existing] = await db.select({ id: uiLayoutPolicies.id }).from(uiLayoutPolicies).where(eq(uiLayoutPolicies.policyKey, key)).limit(1); const values = { policyKey: key, roleKey: input.roleKey, mode: input.mode, businessEntityId: input.businessEntityId, branchId: input.branchId, configJson, enforced: input.enforced, status: "active" as const, updatedBy: ctx.user.id };
    if (existing) await db.update(uiLayoutPolicies).set(values).where(eq(uiLayoutPolicies.id, existing.id)); else await db.insert(uiLayoutPolicies).values({ ...values, createdBy: ctx.user.id });
    await createAuditLog({ userId: ctx.user.id, organizationId: 1, systemKey: "layout", entityType: "ui_layout_policy", entityId: key, action: existing ? "policy.updated" : "policy.created", newValue: JSON.stringify({ ...values, templateKey: input.templateKey }) }); return { saved: true as const, policyKey: key, replay: Boolean(existing) };
  }),
  setPolicyStatus: protectedProcedure.input(z.object({ policyId: id, status: z.enum(["active", "disabled"]) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [policy] = await db.select().from(uiLayoutPolicies).where(eq(uiLayoutPolicies.id, input.policyId)).limit(1); if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "سياسة التخطيط غير موجودة" });
    await db.update(uiLayoutPolicies).set({ status: input.status, updatedBy: ctx.user.id }).where(eq(uiLayoutPolicies.id, input.policyId)); await createAuditLog({ userId: ctx.user.id, organizationId: 1, systemKey: "layout", entityType: "ui_layout_policy", entityId: String(policy.id), action: `policy.${input.status}`, newValue: JSON.stringify({ before: policy.status, after: input.status }) }); return { updated: true as const };
  }),
  versions: protectedProcedure.input(z.object({ templateKey: z.string().min(1).max(120), roleKey: z.string().min(1).max(100), mode, includeArchived: z.boolean().default(true) })).query(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) return [];
    const rows = await db.select().from(uiLayoutTemplateVersions).where(and(eq(uiLayoutTemplateVersions.templateKey, input.templateKey), input.includeArchived ? undefined : eq(uiLayoutTemplateVersions.status, "published"))).orderBy(desc(uiLayoutTemplateVersions.versionNo)).limit(200);
    if (rows.length) return rows.map(row => ({ ...row, config: parseConfig(row.configJson, row.roleKey, row.mode), isBaseline: false }));
    return [{ id: 0, templateKey: input.templateKey, roleKey: input.roleKey, mode: input.mode, versionNo: 0, nameAr: templateName(input.roleKey), config: defaultLayoutForRole(input.roleKey, input.mode), status: "published" as const, changeNote: "الخط الأساسي قبل تفعيل سجل الإصدارات", createdBy: 0, restoredFromVersionId: null, createdAt: null, isBaseline: true }];
  }),
  compareVersions: protectedProcedure.input(z.object({ leftVersionId: id, rightVersionId: id })).query(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const rows = await db.select().from(uiLayoutTemplateVersions).where(or(eq(uiLayoutTemplateVersions.id, input.leftVersionId), eq(uiLayoutTemplateVersions.id, input.rightVersionId))); const left = rows.find(row => row.id === input.leftVersionId); const right = rows.find(row => row.id === input.rightVersionId); if (!left || !right) throw new TRPCError({ code: "NOT_FOUND", message: "الإصداران المطلوبان للمقارنة غير موجودين" });
    const leftConfig = parseConfig(left.configJson, left.roleKey, left.mode); const rightConfig = parseConfig(right.configJson, right.roleKey, right.mode); return { left: { ...left, config: leftConfig }, right: { ...right, config: rightConfig }, changes: diffLayoutConfigs(leftConfig, rightConfig) };
  }),
  createVersion: protectedProcedure.input(z.object({ templateKey: z.string().min(1).max(120), roleKey: z.string().min(1).max(100), mode, nameAr: z.string().min(2).max(180), config: configSchema, changeNote: z.string().min(3).max(500) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [latest] = await db.select({ versionNo: uiLayoutTemplateVersions.versionNo }).from(uiLayoutTemplateVersions).where(eq(uiLayoutTemplateVersions.templateKey, input.templateKey)).orderBy(desc(uiLayoutTemplateVersions.versionNo)).limit(1); const versionNo = nextLayoutVersion(latest?.versionNo); const configJson = JSON.stringify(cloneLayoutConfig(input.config));
    await db.transaction(async tx => { await tx.update(uiLayoutTemplateVersions).set({ status: "archived" }).where(and(eq(uiLayoutTemplateVersions.templateKey, input.templateKey), eq(uiLayoutTemplateVersions.status, "published"))); await tx.insert(uiLayoutTemplateVersions).values({ templateKey: input.templateKey, roleKey: input.roleKey, mode: input.mode, versionNo, nameAr: input.nameAr, configJson, status: "published", changeNote: input.changeNote, createdBy: ctx.user.id }); const [template] = await tx.select({ id: uiLayoutTemplates.id }).from(uiLayoutTemplates).where(eq(uiLayoutTemplates.templateKey, input.templateKey)).limit(1); if (template) await tx.update(uiLayoutTemplates).set({ roleKey: input.roleKey, mode: input.mode, nameAr: input.nameAr, configJson, status: "active", updatedBy: ctx.user.id }).where(eq(uiLayoutTemplates.id, template.id)); else await tx.insert(uiLayoutTemplates).values({ templateKey: input.templateKey, roleKey: input.roleKey, mode: input.mode, nameAr: input.nameAr, configJson, isSystem: false, status: "active", updatedBy: ctx.user.id }); });
    await createAuditLog({ userId: ctx.user.id, organizationId: 1, systemKey: "layout", entityType: "ui_layout_template_version", entityId: `${input.templateKey}:v${versionNo}`, action: "template.version.created", newValue: JSON.stringify({ versionNo, changeNote: input.changeNote }) }); return { saved: true as const, templateKey: input.templateKey, versionNo };
  }),
  restoreVersion: protectedProcedure.input(z.object({ versionId: id, changeNote: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [source] = await db.select().from(uiLayoutTemplateVersions).where(eq(uiLayoutTemplateVersions.id, input.versionId)).limit(1); if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "الإصدار المطلوب للاسترجاع غير موجود" }); const [latest] = await db.select({ versionNo: uiLayoutTemplateVersions.versionNo }).from(uiLayoutTemplateVersions).where(eq(uiLayoutTemplateVersions.templateKey, source.templateKey)).orderBy(desc(uiLayoutTemplateVersions.versionNo)).limit(1); const versionNo = nextLayoutVersion(latest?.versionNo); const configJson = source.configJson; const changeNote = layoutVersionRestoreNote(source.versionNo, input.changeNote);
    await db.transaction(async tx => { await tx.update(uiLayoutTemplateVersions).set({ status: "archived" }).where(and(eq(uiLayoutTemplateVersions.templateKey, source.templateKey), eq(uiLayoutTemplateVersions.status, "published"))); await tx.insert(uiLayoutTemplateVersions).values({ templateKey: source.templateKey, roleKey: source.roleKey, mode: source.mode, versionNo, nameAr: source.nameAr, configJson, status: "published", changeNote, createdBy: ctx.user.id, restoredFromVersionId: source.id }); const [template] = await tx.select({ id: uiLayoutTemplates.id }).from(uiLayoutTemplates).where(eq(uiLayoutTemplates.templateKey, source.templateKey)).limit(1); if (template) await tx.update(uiLayoutTemplates).set({ roleKey: source.roleKey, mode: source.mode, nameAr: source.nameAr, configJson, status: "active", updatedBy: ctx.user.id }).where(eq(uiLayoutTemplates.id, template.id)); else await tx.insert(uiLayoutTemplates).values({ templateKey: source.templateKey, roleKey: source.roleKey, mode: source.mode, nameAr: source.nameAr, configJson, isSystem: false, status: "active", updatedBy: ctx.user.id }); });
    await createAuditLog({ userId: ctx.user.id, organizationId: 1, systemKey: "layout", entityType: "ui_layout_template_version", entityId: `${source.templateKey}:v${versionNo}`, action: "template.version.restored", newValue: JSON.stringify({ restoredFromVersionId: source.id, restoredFromVersionNo: source.versionNo, versionNo, changeNote }) }); return { restored: true as const, templateKey: source.templateKey, versionNo, restoredFromVersionNo: source.versionNo };
  }),
});
