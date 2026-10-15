import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNotNull, or, not } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  businessEntities,
  customerCredentials,
  customerLinkRequests,
  customerRegistrationSettings,
  customerVerifiedLinks,
  customers,
  organizations,
  portalAudit,
  portalEntityRelationships,
  portalProfiles,
  portalUsers,
  portalV2Notifications,
  users,
} from "../drizzle/schema";
import {
  normalizeCustomerEmail,
  normalizeCustomerPhone,
} from "../shared/customerAuth";
import { hasActiveMfa } from "./iam";
import { getDb } from "./db";
import { adminProcedure, router } from "./_core/trpc";
import { assertCsrf } from "./customerAuth";
import { customerPortalProcedure } from "./customerPortalProcedure";

const scopeInput = z.object({
  businessEntityId: z.number().int().positive(),
  relationshipId: z.number().int().positive(),
});
const requestInput = scopeInput.extend({
  customerNo: z.string().trim().min(1).max(32),
  requesterNote: z.string().trim().min(1).max(1000),
});
const reviewInput = z.object({
  requestId: z.number().int().positive(),
  decision: z.enum(["approve", "reject"]),
  reviewNote: z.string().trim().min(1).max(2000),
  evidenceReference: z.string().trim().max(180).optional(),
  identityCheckMethod: z
    .enum(["in_person_id", "existing_contract_identity"])
    .optional(),
  identityConfirmed: z.boolean().optional(),
});

type CustomerActor = {
  userId: number;
  credentialId: number;
  sessionId: number;
};

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function dbRequired() {
  return getDb().then(db => {
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "خدمة الحساب غير متاحة حالياً",
      });
    return db;
  });
}

function localCustomer(ctx: { customer: unknown }): CustomerActor {
  const actor = ctx.customer as Partial<CustomerActor> | null;
  if (
    !actor ||
    !Number.isInteger(actor.userId) ||
    !Number.isInteger(actor.credentialId) ||
    !Number.isInteger(actor.sessionId)
  )
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "يلزم تسجيل الدخول إلى حساب العميل المحلي",
    });
  return actor as CustomerActor;
}

function assertEmployeeAdmin(ctx: {
  user?: { id: number; role: string } | null;
  customer?: unknown;
}) {
  if (ctx.customer)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "لا يمكن استخدام جلسة عميل لمراجعة طلبات الموظفين",
    });
  if (!ctx.user || ctx.user.role !== "admin")
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "صلاحية المسؤول مطلوبة",
    });
}

function auditValues(input: {
  portalUserId?: number;
  businessEntityId?: number;
  relationshipId?: number;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: "success" | "failure" | "denied";
}) {
  return {
    portalUserId: input.portalUserId,
    businessEntityId: input.businessEntityId,
    relationshipId: input.relationshipId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    outcome: input.outcome,
    correlationId: `customer-link-${nanoid(12)}`,
  };
}

function asMillis(value: unknown): number | null {
  if (value instanceof Date) {
    const result = value.getTime();
    return Number.isFinite(result) ? result : null;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const result = Date.parse(value);
    return Number.isFinite(result) ? result : null;
  }
  return null;
}

function freshProof(value: unknown, now: number) {
  const timestamp = asMillis(value);
  return (
    timestamp !== null &&
    timestamp <= now &&
    timestamp >= now - 24 * 60 * 60 * 1000
  );
}

function contactMatches(
  credential: { email?: unknown; phone?: unknown },
  target: { email?: unknown; phone?: unknown }
) {
  const credentialEmail = normalizeCustomerEmail(
    String(credential.email ?? "")
  );
  const targetEmail = normalizeCustomerEmail(String(target.email ?? ""));
  const credentialPhone = normalizeCustomerPhone(
    String(credential.phone ?? "")
  );
  const targetPhone = normalizeCustomerPhone(String(target.phone ?? ""));
  return (
    Boolean(credentialEmail && targetEmail && credentialPhone && targetPhone) &&
    credentialEmail === targetEmail &&
    credentialPhone === targetPhone
  );
}

function genericReviewFailure(
  message = "المرجع غير صالح أو لم يستوفِ شروط المراجعة"
) {
  return new TRPCError({ code: "BAD_REQUEST", message });
}

async function customerScope(
  tx: any,
  actor: CustomerActor,
  input: { businessEntityId: number; relationshipId: number },
  lock = false
) {
  const query = tx
    .select({
      relationship: portalEntityRelationships,
      portalUser: portalUsers,
    })
    .from(portalEntityRelationships)
    .innerJoin(
      portalUsers,
      eq(portalUsers.id, portalEntityRelationships.portalUserId)
    )
    .innerJoin(
      businessEntities,
      eq(businessEntities.id, portalEntityRelationships.businessEntityId)
    )
    .where(
      and(
        eq(portalEntityRelationships.id, input.relationshipId),
        eq(portalEntityRelationships.businessEntityId, input.businessEntityId),
        eq(portalEntityRelationships.relationshipType, "customer"),
        eq(portalEntityRelationships.status, "active"),
        eq(portalUsers.userId, actor.userId),
        eq(portalUsers.userType, "customer"),
        eq(portalUsers.status, "active"),
        eq(businessEntities.status, "active")
      )
    )
    .limit(1);
  const rows = lock ? await query.for("update") : await query;
  return rows[0];
}

async function lockedCredential(
  tx: any,
  actor: CustomerActor,
  requireProof = true
) {
  const rows = await tx
    .select()
    .from(customerCredentials)
    .where(
      and(
        eq(customerCredentials.id, actor.credentialId),
        eq(customerCredentials.userId, actor.userId)
      )
    )
    .limit(1)
    .for("update");
  const credential = rows[0];
  if (!credential || credential.status !== "active")
    throw new TRPCError({ code: "FORBIDDEN", message: "حساب العميل غير نشط" });
  if (
    requireProof &&
    (!credential.emailVerifiedAt || !credential.phoneVerifiedAt)
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "يلزم توثيق البريد والجوال أولاً",
    });
  return credential;
}

async function preliminaryRequest(db: Db, requestId: number) {
  const rows = await db
    .select({ credentialId: customerLinkRequests.credentialId })
    .from(customerLinkRequests)
    .where(eq(customerLinkRequests.id, requestId))
    .limit(1);
  return rows[0];
}

export const customerLinkReviewRouter = router({
  mine: customerPortalProcedure
    .input(scopeInput)
    .query(async ({ ctx, input }) => {
      const actor = localCustomer(ctx);
      const db = await dbRequired();
      const scope = await customerScope(db, actor, input);
      if (!scope)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "لا توجد علاقة بوابة فعالة لهذا الكيان",
        });
      return db
        .select({
          id: customerLinkRequests.id,
          customerNo: customerLinkRequests.customerNo,
          status: customerLinkRequests.status,
          requesterNote: customerLinkRequests.requesterNote,
          createdAt: customerLinkRequests.createdAt,
          reviewedAt: customerLinkRequests.reviewedAt,
        })
        .from(customerLinkRequests)
        .where(
          and(
            eq(customerLinkRequests.credentialId, actor.credentialId),
            eq(customerLinkRequests.userId, actor.userId),
            eq(customerLinkRequests.businessEntityId, input.businessEntityId),
            eq(customerLinkRequests.relationshipId, input.relationshipId)
          )
        )
        .orderBy(
          desc(customerLinkRequests.createdAt),
          desc(customerLinkRequests.id)
        )
        .limit(100);
    }),

  request: customerPortalProcedure
    .input(requestInput)
    .mutation(async ({ ctx, input }) => {
      const actor = localCustomer(ctx);
      const db = await dbRequired();
      const now = Date.now();
      const result = await db.transaction(async (tx: Tx) => {
        const credential = await lockedCredential(tx, actor);
        const scope = await customerScope(tx, actor, input, true);
        if (!scope)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "لا توجد علاقة بوابة فعالة لهذا الكيان",
          });
        // Deliberately do not query customers here. The submitted customerNo is only a review reference.
        const existing = await tx
          .select({
            id: customerLinkRequests.id,
            status: customerLinkRequests.status,
          })
          .from(customerLinkRequests)
          .where(
            and(
              eq(customerLinkRequests.credentialId, credential.id),
              eq(customerLinkRequests.businessEntityId, input.businessEntityId),
              inArray(customerLinkRequests.status, ["pending", "approved"])
            )
          )
          .orderBy(desc(customerLinkRequests.id))
          .limit(1)
          .for("update");
        if (existing[0])
          return {
            id: existing[0].id,
            status: existing[0].status as "pending" | "approved",
            replay: true as const,
          };
        const existingLink = await tx
          .select({ requestId: customerVerifiedLinks.requestId })
          .from(customerVerifiedLinks)
          .where(
            and(
              eq(customerVerifiedLinks.credentialId, credential.id),
              eq(customerVerifiedLinks.businessEntityId, input.businessEntityId)
            )
          )
          .limit(1)
          .for("update");
        if (existingLink[0])
          return {
            id: existingLink[0].requestId,
            status: "approved" as const,
            replay: true as const,
          };
        const inserted = await tx.insert(customerLinkRequests).values({
          credentialId: credential.id,
          userId: actor.userId,
          businessEntityId: input.businessEntityId,
          relationshipId: scope.relationship.id,
          customerNo: input.customerNo,
          requesterNote: input.requesterNote,
          status: "pending",
          createdAt: now,
        });
        const id = Number(inserted[0].insertId);
        await tx.insert(portalAudit).values(
          auditValues({
            portalUserId: scope.portalUser.id,
            businessEntityId: input.businessEntityId,
            relationshipId: scope.relationship.id,
            action: "customer.link.request",
            resourceType: "customer_link_request",
            resourceId: String(id),
            outcome: "success",
          })
        );
        return { id, status: "pending" as const, replay: false as const };
      });
      return result;
    }),

  cancel: customerPortalProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const actor = localCustomer(ctx);
      const db = await dbRequired();
      const now = Date.now();
      return db.transaction(async (tx: Tx) => {
        await lockedCredential(tx, actor, false);
        const rows = await tx
          .select({
            request: customerLinkRequests,
            relationship: portalEntityRelationships,
          })
          .from(customerLinkRequests)
          .innerJoin(
            portalEntityRelationships,
            eq(
              portalEntityRelationships.id,
              customerLinkRequests.relationshipId
            )
          )
          .where(
            and(
              eq(customerLinkRequests.id, input.requestId),
              eq(customerLinkRequests.credentialId, actor.credentialId),
              eq(customerLinkRequests.userId, actor.userId),
              eq(customerLinkRequests.status, "pending")
            )
          )
          .limit(1)
          .for("update");
        const row = rows[0];
        if (!row)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "لا يمكن إلغاء هذا الطلب",
          });
        await tx
          .update(customerLinkRequests)
          .set({ status: "cancelled", reviewedAt: now })
          .where(eq(customerLinkRequests.id, row.request.id));
        await tx.insert(portalAudit).values(
          auditValues({
            portalUserId: row.relationship.portalUserId,
            businessEntityId: row.request.businessEntityId,
            relationshipId: row.request.relationshipId,
            action: "customer.link.cancel",
            resourceType: "customer_link_request",
            resourceId: String(row.request.id),
            outcome: "success",
          })
        );
        return { id: row.request.id, status: "cancelled" as const };
      });
    }),

  adminList: adminProcedure
    .input(z.object({ businessEntityId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      assertEmployeeAdmin(ctx);
      const db = await dbRequired();
      const canApprove = await hasActiveMfa(ctx.user.id);
      const rows = await db
        .select({
          request: customerLinkRequests,
          credential: customerCredentials,
          requester: users,
          target: customers,
        })
        .from(customerLinkRequests)
        .innerJoin(
          customerCredentials,
          eq(customerCredentials.id, customerLinkRequests.credentialId)
        )
        .innerJoin(users, eq(users.id, customerLinkRequests.userId))
        .leftJoin(
          customers,
          and(
            eq(
              customers.businessEntityId,
              customerLinkRequests.businessEntityId
            ),
            eq(customers.customerNo, customerLinkRequests.customerNo),
            eq(customers.status, "active")
          )
        )
        .where(
          and(
            eq(customerLinkRequests.businessEntityId, input.businessEntityId),
            eq(customerLinkRequests.status, "pending")
          )
        )
        .orderBy(
          desc(customerLinkRequests.createdAt),
          desc(customerLinkRequests.id)
        )
        .limit(100);
      return rows.map(row => ({
        id: row.request.id,
        businessEntityId: row.request.businessEntityId,
        relationshipId: row.request.relationshipId,
        customerNo: row.request.customerNo,
        requesterNote: row.request.requesterNote,
        status: row.request.status,
        createdAt: row.request.createdAt,
        reviewedAt: row.request.reviewedAt,
        requester: {
          userId: row.request.userId,
          name: row.requester.name,
          email: row.credential.email,
          phone: row.credential.phone,
          emailVerifiedAt: row.credential.emailVerifiedAt,
          phoneVerifiedAt: row.credential.phoneVerifiedAt,
        },
        target: row.target
          ? {
              id: row.target.id,
              customerNo: row.target.customerNo,
              nameAr: row.target.nameAr,
              nameEn: row.target.nameEn,
              email: row.target.email,
              phone: row.target.phone,
              organizationId: row.target.organizationId,
              status: row.target.status,
            }
          : null,
        canApprove,
        evidenceRequired: true as const,
        approvalExplanation: canApprove
          ? "يمكن بدء المراجعة؛ يلزم إثبات هوية يدوي وتوثيق المرجع قبل الاعتماد."
          : "لا يمكن الاعتماد قبل تفعيل MFA للمسؤول؛ الرفض ما زال متاحاً بسبب توثيق السبب.",
        identityCheckMethods: [
          { value: "in_person_id" as const, labelAr: "مطابقة هوية حضورياً" },
          {
            value: "existing_contract_identity" as const,
            labelAr: "هوية مثبتة في عقد قائم",
          },
        ],
      }));
    }),

  review: adminProcedure.input(reviewInput).mutation(async ({ ctx, input }) => {
    assertEmployeeAdmin(ctx);
    assertCsrf(ctx.req);
    if (input.decision === "reject" && input.reviewNote.trim().length < 10)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "سبب الرفض مطلوب بعبارة واضحة",
      });
    if (input.decision === "approve") {
      if (input.reviewNote.trim().length < 15)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ملاحظة الاعتماد يجب ألا تقل عن 15 محرفاً",
        });
      if (!input.evidenceReference || input.evidenceReference.trim().length < 5)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "مرجع الدليل مطلوب للاعتماد",
        });
      if (input.identityConfirmed !== true || !input.identityCheckMethod)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "يلزم تأكيد الهوية وطريقة التحقق",
        });
      if (!(await hasActiveMfa(ctx.user.id)))
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "تفعيل MFA مطلوب لاعتماد الربط",
        });
    }
    const db = await dbRequired();
    const preliminary = await preliminaryRequest(db, input.requestId);
    if (!preliminary)
      throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
    const now = Date.now();
    try {
      return await db.transaction(async (tx: Tx) => {
        const credentialRows = await tx
          .select()
          .from(customerCredentials)
          .where(eq(customerCredentials.id, preliminary.credentialId))
          .limit(1)
          .for("update");
        const credential = credentialRows[0];
        const requestRows = await tx
          .select({
            request: customerLinkRequests,
            relationship: portalEntityRelationships,
          })
          .from(customerLinkRequests)
          .leftJoin(
            portalEntityRelationships,
            eq(
              portalEntityRelationships.id,
              customerLinkRequests.relationshipId
            )
          )
          .where(eq(customerLinkRequests.id, input.requestId))
          .limit(1)
          .for("update");
        const row = requestRows[0];
        if (!credential || !row?.request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "الطلب غير موجود",
          });
        if (row.request.status !== "pending")
          throw new TRPCError({
            code: "CONFLICT",
            message: "تمت معالجة الطلب مسبقاً",
          });
        if (row.request.userId === ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "لا يجوز للمراجع اعتماد طلبه",
          });
        if (
          credential.userId !== row.request.userId ||
          credential.status !== "active" ||
          !credential.emailVerifiedAt ||
          !credential.phoneVerifiedAt
        )
          throw genericReviewFailure("حساب مقدم الطلب غير صالح للمراجعة");
        if (input.decision === "reject") {
          await tx
            .update(customerLinkRequests)
            .set({
              status: "rejected",
              reviewedBy: ctx.user.id,
              reviewNote: input.reviewNote.trim(),
              evidenceReference: input.evidenceReference?.trim() || null,
              identityCheckMethod: input.identityCheckMethod,
              reviewedAt: now,
            })
            .where(eq(customerLinkRequests.id, row.request.id));
          await tx.insert(portalAudit).values(
            auditValues({
              businessEntityId: row.request.businessEntityId,
              relationshipId: row.request.relationshipId,
              action: "customer.link.review.reject",
              resourceType: "customer_link_request",
              resourceId: String(row.request.id),
              outcome: "success",
            })
          );
          return { id: row.request.id, status: "rejected" as const };
        }
        const relationship = row.relationship;
        if (!relationship || relationship.portalUserId <= 0)
          throw genericReviewFailure("العلاقة الحالية غير متاحة للمراجعة");
        const targetRows = await tx
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.businessEntityId, row.request.businessEntityId),
              eq(customers.customerNo, row.request.customerNo),
              eq(customers.status, "active")
            )
          )
          .limit(1)
          .for("update");
        const target = targetRows[0];
        if (!target) throw genericReviewFailure();
        const activeRelationRows = await tx
          .select({
            relationship: portalEntityRelationships,
            portalUser: portalUsers,
          })
          .from(portalEntityRelationships)
          .innerJoin(
            portalUsers,
            eq(portalUsers.id, portalEntityRelationships.portalUserId)
          )
          .innerJoin(
            businessEntities,
            eq(businessEntities.id, portalEntityRelationships.businessEntityId)
          )
          .where(
            and(
              eq(portalEntityRelationships.id, row.request.relationshipId),
              eq(
                portalEntityRelationships.portalUserId,
                relationship.portalUserId
              ),
              eq(
                portalEntityRelationships.businessEntityId,
                row.request.businessEntityId
              ),
              eq(portalEntityRelationships.relationshipType, "customer"),
              eq(portalEntityRelationships.status, "active"),
              eq(portalUsers.userId, row.request.userId),
              eq(portalUsers.userType, "customer"),
              eq(portalUsers.status, "active"),
              eq(businessEntities.status, "active")
            )
          )
          .limit(1)
          .for("update");
        const activeRelation = activeRelationRows[0];
        if (!activeRelation)
          throw genericReviewFailure("العلاقة الحالية غير متاحة للمراجعة");
        const profileRows = await tx
          .select()
          .from(portalProfiles)
          .where(
            and(
              eq(portalProfiles.userId, row.request.userId),
              eq(portalProfiles.businessEntityId, row.request.businessEntityId),
              eq(portalProfiles.profileType, "customer"),
              eq(portalProfiles.localRecordType, "customer"),
              eq(portalProfiles.status, "active")
            )
          )
          .limit(1)
          .for("update");
        const profile = profileRows[0];
        if (!profile)
          throw genericReviewFailure("لا يوجد ملف عميل فعال لتحديث الربط");
        if (profile.localRecordId === target.id)
          throw genericReviewFailure("المرجع يطابق السجل الحالي للحساب");
        if (
          activeRelation.relationship.sourceProfileId !== null &&
          activeRelation.relationship.sourceProfileId !== profile.localRecordId
        )
          throw genericReviewFailure("العلاقة الحالية لا تطابق ملف العميل");
        const originalRows = await tx
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.id, profile.localRecordId),
              eq(customers.businessEntityId, row.request.businessEntityId),
              eq(customers.status, "active")
            )
          )
          .limit(1)
          .for("update");
        const original = originalRows[0];
        if (!original)
          throw genericReviewFailure(
            "ملف العميل الأصلي لا يطابق الكيان المحدد"
          );
        if (!contactMatches(credential, target))
          throw genericReviewFailure(
            "بيانات الاتصال الموثقة لا تطابق السجل القديم"
          );
        if (
          !freshProof(credential.emailVerifiedAt, now) ||
          !freshProof(credential.phoneVerifiedAt, now)
        )
          throw genericReviewFailure(
            "توثيق البريد والجوال أقدم من المدة المسموحة"
          );
        const settingRows = await tx
          .select({
            organizationId: customerRegistrationSettings.organizationId,
          })
          .from(customerRegistrationSettings)
          .leftJoin(
            organizations,
            eq(organizations.id, customerRegistrationSettings.organizationId)
          )
          .where(
            eq(
              customerRegistrationSettings.businessEntityId,
              row.request.businessEntityId
            )
          )
          .limit(1)
          .for("update");
        const configuredOrganizationId = settingRows[0]?.organizationId;
        if (
          (configuredOrganizationId !== undefined &&
            target.organizationId !== configuredOrganizationId) ||
          target.organizationId !== original.organizationId
        )
          throw genericReviewFailure(
            "المنظمة لا تتسق مع الكيان أو الحساب الأصلي"
          );
        const targetProfiles = await tx
          .select({ id: portalProfiles.id, userId: portalProfiles.userId })
          .from(portalProfiles)
          .where(
            and(
              eq(portalProfiles.businessEntityId, row.request.businessEntityId),
              eq(portalProfiles.localRecordType, "customer"),
              eq(portalProfiles.localRecordId, target.id),
              inArray(portalProfiles.status, [
                "active",
                "pending",
                "blocked",
                "unlinked",
              ])
            )
          )
          .limit(100)
          .for("update");
        if (targetProfiles.length)
          throw genericReviewFailure(
            "السجل القديم مملوك بالفعل لحساب بوابة آخر"
          );
        const targetRelationships = await tx
          .select({
            id: portalEntityRelationships.id,
            portalUserId: portalEntityRelationships.portalUserId,
          })
          .from(portalEntityRelationships)
          .where(
            and(
              eq(
                portalEntityRelationships.businessEntityId,
                row.request.businessEntityId
              ),
              eq(portalEntityRelationships.relationshipType, "customer"),
              eq(portalEntityRelationships.sourceProfileId, target.id),
              not(
                eq(
                  portalEntityRelationships.portalUserId,
                  relationship.portalUserId
                )
              )
            )
          )
          .limit(100)
          .for("update");
        if (targetRelationships.length)
          throw genericReviewFailure("السجل القديم مرتبط بحساب بوابة آخر");
        const targetLinkRows = await tx
          .select({ id: customerVerifiedLinks.id })
          .from(customerVerifiedLinks)
          .where(
            and(
              eq(
                customerVerifiedLinks.businessEntityId,
                row.request.businessEntityId
              ),
              eq(customerVerifiedLinks.customerId, target.id)
            )
          )
          .limit(1)
          .for("update");
        const ownerLinkRows = await tx
          .select({ id: customerVerifiedLinks.id })
          .from(customerVerifiedLinks)
          .where(
            and(
              eq(customerVerifiedLinks.credentialId, credential.id),
              eq(
                customerVerifiedLinks.businessEntityId,
                row.request.businessEntityId
              )
            )
          )
          .limit(1)
          .for("update");
        if (targetLinkRows[0] || ownerLinkRows[0])
          throw genericReviewFailure("يوجد ربط موثق متعارض بالفعل");
        await tx.insert(customerVerifiedLinks).values({
          credentialId: credential.id,
          userId: row.request.userId,
          businessEntityId: row.request.businessEntityId,
          customerId: target.id,
          requestId: row.request.id,
          approvedBy: ctx.user.id,
          createdAt: now,
        });
        await tx
          .update(portalEntityRelationships)
          .set({ sourceProfileId: target.id })
          .where(
            and(
              eq(portalEntityRelationships.id, activeRelation.relationship.id),
              eq(portalEntityRelationships.status, "active"),
              eq(
                portalEntityRelationships.businessEntityId,
                row.request.businessEntityId
              )
            )
          );
        await tx
          .update(portalProfiles)
          .set({ localRecordId: target.id })
          .where(
            and(
              eq(portalProfiles.id, profile.id),
              eq(portalProfiles.status, "active"),
              eq(portalProfiles.businessEntityId, row.request.businessEntityId)
            )
          );
        await tx
          .update(customerLinkRequests)
          .set({
            status: "approved",
            reviewedBy: ctx.user.id,
            reviewNote: input.reviewNote.trim(),
            evidenceReference: input.evidenceReference!.trim(),
            identityCheckMethod: input.identityCheckMethod,
            reviewedAt: now,
          })
          .where(eq(customerLinkRequests.id, row.request.id));
        await tx.insert(portalAudit).values(
          auditValues({
            businessEntityId: row.request.businessEntityId,
            relationshipId: row.request.relationshipId,
            action: "customer.link.review.approve",
            resourceType: "customer_link_request",
            resourceId: String(row.request.id),
            outcome: "success",
          })
        );
        await tx.insert(portalV2Notifications).values({
          portalUserId: activeRelation.portalUser.id,
          businessEntityId: row.request.businessEntityId,
          eventKey: "CustomerLinkApproved",
          channel: "in_app",
          title: "تم اعتماد ربط حسابك",
          body: "تمت مراجعة طلب ربط حساب العميل واعتماده.",
          dedupeKey: `customer-link-${row.request.id}-approved`,
        });
        return { id: row.request.id, status: "approved" as const };
      });
    } catch (error) {
      if (
        (error as { code?: string; errno?: number }).code === "ER_DUP_ENTRY" ||
        (error as { errno?: number }).errno === 1062
      )
        throw new TRPCError({
          code: "CONFLICT",
          message: "يوجد ربط موثق متعارض بالفعل",
        });
      throw error;
    }
  }),
});
