export type RoleSearchRecord = { nameAr: string; roleKey: string; scopeType: string };

export function roleMatchesQuery(role: RoleSearchRecord, query: string) {
  const normalized = query.trim().toLowerCase();
  return !normalized || `${role.nameAr} ${role.roleKey} ${role.scopeType}`.toLowerCase().includes(normalized);
}

export function countActiveMemberships<T extends { status: string }>(memberships: T[]) {
  return memberships.filter(membership => membership.status === "active").length;
}
