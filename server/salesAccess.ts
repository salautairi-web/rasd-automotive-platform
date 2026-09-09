import { TRPCError } from "@trpc/server";
import { assertEntityAccess, assertSameEntity } from "./entityAccess";

export async function assertSalesRead(userId: number, userRole: string, businessEntityId: number) {
  return assertEntityAccess(userId, userRole, businessEntityId, "sales.read");
}

export async function assertSalesManage(userId: number, userRole: string, businessEntityId: number) {
  return assertEntityAccess(userId, userRole, businessEntityId, "sales.manage");
}

export async function assertSalesPayment(userId: number, userRole: string, businessEntityId: number) {
  return assertEntityAccess(userId, userRole, businessEntityId, "sales.payment");
}

export function assertSalesInvoiceTotal(invoiceTotalMinor: number, paidMinor: number, paymentMinor: number) {
  if (invoiceTotalMinor < 0 || paidMinor < 0 || paymentMinor <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "قيم الفاتورة والدفع غير صالحة" });
  }
  if (paidMinor + paymentMinor > invoiceTotalMinor) {
    throw new TRPCError({ code: "CONFLICT", message: "قيمة الدفع تتجاوز الرصيد المستحق للفاتورة" });
  }
  return true;
}

export function assertSalesRelation(leftEntityId: number | null | undefined, rightEntityId: number | null | undefined) {
  return assertSameEntity(leftEntityId, rightEntityId);
}
