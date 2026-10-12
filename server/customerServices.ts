import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  portalAudit,
  portalOrders,
  portalReservations,
  portalV2Notifications,
} from "../drizzle/schema";
import { customerServices } from "../shared/customerServices";
import { customerPortalProcedure } from "./customerPortalProcedure";
import { scopedRelationship } from "./portalV2";
import { router } from "./_core/trpc";

export const customerServicesRouter = router({
  request: customerPortalProcedure
    .input(
      z.object({
        businessEntityId: z.number().int().positive(),
        relationshipId: z.number().int().positive(),
        service: z.enum(["rental", "workshop", "sales", "parts"]),
        subject: z.string().trim().min(3).max(180),
        details: z.string().trim().min(5).max(5000),
        preferredDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        idempotencyKey: z.string().trim().min(8).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, pu, relationship } = await scopedRelationship(
        ctx.portalIdentity.id,
        input.businessEntityId,
        input.relationshipId
      );
      const service = customerServices.find(
        item => item.key === input.service
      )!;
      if (
        input.preferredDate &&
        (!Number.isFinite(Date.parse(input.preferredDate)) ||
          new Date(input.preferredDate).toISOString().slice(0, 10) !==
            input.preferredDate)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "التاريخ المفضل غير صالح",
        });
      const idempotencyKey = `customer-${pu.id}-${relationship.id}-${input.idempotencyKey}`;
      return db.transaction(async tx => {
        const table =
          service.kind === "reservation" ? portalReservations : portalOrders;
        const [replay] = await tx
          .select({ id: table.id, status: table.status })
          .from(table)
          .where(
            and(
              eq(table.portalUserId, pu.id),
              eq(table.businessEntityId, input.businessEntityId),
              eq(table.relationshipId, relationship.id),
              eq(table.idempotencyKey, idempotencyKey)
            )
          )
          .limit(1);
        if (replay)
          return {
            id: replay.id,
            reference: `${service.kind === "reservation" ? "RSV" : "ORD"}-${replay.id}`,
            kind: service.kind,
            status: replay.status,
            replay: true,
          };
        const detailsJson = JSON.stringify({
          service: input.service,
          subject: input.subject,
          details: input.details,
          preferredDate: input.preferredDate ?? null,
          customerId: relationship.sourceProfileId,
          confirmationRequired: true,
        });
        const result =
          service.kind === "reservation"
            ? await tx
                .insert(portalReservations)
                .values({
                  portalUserId: pu.id,
                  businessEntityId: input.businessEntityId,
                  relationshipId: relationship.id,
                  reservationType: service.title,
                  detailsJson,
                  idempotencyKey,
                  status: "requested",
                })
            : await tx
                .insert(portalOrders)
                .values({
                  portalUserId: pu.id,
                  businessEntityId: input.businessEntityId,
                  relationshipId: relationship.id,
                  orderType: service.title,
                  summaryJson: detailsJson,
                  idempotencyKey,
                  status: "submitted",
                });
        const id = Number(result[0].insertId);
        const reference = `${service.kind === "reservation" ? "RSV" : "ORD"}-${id}`;
        await tx
          .insert(portalV2Notifications)
          .values({
            portalUserId: pu.id,
            businessEntityId: input.businessEntityId,
            eventKey: "CustomerServiceRequested",
            channel: "in_app",
            dedupeKey: `service-${idempotencyKey}`,
            title: "استلمنا طلب خدمتك",
            body: `${input.subject} · ${reference}. سيُراجع فريق الشركة الطلب؛ هذا ليس حجزاً نهائياً أو عملية دفع.`,
          });
        await tx
          .insert(portalAudit)
          .values({
            portalUserId: pu.id,
            businessEntityId: input.businessEntityId,
            relationshipId: relationship.id,
            action: "service.request",
            resourceType: service.kind,
            resourceId: reference,
            outcome: "success",
            correlationId: `customer-service-${randomUUID()}`,
          });
        return {
          id,
          reference,
          kind: service.kind,
          status: service.kind === "reservation" ? "requested" : "submitted",
          replay: false,
        };
      });
    }),
});
