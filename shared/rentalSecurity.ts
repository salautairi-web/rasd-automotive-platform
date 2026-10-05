export type RentalNotificationType = "reservation" | "contract" | "deposit" | "invoice";
export type RentalSeverity = "critical" | "high" | "normal" | "low";

export interface RentalNotificationLike {
  id: string;
  type: string;
  severity: string;
  title?: string;
  body?: string;
  createdAt: Date;
}

export interface RentalAuditLike {
  id: number;
  action: string;
  resourceType: string | null;
  resourceId?: string | null;
  outcome: string;
  createdAt: Date;
}

export function rentalNotificationLabel(type: RentalNotificationType) {
  return ({ reservation: "حجز", contract: "عقد", deposit: "وديعة", invoice: "فاتورة" })[type];
}

export function requiresRentalFinancialMfa(input: { isAdmin: boolean; roleKey: string }) {
  if (input.isAdmin) return false;
  const role = input.roleKey.toLowerCase();
  return role === "accountant" || role === "rental_manager" || role.includes("finance");
}

export function filterAndSortRentalNotifications<T extends RentalNotificationLike>(items: T[], filters: { severity?: string; type?: string; sort?: string }) {
  const priority: Record<string, number> = { critical: 4, high: 3, normal: 2, low: 1 };
  return items
    .filter(item => (!filters.severity || filters.severity === "all" || item.severity === filters.severity) && (!filters.type || filters.type === "all" || item.type === filters.type))
    .sort((a, b) => filters.sort === "urgency" ? (priority[b.severity] ?? 0) - (priority[a.severity] ?? 0) : filters.sort === "oldest" ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime());
}

export function filterAndSortRentalAuditTrail<T extends RentalAuditLike>(items: T[], filters: { from?: Date; to?: Date; resourceType?: string; outcome?: string; sort?: string }) {
  return items
    .filter(event => (!filters.from || event.createdAt >= filters.from) && (!filters.to || event.createdAt <= filters.to) && (!filters.resourceType || filters.resourceType === "all" || (event.resourceType ?? "session") === filters.resourceType) && (!filters.outcome || filters.outcome === "all" || event.outcome === filters.outcome))
    .sort((a, b) => filters.sort === "oldest" ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime());
}
