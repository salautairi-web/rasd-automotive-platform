export type TreasuryPaymentStatus = "draft" | "pending_approval" | "approved" | "submitted" | "completed" | "failed" | "rejected" | "cancelled";
export const isMakerCheckerValid = (makerUserId: number, checkerUserId: number, status: TreasuryPaymentStatus, amountMinor: number, limitMinor: number) => makerUserId !== checkerUserId && status === "pending_approval" && amountMinor > 0 && limitMinor >= amountMinor;
export const closingForecast = (opening: number, receipts: number, payments: number, restricted: number, committed: number) => opening + receipts - payments - restricted - committed;
export const reconciliationDifference = (bookAmountMinor: number, statementAmountMinor: number) => statementAmountMinor - bookAmountMinor;
export const isReplaySafe = (storedHash: string | null | undefined, requestHash: string) => storedHash === requestHash;
export const shouldFlagRisk = (input: { amountMinor: number; isRoundAmount?: boolean; repeatedCount?: number; beneficiaryChanged?: boolean }) => input.amountMinor > 0 && (Boolean(input.isRoundAmount) || (input.repeatedCount ?? 0) >= 3 || Boolean(input.beneficiaryChanged));
export const entityScoped = <T extends { businessEntityId: number }>(rows: T[], businessEntityId: number) => rows.filter((row) => row.businessEntityId === businessEntityId);


export type TreasuryScenario = "base" | "optimistic" | "conservative" | "stress";

export const projectLiquidity = (input: { openingCashMinor: number; inflowsMinor: number; outflowsMinor: number; committedOutflowsMinor: number; minimumCashMinor: number }) => {
  const projectedClosingMinor = input.openingCashMinor + input.inflowsMinor - input.outflowsMinor - input.committedOutflowsMinor;
  return { projectedClosingMinor, bufferMinor: projectedClosingMinor - input.minimumCashMinor, belowMinimum: projectedClosingMinor < input.minimumCashMinor };
};

export const enforceTreasuryLimit = (input: { amountMinor: number; singleLimitMinor: number; dailyUsedMinor: number; dailyLimitMinor: number }) => {
  if (input.amountMinor <= 0) return { allowed: false, reason: "invalid_amount" as const };
  if (input.singleLimitMinor > 0 && input.amountMinor > input.singleLimitMinor) return { allowed: false, reason: "single_limit" as const };
  if (input.dailyLimitMinor > 0 && input.dailyUsedMinor + input.amountMinor > input.dailyLimitMinor) return { allowed: false, reason: "daily_limit" as const };
  return { allowed: true, reason: "within_limits" as const };
};

export const conserveTransferBalance = (fromBalanceMinor: number, toBalanceMinor: number, amountMinor: number) => ({
  fromBalanceMinor: fromBalanceMinor - amountMinor,
  toBalanceMinor: toBalanceMinor + amountMinor,
  totalBeforeMinor: fromBalanceMinor + toBalanceMinor,
  totalAfterMinor: fromBalanceMinor - amountMinor + toBalanceMinor + amountMinor,
  conserved: amountMinor > 0 && fromBalanceMinor >= amountMinor,
});

export const requireStepUp = (input: { dualApprovalRequired: boolean; stepUpRequired: boolean; makerUserId: number; checkerUserId: number; stepUpVerified: boolean }) => input.makerUserId !== input.checkerUserId && (!input.dualApprovalRequired || input.stepUpVerified || !input.stepUpRequired);
