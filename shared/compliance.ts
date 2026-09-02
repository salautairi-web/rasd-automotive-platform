export type ComplianceLicenseStatus = "requested" | "submitted" | "under_review" | "approved" | "active" | "expiring" | "expired" | "suspended" | "cancelled" | "renewed";

const licenseTransitions: Record<ComplianceLicenseStatus, ComplianceLicenseStatus[]> = {
  requested: ["submitted", "cancelled"], submitted: ["under_review", "cancelled"], under_review: ["approved", "active", "cancelled"], approved: ["active", "suspended", "cancelled"], active: ["expiring", "suspended", "renewed", "expired"], expiring: ["renewed", "expired", "suspended"], expired: ["renewed", "cancelled"], suspended: ["active", "cancelled", "renewed"], cancelled: [], renewed: ["active"],
};

export function canTransitionLicense(from: ComplianceLicenseStatus, to: ComplianceLicenseStatus): boolean { return from === to || licenseTransitions[from]?.includes(to) === true; }
export function daysUntilExpiry(expiry: Date, now = new Date()): number { return Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000); }
export function complianceLicenseState(expiry: Date | null, current: ComplianceLicenseStatus, now = new Date(), warningDays = 30): ComplianceLicenseStatus { if (!expiry || ["cancelled", "suspended", "renewed"].includes(current)) return current; const days = daysUntilExpiry(expiry, now); if (days < 0) return "expired"; if (days <= warningDays) return "expiring"; return current; }
export function complianceScore(input: { active: number; expiring: number; expired: number; overdue: number; openIncidents: number; highRisks: number }): number { const total = input.active + input.expiring + input.expired + input.overdue + input.openIncidents + input.highRisks; if (total === 0) return 100; const penalty = input.expired * 30 + input.overdue * 20 + input.openIncidents * 12 + input.highRisks * 15 + input.expiring * 5; return Math.max(0, Math.min(100, Math.round(100 - (penalty / total)))); }
export function legalHoldBlocksDeletion(status: "active" | "released"): boolean { return status === "active"; }
export function maskLegalReference(value: string): string { const trimmed = value.trim(); return trimmed.length <= 4 ? "••••" : `${"•".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`; }
