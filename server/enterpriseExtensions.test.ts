import { describe, expect, it } from "vitest";
import { canExecuteInterEntityAssetTransfer, canSendMarketing, componentDepreciationMonthly, inventoryAdjustmentAllowed, loyaltyBalanceAfter, sourcingScore, transferConservesQuantity } from "../shared/enterpriseExtensions";

describe("Steps 37-40 enterprise controls", () => {
  it("keeps loyalty balances non-negative and deterministic", () => { expect(loyaltyBalanceAfter(100, "earn", 25)).toBe(125); expect(() => loyaltyBalanceAfter(10, "redeem", 20)).toThrow("insufficient_points"); });
  it("blocks marketing after withdrawal or consent expiry", () => { const now = new Date("2026-01-02T00:00:00Z"); expect(canSendMarketing("withdrawn", undefined, now)).toBe(false); expect(canSendMarketing("granted", new Date("2026-01-01T00:00:00Z"), now)).toBe(false); });
  it("calculates transparent weighted sourcing scores", () => { expect(sourcingScore({ technicalBps: 8000, commercialBps: 9000, riskBps: 2000 })).toBe(8400); });
  it("enforces evidence and maker-checker for stock adjustments", () => { expect(inventoryAdjustmentAllowed(1, 1, 2, true)).toBe(false); expect(inventoryAdjustmentAllowed(1, 2, 2, true)).toBe(true); });
  it("conserves quantity across warehouse transfers", () => { expect(transferConservesQuantity(10, 9, 1)).toBe(true); expect(transferConservesQuantity(10, 8, 1)).toBe(false); });
  it("calculates component-level monthly depreciation", () => { expect(componentDepreciationMonthly(120000, 0, 12)).toBe(10000); expect(() => componentDepreciationMonthly(100, 120, 12)).toThrow(); });
  it("requires an explicit target entity for inter-entity asset transfers", () => { expect(canExecuteInterEntityAssetTransfer(1, 2, "inter_entity_transfer")).toBe(true); expect(canExecuteInterEntityAssetTransfer(1, undefined, "inter_entity_transfer")).toBe(false); });
});
