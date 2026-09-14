import { describe, expect, it } from "vitest";
import { budgetAvailability, wbsProgress } from "../shared/projects62";

describe("Projects 62 PMO rules", () => {
  it("calculates available budget without allowing negative availability", () => {
    expect(budgetAvailability(10000, 2500, 1500)).toBe(6000);
    expect(budgetAvailability(1000, 800, 400)).toBe(0);
  });
  it("clamps WBS progress to a valid basis-point range", () => {
    expect(wbsProgress(-10)).toBe(0);
    expect(wbsProgress(4500)).toBe(4500);
    expect(wbsProgress(12000)).toBe(10000);
  });
});
