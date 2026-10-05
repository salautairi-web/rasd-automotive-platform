import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { auditAuditlog50, iamSecurityEvents, iamSessionAudit, rentalContracts, rentalDeposits, rentalInvoices, rentalReservations } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { hasEntityMembership } from "./iam";

const entityInput = z.object({ businessEntityId: z.number().int().positive() });
async function guard(user: { id: number; role: string }, businessEntityId: number) {
  if (user.role !== "admin" && !(await hasEntityMembership(user.id, businessEntityId))) throw new TRPCError({ code: "FORBIDDEN", message: "عضوية IAM نشطة في كيان التأجير مطلوبة" });
}

export const rentalSecurityRouter = router({
  notifications: protectedProcedure.input(entityInput).query(async ({ ctx, input }) => {
    await guard(ctx.user, input.businessEntityId);
    const db = await getDb();
    if (!db) return { items: [], unreadCount: 0, generatedAt: new Date() };
    const now = new Date();
    const horizon = new Date(now.getTime() + 7 * 86400000);
    const [reservations, contracts, deposits, invoices] = await Promise.all([
      db.select({ id: rentalReservations.id, reference: rentalReservations.reservationNo, startsAt: rentalReservations.startsAt }).from(rentalReservations).where(and(eq(rentalReservations.businessEntityId, input.businessEntityId), sql`${rentalReservations.status} in ('pending','confirmed')`, gte(rentalReservations.startsAt, now), lte(rentalReservations.startsAt, horizon))).orderBy(rentalReservations.startsAt).limit(20),
      db.select({ id: rentalContracts.id, reference: rentalContracts.contractNo, endsAt: rentalContracts.endsAt }).from(rentalContracts).where(and(eq(rentalContracts.businessEntityId, input.businessEntityId), sql`${rentalContracts.status} in ('active','extended')`, lte(rentalContracts.endsAt, horizon))).orderBy(rentalContracts.endsAt).limit(20),
      db.select({ id: rentalDeposits.id, reference: rentalDeposits.depositNo, amountMinor: rentalDeposits.amountMinor, deductedMinor: rentalDeposits.deductedMinor, refundedMinor: rentalDeposits.refundedMinor }).from(rentalDeposits).where(and(eq(rentalDeposits.businessEntityId, input.businessEntityId), sql`${rentalDeposits.status} in ('pending','held','partially_deducted')`)).orderBy(desc(rentalDeposits.id)).limit(20),
      db.select({ id: rentalInvoices.id, reference: rentalInvoices.invoiceNo, totalMinor: rentalInvoices.totalMinor, paidMinor: rentalInvoices.paidMinor }).from(rentalInvoices).where(and(eq(rentalInvoices.businessEntityId, input.businessEntityId), sql`${rentalInvoices.status} in ('posted','partially_paid')`, sql`${rentalInvoices.totalMinor} > ${rentalInvoices.paidMinor}`)).orderBy(desc(rentalInvoices.id)).limit(20),
    ]);
    const items = [
      ...reservations.map(item => ({ id: `reservation-${item.id}`, type: "reservation", severity: "normal", title: "حجز قادم يحتاج المتابعة", body: `${item.reference} يبدأ ${item.startsAt.toLocaleString("ar-OM")}`, reference: item.reference, createdAt: item.startsAt })),
      ...contracts.map(item => ({ id: `contract-${item.id}`, type: "contract", severity: "high", title: "عقد يقترب من موعد الانتهاء", body: `${item.reference} ينتهي ${item.endsAt.toLocaleString("ar-OM")}`, reference: item.reference, createdAt: item.endsAt })),
      ...deposits.map(item => ({ id: `deposit-${item.id}`, type: "deposit", severity: "high", title: "وديعة تحتاج تسوية أو متابعة", body: `${item.reference} · الرصيد ${Number(item.amountMinor) - Number(item.deductedMinor) - Number(item.refundedMinor)} وحدة صغرى`, reference: item.reference, createdAt: now })),
      ...invoices.map(item => ({ id: `invoice-${item.id}`, type: "invoice", severity: "critical", title: "فاتورة متأخرة أو غير مكتملة السداد", body: `${item.reference} · المتبقي ${Number(item.totalMinor) - Number(item.paidMinor)} وحدة صغرى`, reference: item.reference, createdAt: now })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 60);
    return { items, unreadCount: items.length, generatedAt: now };
  }),
  auditTrail: protectedProcedure.input(entityInput).query(async ({ ctx, input }) => {
    await guard(ctx.user, input.businessEntityId);
    const db = await getDb();
    if (!db) return [];
    const ownOnly = ctx.user.role !== "admin";
    const [security, finance, sessions] = await Promise.all([
      db.select({ id: iamSecurityEvents.id, userId: iamSecurityEvents.userId, action: iamSecurityEvents.eventType, outcome: iamSecurityEvents.outcome, resourceType: iamSecurityEvents.resourceType, resourceId: iamSecurityEvents.resourceId, details: iamSecurityEvents.detailsJson, createdAt: iamSecurityEvents.createdAt }).from(iamSecurityEvents).where(and(eq(iamSecurityEvents.businessEntityId, input.businessEntityId), ownOnly ? eq(iamSecurityEvents.userId, ctx.user.id) : sql`1=1`)).orderBy(desc(iamSecurityEvents.createdAt)).limit(80),
      db.select({ id: auditAuditlog50.id, userId: auditAuditlog50.userId, action: auditAuditlog50.action, outcome: sql<"success">`'success'`, resourceType: auditAuditlog50.resourceType, resourceId: auditAuditlog50.resourceId, details: auditAuditlog50.reason, createdAt: auditAuditlog50.createdAt }).from(auditAuditlog50).where(and(eq(auditAuditlog50.businessEntityId, input.businessEntityId), ownOnly ? eq(auditAuditlog50.userId, ctx.user.id) : sql`1=1`)).orderBy(desc(auditAuditlog50.createdAt)).limit(80),
      db.select({ id: iamSessionAudit.id, userId: iamSessionAudit.userId, action: iamSessionAudit.action, outcome: iamSessionAudit.outcome, resourceType: sql<string>`'session'`, resourceId: sql<string>`coalesce(cast(${iamSessionAudit.sessionId} as char), '')`, details: iamSessionAudit.detailsJson, createdAt: iamSessionAudit.createdAt }).from(iamSessionAudit).where(ownOnly ? eq(iamSessionAudit.userId, ctx.user.id) : sql`1=1`).orderBy(desc(iamSessionAudit.createdAt)).limit(80),
    ]);
    return [...security, ...finance, ...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 120);
  }),
});
