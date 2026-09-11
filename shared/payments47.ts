export type PaymentIntentStatus = "created" | "requires_action" | "authorized" | "captured" | "failed" | "cancelled" | "expired" | "partially_refunded" | "refunded" | "chargeback";

const allowed: Record<PaymentIntentStatus, PaymentIntentStatus[]> = { created: ["requires_action", "authorized", "failed", "cancelled", "expired"], requires_action: ["authorized", "failed", "cancelled", "expired"], authorized: ["captured", "failed", "cancelled"], captured: ["partially_refunded", "refunded", "chargeback"], failed: [], cancelled: [], expired: [], partially_refunded: ["refunded", "chargeback"], refunded: [], chargeback: [] };
export function canTransitionPayment(from: PaymentIntentStatus, to: PaymentIntentStatus) { return allowed[from]?.includes(to) ?? false; }
export function remainingInvoiceAmount(amountMinor: number, paidAmountMinor: number) { return Math.max(0, amountMinor - paidAmountMinor); }
export function canRefund(capturedAmountMinor: number, alreadyRefundedMinor: number, requestedMinor: number) { return requestedMinor > 0 && requestedMinor <= Math.max(0, capturedAmountMinor - alreadyRefundedMinor); }
export function settlementNet(grossAmountMinor: number, feeAmountMinor: number) { return grossAmountMinor - feeAmountMinor; }
export function maskGatewayPayload(payload: unknown) { return JSON.stringify({ received: true, keys: payload && typeof payload === "object" ? Object.keys(payload as object).slice(0, 40) : [] }); }
