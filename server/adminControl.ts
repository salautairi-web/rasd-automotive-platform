import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { businessEntities, branches, customers, iamMemberships, iamPermissions, iamRoles, organizations, projects, users } from "../drizzle/schema";

const requireAdmin = (role: string) => {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية إدارة المنصة مطلوبة" });
};

export const adminControlRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { entities: [], organizations: [], branches: [], customers: [], projects: [], users: [], roles: [], permissions: [], metrics: { entities: 0, branches: 0, customers: 0, projects: 0, users: 0, roles: 0 } };
    const [entityRows, orgRows, branchRows, customerRows, projectRows, userRows, roleRows, permissionRows] = await Promise.all([
      db.select().from(businessEntities).orderBy(desc(businessEntities.createdAt)).limit(100),
      db.select().from(organizations).orderBy(organizations.nameAr).limit(100),
      db.select().from(branches).orderBy(branches.nameAr).limit(100),
      db.select({ id: customers.id, customerNo: customers.customerNo, businessEntityId: customers.businessEntityId, nameAr: customers.nameAr, phone: customers.phone, email: customers.email, status: customers.status, createdAt: customers.createdAt }).from(customers).orderBy(desc(customers.createdAt)).limit(100),
      db.select({ id: projects.id, projectCode: projects.projectCode, businessEntityId: projects.businessEntityId, nameAr: projects.nameAr, lifecycle: projects.lifecycle, status: projects.status, projectType: projects.projectType }).from(projects).orderBy(desc(projects.id)).limit(100),
      db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn)).limit(100),
      db.select({ id: iamRoles.id, roleKey: iamRoles.roleKey, nameAr: iamRoles.nameAr, scopeType: iamRoles.scopeType, status: iamRoles.status }).from(iamRoles).orderBy(iamRoles.roleKey).limit(100),
      db.select({ id: iamPermissions.id, permissionKey: iamPermissions.permissionKey, nameAr: iamPermissions.nameAr, resource: iamPermissions.resource, action: iamPermissions.action, sensitivity: iamPermissions.sensitivity }).from(iamPermissions).orderBy(iamPermissions.permissionKey).limit(200),
    ]);
    return { entities: entityRows, organizations: orgRows, branches: branchRows, customers: customerRows, projects: projectRows, users: userRows, roles: roleRows, permissions: permissionRows, metrics: { entities: entityRows.length, branches: branchRows.length, customers: customerRows.length, projects: projectRows.length, users: userRows.length, roles: roleRows.length } };
  }),
  createEntity: protectedProcedure.input(z.object({ code: z.string().trim().min(2).max(40), nameAr: z.string().trim().min(2).max(180), nameEn: z.string().trim().max(180).optional(), entityType: z.enum(["company", "subsidiary", "business_project", "business_activity", "investment_vehicle", "future"]), currency: z.string().length(3).default("OMR"), timezone: z.string().min(3).max(64).default("Asia/Muscat") })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const entityId = `ENT-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
    await db.insert(businessEntities).values({ ...input, entityId, status: "planned" });
    return { entityId };
  }),
  createCustomer: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), businessEntityId: z.number().int().positive(), nameAr: z.string().trim().min(2).max(180), nameEn: z.string().trim().max(180).optional(), phone: z.string().trim().max(40).optional(), email: z.string().email().optional() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const customerNo = `CUS-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
    await db.insert(customers).values({ ...input, customerNo }); return { customerNo };
  }),
  grantMembership: protectedProcedure.input(z.object({ userId: z.number().int().positive(), businessEntityId: z.number().int().positive(), roleId: z.number().int().positive(), scope: z.record(z.string(), z.unknown()).default({}), defaultEntity: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await getDb(); if (!db) throw new Error("database_unavailable");
    const [existing] = await db.select({ id: iamMemberships.id }).from(iamMemberships).where(and(eq(iamMemberships.userId, input.userId), eq(iamMemberships.businessEntityId, input.businessEntityId), eq(iamMemberships.roleId, input.roleId))).limit(1);
    if (existing) return { id: existing.id, replay: true as const };
    const result = await db.insert(iamMemberships).values({ userId: input.userId, businessEntityId: input.businessEntityId, roleId: input.roleId, scopeJson: JSON.stringify(input.scope), defaultEntity: input.defaultEntity, status: "active" });
    return { id: Number(result[0].insertId), replay: false as const };
  }),
});
