import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { assertWorkshopPermission } from "./workshopAccess";
import {
  customers,
  vehicles,
  workshopBays59,
  workshopTechnicians,
  workshopJobCards59,
  workshopEstimates59,
  paymentInvoices47,
  paymentIntents47,
  iamMemberships,
  iamRoles,
  iamSecurityEvents,
} from "../drizzle/schema";

const scope = z.object({ businessEntityId: z.number().int().positive() });
const getDatabase = async () => {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة؛ لا يمكن بدء التشغيل.",
    });
  return db;
};

export const workshopSetupRouter = router({
  readiness: protectedProcedure.input(scope).query(async ({ input, ctx }) => {
    await assertWorkshopPermission(ctx.user, input.businessEntityId, "read");
    const db = await getDatabase();
    const [customerCount, vehicleCount, bayCount, technicianCount, staffCount] =
      await Promise.all([
        db
          .select({ total: sql<number>`count(*)` })
          .from(customers)
          .where(
            and(
              eq(customers.businessEntityId, input.businessEntityId),
              eq(customers.status, "active")
            )
          ),
        db
          .select({ total: sql<number>`count(*)` })
          .from(vehicles)
          .where(eq(vehicles.businessEntityId, input.businessEntityId)),
        db
          .select({ total: sql<number>`count(*)` })
          .from(workshopBays59)
          .where(
            and(
              eq(workshopBays59.businessEntityId, input.businessEntityId),
              eq(workshopBays59.status, "active")
            )
          ),
        db
          .select({ total: sql<number>`count(*)` })
          .from(workshopTechnicians)
          .where(
            and(
              eq(workshopTechnicians.businessEntityId, input.businessEntityId),
              eq(workshopTechnicians.available, 1)
            )
          ),
        db
          .select({
            total: sql<number>`count(distinct ${iamMemberships.userId})`,
          })
          .from(iamMemberships)
          .innerJoin(iamRoles, eq(iamRoles.id, iamMemberships.roleId))
          .where(
            and(
              eq(iamMemberships.businessEntityId, input.businessEntityId),
              eq(iamMemberships.status, "active"),
              eq(iamRoles.status, "active"),
              sql`${iamRoles.scopeType} in ('entity','company','central')`
            )
          ),
      ]);
    const counts = {
      customers: Number(customerCount[0]?.total ?? 0),
      vehicles: Number(vehicleCount[0]?.total ?? 0),
      bays: Number(bayCount[0]?.total ?? 0),
      technicians: Number(technicianCount[0]?.total ?? 0),
      staff: Number(staffCount[0]?.total ?? 0),
    };
    const checks = [
      {
        key: "customers",
        label: "سجل عملاء نشط",
        passed: counts.customers > 0,
        count: counts.customers,
        route: "/master-data",
      },
      {
        key: "vehicles",
        label: "مركبات مسجلة في الكيان",
        passed: counts.vehicles > 0,
        count: counts.vehicles,
        route: "/master-data",
      },
      {
        key: "bays",
        label: "بايات عمل متاحة",
        passed: counts.bays > 0,
        count: counts.bays,
        route: null,
      },
      {
        key: "technicians",
        label: "دليل فنيين متاح",
        passed: counts.technicians > 0,
        count: counts.technicians,
        route: null,
      },
      {
        key: "staff",
        label: "عضويات مستخدمين على مستوى الكيان",
        passed: counts.staff > 0,
        count: counts.staff,
        route: "/admin/roles",
      },
    ];
    return {
      counts,
      checks,
      canStart: checks.every(item => item.passed),
      version: "ورشة RASD · تشغيل تجريبي 1.0",
      limitations: [
        "هذه الوحدة تعمل على مستوى كيان الأعمال؛ الأدوار المقيدة بفرع أو بأعمال مسندة لا تُوسّع تلقائياً إلى كل الكيان.",
        "الفاتورة مرتبطة بمركز الفوترة والتحصيل. إثبات الدفع يعتمد على سجله الفعلي؛ الربط والترحيل إلى دفتر الأستاذ يحتاج اعتماداً محاسبياً منفصلاً.",
        "تسليم النسخة للمستخدمين يتطلب نشر الإصدار، تفعيل الحسابات والصلاحيات، والتحقق التشغيلي من النسخ الاحتياطي والاستعادة.",
      ],
    };
  }),
  createBay: protectedProcedure
    .input(
      scope.extend({
        bayCode: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[A-Za-z0-9_-]+$/, "استخدم أحرفاً إنجليزية وأرقاماً للرمز"),
        nameAr: z.string().trim().min(2).max(160),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertWorkshopPermission(
        ctx.user,
        input.businessEntityId,
        "configure"
      );
      const db = await getDatabase();
      return db.transaction(async tx => {
        const [existing] = await tx
          .select({ id: workshopBays59.id })
          .from(workshopBays59)
          .where(
            and(
              eq(workshopBays59.businessEntityId, input.businessEntityId),
              eq(workshopBays59.bayCode, input.bayCode)
            )
          )
          .limit(1);
        if (existing)
          throw new TRPCError({
            code: "CONFLICT",
            message: "رمز الباي مستخدم في هذا الكيان.",
          });
        const [row] = await tx
          .insert(workshopBays59)
          .values({ ...input, capacity: 1, status: "active" })
          .$returningId();
        await tx
          .insert(iamSecurityEvents)
          .values({
            userId: ctx.user.id,
            businessEntityId: input.businessEntityId,
            eventType: "WorkshopBayCreated",
            outcome: "success",
            resourceType: "workshop_bay",
            resourceId: String(row.id),
            correlationId: randomUUID(),
            detailsJson: JSON.stringify({ bayCode: input.bayCode }),
          });
        return row;
      });
    }),
  createTechnician: protectedProcedure
    .input(
      scope.extend({
        technicianNo: z.string().trim().min(2).max(60),
        nameAr: z.string().trim().min(2).max(180),
        department: z.string().trim().min(2).max(40),
        laborRateMinor: z
          .number()
          .int()
          .nonnegative()
          .max(100000000)
          .default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertWorkshopPermission(
        ctx.user,
        input.businessEntityId,
        "configure"
      );
      const db = await getDatabase();
      return db.transaction(async tx => {
        const [existing] = await tx
          .select({ id: workshopTechnicians.id })
          .from(workshopTechnicians)
          .where(
            and(
              eq(workshopTechnicians.businessEntityId, input.businessEntityId),
              eq(workshopTechnicians.technicianNo, input.technicianNo)
            )
          )
          .limit(1);
        if (existing)
          throw new TRPCError({
            code: "CONFLICT",
            message: "رقم الفني مستخدم في هذا الكيان.",
          });
        const [row] = await tx
          .insert(workshopTechnicians)
          .values({ ...input, available: 1 })
          .$returningId();
        await tx
          .insert(iamSecurityEvents)
          .values({
            userId: ctx.user.id,
            businessEntityId: input.businessEntityId,
            eventType: "WorkshopTechnicianCreated",
            outcome: "success",
            resourceType: "workshop_technician",
            resourceId: String(row.id),
            correlationId: randomUUID(),
            detailsJson: JSON.stringify({ technicianNo: input.technicianNo }),
          });
        return row;
      });
    }),
  issueInvoice: protectedProcedure
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        invoiceNo: z.string().trim().min(3).max(100),
        dueAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertWorkshopPermission(
        ctx.user,
        input.businessEntityId,
        "invoice"
      );
      const db = await getDatabase();
      return db.transaction(async tx => {
        const [job] = await tx
          .select()
          .from(workshopJobCards59)
          .where(
            and(
              eq(workshopJobCards59.id, input.jobCardId),
              eq(workshopJobCards59.businessEntityId, input.businessEntityId)
            )
          )
          .limit(1)
          .for("update");
        if (!job)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "أمر العمل غير موجود في الكيان.",
          });
        const [existing] = await tx
          .select()
          .from(paymentInvoices47)
          .where(
            and(
              eq(paymentInvoices47.businessEntityId, input.businessEntityId),
              eq(paymentInvoices47.sourceSystem, "workshop59"),
              eq(paymentInvoices47.sourceRecordId, String(job.id))
            )
          )
          .limit(1);
        if (existing)
          return {
            id: existing.id,
            invoiceNo: existing.invoiceNo,
            replayed: true,
          };
        if (["delivered", "closed"].includes(job.status))
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "لا يمكن إنشاء فاتورة لأمر مسلّم أو مغلق.",
          });
        const [estimate] = await tx
          .select()
          .from(workshopEstimates59)
          .where(
            and(
              eq(workshopEstimates59.id, job.estimateId ?? 0),
              eq(workshopEstimates59.businessEntityId, input.businessEntityId),
              eq(workshopEstimates59.customerId, job.customerId),
              eq(workshopEstimates59.vehicleId, job.vehicleId)
            )
          )
          .limit(1)
          .for("update");
        if (!estimate || estimate.status !== "approved")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "اعتماد العميل للتقدير مطلوب قبل إصدار الفاتورة.",
          });
        const [duplicate] = await tx
          .select({ id: paymentInvoices47.id })
          .from(paymentInvoices47)
          .where(
            and(
              eq(paymentInvoices47.businessEntityId, input.businessEntityId),
              eq(paymentInvoices47.invoiceNo, input.invoiceNo)
            )
          )
          .limit(1);
        if (duplicate)
          throw new TRPCError({
            code: "CONFLICT",
            message: "رقم الفاتورة مستخدم بالفعل.",
          });
        const [row] = await tx
          .insert(paymentInvoices47)
          .values({
            businessEntityId: input.businessEntityId,
            sourceSystem: "workshop59",
            sourceRecordId: String(job.id),
            invoiceNo: input.invoiceNo,
            customerRef: String(job.customerId),
            amountMinor: estimate.totalMinor,
            paidAmountMinor: 0,
            currency: estimate.currency,
            dueAt: input.dueAt,
            status: estimate.totalMinor === 0 ? "paid" : "issued",
          })
          .$returningId();
        await tx
          .insert(iamSecurityEvents)
          .values({
            userId: ctx.user.id,
            businessEntityId: input.businessEntityId,
            eventType: "WorkshopInvoiceIssued",
            outcome: "success",
            resourceType: "payment_invoice",
            resourceId: String(row.id),
            correlationId: randomUUID(),
            detailsJson: JSON.stringify({
              jobCardId: job.id,
              estimateId: estimate.id,
              amountMinor: estimate.totalMinor,
              sourceSystem: "workshop59",
            }),
          });
        return { id: row.id, invoiceNo: input.invoiceNo, replayed: false };
      });
    }),
  recordPayment: protectedProcedure
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        amountMinor: z.number().int().positive().max(2000000000),
        method: z.enum(["cash", "bank_transfer"]),
        reference: z.string().trim().min(3).max(120),
        receivedConfirmation: z.literal(true),
        idempotencyKey: z.string().trim().min(8).max(180),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertWorkshopPermission(
        ctx.user,
        input.businessEntityId,
        "collect"
      );
      const db = await getDatabase();
      return db.transaction(async tx => {
        const [job] = await tx
          .select()
          .from(workshopJobCards59)
          .where(
            and(
              eq(workshopJobCards59.id, input.jobCardId),
              eq(workshopJobCards59.businessEntityId, input.businessEntityId)
            )
          )
          .limit(1)
          .for("update");
        if (!job)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "أمر العمل غير موجود ضمن الكيان.",
          });
        const [invoice] = await tx
          .select()
          .from(paymentInvoices47)
          .where(
            and(
              eq(paymentInvoices47.businessEntityId, input.businessEntityId),
              eq(paymentInvoices47.sourceSystem, "workshop59"),
              eq(paymentInvoices47.sourceRecordId, String(job.id))
            )
          )
          .limit(1)
          .for("update");
        if (!invoice)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "أصدر الفاتورة المرتبطة بالأمر أولاً.",
          });
        const [existing] = await tx
          .select()
          .from(paymentIntents47)
          .where(
            and(
              eq(paymentIntents47.businessEntityId, input.businessEntityId),
              eq(paymentIntents47.idempotencyKey, input.idempotencyKey)
            )
          )
          .limit(1);
        if (existing) {
          if (
            existing.invoiceId !== invoice.id ||
            existing.amountMinor !== input.amountMinor ||
            existing.paymentMethodType !== input.method ||
            existing.maskedReference !== input.reference ||
            existing.providerKey !== "workshop-manual"
          )
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "مفتاح التحصيل مستخدم لدفعة مختلفة؛ لا يمكن إعادة استعماله.",
            });
          return {
            receiptId: existing.id,
            receiptRef: existing.intentRef,
            remainingMinor: Math.max(
              0,
              invoice.amountMinor - invoice.paidAmountMinor
            ),
            replayed: true,
          };
        }
        if (["cancelled", "disputed"].includes(invoice.status))
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "الفاتورة ملغاة أو متنازع عليها.",
          });
        const remaining = invoice.amountMinor - invoice.paidAmountMinor;
        if (input.amountMinor > remaining)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "قيمة التحصيل تتجاوز الرصيد المتبقي.",
          });
        const receiptRef = `WS-RCP-${randomUUID()}`;
        const [receipt] = await tx
          .insert(paymentIntents47)
          .values({
            businessEntityId: input.businessEntityId,
            invoiceId: invoice.id,
            providerKey: "workshop-manual",
            intentRef: receiptRef,
            amountMinor: input.amountMinor,
            currency: invoice.currency,
            paymentMethodType: input.method,
            status: "captured",
            idempotencyKey: input.idempotencyKey,
            maskedReference: input.reference,
            capturedAt: new Date(),
          })
          .$returningId();
        const paid = invoice.paidAmountMinor + input.amountMinor;
        await tx
          .update(paymentInvoices47)
          .set({
            paidAmountMinor: paid,
            status: paid === invoice.amountMinor ? "paid" : "partially_paid",
          })
          .where(
            and(
              eq(paymentInvoices47.id, invoice.id),
              eq(paymentInvoices47.businessEntityId, input.businessEntityId)
            )
          );
        await tx
          .insert(iamSecurityEvents)
          .values({
            userId: ctx.user.id,
            businessEntityId: input.businessEntityId,
            eventType: "WorkshopPaymentRecorded",
            outcome: "success",
            resourceType: "payment_receipt",
            resourceId: String(receipt.id),
            correlationId: randomUUID(),
            detailsJson: JSON.stringify({
              jobCardId: job.id,
              invoiceId: invoice.id,
              amountMinor: input.amountMinor,
              method: input.method,
              reference: input.reference,
              receivedConfirmation: true,
              externalPaymentExecuted: false,
            }),
          });
        return {
          receiptId: receipt.id,
          receiptRef,
          remainingMinor: invoice.amountMinor - paid,
          replayed: false,
        };
      });
    }),
});
