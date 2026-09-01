export type GatewayRequest = { method: string; endpoint: string; correlationId?: string; requestId?: string; businessEntityId?: number; requiredScope: "central" | "entity" | "cross_entity"; actorRole: string; entityMembership: boolean; rateCount: number; rateLimitPerMinute: number };

export function buildGatewayContext(input: { method: string; endpoint: string; correlationId?: string; requestId?: string }) { return { ...input, correlationId: input.correlationId ?? `corr-${crypto.randomUUID()}`, requestId: input.requestId ?? `req-${crypto.randomUUID()}` }; }
export function validateGatewayRequest(request: GatewayRequest) {
  if (!request.method || !request.endpoint.startsWith("/")) return { accepted: false, code: "INVALID_REQUEST" as const };
  if (request.requiredScope === "central" && request.actorRole !== "admin") return { accepted: false, code: "CENTRAL_SCOPE_REQUIRED" as const };
  if (request.requiredScope === "entity" && request.businessEntityId === undefined) return { accepted: false, code: "ENTITY_REQUIRED" as const };
  if (request.requiredScope === "entity" && !request.entityMembership && request.actorRole !== "admin") return { accepted: false, code: "ENTITY_SCOPE_DENIED" as const };
  if (request.rateCount >= request.rateLimitPerMinute) return { accepted: false, code: "RATE_LIMITED" as const };
  return { accepted: true as const, code: "ACCEPTED" as const };
}
export function normalizeGatewayError(error: unknown) { return error instanceof Error ? error.message.slice(0, 500) : "gateway_error"; }
