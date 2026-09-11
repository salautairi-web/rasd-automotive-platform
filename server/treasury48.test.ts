import { describe, expect, it } from "vitest";
import { conserveTransferBalance, enforceTreasuryLimit, entityScoped, projectLiquidity, requireStepUp } from "../shared/treasury";

describe("treasury step 48 shared controls", () => {
  it("projects liquidity deterministically and flags minimum breach", () => {
    expect(projectLiquidity({ openingCashMinor: 1000, inflowsMinor: 500, outflowsMinor: 300, committedOutflowsMinor: 900, minimumCashMinor: 400 })).toEqual({ projectedClosingMinor: 300, bufferMinor: -100, belowMinimum: true });
  });

  it("enforces single and daily account limits", () => {
    expect(enforceTreasuryLimit({ amountMinor: 600, singleLimitMinor: 500, dailyUsedMinor: 0, dailyLimitMinor: 1000 }).allowed).toBe(false);
    expect(enforceTreasuryLimit({ amountMinor: 600, singleLimitMinor: 1000, dailyUsedMinor: 500, dailyLimitMinor: 1000 }).reason).toBe("daily_limit");
    expect(enforceTreasuryLimit({ amountMinor: 400, singleLimitMinor: 1000, dailyUsedMinor: 500, dailyLimitMinor: 1000 }).allowed).toBe(true);
  });

  it("conserves transfer total when source has sufficient balance", () => {
    const result = conserveTransferBalance(1000, 200, 300);
    expect(result.conserved).toBe(true);
    expect(result.totalBeforeMinor).toBe(result.totalAfterMinor);
  });

  it("requires different entity scope for in-memory rows", () => {
    expect(entityScoped([{ businessEntityId: 1, id: "a" }, { businessEntityId: 2, id: "b" }], 1)).toEqual([{ businessEntityId: 1, id: "a" }]);
  });

  it("requires maker-checker and step-up when controls demand it", () => {
    expect(requireStepUp({ dualApprovalRequired: true, stepUpRequired: true, makerUserId: 10, checkerUserId: 11, stepUpVerified: true })).toBe(true);
    expect(requireStepUp({ dualApprovalRequired: true, stepUpRequired: true, makerUserId: 10, checkerUserId: 10, stepUpVerified: true })).toBe(false);
  });
});
