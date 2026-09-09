import { describe, expect, it } from "vitest";
import { canDrillIntoEntity, qualityScore, reconciliationStatus, sourceTrace } from "../shared/bi45";

describe("BI45 governance contracts", () => {
  it("calculates a bounded quality score and penalizes duplicates", () => {
    expect(qualityScore({ completenessBps: 9800, accuracyBps: 9700, timelinessBps: 9600, consistencyBps: 9900, duplicateCount: 2 })).toBe(9730);
    expect(qualityScore(null)).toBeNull();
  });

  it("marks reconciliation only within the declared tolerance", () => {
    expect(reconciliationStatus(100, 100.005)).toBe("matched");
    expect(reconciliationStatus(100, 101)).toBe("difference");
  });

  it("does not allow unauthorized entity drill-down", () => {
    expect(canDrillIntoEntity("portfolio", 2, [1])).toBe(false);
    expect(canDrillIntoEntity("entity", 1, [1])).toBe(true);
    expect(canDrillIntoEntity("entity", undefined, [1])).toBe(false);
  });

  it("keeps a traceable immutable source reference", () => {
    expect(sourceTrace("finance", "journal:42", "fact:revenue:2026-01")).toEqual({ sourceSystem: "finance", sourceReference: "journal:42", factKey: "fact:revenue:2026-01", immutable: true });
  });
});
