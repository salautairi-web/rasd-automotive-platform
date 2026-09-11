import { describe, expect, it } from "vitest";
import { canRefund, canTransitionPayment, maskGatewayPayload, remainingInvoiceAmount, settlementNet } from "../shared/payments47";

describe("payments 47", () => {
  it("guards payment lifecycle transitions", () => {
    expect(canTransitionPayment("created", "authorized")).toBe(true);
    expect(canTransitionPayment("refunded", "captured")).toBe(false);
  });
  it("keeps invoice balance non-negative", () => {
    expect(remainingInvoiceAmount(1000, 400)).toBe(600);
    expect(remainingInvoiceAmount(1000, 1200)).toBe(0);
  });
  it("prevents refunds over captured balance", () => {
    expect(canRefund(1000, 200, 800)).toBe(true);
    expect(canRefund(1000, 200, 801)).toBe(false);
  });
  it("calculates settlement net after fees", () => {
    expect(settlementNet(1000, 25)).toBe(975);
  });
  it("redacts gateway payload values", () => {
    expect(maskGatewayPayload({ cardNumber: "4111", amount: 10 })).toContain("cardNumber");
    expect(maskGatewayPayload({ cardNumber: "4111", amount: 10 })).not.toContain("4111");
  });
});
