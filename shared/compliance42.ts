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
