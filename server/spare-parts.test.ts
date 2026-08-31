import { describe, expect, it } from "vitest";
import { canReserveStock, requiresMarginApproval, stockAfterMovement } from "../shared/spare-parts";

describe("Spare Parts inventory invariants", () => {
  it("prevents reservations above entity-scoped availability", () => {
    expect(canReserveStock(5, 3)).toBe(true);
    expect(canReserveStock(2, 3)).toBe(false);
  });
  it("prevents negative stock", () => {
    expect(stockAfterMovement(5, -3)).toBe(2);
    expect(() => stockAfterMovement(2, -3)).toThrow("Negative stock");
  });
  it("requires approval below the configured minimum margin", () => {
    expect(requiresMarginApproval(80, 100, 1500)).toEqual({ marginBps: 2000, requiresApproval: false });
    expect(requiresMarginApproval(95, 100, 1500).requiresApproval).toBe(true);
  });
});
