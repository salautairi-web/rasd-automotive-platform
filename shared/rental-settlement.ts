import { TRPCError } from "@trpc/server";

export function calculateRentalPayment(totalMinor: number, paidMinor: number, paymentMinor: number) {
  if (!Number.isInteger(totalMinor) || !Number.isInteger(paidMinor) || !Number.isInteger(paymentMinor)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "قيم الفاتورة والدفع يجب أن تكون أعدادًا صحيحة" });
  }
  if (totalMinor <= 0 || paidMinor < 0 || paymentMinor <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "قيم الفاتورة والدفع غير صالحة" });
  }
  if (paidMinor > totalMinor) {
    throw new TRPCError({ code: "CONFLICT", message: "الرصيد المدفوع يتجاوز إجمالي الفاتورة" });
  }
  const outstandingMinor = totalMinor - paidMinor;
  if (paymentMinor > outstandingMinor) {
    throw new TRPCError({ code: "CONFLICT", message: "قيمة الدفعة تتجاوز الرصيد المستحق" });
  }
  const nextPaidMinor = paidMinor + paymentMinor;
  return {
    outstandingMinor,
    nextPaidMinor,
    status: nextPaidMinor === totalMinor ? ("paid" as const) : ("partially_paid" as const),
  };
}
