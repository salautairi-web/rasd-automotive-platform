import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { iamMemberships, iamPermissions, iamRolePermissions, iamRoles } from "../drizzle/schema";
import { getDb } from "./db";

export async function assertEntityAccess(userId: number, userRole: string, businessEntityId: number, permissionKey: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
  const rows = await db
    .select({ permissionId: iamPermissions.id, scopeType: iamRoles.scopeType })
    .from(iamMemberships)
    .innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id))
    .innerJoin(iamRolePermissions, eq(iamRolePermissions.roleId, iamRoles.id))
    .innerJoin(iamPermissions, eq(iamRolePermissions.permissionId, iamPermissions.id))
    .where(and(
      eq(iamMemberships.userId, userId),
      eq(iamMemberships.businessEntityId, businessEntityId),
      eq(iamMemberships.status, "active"),
      eq(iamRoles.status, "active"),
      eq(iamPermissions.permissionKey, permissionKey),
    ))
    .limit(1);
  if (rows[0]) return true;
  if (userRole === "admin") {
    const membership = await db.select({ id: iamMemberships.id }).from(iamMemberships).where(and(
      eq(iamMemberships.userId, userId),
      eq(iamMemberships.businessEntityId, businessEntityId),
      eq(iamMemberships.status, "active"),
    )).limit(1);
    if (membership[0]) return true;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "لا توجد صلاحية لهذه العملية ضمن الكيان المحدد" });
}

export async function assertEntityMembership(userId: number, _userRole: string, businessEntityId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
  const rows = await db.select({ id: iamMemberships.id }).from(iamMemberships).where(and(
    eq(iamMemberships.userId, userId),
    eq(iamMemberships.businessEntityId, businessEntityId),
    eq(iamMemberships.status, "active"),
  )).limit(1);
  if (rows[0]) return true;
  throw new TRPCError({ code: "FORBIDDEN", message: "الحساب غير مرتبط بالكيان المحدد" });
}

export function assertSameEntity(leftEntityId: number | null | undefined, rightEntityId: number | null | undefined) {
  if (leftEntityId == null || rightEntityId == null || leftEntityId !== rightEntityId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "السجلات المرتبطة يجب أن تنتمي إلى نفس الكيان" });
  }
  return true;
}
