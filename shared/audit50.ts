export const auditScore = (riskPriority: number, coverage: number, controlWeakness: number) => Math.max(1, Math.trunc(riskPriority)) * Math.max(1, Math.trunc(coverage)) * Math.max(1, Math.trunc(controlWeakness));

export const isReviewerIndependent = (auditorUserId: number, transactionApproverUserId?: number | null) => transactionApproverUserId == null || auditorUserId !== transactionApproverUserId;

export const evidenceVersion = (currentVersion: number, integrityHash?: string | null, nextIntegrityHash?: string | null) => ({ version: currentVersion + 1, integrityChanged: Boolean(integrityHash && nextIntegrityHash && integrityHash !== nextIntegrityHash), immutableReference: Boolean(integrityHash) });

export const continuousExceptionSeverity = (rule: { thresholdMinor: number; amountMinor?: number; repeatedCount?: number; selfApproval?: boolean; duplicate?: boolean }) => {
  if (rule.selfApproval || rule.duplicate) return "critical" as const;
  if ((rule.amountMinor ?? 0) > rule.thresholdMinor && rule.thresholdMinor > 0) return "high" as const;
  if ((rule.repeatedCount ?? 0) >= 3) return "medium" as const;
  return "low" as const;
};

export const findingAgingBucket = (dueAt: Date | null | undefined, now = new Date()) => {
  if (!dueAt) return "unplanned" as const;
  const days = Math.ceil((now.getTime() - dueAt.getTime()) / 86400000);
  return days > 30 ? "overdue_30_plus" as const : days > 0 ? "overdue" as const : "within_due" as const;
};

export const canCloseFinding = (status: string, validationResult: string, managementResponse?: string | null) => status !== "closed" && validationResult === "pass" && Boolean(managementResponse?.trim());
