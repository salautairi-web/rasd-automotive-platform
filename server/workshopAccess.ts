import { and, eq, inArray, isNull, lte, gt, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  businessEntities,
  iamMemberships,
  iamPermissions,
  iamRolePermissions,
  iamRoles,
} from "../drizzle/schema";
import { getDb } from "./db";

/** Public action vocabulary used by the workshop UI and every procedure guard. */
export type WorkshopAction =
  | "read"
  | "receive"
  | "schedule"
  | "estimate"
  | "inspect"
  | "operate"
  | "parts"
  | "quality"
  | "deliver"
  | "configure"
  | "report"
  | "invoice"
  | "collect";

/**
 * Exact IAM keys.  This is deliberately an explicit table, not a role-name or
 * substring matcher.  Deployments may add these keys through IAM; missing
 * keys fail closed.  The role-template names are not grants by themselves.
 */
export const WORKSHOP_PERMISSION_KEYS: Record<WorkshopAction, string> = {
  read: "workshop.jobcard.read",
  receive: "workshop.jobcard.create",
  schedule: "workshop.schedule.create",
  estimate: "workshop.estimate.create",
  inspect: "workshop.inspection.create",
  operate: "workshop.operation.create",
  parts: "workshop.part.request",
  quality: "workshop.quality.record",
  deliver: "workshop.delivery.create",
  configure: "workshop.configure.update",
  report: "workshop.report.read",
  invoice: "workshop.invoice.issue",
  collect: "workshop.payment.record",
};

/** The catalog has used either of these exact keys across existing deployments. */
const WORKSHOP_COLLECT_KEYS = [
  "workshop.payment.record",
  "workshop.payment.create",
] as const;

const entityWideScopes = ["entity", "company"] as const;
const actionValues = Object.keys(WORKSHOP_PERMISSION_KEYS) as WorkshopAction[];

function activeMembershipNow() {
  const now = new Date();
  return and(
    lte(iamMemberships.startsAt, now),
    or(isNull(iamMemberships.endsAt), gt(iamMemberships.endsAt, now))
  );
}

export function safeEntityScope(scopeJson: string): boolean {
  try {
    const scope = JSON.parse(scopeJson) as Record<string, unknown>;
    if (!scope || typeof scope !== "object" || Array.isArray(scope))
      return false;
    return ![
      "branchId",
      "branchIds",
      "assigned",
      "assignedUserId",
      "assignedUserIds",
      "own",
      "ownerUserId",
    ].some(key => key in scope);
  } catch {
    return false;
  }
}

function deny(message: string): never {
  throw new TRPCError({ code: "FORBIDDEN", message });
}

async function activeEntity(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  businessEntityId: number
) {
  const [entity] = await db
    .select({
      id: businessEntities.id,
      nameAr: businessEntities.nameAr,
      currency: businessEntities.currency,
    })
    .from(businessEntities)
    .where(
      and(
        eq(businessEntities.id, businessEntityId),
        eq(businessEntities.status, "active")
      )
    )
    .limit(1);
  if (!entity) deny("الكيان المحدد غير نشط أو غير موجود");
  return entity;
}

/** Returns whether a non-admin has an entity-wide active workshop permission. */
export async function hasWorkshopPermission(
  user: { id: number; role: string },
  businessEntityId: number,
  action: WorkshopAction
) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة",
    });
  await activeEntity(db, businessEntityId);
  if (user.role === "admin") return true;
  const rows = await db
    .select({
      permissionId: iamPermissions.id,
      scopeJson: iamMemberships.scopeJson,
    })
    .from(iamMemberships)
    .innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id))
    .innerJoin(iamRolePermissions, eq(iamRolePermissions.roleId, iamRoles.id))
    .innerJoin(
      iamPermissions,
      eq(iamRolePermissions.permissionId, iamPermissions.id)
    )
    .where(
      and(
        eq(iamMemberships.userId, user.id),
        eq(iamMemberships.businessEntityId, businessEntityId),
        eq(iamMemberships.status, "active"),
        activeMembershipNow(),
        eq(iamRoles.status, "active"),
        inArray(iamRoles.scopeType, [...entityWideScopes]),
        action === "collect"
          ? inArray(iamPermissions.permissionKey, [...WORKSHOP_COLLECT_KEYS])
          : eq(iamPermissions.permissionKey, WORKSHOP_PERMISSION_KEYS[action])
      )
    );
  return rows.some(row => safeEntityScope(row.scopeJson));
}

/**
 * Guard called by every workshop procedure after its input parser has run.
 * Admin bypasses the role check but never the active-entity check.  Branch,
 * assigned, own and central-scoped memberships are intentionally denied here:
 * workshop-59 records have no branch/assignee column to enforce safely.
 */
export async function assertWorkshopPermission(
  user: { id: number; role: string },
  businessEntityId: number,
  action: WorkshopAction
) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة",
    });
  await activeEntity(db, businessEntityId);
  if (user.role === "admin") return;
  const allowed = await hasWorkshopPermission(user, businessEntityId, action);
  if (!allowed) {
    deny(
      "لا توجد صلاحية ورشة على مستوى الكيان لهذه العملية؛ الأدوار المقيدة بفرع/تعيين لا تُوسّع تلقائياً."
    );
  }
}

/** Used when a persisted user id is referenced as an operator/driver. */
export async function assertWorkshopEntityUser(
  userId: number,
  businessEntityId: number
) {
  if (
    !(await hasWorkshopPermission(
      { id: userId, role: "user" },
      businessEntityId,
      "operate"
    ))
  )
    deny("المستخدم المشار إليه لا يملك صلاحية فنية نشطة على مستوى الكيان");
}

export function workshopActionValues(): WorkshopAction[] {
  return [...actionValues];
}

/**
 * Builds the contract for workshop59.access.  It intentionally returns only
 * role names and normalized action keys, never raw IAM permission records.
 */
export async function getWorkshopAccess(user: { id: number; role: string }) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة",
    });
  const entities = await db
    .select({
      id: businessEntities.id,
      nameAr: businessEntities.nameAr,
      currency: businessEntities.currency,
    })
    .from(businessEntities)
    .where(eq(businessEntities.status, "active"))
    .orderBy(businessEntities.nameAr);
  if (user.role === "admin") {
    return {
      entities: entities.map(entity => ({
        ...entity,
        roleNames: ["admin"],
        permissions: workshopActionValues(),
      })),
    };
  }

  const memberships = await db
    .select({
      entityId: iamMemberships.businessEntityId,
      roleNameAr: iamRoles.nameAr,
      scopeType: iamRoles.scopeType,
      scopeJson: iamMemberships.scopeJson,
    })
    .from(iamMemberships)
    .innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id))
    .where(
      and(
        eq(iamMemberships.userId, user.id),
        eq(iamMemberships.status, "active"),
        activeMembershipNow(),
        eq(iamRoles.status, "active"),
        inArray(
          iamMemberships.businessEntityId,
          entities.map(entity => entity.id).length
            ? entities.map(entity => entity.id)
            : [0]
        )
      )
    );
  const grants = await db
    .select({
      entityId: iamMemberships.businessEntityId,
      permissionKey: iamPermissions.permissionKey,
      scopeType: iamRoles.scopeType,
      scopeJson: iamMemberships.scopeJson,
    })
    .from(iamMemberships)
    .innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id))
    .innerJoin(iamRolePermissions, eq(iamRolePermissions.roleId, iamRoles.id))
    .innerJoin(
      iamPermissions,
      eq(iamRolePermissions.permissionId, iamPermissions.id)
    )
    .where(
      and(
        eq(iamMemberships.userId, user.id),
        eq(iamMemberships.status, "active"),
        activeMembershipNow(),
        eq(iamRoles.status, "active"),
        inArray(
          iamMemberships.businessEntityId,
          entities.map(entity => entity.id).length
            ? entities.map(entity => entity.id)
            : [0]
        ),
        inArray(iamRoles.scopeType, [...entityWideScopes]),
        inArray(iamPermissions.permissionKey, [
          ...actionValues
            .filter(action => action !== "collect")
            .map(action => WORKSHOP_PERMISSION_KEYS[action]),
          ...WORKSHOP_COLLECT_KEYS,
        ])
      )
    );
  return {
    entities: entities
      .filter(entity =>
        memberships.some(membership => membership.entityId === entity.id)
      )
      .map(entity => {
        const entityMemberships = memberships.filter(
          membership => membership.entityId === entity.id
        );
        const permissionKeys = new Set(
          grants
            .filter(
              grant =>
                grant.entityId === entity.id && safeEntityScope(grant.scopeJson)
            )
            .map(grant => grant.permissionKey)
        );
        const permissions = actionValues.filter(action =>
          action === "collect"
            ? WORKSHOP_COLLECT_KEYS.some(key => permissionKeys.has(key))
            : permissionKeys.has(WORKSHOP_PERMISSION_KEYS[action])
        );
        return {
          ...entity,
          roleNames: Array.from(
            new Set(entityMemberships.map(membership => membership.roleNameAr))
          ),
          permissions,
        };
      })
      .filter(entity => entity.permissions.includes("read")),
  };
}
