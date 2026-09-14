export function budgetAvailability(approvedMinor: number, committedMinor: number, actualMinor: number) { if (![approvedMinor, committedMinor, actualMinor].every(Number.isFinite)) return 0; return Math.max(0, Math.round(approvedMinor - committedMinor - actualMinor)); }
export function wbsProgress(completionBps: number) { return Math.max(0, Math.min(10000, Math.round(completionBps))); }
