import { describe, expect, it } from "vitest";
import { calculateBudgetRemaining, calculateRiskScore, canTransitionLifecycle, dependencyCreatesCycle, isProjectLifecycleComplete, portfolioProgress } from "../shared/projects";

describe("project domain guards", () => {
  it("allows only sequential lifecycle transitions and cancellation before closure", () => {
    expect(canTransitionLifecycle("idea", "assessment")).toBe(true);
    expect(canTransitionLifecycle("idea", "execution")).toBe(false);
    expect(canTransitionLifecycle("closure", "cancelled")).toBe(false);
    expect(canTransitionLifecycle("execution", "cancelled")).toBe(true);
  });
  it("requires gates for approval and go-live readiness", () => {
    expect(isProjectLifecycleComplete("approval", { businessCaseApproved: true, gateApproved: false, goLiveApproved: false, financialClose: false })).toBe(false);
    expect(isProjectLifecycleComplete("approval", { businessCaseApproved: true, gateApproved: true, goLiveApproved: false, financialClose: false })).toBe(true);
    expect(isProjectLifecycleComplete("go_live", { businessCaseApproved: true, gateApproved: true, goLiveApproved: false, financialClose: false })).toBe(false);
  });
  it("rejects task dependency cycles", () => {
    expect(dependencyCreatesCycle([{ sourceId: 1, targetId: 2 }, { sourceId: 2, targetId: 3 }], 3, 1)).toBe(true);
    expect(dependencyCreatesCycle([{ sourceId: 1, targetId: 2 }], 2, 3)).toBe(false);
    expect(dependencyCreatesCycle([], 4, 4)).toBe(true);
  });
  it("preserves explicit budget and risk calculations", () => {
    expect(calculateBudgetRemaining(100000, 20000, 30000, 5000)).toBe(45000);
    expect(calculateRiskScore(8000, 5000)).toBe(4000);
    expect(portfolioProgress([2500, 5000, 7500])).toBe(5000);
  });
});
