export type ComplianceScope = { businessEntityId: number; role: "admin" | "user"; hasMatterAccess: boolean };

export function isExpiring(expiryDate: Date | null | undefined, now = new Date(), windowDays = 30) {
  if (!expiryDate) return false;
  const diff = expiryDate.getTime() - now.getTime();
  return diff >= 0 && diff <= windowDays * 24 * 60 * 60 * 1000;
}

export function canAccessMatter(scope: ComplianceScope, requestedEntityId: number) {
  return scope.businessEntityId === requestedEntityId && (scope.role === "admin" || scope.hasMatterAccess);
}

export function canVerifyRemediation(status: "planned" | "in_progress" | "submitted" | "verified" | "rejected" | "closed") {
  return status === "submitted";
}

export function isOverdue(dueDate: Date | null | undefined, now = new Date()) {
  return !!dueDate && dueDate.getTime() < now.getTime();
}

export type RenewalUrgency = "overdue" | "critical" | "warning" | "planned" | "unknown";
export type RenewalItem = { id: number; type: "permit" | "contract"; label: string; expiryDate: Date | string | null | undefined; status: string; ownerUserId?: number | null; sourceKey?: string | null };

export function daysUntil(date: Date | string | null | undefined, now = new Date()) {
  if (!date) return null;
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function renewalUrgency(date: Date | string | null | undefined, now = new Date()): RenewalUrgency {
  const days = daysUntil(date, now);
  if (days === null) return "unknown";
  if (days < 0) return "overdue";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  return "planned";
}

export function buildRenewalSummary(items: RenewalItem[], now = new Date()) {
  const counts: Record<RenewalUrgency, number> = { overdue: 0, critical: 0, warning: 0, planned: 0, unknown: 0 };
  for (const item of items) counts[renewalUrgency(item.expiryDate, now)] += 1;
  return { total: items.length, counts, attention: counts.overdue + counts.critical + counts.warning };
}

export function filterRenewals(items: RenewalItem[], filters: { type?: "permit" | "contract" | "all"; urgency?: RenewalUrgency | "all"; status?: string | "all"; ownerUserId?: number | "all"; query?: string; horizonDays?: number | "all" }, now = new Date()) {
  const query = filters.query?.trim().toLocaleLowerCase("ar") ?? "";
  return items.filter((item) => {
    const urgency = renewalUrgency(item.expiryDate, now);
    const days = daysUntil(item.expiryDate, now);
    return (filters.type === undefined || filters.type === "all" || item.type === filters.type)
      && (filters.urgency === undefined || filters.urgency === "all" || urgency === filters.urgency)
      && (filters.status === undefined || filters.status === "all" || item.status === filters.status)
      && (filters.ownerUserId === undefined || filters.ownerUserId === "all" || item.ownerUserId === filters.ownerUserId)
      && (!query || `${item.label} ${item.sourceKey ?? ""}`.toLocaleLowerCase("ar").includes(query))
      && (filters.horizonDays === undefined || filters.horizonDays === "all" || (days !== null && days <= filters.horizonDays));
  });
}
