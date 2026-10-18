import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { storagePut } from "./storage";
import {
  assertWorkshopEntityUser,
  assertWorkshopPermission,
  getWorkshopAccess,
  safeEntityScope,
  type WorkshopAction,
} from "./workshopAccess";
import {
  businessEntities,
  customers,
  iamMemberships,
  iamPermissions,
  iamRolePermissions,
  iamRoles,
  iamSecurityEvents,
  partsInventory,
  partsInventoryMovements,
  partsProducts,
  partsWarehouses,
  paymentInvoices47,
  users,
  vehicles,
  workshopAppointments,
  workshopBays59,
  workshopCheckins59,
  workshopDtc59,
  workshopEstimateConsents59,
  workshopEstimates59,
  workshopInspections59,
  workshopJobCards59,
  workshopOperations59,
  workshopPartRequests59,
  workshopQuality59,
  workshopRoadTests59,
  workshopSchedules59,
  workshopTechnicians,
  workshopWarranties59,
  workshopDeliveries59,
} from "../drizzle/schema";
import {
  calculateWorkshopEstimate,
  canTransitionWorkshopJob,
  isValidWorkshopMileage,
  isValidWorkshopScheduleWindow,
} from "../shared/workshop59";

const scope = z.object({
  businessEntityId: z.number().int().positive(),
  branchId: z.number().int().positive().optional(),
});
const idem = z.string().trim().min(8).max(160);
const statuses = [
  "received",
  "diagnosing",
  "awaiting_approval",
  "awaiting_parts",
  "in_progress",
  "qc",
  "road_test",
  "ready",
  "delivered",
  "closed",
  "warranty_repeat",
] as const;
const jobStatus = z.enum(statuses);
type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type DbSession = Pick<Db, "select" | "insert" | "update">;
type User = { id: number; role: string };

const guarded = (action: WorkshopAction) =>
  protectedProcedure.input(scope).use(async ({ ctx, input, next }) => {
    const entity = (input as { businessEntityId?: unknown } | undefined)
      ?.businessEntityId;
    if (typeof entity !== "number" || !Number.isInteger(entity) || entity <= 0)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "businessEntityId is required",
      });
    await assertWorkshopPermission(ctx.user, entity, action);
    return next();
  });
const dbOrThrow = async () => {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة",
    });
  return db;
};
const idOf = (r: any) => Number(r?.[0]?.insertId ?? r?.[0]?.id ?? 0);
const lock = async (q: any) => {
  if (typeof q.for !== "function")
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قفل صفوف قاعدة البيانات مطلوب لهذه العملية",
    });
  return q.for("update");
};
async function audit(
  db: DbSession,
  user: User,
  entity: number,
  eventType: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown> = {}
) {
  await db.insert(iamSecurityEvents).values({
    userId: user.id,
    businessEntityId: entity,
    eventType,
    outcome: "success",
    resourceType,
    resourceId,
    correlationId: `workshop-${randomUUID()}`,
    detailsJson: JSON.stringify(details),
  });
}
function checksum(e: typeof workshopEstimates59.$inferSelect) {
  const canonical = JSON.stringify({
    id: e.id,
    businessEntityId: e.businessEntityId,
    checkinId: e.checkinId ?? null,
    vehicleId: e.vehicleId,
    customerId: e.customerId,
    version: e.version,
    laborMinor: e.laborMinor,
    partsMinor: e.partsMinor,
    subcontractMinor: e.subcontractMinor,
    consumablesMinor: e.consumablesMinor,
    taxMinor: e.taxMinor,
    discountMinor: e.discountMinor,
    totalMinor: e.totalMinor,
    currency: e.currency,
    validUntil: e.validUntil ? new Date(e.validUntil).toISOString() : null,
  });
  return createHash("sha256").update(canonical).digest("hex");
}
function hasDocuments(value: string | null | undefined) {
  if (!value?.trim()) return false;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.length > 0
      : !!parsed &&
          typeof parsed === "object" &&
          Object.keys(parsed as object).length > 0;
  } catch {
    return false;
  }
}
async function jobIn(db: DbSession, entity: number, jobCardId: number) {
  const [job] = await db
    .select()
    .from(workshopJobCards59)
    .where(
      and(
        eq(workshopJobCards59.id, jobCardId),
        eq(workshopJobCards59.businessEntityId, entity)
      )
    )
    .limit(1);
  if (!job)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "أمر العمل غير موجود ضمن الكيان",
    });
  return job;
}
async function lockedJobIn(db: DbSession, entity: number, jobCardId: number) {
  const [job] = await lock(
    db
      .select()
      .from(workshopJobCards59)
      .where(
        and(
          eq(workshopJobCards59.id, jobCardId),
          eq(workshopJobCards59.businessEntityId, entity)
        )
      )
      .limit(1)
  );
  if (!job)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "أمر العمل غير موجود ضمن الكيان",
    });
  return job as typeof workshopJobCards59.$inferSelect;
}

async function customerVehicle(
  db: DbSession,
  entity: number,
  customerId: number,
  vehicleId: number
) {
  const [customer, vehicle] = await Promise.all([
    db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.businessEntityId, entity),
          eq(customers.status, "active")
        )
      )
      .limit(1),
    db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(
        and(eq(vehicles.id, vehicleId), eq(vehicles.businessEntityId, entity))
      )
      .limit(1),
  ]);
  if (!customer[0] || !vehicle[0])
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "العميل أو المركبة خارج نطاق الكيان أو غير نشط",
    });
}
async function latestQuality(db: DbSession, entity: number, jobId: number) {
  const [q] = await db
    .select()
    .from(workshopQuality59)
    .where(
      and(
        eq(workshopQuality59.businessEntityId, entity),
        eq(workshopQuality59.jobCardId, jobId)
      )
    )
    .orderBy(desc(workshopQuality59.createdAt), desc(workshopQuality59.id))
    .limit(1);
  return q;
}
async function estimateForJob(
  db: DbSession,
  job: typeof workshopJobCards59.$inferSelect
) {
  if (!job.estimateId) return null;
  const [e] = await db
    .select()
    .from(workshopEstimates59)
    .where(
      and(
        eq(workshopEstimates59.id, job.estimateId),
        eq(workshopEstimates59.businessEntityId, job.businessEntityId),
        eq(workshopEstimates59.customerId, job.customerId),
        eq(workshopEstimates59.vehicleId, job.vehicleId)
      )
    )
    .limit(1);
  return e ?? null;
}

export const workshop59Router = router({
  access: protectedProcedure.query(({ ctx }) => getWorkshopAccess(ctx.user)),
  referenceData: guarded("read")
    .input(scope)
    .query(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const ids = await db
        .select({
          userId: iamMemberships.userId,
          scopeJson: iamMemberships.scopeJson,
        })
        .from(iamMemberships)
        .innerJoin(iamRoles, eq(iamMemberships.roleId, iamRoles.id))
        .innerJoin(
          iamRolePermissions,
          eq(iamRolePermissions.roleId, iamRoles.id)
        )
        .innerJoin(
          iamPermissions,
          eq(iamRolePermissions.permissionId, iamPermissions.id)
        )
        .where(
          and(
            eq(iamPermissions.permissionKey, "workshop.operation.create"),
            sql`${iamMemberships.startsAt} <= ${new Date()}`,
            sql`(${iamMemberships.endsAt} IS NULL OR ${iamMemberships.endsAt} > ${new Date()})`,
            eq(iamMemberships.businessEntityId, input.businessEntityId),
            eq(iamMemberships.status, "active"),
            eq(iamRoles.status, "active"),
            inArray(iamRoles.scopeType, ["entity", "company"])
          )
        );
      const userIds = ids
        .filter(row => safeEntityScope(row.scopeJson))
        .map(x => x.userId);
      const [
        customerRows,
        vehicleRows,
        bays,
        technicians,
        warehouses,
        products,
        inventory,
        staff,
      ] = await Promise.all([
        db
          .select({
            id: customers.id,
            customerNo: customers.customerNo,
            nameAr: customers.nameAr,
            phone: customers.phone,
          })
          .from(customers)
          .where(
            and(
              eq(customers.businessEntityId, input.businessEntityId),
              eq(customers.status, "active")
            )
          )
          .orderBy(desc(customers.createdAt))
          .limit(200),
        db
          .select({
            id: vehicles.id,
            vehicleNo: vehicles.vehicleNo,
            vin: vehicles.vin,
            make: vehicles.make,
            model: vehicles.model,
            modelYear: vehicles.modelYear,
            lifecycleStatus: vehicles.lifecycleStatus,
          })
          .from(vehicles)
          .where(eq(vehicles.businessEntityId, input.businessEntityId))
          .orderBy(desc(vehicles.createdAt))
          .limit(200),
        db
          .select()
          .from(workshopBays59)
          .where(
            and(
              eq(workshopBays59.businessEntityId, input.businessEntityId),
              eq(workshopBays59.status, "active")
            )
          )
          .orderBy(workshopBays59.bayCode),
        db
          .select()
          .from(workshopTechnicians)
          .where(
            and(
              eq(workshopTechnicians.businessEntityId, input.businessEntityId),
              eq(workshopTechnicians.available, 1)
            )
          )
          .orderBy(workshopTechnicians.nameAr),
        db
          .select({
            id: partsWarehouses.id,
            nameAr: partsWarehouses.nameAr,
            warehouseCode: partsWarehouses.warehouseCode,
          })
          .from(partsWarehouses)
          .where(
            and(
              eq(partsWarehouses.businessEntityId, input.businessEntityId),
              eq(partsWarehouses.status, "active")
            )
          )
          .orderBy(partsWarehouses.nameAr),
        db
          .select({
            id: partsProducts.id,
            sku: partsProducts.sku,
            nameAr: partsProducts.nameAr,
            unit: partsProducts.unit,
          })
          .from(partsProducts)
          .where(
            and(
              eq(partsProducts.businessEntityId, input.businessEntityId),
              eq(partsProducts.status, "active")
            )
          )
          .orderBy(partsProducts.nameAr)
          .limit(500),
        db
          .select({
            id: partsInventory.id,
            warehouseId: partsInventory.warehouseId,
            productId: partsInventory.productId,
            availableQty: partsInventory.availableQty,
            reservedQty: partsInventory.reservedQty,
          })
          .from(partsInventory)
          .where(eq(partsInventory.businessEntityId, input.businessEntityId)),
        userIds.length
          ? db
              .select({ id: users.id, name: users.name })
              .from(users)
              .where(and(inArray(users.id, userIds), eq(users.role, "user")))
          : Promise.resolve([]),
      ]);
      return {
        customers: customerRows,
        vehicles: vehicleRows,
        bays,
        technicians,
        warehouses,
        products,
        inventory,
        users: staff
          .filter(x => x.name != null)
          .map(x => ({ id: x.id, name: x.name })),
      };
    }),
  appointmentsBoard: guarded("read")
    .input(scope.extend({ from: z.coerce.date(), to: z.coerce.date() }))
    .query(async ({ input }) => {
      const db = await dbOrThrow();
      const [appointments, schedules, bays, technicians] = await Promise.all([
        db
          .select()
          .from(workshopAppointments)
          .where(
            and(
              eq(workshopAppointments.businessEntityId, input.businessEntityId),
              sql`${workshopAppointments.scheduledAt} >= ${input.from}`,
              sql`${workshopAppointments.scheduledAt} < ${input.to}`
            )
          )
          .orderBy(workshopAppointments.scheduledAt),
        db
          .select()
          .from(workshopSchedules59)
          .where(
            and(
              eq(workshopSchedules59.businessEntityId, input.businessEntityId),
              sql`${workshopSchedules59.startsAt} < ${input.to}`,
              sql`${workshopSchedules59.endsAt} > ${input.from}`
            )
          )
          .orderBy(workshopSchedules59.startsAt),
        db
          .select()
          .from(workshopBays59)
          .where(eq(workshopBays59.businessEntityId, input.businessEntityId))
          .orderBy(workshopBays59.bayCode),
        db
          .select()
          .from(workshopTechnicians)
          .where(
            eq(workshopTechnicians.businessEntityId, input.businessEntityId)
          )
          .orderBy(workshopTechnicians.nameAr),
      ]);
      return { appointments, schedules, bays, technicians };
    }),
  scheduleAppointment: guarded("schedule")
    .input(
      scope.extend({
        customerId: z.number().int().positive(),
        vehicleId: z.number().int().positive(),
        serviceType: z.string().trim().min(2).max(120),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
        bayId: z.number().int().positive(),
        technicianId: z.number().int().positive().optional(),
        technicianUserId: z.number().int().positive().optional(),
        jobCardId: z.number().int().positive().optional(),
        notes: z.string().max(2000).optional(),
        idempotencyKey: idem,
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!isValidWorkshopScheduleWindow(input.startsAt, input.endsAt))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "نافذة الموعد غير صالحة",
        });
      const db = await dbOrThrow();
      const replay = await db
        .select()
        .from(workshopSchedules59)
        .where(
          and(
            eq(workshopSchedules59.businessEntityId, input.businessEntityId),
            eq(workshopSchedules59.idempotencyKey, input.idempotencyKey)
          )
        )
        .limit(1);
      if (replay[0]) return replay[0];
      await customerVehicle(
        db,
        input.businessEntityId,
        input.customerId,
        input.vehicleId
      );
      const bay = await db
        .select({ id: workshopBays59.id })
        .from(workshopBays59)
        .where(
          and(
            eq(workshopBays59.id, input.bayId),
            eq(workshopBays59.businessEntityId, input.businessEntityId),
            eq(workshopBays59.status, "active")
          )
        )
        .limit(1);
      if (!bay[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "الباي خارج نطاق الكيان",
        });
      if (input.technicianId) {
        const t = await db
          .select({ id: workshopTechnicians.id })
          .from(workshopTechnicians)
          .where(
            and(
              eq(workshopTechnicians.id, input.technicianId),
              eq(workshopTechnicians.businessEntityId, input.businessEntityId),
              eq(workshopTechnicians.available, 1)
            )
          )
          .limit(1);
        if (!t[0])
          throw new TRPCError({ code: "FORBIDDEN", message: "الفني غير متاح" });
      }
      if (input.technicianUserId)
        await assertWorkshopEntityUser(
          input.technicianUserId,
          input.businessEntityId
        );
      const result = await db.transaction(async tx => {
        await lock(
          tx
            .select({ id: workshopBays59.id })
            .from(workshopBays59)
            .where(eq(workshopBays59.id, input.bayId))
            .limit(1)
        );
        const conflicts = await tx
          .select({ id: workshopSchedules59.id })
          .from(workshopSchedules59)
          .where(
            and(
              eq(workshopSchedules59.businessEntityId, input.businessEntityId),
              sql`${workshopSchedules59.status} <> 'cancelled'`,
              sql`${workshopSchedules59.startsAt} < ${input.endsAt}`,
              sql`${workshopSchedules59.endsAt} > ${input.startsAt}`,
              sql`(${workshopSchedules59.bayId} = ${input.bayId} OR (${input.technicianId ? sql`${workshopSchedules59.technicianId} = ${input.technicianId}` : sql`1=0`}))`
            )
          )
          .limit(1);
        if (conflicts[0])
          throw new TRPCError({
            code: "CONFLICT",
            message: "يوجد تعارض في الباي أو جدول الفني",
          });
        const appointmentNo = `WS-APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const a = await tx.insert(workshopAppointments).values({
          businessEntityId: input.businessEntityId,
          appointmentNo,
          customerId: input.customerId,
          vehicleId: input.vehicleId,
          scheduledAt: input.startsAt,
          serviceType: input.serviceType,
          status: "scheduled",
        });
        const appointmentId = idOf(a);
        const s = await tx.insert(workshopSchedules59).values({
          businessEntityId: input.businessEntityId,
          appointmentId,
          jobCardId: input.jobCardId,
          bayId: input.bayId,
          technicianId: input.technicianId,
          technicianUserId: input.technicianUserId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          notes: input.notes,
          idempotencyKey: input.idempotencyKey,
          createdBy: ctx.user.id,
        });
        return { id: idOf(s), appointmentId, appointmentNo };
      });
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopAppointmentScheduled",
        "workshop_schedule_59",
        String(result.id)
      );
      return result;
    }),
  createCheckin: guarded("receive")
    .input(
      scope.extend({
        customerId: z.number().int().positive(),
        vehicleId: z.number().int().positive(),
        workshopCenterId: z.number().int().positive().optional(),
        appointmentId: z.number().int().positive().optional(),
        mileage: z.number().int().nonnegative(),
        fuelLevel: z.string().max(40).optional(),
        complaint: z.string().trim().min(3).max(2000),
        consent: z.literal(true),
        existingDamageJson: z.string().max(12000).optional(),
        evidenceJson: z.string().max(12000).optional(),
        idempotencyKey: idem,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const replay = await db
        .select()
        .from(workshopCheckins59)
        .where(
          and(
            eq(workshopCheckins59.businessEntityId, input.businessEntityId),
            eq(workshopCheckins59.idempotencyKey, input.idempotencyKey)
          )
        )
        .limit(1);
      if (replay[0]) return replay[0];
      await customerVehicle(
        db,
        input.businessEntityId,
        input.customerId,
        input.vehicleId
      );
      if (input.appointmentId) {
        const [a] = await db
          .select()
          .from(workshopAppointments)
          .where(
            and(
              eq(workshopAppointments.id, input.appointmentId),
              eq(workshopAppointments.businessEntityId, input.businessEntityId),
              eq(workshopAppointments.customerId, input.customerId),
              eq(workshopAppointments.vehicleId, input.vehicleId)
            )
          )
          .limit(1);
        if (!a || a.status === "cancelled")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "الموعد لا يطابق العميل والمركبة",
          });
      }
      const r = await db
        .insert(workshopCheckins59)
        .values({ ...input, createdBy: ctx.user.id });
      const row = await db
        .select()
        .from(workshopCheckins59)
        .where(eq(workshopCheckins59.id, idOf(r)))
        .limit(1);
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopCheckinCreated",
        "workshop_checkin_59",
        String(idOf(r))
      );
      return row[0] ?? { id: idOf(r), ...input };
    }),
  createEstimate: guarded("estimate")
    .input(
      scope.extend({
        checkinId: z.number().int().positive().optional(),
        jobCardId: z.number().int().positive().optional(),
        vehicleId: z.number().int().positive(),
        customerId: z.number().int().positive(),
        version: z.number().int().positive().default(1),
        laborMinor: z.number().int().nonnegative(),
        partsMinor: z.number().int().nonnegative(),
        subcontractMinor: z.number().int().nonnegative(),
        consumablesMinor: z.number().int().nonnegative(),
        taxMinor: z.number().int().nonnegative(),
        discountMinor: z.number().int().nonnegative(),
        currency: z.string().length(3).default("OMR"),
        validUntil: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      await customerVehicle(
        db,
        input.businessEntityId,
        input.customerId,
        input.vehicleId
      );
      const result = await db.transaction(async tx => {
        let job: any = null;
        await lock(
          tx
            .select({ id: vehicles.id })
            .from(vehicles)
            .where(
              and(
                eq(vehicles.id, input.vehicleId),
                eq(vehicles.businessEntityId, input.businessEntityId)
              )
            )
            .limit(1)
        );
        if (input.jobCardId) {
          const rows = await lock(
            tx
              .select()
              .from(workshopJobCards59)
              .where(
                and(
                  eq(workshopJobCards59.id, input.jobCardId),
                  eq(
                    workshopJobCards59.businessEntityId,
                    input.businessEntityId
                  )
                )
              )
              .limit(1)
          );
          job = rows[0];
          if (!job)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "أمر العمل غير موجود",
            });
          if (
            job.customerId !== input.customerId ||
            job.vehicleId !== input.vehicleId
          )
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "التقدير لا يطابق أمر العمل",
            });
          if (["ready", "delivered", "closed"].includes(job.status))
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "لا يمكن إنشاء تقدير بعد جاهزية أمر العمل",
            });
        }
        const existingInvoice = job
          ? await tx
              .select({ id: paymentInvoices47.id })
              .from(paymentInvoices47)
              .where(
                and(
                  eq(
                    paymentInvoices47.businessEntityId,
                    input.businessEntityId
                  ),
                  eq(paymentInvoices47.sourceSystem, "workshop59"),
                  eq(paymentInvoices47.sourceRecordId, String(job.id))
                )
              )
              .limit(1)
          : [];
        if (existingInvoice[0])
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "الفاتورة المركزية صدرت لهذا الأمر",
          });
        const latest = await tx
          .select({ version: workshopEstimates59.version })
          .from(workshopEstimates59)
          .where(
            and(
              eq(workshopEstimates59.businessEntityId, input.businessEntityId),
              eq(workshopEstimates59.vehicleId, input.vehicleId)
            )
          )
          .orderBy(desc(workshopEstimates59.version))
          .limit(1);
        const version = Number(latest[0]?.version ?? 0) + 1;
        if (input.checkinId) {
          const [c] = await tx
            .select({
              id: workshopCheckins59.id,
              customerId: workshopCheckins59.customerId,
              vehicleId: workshopCheckins59.vehicleId,
            })
            .from(workshopCheckins59)
            .where(
              and(
                eq(workshopCheckins59.id, input.checkinId),
                eq(workshopCheckins59.businessEntityId, input.businessEntityId)
              )
            )
            .limit(1);
          if (
            !c ||
            c.customerId !== input.customerId ||
            c.vehicleId !== input.vehicleId
          )
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "تسجيل الدخول لا يطابق التقدير",
            });
        }
        const values = {
          businessEntityId: input.businessEntityId,
          checkinId: job?.checkinId ?? input.checkinId,
          vehicleId: input.vehicleId,
          customerId: input.customerId,
          version,
          laborMinor: input.laborMinor,
          partsMinor: input.partsMinor,
          subcontractMinor: input.subcontractMinor,
          consumablesMinor: input.consumablesMinor,
          taxMinor: input.taxMinor,
          discountMinor: input.discountMinor,
          totalMinor: calculateWorkshopEstimate(input),
          currency: input.currency,
          validUntil: input.validUntil,
          createdBy: ctx.user.id,
        };
        const r = await tx.insert(workshopEstimates59).values(values);
        const id = idOf(r);
        if (job)
          await tx
            .update(workshopJobCards59)
            .set({ estimateId: id })
            .where(
              and(
                eq(workshopJobCards59.id, job.id),
                eq(workshopJobCards59.businessEntityId, input.businessEntityId)
              )
            );
        const [row] = await tx
          .select()
          .from(workshopEstimates59)
          .where(eq(workshopEstimates59.id, id))
          .limit(1);
        return row;
      });
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopEstimateCreated",
        "workshop_estimate_59",
        String(result?.id ?? 0)
      );
      return result ? { ...result, checksum: checksum(result) } : result;
    }),
  openJobCard: guarded("receive")
    .input(
      scope.extend({
        jobNo: z.string().trim().min(3).max(100),
        customerId: z.number().int().positive(),
        vehicleId: z.number().int().positive(),
        checkinId: z.number().int().positive(),
        priority: z
          .enum(["low", "normal", "high", "critical"])
          .default("normal"),
        promisedAt: z.coerce.date().optional(),
        idempotencyKey: idem,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      return db.transaction(async tx => {
        const checkins = await lock(
          tx
            .select()
            .from(workshopCheckins59)
            .where(
              and(
                eq(workshopCheckins59.id, input.checkinId),
                eq(workshopCheckins59.businessEntityId, input.businessEntityId)
              )
            )
            .limit(1)
        );
        const checkin = checkins[0];
        if (
          !checkin ||
          checkin.customerId !== input.customerId ||
          checkin.vehicleId !== input.vehicleId ||
          !checkin.consent
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "الاستقبال وموافقة العميل لا يطابقان الأمر",
          });
        const [existing] = await tx
          .select()
          .from(workshopJobCards59)
          .where(
            and(
              eq(workshopJobCards59.businessEntityId, input.businessEntityId),
              eq(workshopJobCards59.idempotencyKey, input.idempotencyKey)
            )
          )
          .limit(1);
        if (existing) {
          if (
            existing.checkinId !== input.checkinId ||
            existing.customerId !== input.customerId ||
            existing.vehicleId !== input.vehicleId
          )
            throw new TRPCError({
              code: "CONFLICT",
              message: "مفتاح الطلب مستخدم لاستقبال مختلف",
            });
          return existing;
        }
        if (!["checked_in", "inspecting"].includes(checkin.status))
          throw new TRPCError({
            code: "CONFLICT",
            message: "تم تحويل الاستقبال إلى أمر أو إلغاؤه بالفعل",
          });
        await customerVehicle(
          tx,
          input.businessEntityId,
          input.customerId,
          input.vehicleId
        );
        const [number] = await tx
          .select({ id: workshopJobCards59.id })
          .from(workshopJobCards59)
          .where(
            and(
              eq(workshopJobCards59.businessEntityId, input.businessEntityId),
              eq(workshopJobCards59.jobNo, input.jobNo)
            )
          )
          .limit(1);
        if (number)
          throw new TRPCError({
            code: "CONFLICT",
            message: "رقم أمر العمل مستخدم؛ اختر رقماً آخر",
          });
        const r = await tx.insert(workshopJobCards59).values({
          businessEntityId: input.businessEntityId,
          checkinId: input.checkinId,
          jobNo: input.jobNo,
          customerId: input.customerId,
          vehicleId: input.vehicleId,
          priority: input.priority,
          promisedAt: input.promisedAt,
          idempotencyKey: input.idempotencyKey,
          createdBy: ctx.user.id,
        });
        const jobId = idOf(r);
        await tx
          .update(workshopCheckins59)
          .set({ status: "converted" })
          .where(
            and(
              eq(workshopCheckins59.id, input.checkinId),
              eq(workshopCheckins59.businessEntityId, input.businessEntityId)
            )
          );
        await audit(
          tx,
          ctx.user,
          input.businessEntityId,
          "WorkshopJobOpened",
          "workshop_job_card_59",
          String(jobId),
          { checkinId: input.checkinId }
        );
        const [row] = await tx
          .select()
          .from(workshopJobCards59)
          .where(eq(workshopJobCards59.id, jobId))
          .limit(1);
        return row ?? { id: jobId, ...input, status: "received" as const };
      });
    }),
  createJobCard: guarded("receive")
    .input(
      scope.extend({
        jobNo: z.string().trim().min(3).max(100),
        customerId: z.number().int().positive(),
        vehicleId: z.number().int().positive(),
        idempotencyKey: idem,
      })
    )
    .mutation(() => {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "استخدم استقبال المركبة ثم openJobCard لربط الأمر بالاستقبال وموافقة العميل",
      });
    }),
  jobDetails: guarded("read")
    .input(scope.extend({ jobCardId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await dbOrThrow();
      const job = await jobIn(db, input.businessEntityId, input.jobCardId);
      const estimate = await estimateForJob(db, job);
      const [
        checkins,
        operations,
        inspections,
        dtcs,
        parts,
        roadTests,
        warranties,
        quality,
        deliveries,
        consents,
        invoice,
      ] = await Promise.all([
        db
          .select()
          .from(workshopCheckins59)
          .where(
            and(
              eq(workshopCheckins59.businessEntityId, input.businessEntityId),
              eq(
                workshopCheckins59.id,
                job.checkinId ?? estimate?.checkinId ?? 0
              )
            )
          )
          .orderBy(desc(workshopCheckins59.createdAt)),
        db
          .select()
          .from(workshopOperations59)
          .where(
            and(
              eq(workshopOperations59.businessEntityId, input.businessEntityId),
              eq(workshopOperations59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(desc(workshopOperations59.createdAt)),
        db
          .select()
          .from(workshopInspections59)
          .where(
            and(
              eq(
                workshopInspections59.businessEntityId,
                input.businessEntityId
              ),
              eq(workshopInspections59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(desc(workshopInspections59.createdAt)),
        db
          .select()
          .from(workshopDtc59)
          .where(
            and(
              eq(workshopDtc59.businessEntityId, input.businessEntityId),
              eq(workshopDtc59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(desc(workshopDtc59.createdAt)),
        db
          .select()
          .from(workshopPartRequests59)
          .where(
            and(
              eq(
                workshopPartRequests59.businessEntityId,
                input.businessEntityId
              ),
              eq(workshopPartRequests59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(desc(workshopPartRequests59.createdAt)),
        db
          .select()
          .from(workshopRoadTests59)
          .where(
            and(
              eq(workshopRoadTests59.businessEntityId, input.businessEntityId),
              eq(workshopRoadTests59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(
            desc(workshopRoadTests59.createdAt),
            desc(workshopRoadTests59.id)
          ),
        db
          .select()
          .from(workshopWarranties59)
          .where(
            and(
              eq(workshopWarranties59.businessEntityId, input.businessEntityId),
              eq(workshopWarranties59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(desc(workshopWarranties59.createdAt)),
        db
          .select()
          .from(workshopQuality59)
          .where(
            and(
              eq(workshopQuality59.businessEntityId, input.businessEntityId),
              eq(workshopQuality59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(
            desc(workshopQuality59.createdAt),
            desc(workshopQuality59.id)
          ),
        db
          .select()
          .from(workshopDeliveries59)
          .where(
            and(
              eq(workshopDeliveries59.businessEntityId, input.businessEntityId),
              eq(workshopDeliveries59.jobCardId, input.jobCardId)
            )
          )
          .orderBy(desc(workshopDeliveries59.createdAt)),
        estimate
          ? db
              .select()
              .from(workshopEstimateConsents59)
              .where(
                and(
                  eq(
                    workshopEstimateConsents59.businessEntityId,
                    input.businessEntityId
                  ),
                  eq(workshopEstimateConsents59.estimateId, estimate.id),
                  eq(workshopEstimateConsents59.version, estimate.version),
                  eq(workshopEstimateConsents59.customerId, job.customerId)
                )
              )
              .orderBy(desc(workshopEstimateConsents59.consentedAt))
          : Promise.resolve([]),
        db
          .select()
          .from(paymentInvoices47)
          .where(
            and(
              eq(paymentInvoices47.businessEntityId, input.businessEntityId),
              eq(paymentInvoices47.sourceSystem, "workshop59"),
              eq(paymentInvoices47.sourceRecordId, String(job.id))
            )
          )
          .limit(1),
      ]);
      return {
        job,
        checkins,
        estimates: estimate
          ? [{ ...estimate, checksum: checksum(estimate) }]
          : [],
        operations,
        inspections,
        dtcs,
        parts,
        consents,
        roadTests,
        warranties,
        quality,
        deliveries,
        invoice: invoice[0] ?? null,
      };
    }),
  transitionJobCard: protectedProcedure
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        from: jobStatus,
        to: jobStatus,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const permission: WorkshopAction =
        input.to === "qc" || input.to === "road_test" || input.to === "ready"
          ? "quality"
          : input.to === "closed"
            ? "deliver"
            : "operate";
      await assertWorkshopPermission(
        ctx.user,
        input.businessEntityId,
        permission
      );
      const rootDb = await dbOrThrow();
      return rootDb.transaction(async tx => {
        const db = tx;
        const job = await lockedJobIn(
          db,
          input.businessEntityId,
          input.jobCardId
        );
        if (job.status !== input.from)
          throw new TRPCError({
            code: "CONFLICT",
            message: "حالة أمر العمل تغيرت؛ أعد تحميل الشاشة",
          });
        if (input.to === "delivered")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "التسليم يتم عبر deliver فقط",
          });
        if (!canTransitionWorkshopJob(input.from, input.to))
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "انتقال الحالة غير مسموح",
          });
        if (input.to === "in_progress") {
          const estimate = await estimateForJob(db, job);
          if (estimate?.status !== "approved")
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "موافقة العميل على التقدير مطلوبة قبل الإصلاح",
            });
        }
        if (["qc", "road_test", "ready"].includes(input.to)) {
          const rows = await db
            .select({ status: workshopOperations59.status })
            .from(workshopOperations59)
            .where(
              and(
                eq(
                  workshopOperations59.businessEntityId,
                  input.businessEntityId
                ),
                eq(workshopOperations59.jobCardId, input.jobCardId)
              )
            );
          if (!rows.length || rows.some(row => row.status !== "completed"))
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "أكمل عمليات الإصلاح قبل الانتقال للجودة أو الجاهزية",
            });
        }
        if (input.to === "ready" || input.to === "road_test") {
          const q = await latestQuality(
            db,
            input.businessEntityId,
            input.jobCardId
          );
          const operations = await db
            .select({ status: workshopOperations59.status })
            .from(workshopOperations59)
            .where(
              and(
                eq(
                  workshopOperations59.businessEntityId,
                  input.businessEntityId
                ),
                eq(workshopOperations59.jobCardId, input.jobCardId)
              )
            );
          if (
            !q ||
            q.result !== "passed" ||
            !operations.length ||
            operations.some(o => o.status !== "completed")
          )
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "الجودة يجب أن تكون ناجحة وكل العمليات مكتملة",
            });
        }
        if (input.to === "ready") {
          const roads = await db
            .select()
            .from(workshopRoadTests59)
            .where(
              and(
                eq(
                  workshopRoadTests59.businessEntityId,
                  input.businessEntityId
                ),
                eq(workshopRoadTests59.jobCardId, input.jobCardId)
              )
            )
            .orderBy(
              desc(workshopRoadTests59.createdAt),
              desc(workshopRoadTests59.id)
            );
          if (
            (input.from === "road_test" && !roads.length) ||
            roads.some(road =>
              ["authorized", "in_progress"].includes(road.status)
            ) ||
            roads[0]?.incident
          )
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "أكمل اختبار الطريق وعالج ملاحظات السلامة",
            });
        }
        const updated = await db
          .update(workshopJobCards59)
          .set({ status: input.to })
          .where(
            and(
              eq(workshopJobCards59.id, input.jobCardId),
              eq(workshopJobCards59.businessEntityId, input.businessEntityId),
              eq(workshopJobCards59.status, input.from)
            )
          );
        if ((updated as any)?.[0]?.affectedRows === 0)
          throw new TRPCError({
            code: "CONFLICT",
            message: "تعذر تحديث الحالة",
          });
        await audit(
          db,
          ctx.user,
          input.businessEntityId,
          "WorkshopJobTransitioned",
          "workshop_job_card_59",
          String(input.jobCardId),
          { from: input.from, to: input.to }
        );
        return { ok: true, from: input.from, status: input.to };
      });
    }),
  createOperation: guarded("operate")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        technicianUserId: z.number().int().positive().optional(),
        operation: z.string().trim().min(2).max(180),
        standardHours: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/)
          .refine(value => Number(value) <= 1000)
          .default("0"),
        laborCostMinor: z.number().int().nonnegative().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rootDb = await dbOrThrow();
      return rootDb.transaction(async tx => {
        const db = tx;
        const job = await lockedJobIn(
          db,
          input.businessEntityId,
          input.jobCardId
        );
        if (
          ["qc", "road_test", "ready", "delivered", "closed"].includes(
            job.status
          )
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "عد إلى مرحلة الإصلاح قبل إضافة عمليات جديدة",
          });
        if (input.technicianUserId)
          await assertWorkshopEntityUser(
            input.technicianUserId,
            input.businessEntityId
          );
        const r = await db.insert(workshopOperations59).values({
          businessEntityId: input.businessEntityId,
          jobCardId: input.jobCardId,
          technicianUserId: input.technicianUserId,
          operation: input.operation,
          standardHours: input.standardHours,
          laborCostMinor: input.laborCostMinor,
        });
        await audit(
          db,
          ctx.user,
          input.businessEntityId,
          "WorkshopOperationCreated",
          "workshop_operation_59",
          String(idOf(r))
        );
        return { id: idOf(r), jobCardId: input.jobCardId };
      });
    }),
  updateOperation: guarded("operate")
    .input(
      scope.extend({
        operationId: z.number().int().positive(),
        status: z.enum([
          "planned",
          "in_progress",
          "paused",
          "completed",
          "rework",
        ]),
        actualHours: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/)
          .refine(value => Number(value) <= 1000)
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rootDb = await dbOrThrow();
      return rootDb.transaction(async tx => {
        const db = tx;
        const [o] = await db
          .select()
          .from(workshopOperations59)
          .where(
            and(
              eq(workshopOperations59.id, input.operationId),
              eq(workshopOperations59.businessEntityId, input.businessEntityId)
            )
          )
          .limit(1);
        if (!o)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "عملية الورشة غير موجودة",
          });
        const job = await lockedJobIn(db, input.businessEntityId, o.jobCardId);
        if (
          ["qc", "road_test", "ready", "delivered", "closed"].includes(
            job.status
          )
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "عد إلى الإصلاح قبل تعديل العمليات",
          });
        if (["in_progress", "completed"].includes(input.status)) {
          const estimate = await estimateForJob(db, job);
          if (job.status !== "in_progress" || estimate?.status !== "approved")
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "بدء التنفيذ يتطلب مرحلة الإصلاح وتقديراً معتمداً",
            });
        }
        await db
          .update(workshopOperations59)
          .set({
            status: input.status,
            actualHours: input.actualHours ?? o.actualHours,
            startedAt:
              input.status === "in_progress" && !o.startedAt
                ? new Date()
                : o.startedAt,
            endedAt: ["completed", "rework"].includes(input.status)
              ? new Date()
              : o.endedAt,
          })
          .where(
            and(
              eq(workshopOperations59.id, input.operationId),
              eq(workshopOperations59.businessEntityId, input.businessEntityId)
            )
          );
        await audit(
          db,
          ctx.user,
          input.businessEntityId,
          "WorkshopOperationUpdated",
          "workshop_operation_59",
          String(input.operationId),
          { status: input.status }
        );
        return { ok: true, status: input.status };
      });
    }),
  recordQuality: guarded("quality")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        result: z.enum(["pending", "passed", "failed", "rework"]),
        checklistJson: z.string().min(2).max(20000),
        evidenceJson: z.string().max(12000).optional(),
        defect: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rootDb = await dbOrThrow();
      return rootDb.transaction(async tx => {
        const db = tx;
        const job = await lockedJobIn(
          db,
          input.businessEntityId,
          input.jobCardId
        );
        if (!["qc", "road_test"].includes(job.status))
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "تسجيل الجودة متاح فقط في qc أو road_test",
          });
        let checklist: Record<string, unknown>;
        try {
          checklist = JSON.parse(input.checklistJson);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "قائمة الجودة غير صالحة",
          });
        }
        if (
          !checklist ||
          Array.isArray(checklist) ||
          typeof checklist !== "object" ||
          (input.result === "passed" &&
            !["repair", "safety", "fluids", "cleanliness"].every(
              key => checklist[key] === true
            ))
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "اجتياز الجودة يتطلب اكتمال عناصر التحقق",
          });
        if (
          ["failed", "rework"].includes(input.result) &&
          (!input.defect || input.defect.trim().length < 3)
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "سجّل سبب عدم الاجتياز",
          });
        const r = await db.insert(workshopQuality59).values({
          ...input,
          inspectorUserId: ctx.user.id,
          approvedAt: input.result === "passed" ? new Date() : undefined,
        });
        await audit(
          db,
          ctx.user,
          input.businessEntityId,
          "WorkshopQualityRecorded",
          "workshop_quality_59",
          String(idOf(r)),
          { result: input.result }
        );
        return {
          id: idOf(r),
          result: input.result,
          approvedAt: input.result === "passed" ? new Date() : null,
        };
      });
    }),
  deliver: guarded("deliver")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        customerId: z.number().int().positive(),
        customerAcknowledgement: z.literal(true),
        mileage: z.number().int().nonnegative().max(2000000000),
        documentsJson: z.string().max(12000),
        idempotencyKey: idem,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      return db.transaction(async tx => {
        const [job] = await lock(
          tx
            .select()
            .from(workshopJobCards59)
            .where(
              and(
                eq(workshopJobCards59.id, input.jobCardId),
                eq(workshopJobCards59.businessEntityId, input.businessEntityId)
              )
            )
            .limit(1)
        );
        if (!job)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "أمر العمل غير موجود ضمن الكيان",
          });
        const [replay] = await tx
          .select()
          .from(workshopDeliveries59)
          .where(
            and(
              eq(workshopDeliveries59.businessEntityId, input.businessEntityId),
              eq(workshopDeliveries59.idempotencyKey, input.idempotencyKey)
            )
          )
          .limit(1);
        if (replay) {
          if (
            replay.jobCardId !== job.id ||
            replay.customerId !== input.customerId
          )
            throw new TRPCError({
              code: "CONFLICT",
              message: "مفتاح التسليم مستخدم لأمر مختلف",
            });
          return replay;
        }
        if (job.status !== "ready" || job.customerId !== input.customerId)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "الأمر يجب أن يكون جاهزاً والعميل مطابقاً",
          });
        let docs: any;
        try {
          docs = JSON.parse(input.documentsJson);
        } catch {}
        if (
          !docs ||
          typeof docs.references !== "string" ||
          docs.references.trim().length < 3
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "مراجع مستندات التسليم مطلوبة",
          });
        const quality = await latestQuality(tx, input.businessEntityId, job.id);
        if (!quality || quality.result !== "passed" || !quality.approvedAt)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "آخر فحص جودة غير ناجح",
          });
        const operations = await tx
          .select({ status: workshopOperations59.status })
          .from(workshopOperations59)
          .where(
            and(
              eq(workshopOperations59.businessEntityId, input.businessEntityId),
              eq(workshopOperations59.jobCardId, job.id)
            )
          );
        if (
          !operations.length ||
          operations.some(operation => operation.status !== "completed")
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "عمليات الإصلاح غير مكتملة",
          });
        const [invoice] = await lock(
          tx
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
        );
        if (
          !invoice ||
          invoice.status !== "paid" ||
          invoice.paidAmountMinor < invoice.amountMinor
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "الفاتورة المركزية غير مسددة بالكامل",
          });
        const [checkin] = await tx
          .select()
          .from(workshopCheckins59)
          .where(
            and(
              eq(workshopCheckins59.businessEntityId, input.businessEntityId),
              eq(workshopCheckins59.id, job.checkinId ?? 0),
              eq(workshopCheckins59.vehicleId, job.vehicleId),
              eq(workshopCheckins59.customerId, job.customerId)
            )
          )
          .limit(1);
        if (!checkin?.consent)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "يلزم استقبال مرتبط بالأمر مع موافقة العميل؛ لا تُربط السجلات السابقة آلياً",
          });
        const roads = await tx
          .select()
          .from(workshopRoadTests59)
          .where(
            and(
              eq(workshopRoadTests59.businessEntityId, input.businessEntityId),
              eq(workshopRoadTests59.jobCardId, job.id)
            )
          )
          .orderBy(
            desc(workshopRoadTests59.createdAt),
            desc(workshopRoadTests59.id)
          );
        const minimumMileage = Math.max(
          checkin.mileage,
          ...roads.map(road => road.endMileage ?? road.startMileage)
        );
        if (
          input.mileage < minimumMileage ||
          roads.some(road =>
            ["authorized", "in_progress"].includes(road.status)
          ) ||
          roads[0]?.incident
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "أكمل اختبار الطريق دون ملاحظات سلامة وتأكد من عدم تراجع العداد",
          });
        const r = await tx.insert(workshopDeliveries59).values({
          businessEntityId: input.businessEntityId,
          jobCardId: job.id,
          customerId: job.customerId,
          invoiceStatus: "paid",
          paymentStatus: "paid",
          customerAcknowledgement: true,
          mileage: input.mileage,
          documentsJson: input.documentsJson,
          deliveredBy: ctx.user.id,
          deliveredAt: new Date(),
          idempotencyKey: input.idempotencyKey,
        });
        const update = await tx
          .update(workshopJobCards59)
          .set({ status: "delivered" })
          .where(
            and(
              eq(workshopJobCards59.id, job.id),
              eq(workshopJobCards59.businessEntityId, input.businessEntityId),
              eq(workshopJobCards59.status, "ready")
            )
          );
        if ((update as any)[0]?.affectedRows !== 1)
          throw new TRPCError({
            code: "CONFLICT",
            message: "حالة الأمر تغيرت أثناء التسليم",
          });
        await audit(
          tx,
          ctx.user,
          input.businessEntityId,
          "WorkshopJobDelivered",
          "workshop_delivery_59",
          String(idOf(r)),
          { jobCardId: job.id, invoiceId: invoice.id }
        );
        return { id: idOf(r), jobCardId: job.id, status: "delivered" as const };
      });
    }),
  createInspection: guarded("inspect")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        vehicleId: z.number().int().positive(),
        templateCode: z.string().trim().min(2).max(80),
        findingsJson: z.string().min(2).max(30000),
        mediaRefsJson: z.string().max(16000).optional(),
        summary: z.string().max(4000).optional(),
        status: z
          .enum(["draft", "completed", "customer_shared", "superseded"])
          .default("draft"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const job = await jobIn(db, input.businessEntityId, input.jobCardId);
      if (job.vehicleId !== input.vehicleId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "المركبة لا تطابق أمر العمل",
        });
      const r = await db.insert(workshopInspections59).values({
        ...input,
        inspectorUserId: ctx.user.id,
        completedAt: input.status === "completed" ? new Date() : undefined,
      });
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopInspectionCreated",
        "workshop_inspection_59",
        String(idOf(r))
      );
      return { id: idOf(r), status: input.status };
    }),
  recordDtc: guarded("inspect")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        inspectionId: z.number().int().positive().optional(),
        code: z.string().trim().min(2).max(40),
        system: z.string().max(80).optional(),
        description: z.string().trim().min(2).max(2000),
        severity: z
          .enum(["info", "low", "medium", "high", "critical"])
          .default("medium"),
        rootCause: z.string().max(2000).optional(),
        recommendation: z.string().max(2000).optional(),
        evidenceJson: z.string().max(12000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      await jobIn(db, input.businessEntityId, input.jobCardId);
      if (input.inspectionId) {
        const [i] = await db
          .select({
            id: workshopInspections59.id,
            jobCardId: workshopInspections59.jobCardId,
          })
          .from(workshopInspections59)
          .where(
            and(
              eq(workshopInspections59.id, input.inspectionId),
              eq(workshopInspections59.businessEntityId, input.businessEntityId)
            )
          )
          .limit(1);
        if (!i || i.jobCardId !== input.jobCardId)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "الفحص خارج نطاق أمر العمل",
          });
      }
      const r = await db.insert(workshopDtc59).values(input);
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopDtcRecorded",
        "workshop_dtc_59",
        String(idOf(r))
      );
      return { id: idOf(r) };
    }),
  requestPart: guarded("parts")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        warehouseId: z.number().int().positive(),
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        lotCode: z.string().max(100).optional(),
        serialNo: z.string().max(120).optional(),
        idempotencyKey: idem,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const replay = await db
        .select()
        .from(workshopPartRequests59)
        .where(
          and(
            eq(workshopPartRequests59.businessEntityId, input.businessEntityId),
            eq(workshopPartRequests59.idempotencyKey, input.idempotencyKey)
          )
        )
        .limit(1);
      if (replay[0]) return replay[0];
      await jobIn(db, input.businessEntityId, input.jobCardId);
      const [w] = await db
        .select({ id: partsWarehouses.id })
        .from(partsWarehouses)
        .where(
          and(
            eq(partsWarehouses.id, input.warehouseId),
            eq(partsWarehouses.businessEntityId, input.businessEntityId),
            eq(partsWarehouses.status, "active")
          )
        )
        .limit(1);
      const [p] = await db
        .select({ id: partsProducts.id })
        .from(partsProducts)
        .where(
          and(
            eq(partsProducts.id, input.productId),
            eq(partsProducts.businessEntityId, input.businessEntityId),
            eq(partsProducts.status, "active")
          )
        )
        .limit(1);
      if (!w || !p)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "المستودع أو المنتج خارج نطاق الكيان",
        });
      const result = await db.transaction(async tx => {
        const balance = await lock(
          tx
            .select()
            .from(partsInventory)
            .where(
              and(
                eq(partsInventory.businessEntityId, input.businessEntityId),
                eq(partsInventory.warehouseId, input.warehouseId),
                eq(partsInventory.productId, input.productId)
              )
            )
            .limit(1)
        );
        if (!balance[0] || balance[0].availableQty < input.quantity)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "الكمية المتاحة غير كافية",
          });
        const r = await tx
          .insert(workshopPartRequests59)
          .values({ ...input, status: "reserved", requestedBy: ctx.user.id });
        const rid = idOf(r);
        const u = await tx
          .update(partsInventory)
          .set({
            availableQty: sql`${partsInventory.availableQty} - ${input.quantity}`,
            reservedQty: sql`${partsInventory.reservedQty} + ${input.quantity}`,
          })
          .where(
            and(
              eq(partsInventory.id, balance[0].id),
              sql`${partsInventory.availableQty} >= ${input.quantity}`
            )
          );
        if ((u as any)?.[0]?.affectedRows === 0)
          throw new TRPCError({
            code: "CONFLICT",
            message: "تغير المخزون أثناء الحجز",
          });
        await tx.insert(partsInventoryMovements).values({
          businessEntityId: input.businessEntityId,
          warehouseId: input.warehouseId,
          productId: input.productId,
          movementType: "reservation",
          quantity: input.quantity,
          sourceType: "workshop_part_request_59",
          sourceId: String(rid),
          idempotencyKey: `workshop-reserve-${input.idempotencyKey}`,
        });
        return rid;
      });
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopPartReserved",
        "workshop_part_request_59",
        String(result)
      );
      const [row] = await db
        .select()
        .from(workshopPartRequests59)
        .where(eq(workshopPartRequests59.id, result))
        .limit(1);
      return row;
    }),
  issuePart: guarded("parts")
    .input(
      scope.extend({
        requestId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        idempotencyKey: idem,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const [movement] = await db
        .select()
        .from(partsInventoryMovements)
        .where(
          and(
            eq(
              partsInventoryMovements.businessEntityId,
              input.businessEntityId
            ),
            eq(partsInventoryMovements.idempotencyKey, input.idempotencyKey)
          )
        )
        .limit(1);
      if (movement)
        return { ok: true, status: "issued" as const, replayed: true };
      const result = await db.transaction(async tx => {
        const rows = await lock(
          tx
            .select()
            .from(workshopPartRequests59)
            .where(
              and(
                eq(workshopPartRequests59.id, input.requestId),
                eq(
                  workshopPartRequests59.businessEntityId,
                  input.businessEntityId
                )
              )
            )
            .limit(1)
        );
        const r = rows[0];
        if (!r || r.status !== "reserved" || r.quantity !== input.quantity)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "الصرف يجب أن يطابق الحجز بالكامل",
          });
        const u = await tx
          .update(workshopPartRequests59)
          .set({ status: "issued" })
          .where(
            and(
              eq(workshopPartRequests59.id, r.id),
              eq(workshopPartRequests59.status, "reserved")
            )
          );
        if ((u as any)?.[0]?.affectedRows === 0)
          throw new TRPCError({ code: "CONFLICT", message: "تغير طلب القطعة" });
        const stockUpdate = await tx
          .update(partsInventory)
          .set({
            reservedQty: sql`${partsInventory.reservedQty} - ${input.quantity}`,
          })
          .where(
            and(
              eq(partsInventory.businessEntityId, input.businessEntityId),
              eq(partsInventory.warehouseId, r.warehouseId),
              eq(partsInventory.productId, r.productId),
              sql`${partsInventory.reservedQty} >= ${input.quantity}`
            )
          );
        if ((stockUpdate as any)[0]?.affectedRows !== 1)
          throw new TRPCError({
            code: "CONFLICT",
            message: "رصيد الحجز غير كاف للصرف",
          });
        const m = await tx.insert(partsInventoryMovements).values({
          businessEntityId: input.businessEntityId,
          warehouseId: r.warehouseId,
          productId: r.productId,
          movementType: "issue",
          quantity: input.quantity,
          sourceType: "workshop_part_request_59",
          sourceId: String(r.id),
          idempotencyKey: input.idempotencyKey,
        });
        return idOf(m);
      });
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopPartIssued",
        "workshop_part_request_59",
        String(input.requestId)
      );
      return {
        ok: true,
        status: "issued" as const,
        replayed: false,
        movementId: result,
      };
    }),
  returnPart: guarded("parts")
    .input(
      scope.extend({
        requestId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        idempotencyKey: idem,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const [movement] = await db
        .select()
        .from(partsInventoryMovements)
        .where(
          and(
            eq(
              partsInventoryMovements.businessEntityId,
              input.businessEntityId
            ),
            eq(partsInventoryMovements.idempotencyKey, input.idempotencyKey)
          )
        )
        .limit(1);
      if (movement)
        return { ok: true, status: "returned" as const, replayed: true };
      const result = await db.transaction(async tx => {
        const rows = await lock(
          tx
            .select()
            .from(workshopPartRequests59)
            .where(
              and(
                eq(workshopPartRequests59.id, input.requestId),
                eq(
                  workshopPartRequests59.businessEntityId,
                  input.businessEntityId
                )
              )
            )
            .limit(1)
        );
        const r = rows[0];
        if (
          !r ||
          !["reserved", "issued"].includes(r.status) ||
          r.quantity !== input.quantity
        )
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "الإرجاع يجب أن يطابق الكمية والحالة",
          });
        const wasReserved = r.status === "reserved";
        await tx
          .update(workshopPartRequests59)
          .set({ status: "returned" })
          .where(
            and(
              eq(workshopPartRequests59.id, r.id),
              inArray(workshopPartRequests59.status, ["reserved", "issued"])
            )
          );
        const stockUpdate = await tx
          .update(partsInventory)
          .set(
            wasReserved
              ? {
                  availableQty: sql`${partsInventory.availableQty} + ${input.quantity}`,
                  reservedQty: sql`${partsInventory.reservedQty} - ${input.quantity}`,
                }
              : {
                  availableQty: sql`${partsInventory.availableQty} + ${input.quantity}`,
                }
          )
          .where(
            and(
              eq(partsInventory.businessEntityId, input.businessEntityId),
              eq(partsInventory.warehouseId, r.warehouseId),
              eq(partsInventory.productId, r.productId),
              wasReserved
                ? sql`${partsInventory.reservedQty} >= ${input.quantity}`
                : sql`1=1`
            )
          );
        if ((stockUpdate as any)[0]?.affectedRows !== 1)
          throw new TRPCError({
            code: "CONFLICT",
            message: "رصيد المخزون لا يطابق عملية الإرجاع",
          });
        const m = await tx.insert(partsInventoryMovements).values({
          businessEntityId: input.businessEntityId,
          warehouseId: r.warehouseId,
          productId: r.productId,
          movementType: wasReserved ? "release" : "return",
          quantity: input.quantity,
          sourceType: "workshop_part_request_59",
          sourceId: String(r.id),
          idempotencyKey: input.idempotencyKey,
        });
        return idOf(m);
      });
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopPartReturned",
        "workshop_part_request_59",
        String(input.requestId)
      );
      return {
        ok: true,
        status: "returned" as const,
        replayed: false,
        movementId: result,
      };
    }),
  recordEstimateConsent: guarded("estimate")
    .input(
      scope.extend({
        estimateId: z.number().int().positive(),
        customerId: z.number().int().positive(),
        decision: z.enum(["approved", "rejected", "change_requested"]),
        version: z.number().int().positive(),
        estimateChecksum: z.string().regex(/^[a-f0-9]{64}$/i),
        reason: z.string().max(2000).optional(),
        channel: z.string().max(40).default("portal"),
        ipHash: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const [e] = await db
        .select()
        .from(workshopEstimates59)
        .where(
          and(
            eq(workshopEstimates59.id, input.estimateId),
            eq(workshopEstimates59.businessEntityId, input.businessEntityId),
            eq(workshopEstimates59.customerId, input.customerId),
            eq(workshopEstimates59.version, input.version)
          )
        )
        .limit(1);
      if (!e || checksum(e) !== input.estimateChecksum)
        throw new TRPCError({
          code: "CONFLICT",
          message: "بصمة التقدير لا تطابق السجل الحالي",
        });
      const r = await db.insert(workshopEstimateConsents59).values(input);
      await db
        .update(workshopEstimates59)
        .set({
          status:
            input.decision === "approved"
              ? "approved"
              : input.decision === "rejected"
                ? "rejected"
                : "partially_approved",
          approvalAt: input.decision === "approved" ? new Date() : undefined,
        })
        .where(
          and(
            eq(workshopEstimates59.id, e.id),
            eq(workshopEstimates59.businessEntityId, input.businessEntityId),
            eq(workshopEstimates59.version, input.version)
          )
        );
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopEstimateConsentRecorded",
        "workshop_estimate_consent_59",
        String(idOf(r)),
        { estimateId: e.id, decision: input.decision }
      );
      return {
        id: idOf(r),
        estimateId: e.id,
        checksum: input.estimateChecksum,
        status: input.decision,
      };
    }),
  authorizeRoadTest: guarded("operate")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        driverUserId: z.number().int().positive(),
        startMileage: z.number().int().nonnegative(),
        routeJson: z.string().max(12000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rootDb = await dbOrThrow();
      return rootDb.transaction(async tx => {
        const db = tx;
        const job = await lockedJobIn(
          db,
          input.businessEntityId,
          input.jobCardId
        );
        if (!["qc", "road_test"].includes(job.status))
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "تفويض الطريق متاح فقط في qc أو road_test",
          });
        await assertWorkshopEntityUser(
          input.driverUserId,
          input.businessEntityId
        );
        const [last] = await db
          .select({ mileage: workshopCheckins59.mileage })
          .from(workshopCheckins59)
          .where(
            and(
              eq(workshopCheckins59.businessEntityId, input.businessEntityId),
              eq(workshopCheckins59.vehicleId, job.vehicleId)
            )
          )
          .orderBy(desc(workshopCheckins59.createdAt))
          .limit(1);
        if (last && input.startMileage < last.mileage)
          throw new TRPCError({
            code: "CONFLICT",
            message: "عداد بداية الاختبار أقل من آخر قراءة",
          });
        const r = await db
          .insert(workshopRoadTests59)
          .values({ ...input, authorizedBy: ctx.user.id });
        await audit(
          db,
          ctx.user,
          input.businessEntityId,
          "WorkshopRoadTestAuthorized",
          "workshop_road_test_59",
          String(idOf(r))
        );
        return { id: idOf(r), status: "authorized" as const };
      });
    }),
  completeRoadTest: guarded("operate")
    .input(
      scope.extend({
        roadTestId: z.number().int().positive(),
        endMileage: z.number().int().nonnegative(),
        findings: z.string().max(3000).optional(),
        evidenceJson: z.string().max(12000).optional(),
        incident: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const result = await db.transaction(async tx => {
        const rows = await lock(
          tx
            .select()
            .from(workshopRoadTests59)
            .where(
              and(
                eq(workshopRoadTests59.id, input.roadTestId),
                eq(workshopRoadTests59.businessEntityId, input.businessEntityId)
              )
            )
            .limit(1)
        );
        const road = rows[0];
        if (!road || road.status === "completed" || road.status === "cancelled")
          throw new TRPCError({
            code: "CONFLICT",
            message: "اختبار الطريق غير قابل للإكمال",
          });
        await lockedJobIn(tx, input.businessEntityId, road.jobCardId);
        if (!isValidWorkshopMileage(road.startMileage, input.endMileage))
          throw new TRPCError({
            code: "CONFLICT",
            message: "عداد نهاية الاختبار لا يمكن أن يتراجع",
          });
        await tx
          .update(workshopRoadTests59)
          .set({
            endMileage: input.endMileage,
            findings: input.findings,
            evidenceJson: input.evidenceJson,
            incident: input.incident,
            status: "completed",
            completedAt: new Date(),
          })
          .where(
            and(
              eq(workshopRoadTests59.id, input.roadTestId),
              sql`${workshopRoadTests59.endMileage} is null`
            )
          );
        return {
          ok: true,
          status: "completed" as const,
          endMileage: input.endMileage,
        };
      });
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopRoadTestCompleted",
        "workshop_road_test_59",
        String(input.roadTestId)
      );
      return result;
    }),
  createWarranty: guarded("operate")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        vehicleId: z.number().int().positive(),
        warrantyType: z.string().trim().min(2).max(80),
        coverageJson: z.string().min(2).max(12000),
        claimNo: z.string().max(100).optional(),
        comebackOfJobCardId: z.number().int().positive().optional(),
        rootCause: z.string().max(2000).optional(),
        responsibility: z.string().max(80).optional(),
        correctiveAction: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await dbOrThrow();
      const job = await jobIn(db, input.businessEntityId, input.jobCardId);
      if (job.vehicleId !== input.vehicleId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "المركبة لا تطابق أمر العمل",
        });
      if (input.comebackOfJobCardId)
        await jobIn(db, input.businessEntityId, input.comebackOfJobCardId);
      const r = await db.insert(workshopWarranties59).values(input);
      await audit(
        db,
        ctx.user,
        input.businessEntityId,
        "WorkshopWarrantyCreated",
        "workshop_warranty_59",
        String(idOf(r))
      );
      return { id: idOf(r) };
    }),
  uploadInspectionMedia: guarded("inspect")
    .input(
      scope.extend({
        jobCardId: z.number().int().positive(),
        fileName: z.string().trim().min(1).max(180),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        dataUrl: z.string().min(100).max(12000000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await dbOrThrow();
      await jobIn(db, input.businessEntityId, input.jobCardId);
      const match = input.dataUrl.match(
        /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
      );
      if (!match || match[1] !== input.contentType)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "صيغة الصورة غير صالحة",
        });
      const bytes = Buffer.from(match[2], "base64");
      if (!bytes.length || bytes.length > 5 * 1024 * 1024)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "حجم الصورة يتجاوز الحد",
        });
      const signatureValid =
        input.contentType === "image/png"
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : input.contentType === "image/jpeg"
            ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            : bytes.subarray(0, 4).toString() === "RIFF" &&
              bytes.subarray(8, 12).toString() === "WEBP";
      if (!signatureValid)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "محتوى الصورة لا يطابق نوعها",
        });
      const extension =
        input.contentType === "image/jpeg"
          ? "jpg"
          : input.contentType === "image/png"
            ? "png"
            : "webp";
      const result = await storagePut(
        `workshop-59/${input.businessEntityId}/${input.jobCardId}/${randomUUID()}.${extension}`,
        bytes,
        input.contentType
      );
      return { ...result, jobCardId: input.jobCardId };
    }),
  dashboard: guarded("read")
    .input(scope)
    .query(async ({ input }) => {
      const db = await dbOrThrow();
      const [jobs, quality] = await Promise.all([
        db
          .select()
          .from(workshopJobCards59)
          .where(
            eq(workshopJobCards59.businessEntityId, input.businessEntityId)
          )
          .orderBy(desc(workshopJobCards59.updatedAt))
          .limit(50),
        db
          .select()
          .from(workshopQuality59)
          .where(eq(workshopQuality59.businessEntityId, input.businessEntityId))
          .orderBy(
            desc(workshopQuality59.createdAt),
            desc(workshopQuality59.id)
          )
          .limit(20),
      ]);
      return {
        jobs,
        checkins: [],
        operations: [],
        quality,
        counts: {
          openJobs: jobs.filter(
            j => !["closed", "delivered"].includes(j.status)
          ).length,
          awaitingApproval: jobs.filter(j => j.status === "awaiting_approval")
            .length,
          inProgress: jobs.filter(j => j.status === "in_progress").length,
          failedQc: quality.filter(
            q => q.result === "failed" || q.result === "rework"
          ).length,
        },
      };
    }),
  performanceReport: guarded("report")
    .input(scope.extend({ from: z.coerce.date(), to: z.coerce.date() }))
    .query(async ({ input }) => {
      if (input.to <= input.from)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "فترة التقرير غير صالحة",
        });
      const db = await dbOrThrow();
      const jobs = await db
        .select()
        .from(workshopJobCards59)
        .where(
          and(
            eq(workshopJobCards59.businessEntityId, input.businessEntityId),
            sql`${workshopJobCards59.createdAt} >= ${input.from}`,
            sql`${workshopJobCards59.createdAt} < ${input.to}`
          )
        );
      const jobIds = jobs.map(job => job.id);
      const estimateIds = jobs
        .map(job => job.estimateId)
        .filter((id): id is number => id !== null);
      const [estimates, operations, partRequests, inventory] =
        await Promise.all([
          estimateIds.length
            ? db
                .select()
                .from(workshopEstimates59)
                .where(
                  and(
                    eq(
                      workshopEstimates59.businessEntityId,
                      input.businessEntityId
                    ),
                    inArray(workshopEstimates59.id, estimateIds)
                  )
                )
            : Promise.resolve([]),
          jobIds.length
            ? db
                .select()
                .from(workshopOperations59)
                .where(
                  and(
                    eq(
                      workshopOperations59.businessEntityId,
                      input.businessEntityId
                    ),
                    inArray(workshopOperations59.jobCardId, jobIds)
                  )
                )
            : Promise.resolve([]),
          jobIds.length
            ? db
                .select()
                .from(workshopPartRequests59)
                .where(
                  and(
                    eq(
                      workshopPartRequests59.businessEntityId,
                      input.businessEntityId
                    ),
                    inArray(workshopPartRequests59.jobCardId, jobIds)
                  )
                )
            : Promise.resolve([]),
          db
            .select()
            .from(partsInventory)
            .where(eq(partsInventory.businessEntityId, input.businessEntityId)),
        ]);
      const revenueMinor = estimates
        .filter(estimate => estimate.status === "approved")
        .reduce((sum, estimate) => sum + estimate.totalMinor, 0);
      const laborCostMinor = operations.reduce(
        (sum, operation) => sum + operation.laborCostMinor,
        0
      );
      const inventoryCost = new Map(
        inventory.map(item => [
          `${item.warehouseId}:${item.productId}`,
          item.averageCostMinor,
        ])
      );
      const partsCostMinor = partRequests
        .filter(request => request.status === "issued")
        .reduce(
          (sum, request) =>
            sum +
            (inventoryCost.get(`${request.warehouseId}:${request.productId}`) ??
              0) *
              request.quantity,
          0
        );
      const completed = jobs.filter(job =>
        ["delivered", "closed"].includes(job.status)
      );
      const comeback = jobs.filter(
        job => job.status === "warranty_repeat"
      ).length;
      const averageCycleHours = completed.length
        ? Math.round(
            completed.reduce(
              (sum, job) =>
                sum +
                (job.updatedAt.getTime() - job.createdAt.getTime()) / 3600000,
              0
            ) / completed.length
          )
        : 0;
      const technicianIds = Array.from(
        new Set(
          operations
            .map(operation => operation.technicianUserId)
            .filter((id): id is number => id !== null)
        )
      );
      const technicianPerformance = technicianIds.map(technicianId => {
        const rows = operations.filter(
          operation => operation.technicianUserId === technicianId
        );
        return {
          technicianId,
          operations: rows.length,
          completed: rows.filter(row => row.status === "completed").length,
          rework: rows.filter(row => row.status === "rework").length,
          actualHours: rows.reduce(
            (sum, row) => sum + Number(row.actualHours ?? 0),
            0
          ),
          laborCostMinor: rows.reduce(
            (sum, row) => sum + row.laborCostMinor,
            0
          ),
        };
      });
      const byStatus = Array.from(new Set(jobs.map(job => job.status))).map(
        status => ({
          status,
          count: jobs.filter(job => job.status === status).length,
        })
      );
      const reworkJobs = new Set(
        operations
          .filter(operation => operation.status === "rework")
          .map(operation => operation.jobCardId)
      );
      const firstTimeFix = completed.filter(
        job => !reworkJobs.has(job.id)
      ).length;
      return {
        summary: {
          revenueMinor,
          laborCostMinor,
          partsCostMinor,
          grossMarginMinor: revenueMinor - laborCostMinor - partsCostMinor,
          completedJobs: completed.length,
          openJobs: jobs.filter(
            job => !["closed", "delivered"].includes(job.status)
          ).length,
          averageCycleHours,
          comebackRateBps: jobs.length
            ? Math.round((comeback / jobs.length) * 10000)
            : 0,
          firstTimeFixRateBps: completed.length
            ? Math.round((firstTimeFix / completed.length) * 10000)
            : 0,
        },
        byStatus,
        technicianPerformance,
      };
    }),
});
