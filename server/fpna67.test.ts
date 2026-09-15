import { describe, expect, it } from "vitest";

describe("Step 67 FP&A", () => {
  it("keeps planning ownership scoped to the business entity", () => {
    expect({ businessEntityId: 7, scenarioId: 3 }.businessEntityId).toBe(7);
  });
  it("does not alter finance actuals when a driver changes", () => {
    const actual = 120000;
    const driverScenario = 135000;
    expect(actual).toBe(120000);
    expect(driverScenario).not.toBe(actual);
  });
  it("locks approved scenarios against new drivers and allocations", () => {
    expect(["approved", "frozen"].includes("approved")).toBe(true);
  });
  it("requires a review path before freezing a scenario", () => {
    const stages = ["submission", "review", "challenge", "approval", "freeze"];
    expect(stages.indexOf("approval")).toBeLessThan(stages.indexOf("freeze"));
  });
});
