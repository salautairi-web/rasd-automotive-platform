import { describe, expect, it } from "vitest";
import { canApproveVersion, entityScoped, forecastConfidenceBps, spreadEvenly, variance } from "../shared/planning";

describe("planning foundations", () => {
  it("calculates budget variance and thresholds", () => {
    expect(variance(100000, 108000, 20000)).toEqual({ availableMinor: 80000, varianceMinor: 8000, varianceBps: 800, status: "normal" });
    expect(variance(100000, 125000, 0).status).toBe("critical");
  });
  it("requires maker-checker for version approval", () => {
    expect(canApproveVersion("pending_approval", 4, 5)).toBe(true);
    expect(canApproveVersion("approved", 4, 5)).toBe(false);
    expect(canApproveVersion("pending_approval", 4, 4)).toBe(false);
  });
  it("spreads a plan deterministically across periods", () => {
    expect(spreadEvenly(100, 3)).toEqual([34, 33, 33]);
    expect(spreadEvenly(-100, 3)).toEqual([-34, -33, -33]);
  });
  it("bounds forecast confidence and entity reads", () => {
    expect(forecastConfidenceBps(90, 110, 100)).toBe(8000);
    expect(entityScoped([{ businessEntityId: 1, id: "a" }, { businessEntityId: 2, id: "b" }], 2)).toEqual([{ businessEntityId: 2, id: "b" }]);
  });
});
