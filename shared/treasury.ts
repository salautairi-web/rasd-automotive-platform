export type TreasuryPaymentStatus = "draft" | "pending_approval" | "approved" | "submitted" | "completed" | "failed" | "rejected" | "cancelled";
export const isMakerCheckerValid = (makerUserId: number, checkerUserId: number, status: TreasuryPaymentStatus, amountMinor: number, limitMinor: number) => makerUserId !== checkerUserId && status === "pending_approval" && amountMinor > 0 && limitMinor >= amountMinor;
export const closingForecast = (opening: number, receipts: number, payments: number, restricted: number, committed: number) => opening + receipts - payments - restricted - committed;
export const reconciliationDifference = (bookAmountMinor: number, statementAmountMinor: number) => statementAmountMinor - bookAmountMinor;
export const isReplaySafe = (storedHash: string | null | undefined, requestHash: string) => storedHash === requestHash;
export const shouldFlagRisk = (input: { amountMinor: number; isRoundAmount?: boolean; repeatedCount?: number; beneficiaryChanged?: boolean }) => input.amountMinor > 0 && (Boolean(input.isRoundAmount) || (input.repeatedCount ?? 0) >= 3 || Boolean(input.beneficiaryChanged));
export const entityScoped = <T extends { businessEntityId: number }>(rows: T[], businessEntityId: number) => rows.filter((row) => row.businessEntityId === businessEntityId);
