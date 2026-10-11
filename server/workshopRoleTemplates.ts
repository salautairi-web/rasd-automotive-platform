import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { assertWorkshopPermission } from "./workshopAccess";
import {
  iamPermissions,
  iamRoles,
  iamRolePermissions,
  iamSecurityEvents,
} from "../drizzle/schema";
import {
  workshopPermissionCatalog,
  workshopRoleTemplates,
  workshopTemplateRoleKey,
} from "../shared/workshopRoleTemplates";

export const workshopRoleTemplatesRouter = router({
  install: adminProcedure
    .input(
      z.object({
        businessEntityId: z.number().int().positive(),
        acknowledged: z.literal(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertWorkshopPermission(
        ctx.user,
        input.businessEntityId,
        "configure"
      );
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "قاعدة البيانات غير متاحة.",
        });
      return db.transaction(async tx => {
        const permissionIds = new Map<string, number>();
        let permissionsCreated = 0;
        for (const definition of workshopPermissionCatalog) {
          const [existing] = await tx
            .select({ id: iamPermissions.id })
            .from(iamPermissions)
            .where(eq(iamPermissions.permissionKey, definition.key))
            .limit(1);
          if (existing) permissionIds.set(definition.action, existing.id);
          else {
            const [row] = await tx
              .insert(iamPermissions)
              .values({
                permissionKey: definition.key,
                nameAr: definition.nameAr,
                resource: definition.resource,
                action: definition.action,
                sensitivity: definition.sensitivity,
              })
              .$returningId();
            permissionIds.set(definition.action, row.id);
            permissionsCreated++;
          }
        }
        const roles: Array<{ id: number; nameAr: string; created: boolean }> =
          [];
        for (const template of workshopRoleTemplates) {
          const roleKey = workshopTemplateRoleKey(
            template.key,
            input.businessEntityId
          );
          const [existing] = await tx
            .select({ id: iamRoles.id, nameAr: iamRoles.nameAr })
            .from(iamRoles)
            .where(eq(iamRoles.roleKey, roleKey))
            .limit(1);
          if (existing) {
            roles.push({ ...existing, created: false });
            continue;
          }
          const nameAr = `${template.nameAr} · كيان ${input.businessEntityId}`;
          const [role] = await tx
            .insert(iamRoles)
            .values({
              roleKey,
              nameAr,
              scopeType: "entity",
              systemRole: false,
              status: "active",
            })
            .$returningId();
          await tx
            .insert(iamRolePermissions)
            .values(
              template.actions.map(action => ({
                roleId: role.id,
                permissionId: permissionIds.get(action)!,
              }))
            );
          roles.push({ id: role.id, nameAr, created: true });
        }
        await tx
          .insert(iamSecurityEvents)
          .values({
            userId: ctx.user.id,
            businessEntityId: input.businessEntityId,
            eventType: "WorkshopRoleTemplatesInstalled",
            outcome: "success",
            resourceType: "workshop_role_catalog",
            resourceId: String(input.businessEntityId),
            correlationId: randomUUID(),
            detailsJson: JSON.stringify({
              permissionsCreated,
              rolesCreated: roles.filter(role => role.created).length,
              existingRolesUntouched: true,
              userMembershipsGranted: 0,
            }),
          });
        return {
          roles,
          permissionsCreated,
          membershipsGranted: 0,
          message:
            "تم تجهيز القوالب دون منح صلاحيات لأي مستخدم. راجعها ثم عيّن العضويات من الإدارة المركزية.",
        };
      });
    }),
});
