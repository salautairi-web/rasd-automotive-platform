export type BudgetVersionStatus = "draft" | "pending_approval" | "approved" | "locked" | "rejected";

export function variance(budgetMinor: number, actualMinor: number, commitmentMinor = 0) {
  const availableMinor = budgetMinor - commitmentMinor;
  const varianceMinor = actualMinor - budgetMinor;
  const varianceBps = budgetMinor === 0 ? 0 : Math.round((varianceMinor / Math.abs(budgetMinor)) * 10000);
  const status = Math.abs(varianceBps) >= 2000 ? "critical" : Math.abs(varianceBps) >= 1000 ? "warning" : "normal";
  return { availableMinor, varianceMinor, varianceBps, status } as const;
}

export function canApproveVersion(status: BudgetVersionStatus, makerUserId: number, checkerUserId: number) {
  return status === "pending_approval" && makerUserId !== checkerUserId;
}

export function spreadEvenly(totalMinor: number, periods: number) {
  if (!Number.isInteger(periods) || periods <= 0) throw new Error("periods_must_be_positive");
  const base = Math.trunc(totalMinor / periods);
  const remainder = totalMinor - base * periods;
  return Array.from({ length: periods }, (_, index) => base + (index < Math.abs(remainder) ? Math.sign(remainder) : 0));
}

export function forecastConfidenceBps(lowerMinor: number | null, upperMinor: number | null, valueMinor: number) {
  if (lowerMinor === null || upperMinor === null || upperMinor < lowerMinor) return 0;
  const width = upperMinor - lowerMinor;
  return width === 0 ? 10000 : Math.max(0, Math.min(10000, Math.round((1 - width / Math.max(Math.abs(valueMinor), 1)) * 10000)));
}

export function entityScoped<T extends { businessEntityId: number }>(rows: T[], businessEntityId: number) {
  return rows.filter((row) => row.businessEntityId === businessEntityId);
}
