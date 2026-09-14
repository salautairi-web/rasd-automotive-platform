import { describe, expect, it } from "vitest";
import { canCapitalize, disposalGainLoss, straightLineDepreciation } from "../shared/assets";

describe("asset lifecycle 57 controls", () => {
  it("calculates bounded straight-line depreciation without dropping below residual value", () => {
    expect(straightLineDepreciation(120000, 20000, 60, 1)).toBe(1667);
    expect(straightLineDepreciation(120000, 20000, 60, 100)).toBe(100000);
  });
  it("calculates disposal gain or loss deterministically", () => {
    expect(disposalGainLoss(95000, 100000)).toBe(-5000);
    expect(disposalGainLoss(120000, 100000)).toBe(20000);
  });
  it("does not treat a missing capitalization document as eligible", () => {
    expect(canCapitalize("received", "docs/asset.pdf")).toBe(true);
    expect(canCapitalize("received", undefined)).toBe(false);
    expect(canCapitalize("active", "docs/asset.pdf")).toBe(false);
  });
});
