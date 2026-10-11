export const portalStatusLabels: Record<string, string> = {
  draft: "مسودة", submitted: "قيد المراجعة", requested: "طلب جديد", confirmed: "مؤكد",
  cancelled: "ملغى", fulfilled: "تم التنفيذ", completed: "مكتمل", open: "مفتوحة",
  in_progress: "قيد المعالجة", escalated: "مصعّدة", resolved: "محلولة", closed: "مغلقة",
  pending: "قيد الانتظار", succeeded: "ناجحة", failed: "فشلت", refunded: "مستردة",
};
export type ActivityKind = "order" | "reservation" | "payment";
export type PortalActivity = { id: string; kind: ActivityKind; title: string; reference: string; status: string; createdAt: Date };
export function filterPortalActivity<T extends PortalActivity>(items: T[], filters: { query: string; kind: string; status: string; sort: string }) {
  const query = filters.query.trim().toLocaleLowerCase();
  return items.filter(item => (filters.kind === "all" || item.kind === filters.kind)
    && (filters.status === "all" || item.status === filters.status)
    && (!query || `${item.title} ${item.reference} ${portalStatusLabels[item.status] ?? item.status}`.toLocaleLowerCase().includes(query)))
    .sort((a, b) => (filters.sort === "oldest" ? 1 : -1) * (a.createdAt.getTime() - b.createdAt.getTime()));
}
export function formatPortalMoney(amountMinor: number, currency: string, locale = "ar-OM") {
  try {
    const formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    return formatter.format(amountMinor / 10 ** digits);
  } catch { return `${amountMinor} وحدة صغرى (${currency})`; }
}
export function canReplyToPortalTicket(status: string) { return !["resolved", "closed"].includes(status); }
export function ownsPortalRecord(record: { portalUserId: number; businessEntityId: number; relationshipId: number }, scope: { portalUserId: number; businessEntityId: number; relationshipId: number }) {
  return record.portalUserId === scope.portalUserId && record.businessEntityId === scope.businessEntityId && record.relationshipId === scope.relationshipId;
}
