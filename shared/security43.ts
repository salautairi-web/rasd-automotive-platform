export type SecurityAction = "allow" | "challenge" | "deny";
export type AccessContext43 = { userId: number; businessEntityId: number | null; permissionKey: string; deviceTrusted: boolean; mfaFresh: boolean; riskScore: number; withinTimeWindow: boolean; requesterIsApprover?: boolean };
export type AbacRule43 = { effect: "allow" | "deny"; attribute: keyof AccessContext43; operator: "equals" | "gte" | "lte" | "true" | "false"; value?: string | number | boolean };

export function evaluateAbacDecision(context: AccessContext43, rules: AbacRule43[]): SecurityAction {
  const matching = rules.filter((rule) => {
    const actual = context[rule.attribute];
    if (rule.operator === "true") return actual === true;
    if (rule.operator === "false") return actual === false;
    if (rule.operator === "equals") return actual === rule.value;
    if (rule.operator === "gte") return typeof actual === "number" && typeof rule.value === "number" && actual >= rule.value;
    if (rule.operator === "lte") return typeof actual === "number" && typeof rule.value === "number" && actual <= rule.value;
    return false;
  });
  if (matching.some((rule) => rule.effect === "deny")) return "deny";
  if (matching.some((rule) => rule.effect === "allow")) return "allow";
  return "deny";
}

export function evaluateConditionalAccess(context: AccessContext43, options: { requireMfa?: boolean; requireFreshDevice?: boolean; maxRiskScore?: number; requireTimeWindow?: boolean } = {}): SecurityAction {
  if (context.businessEntityId === null) return "deny";
  if (context.requesterIsApprover) return "deny";
  if (options.maxRiskScore !== undefined && context.riskScore > options.maxRiskScore) return "deny";
  if (options.requireTimeWindow && !context.withinTimeWindow) return "deny";
  if (options.requireFreshDevice && !context.deviceTrusted) return "challenge";
  if (options.requireMfa && !context.mfaFresh) return "challenge";
  return "allow";
}

export function isPrivilegeRequestActive(status: "requested" | "approved" | "rejected" | "expired" | "revoked", startsAt: Date, expiresAt: Date, now = new Date()) {
  return status === "approved" && startsAt.getTime() <= now.getTime() && expiresAt.getTime() > now.getTime();
}

export function isBreakGlassActive(status: "requested" | "approved" | "active" | "expired" | "revoked" | "rejected", expiresAt: Date, now = new Date()) {
  return (status === "approved" || status === "active") && expiresAt.getTime() > now.getTime();
}

export function severityWeight(severity: "low" | "medium" | "high" | "critical") {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}
