import { describe, expect, it } from "vitest";
import { closingForecast, entityScoped, isMakerCheckerValid, reconciliationDifference, shouldFlagRisk } from "../shared/treasury";

describe("treasury foundations", () => {
  it("enforces maker-checker and approval limit", () => {
    expect(isMakerCheckerValid(10, 11, "pending_approval", 1000, 1000)).toBe(true);
    expect(isMakerCheckerValid(10, 10, "pending_approval", 1000, 1000)).toBe(false);
    expect(isMakerCheckerValid(10, 11, "pending_approval", 1001, 1000)).toBe(false);
  });
  it("calculates forecast and reconciliation deterministically", () => {
    expect(closingForecast(10000, 5000, 3000, 500, 1000)).toBe(10500);
    expect(reconciliationDifference(10000, 9850)).toBe(-150);
  });
  it("flags risk signals without inventing transactions", () => {
    expect(shouldFlagRisk({ amountMinor: 100000, isRoundAmount: true })).toBe(true);
    expect(shouldFlagRisk({ amountMinor: 100, repeatedCount: 1 })).toBe(false);
    expect(shouldFlagRisk({ amountMinor: 100, beneficiaryChanged: true })).toBe(true);
  });
  it("keeps reads inside the requested entity", () => {
    expect(entityScoped([{ businessEntityId: 1, id: "a" }, { businessEntityId: 2, id: "b" }], 1)).toEqual([{ businessEntityId: 1, id: "a" }]);
  });
});
