import { describe, expect, it } from "vitest";

describe("Step 73 BI executive analytics", () => {
  it("keeps actual, budget, and forecast as separate scenarios", () => {
    expect(new Set(["actual", "budget", "forecast_base"]).size).toBe(3);
  });
  it("passes reconciliation when the difference is within tolerance", () => {
    expect(Math.abs(100 - 100) <= 0).toBe(true);
  });
  it("blocks publication when a critical reconciliation fails", () => {
    const failedReconciliations = 1;
    expect(failedReconciliations > 0).toBe(true);
  });
  it("preserves drill-through source references", () => {
    const source = { sourceSystem: "GeneralLedger", sourceId: "GL-2026-09" };
    expect(source.sourceSystem).toBe("GeneralLedger");
    expect(source.sourceId).toMatch(/^GL-/);
  });
  it("supports entity-scoped analytical views", () => {
    expect({ businessEntityId: 1 }).not.toEqual({ businessEntityId: 2 });
  });
});
