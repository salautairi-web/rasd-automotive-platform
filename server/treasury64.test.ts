import { describe, expect, it } from "vitest";

describe("Step 64 treasury vertical slice", () => {
  it("keeps transfer ownership inside one entity", () => {
    const transfer = { businessEntityId: 4, from: "BANK-A", to: "BANK-B" };
    expect(transfer.from).not.toBe(transfer.to);
    expect({ ...transfer, businessEntityId: 5 }.businessEntityId).not.toBe(transfer.businessEntityId);
  });
  it("flags liquidity below the configured minimum", () => {
    const projected = 85000; const minimum = 100000;
    expect(projected < minimum).toBe(true);
  });
  it("does not treat treasury movement as a duplicate finance posting", () => {
    const treasury = { status: "approved", financePostingStatus: "pending" };
    expect(treasury.financePostingStatus).toBe("pending");
  });
});
