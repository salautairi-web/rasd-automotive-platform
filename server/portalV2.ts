import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { businessEntities, customers, paymentInvoices47, portalDocuments, portalEntityRelationships, portalOrders, portalPayments, portalReservations, portalUsers, portalV2Messages, portalV2Notifications, portalV2Tickets, portalAudit } from "../drizzle/schema";
import { getDb } from "./db";
import { router } from "./_core/trpc";
import { customerPortalProcedure } from "./customerPortalProcedure";
import { canReplyToPortalTicket } from "../shared/customerPortal";

const portalScopeInput = z.object({ businessEntityId: z.number().int().positive(), relationshipId: z.number().int().positive() });
const ticketScopeInput = portalScopeInput.extend({ ticketId: z.number().int().positive() });

async function portalUser(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number) {
  const [existing] = await db.select().from(portalUsers).where(eq(portalUsers.userId, userId)).limit(1);
  if (existing) { if (existing.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "حساب البوابة غير نشط" }); return existing; }
  const inserted = await db.insert(portalUsers).values({ userId, userType: "customer", status: "active", verifiedAt: new Date() });
  const [created] = await db.select().from(portalUsers).where(eq(portalUsers.id, Number(inserted[0].insertId))).limit(1);
  if (!created) throw new Error("portal_user_creation_failed");
  return created;
}
export async function scopedRelationship(userId: number, businessEntityId: number, relationshipId?: number) {
  const db = await getDb(); if (!db) throw new Error("database_unavailable");
  const pu = await portalUser(db, userId);
  const filters = [eq(portalEntityRelationships.portalUserId, pu.id), eq(portalEntityRelationships.businessEntityId, businessEntityId), eq(portalEntityRelationships.status, "active"), eq(businessEntities.status, "active")];
  if (relationshipId) filters.push(eq(portalEntityRelationships.id, relationshipId));
  const [relationship] = await db.select({ relationship: portalEntityRelationships, entityName: businessEntities.nameAr, entityType: businessEntities.entityType }).from(portalEntityRelationships).innerJoin(businessEntities, eq(businessEntities.id, portalEntityRelationships.businessEntityId)).where(and(...filters)).limit(1);
  if (!relationship) throw new TRPCError({ code: "FORBIDDEN", message: "لا توجد علاقة بوابة فعالة لهذا الكيان" });
  return { db, pu, relationship: relationship.relationship, entityName: relationship.entityName, entityType: relationship.entityType };
}
function auditValues(input: { portalUserId: number; businessEntityId: number; relationshipId: number; action: string; resourceType: string; resourceId?: string; outcome: "success" | "failure" | "denied" }) { return { ...input, correlationId: `portal-${nanoid(12)}` }; }

export const portalV2Router = router({
  ticketThread: customerPortalProcedure.input(ticketScopeInput).query(async ({ ctx, input }) => {
    const { db, pu, relationship } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId);
    const [ticket] = await db.select().from(portalV2Tickets).where(and(eq(portalV2Tickets.id, input.ticketId), eq(portalV2Tickets.portalUserId, pu.id), eq(portalV2Tickets.businessEntityId, input.businessEntityId), eq(portalV2Tickets.relationshipId, relationship.id))).limit(1);
    if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "التذكرة غير متاحة ضمن العلاقة الحالية" });
    const messages = await db.select().from(portalV2Messages).where(and(eq(portalV2Messages.ticketId, ticket.id), eq(portalV2Messages.portalUserId, pu.id), eq(portalV2Messages.businessEntityId, input.businessEntityId), eq(portalV2Messages.relationshipId, relationship.id))).orderBy(asc(portalV2Messages.createdAt), asc(portalV2Messages.id)).limit(200);
    return { ticket, messages };
  }),
  replyToTicket: customerPortalProcedure.input(ticketScopeInput.extend({ body: z.string().trim().min(2).max(5000) })).mutation(async ({ ctx, input }) => {
    const { db, pu, relationship } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId);
    await db.transaction(async tx => {
      const [ticket] = await tx.select().from(portalV2Tickets).where(and(eq(portalV2Tickets.id, input.ticketId), eq(portalV2Tickets.portalUserId, pu.id), eq(portalV2Tickets.businessEntityId, input.businessEntityId), eq(portalV2Tickets.relationshipId, relationship.id))).limit(1).for("update");
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "التذكرة غير متاحة ضمن العلاقة الحالية" });
      if (!canReplyToPortalTicket(ticket.status)) throw new TRPCError({ code: "CONFLICT", message: "التذكرة مغلقة أو محلولة؛ يرجى إنشاء طلب دعم جديد" });
      await tx.insert(portalV2Messages).values({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, ticketId: ticket.id, senderType: "portal_user", body: input.body });
      await tx.insert(portalAudit).values(auditValues({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, action: "ticket.reply", resourceType: "ticket", resourceId: ticket.ticketNo, outcome: "success" }));
    });
    return { sent: true as const };
  }),
  markNotificationRead: customerPortalProcedure.input(portalScopeInput.extend({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, pu } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId);
    const filters = and(eq(portalV2Notifications.id, input.notificationId), eq(portalV2Notifications.portalUserId, pu.id), eq(portalV2Notifications.businessEntityId, input.businessEntityId));
    const [notification] = await db.select().from(portalV2Notifications).where(filters).limit(1);
    if (!notification) throw new TRPCError({ code: "NOT_FOUND", message: "الإشعار غير متاح ضمن الكيان الحالي" });
    if (!notification.readAt) await db.update(portalV2Notifications).set({ readAt: new Date() }).where(filters);
    return { read: true as const };
  }),
  account: customerPortalProcedure.input(z.object({ cacheIdentity: z.string().max(100) }).optional()).query(async ({ ctx }) => { const db = await getDb(); if (!db) return { portalUser: null, relationships: [] }; const pu = await portalUser(db, ctx.portalIdentity.id); const relationships = await db.select({ id: portalEntityRelationships.id, businessEntityId: portalEntityRelationships.businessEntityId, relationshipType: portalEntityRelationships.relationshipType, status: portalEntityRelationships.status, permissionsJson: portalEntityRelationships.permissionsJson, entityName: businessEntities.nameAr, entityType: businessEntities.entityType }).from(portalEntityRelationships).innerJoin(businessEntities, eq(businessEntities.id, portalEntityRelationships.businessEntityId)).where(and(eq(portalEntityRelationships.portalUserId, pu.id), eq(portalEntityRelationships.status, "active"), eq(businessEntities.status, "active"))); return { portalUser: pu, relationships }; }),
  selectEntity: customerPortalProcedure.input(z.object({ businessEntityId: z.number().int().positive(), relationshipId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const scoped = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId); await scoped.db.insert(portalAudit).values(auditValues({ portalUserId: scoped.pu.id, businessEntityId: input.businessEntityId, relationshipId: input.relationshipId, action: "entity.select", resourceType: "relationship", resourceId: String(input.relationshipId), outcome: "success" })); return { selected: true as const, businessEntityId: input.businessEntityId, relationshipId: input.relationshipId, entityName: scoped.entityName }; }),
  dashboard: customerPortalProcedure.input(z.object({ businessEntityId: z.number().int().positive(), relationshipId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { db, pu, relationship, entityName, entityType } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId);
    const orders = await db.select().from(portalOrders).where(and(eq(portalOrders.portalUserId, pu.id), eq(portalOrders.businessEntityId, input.businessEntityId), eq(portalOrders.relationshipId, relationship.id))).orderBy(desc(portalOrders.createdAt)).limit(10);
    const reservations = await db.select().from(portalReservations).where(and(eq(portalReservations.portalUserId, pu.id), eq(portalReservations.businessEntityId, input.businessEntityId), eq(portalReservations.relationshipId, relationship.id))).orderBy(desc(portalReservations.createdAt)).limit(10);
    const payments = await db.select().from(portalPayments).where(and(eq(portalPayments.portalUserId, pu.id), eq(portalPayments.businessEntityId, input.businessEntityId), eq(portalPayments.relationshipId, relationship.id))).orderBy(desc(portalPayments.createdAt)).limit(10);
    const tickets = await db.select().from(portalV2Tickets).where(and(eq(portalV2Tickets.portalUserId, pu.id), eq(portalV2Tickets.businessEntityId, input.businessEntityId), eq(portalV2Tickets.relationshipId, relationship.id))).orderBy(desc(portalV2Tickets.createdAt)).limit(10);
    const notifications = await db.select().from(portalV2Notifications).where(and(eq(portalV2Notifications.portalUserId, pu.id), eq(portalV2Notifications.businessEntityId, input.businessEntityId))).orderBy(desc(portalV2Notifications.createdAt)).limit(10);
    const [customer] = relationship.sourceProfileId ? await db.select({ id: customers.id, customerNo: customers.customerNo, nameAr: customers.nameAr, nameEn: customers.nameEn, email: customers.email, phone: customers.phone, status: customers.status, createdAt: customers.createdAt }).from(customers).where(and(eq(customers.id, relationship.sourceProfileId), eq(customers.businessEntityId, input.businessEntityId))).limit(1) : [];
    const documents = await db.select({ id: portalDocuments.id, name: portalDocuments.name, status: portalDocuments.status, createdAt: portalDocuments.createdAt }).from(portalDocuments).where(and(eq(portalDocuments.portalUserId, pu.id), eq(portalDocuments.businessEntityId, input.businessEntityId), eq(portalDocuments.relationshipId, relationship.id), eq(portalDocuments.status, "available"))).orderBy(desc(portalDocuments.createdAt)).limit(50);
    const invoices = customer ? await db.select({ id: paymentInvoices47.id, invoiceNo: paymentInvoices47.invoiceNo, amountMinor: paymentInvoices47.amountMinor, paidAmountMinor: paymentInvoices47.paidAmountMinor, currency: paymentInvoices47.currency, dueAt: paymentInvoices47.dueAt, status: paymentInvoices47.status, createdAt: paymentInvoices47.createdAt }).from(paymentInvoices47).where(and(eq(paymentInvoices47.businessEntityId, input.businessEntityId), eq(paymentInvoices47.customerRef, customer.customerNo))).orderBy(desc(paymentInvoices47.createdAt)).limit(50) : [];
    return { entityName, entityType, relationship, profile: customer ?? null, invoices, orders, reservations, payments, tickets, documents, notifications };
  }),
  createOrder: customerPortalProcedure.input(z.object({ businessEntityId: z.number().int().positive(), relationshipId: z.number().int().positive(), orderType: z.string().min(2).max(80), summary: z.record(z.string(), z.unknown()), idempotencyKey: z.string().min(8).max(180) })).mutation(async ({ ctx, input }) => { const { db, pu, relationship } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId); const [replay] = await db.select({ id: portalOrders.id, status: portalOrders.status }).from(portalOrders).where(and(eq(portalOrders.businessEntityId, input.businessEntityId), eq(portalOrders.idempotencyKey, input.idempotencyKey), eq(portalOrders.portalUserId, pu.id), eq(portalOrders.relationshipId, relationship.id))).limit(1); if (replay) return { orderId: replay.id, status: replay.status, replay: true as const }; const result = await db.insert(portalOrders).values({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, orderType: input.orderType, idempotencyKey: input.idempotencyKey, summaryJson: JSON.stringify(input.summary), status: "submitted" }); return { orderId: Number(result[0].insertId), status: "submitted" as const, replay: false as const }; }),
  createReservation: customerPortalProcedure.input(z.object({ businessEntityId: z.number().int().positive(), relationshipId: z.number().int().positive(), reservationType: z.string().min(2).max(80), details: z.record(z.string(), z.unknown()), idempotencyKey: z.string().min(8).max(180) })).mutation(async ({ ctx, input }) => { const { db, pu, relationship } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId); const [replay] = await db.select({ id: portalReservations.id, status: portalReservations.status }).from(portalReservations).where(and(eq(portalReservations.businessEntityId, input.businessEntityId), eq(portalReservations.idempotencyKey, input.idempotencyKey), eq(portalReservations.portalUserId, pu.id), eq(portalReservations.relationshipId, relationship.id))).limit(1); if (replay) return { reservationId: replay.id, status: replay.status, replay: true as const }; const result = await db.insert(portalReservations).values({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, reservationType: input.reservationType, idempotencyKey: input.idempotencyKey, detailsJson: JSON.stringify(input.details), status: "requested" }); return { reservationId: Number(result[0].insertId), status: "requested" as const, replay: false as const }; }),
  createPayment: customerPortalProcedure.input(z.object({ businessEntityId: z.number().int().positive(), relationshipId: z.number().int().positive(), sourceInvoiceId: z.number().int().positive().optional(), amountMinor: z.number().int().positive(), currency: z.string().length(3), idempotencyKey: z.string().min(8).max(180) })).mutation(async ({ ctx, input }) => { const { db, pu, relationship } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId); const [replay] = await db.select({ id: portalPayments.id, status: portalPayments.status }).from(portalPayments).where(and(eq(portalPayments.businessEntityId, input.businessEntityId), eq(portalPayments.idempotencyKey, input.idempotencyKey), eq(portalPayments.portalUserId, pu.id), eq(portalPayments.relationshipId, relationship.id))).limit(1); if (replay) return { paymentId: replay.id, status: replay.status, replay: true as const }; const result = await db.insert(portalPayments).values({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, sourceInvoiceId: input.sourceInvoiceId, amountMinor: input.amountMinor, currency: input.currency, idempotencyKey: input.idempotencyKey, status: "requested" }); return { paymentId: Number(result[0].insertId), status: "requested" as const, replay: false as const }; }),
  createTicket: customerPortalProcedure.input(portalScopeInput.extend({ category: z.string().trim().min(2).max(80), subject: z.string().trim().min(3).max(220), priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"), message: z.string().trim().min(2).max(5000) })).mutation(async ({ ctx, input }) => {
    const { db, pu, relationship } = await scopedRelationship(ctx.portalIdentity.id, input.businessEntityId, input.relationshipId);
    const ticketNo = `PTK-${nanoid(9).toUpperCase()}`;
    const ticketId = await db.transaction(async tx => {
      const result = await tx.insert(portalV2Tickets).values({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, ticketNo, category: input.category, subject: input.subject, priority: input.priority, status: "open" });
      const createdId = Number(result[0].insertId);
      await tx.insert(portalV2Messages).values({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, ticketId: createdId, body: input.message, senderType: "portal_user" });
      await tx.insert(portalAudit).values(auditValues({ portalUserId: pu.id, businessEntityId: input.businessEntityId, relationshipId: relationship.id, action: "ticket.create", resourceType: "ticket", resourceId: ticketNo, outcome: "success" }));
      return createdId;
    });
    return { ticketId, ticketNo };
  }),
});
