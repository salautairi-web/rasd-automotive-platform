export type AccessContext = { userId: number; role: string; entityId?: number; membershipEntityIds: number[]; permissionKeys: string[]; resourceOwnerUserId?: number; status?: string; amountMinor?: number; approvalLimitMinor?: number };

export function isEntityInScope(context: AccessContext, entityId?: number) { return context.role === "admin" || (entityId !== undefined && context.membershipEntityIds.includes(entityId)); }
export function hasPermission(context: AccessContext, permissionKey: string) { return context.role === "admin" || context.permissionKeys.includes(permissionKey); }
export function canReadResource(context: AccessContext, permissionKey: string, entityId: number, ownerUserId?: number) { if (!isEntityInScope(context, entityId) || !hasPermission(context, permissionKey)) return false; return ownerUserId === undefined || ownerUserId === context.userId || context.role === "admin"; }
export function canApprove(context: AccessContext, permissionKey: string, entityId: number, makerUserId: number, amountMinor = 0) { if (!canReadResource(context, permissionKey, entityId)) return false; if (makerUserId === context.userId) return false; return context.approvalLimitMinor === undefined || amountMinor <= context.approvalLimitMinor || context.role === "admin"; }
export function canGrantRole(actorRole: string, targetRoleScope: string) { return actorRole === "admin" || targetRoleScope !== "central"; }
export function needsStepUp(sensitivity: "normal" | "sensitive" | "critical", amountMinor = 0) { return sensitivity === "critical" || sensitivity === "sensitive" || amountMinor > 0; }
export function defaultDeny(decision: boolean, reason: string) { return { allowed: decision, reason: decision ? reason : "default_deny" }; }
