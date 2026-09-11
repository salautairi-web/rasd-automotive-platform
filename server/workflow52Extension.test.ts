import { describe, expect, it } from "vitest";
import { addBusinessMinutes, automationRateBps, bottleneck, dryRunResult, isBusinessDay, validateGraph } from "../shared/workflow52Extension";

describe("Workflow visual designer and assurance extension", () => {
  const calendar = { workingDays: [0, 1, 2, 3, 4], holidays: ["2026-01-05"] };
  it("calculates business days and skips holidays", () => {
    expect(isBusinessDay(new Date("2026-01-04T00:00:00Z"), calendar)).toBe(true);
    expect(isBusinessDay(new Date("2026-01-05T00:00:00Z"), calendar)).toBe(false);
    const due = addBusinessMinutes(new Date("2026-01-04T23:59:00Z"), 2, calendar);
    expect(due).toBeInstanceOf(Date);
  });
  it("validates graph integrity and dry-run side effects", () => {
    const nodes = [{ nodeKey: "start", nodeType: "start" }, { nodeKey: "end", nodeType: "end" }];
    const edges = [{ sourceNodeKey: "start", targetNodeKey: "end" }];
    expect(validateGraph(nodes, edges).valid).toBe(true);
    expect(dryRunResult(nodes, edges).sideEffectsApplied).toBe(false);
    expect(validateGraph([{ nodeKey: "start", nodeType: "start" }], edges).valid).toBe(false);
  });
  it("calculates automation rate and bottleneck deterministically", () => {
    expect(automationRateBps(3, 4)).toBe(7500);
    expect(bottleneck([{ nodeKey: "a", minutes: 4 }, { nodeKey: "b", minutes: 9 }])).toEqual({ nodeKey: "b", minutes: 9 });
  });
});
