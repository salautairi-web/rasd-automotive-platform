export function membershipIsActive(status: string, startsAt: Date, endsAt: Date | null, now = new Date()) { return status === "active" && startsAt <= now && (!endsAt || endsAt > now); }
export function resourceBelongsToPortal(resourceEntityId: number, portalEntityId: number, resourceOwnerId: number, portalLocalRecordId: number) { return resourceEntityId === portalEntityId && resourceOwnerId === portalLocalRecordId; }
export function sanitizePortalScopes(scopes: string[]) { return Array.from(new Set(scopes.filter(s => /^[a-z][a-z0-9_.:-]{2,79}$/.test(s)))).sort(); }
