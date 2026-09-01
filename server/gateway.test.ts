import { describe, expect, it } from "vitest";
import { validateGatewayRequest } from "../shared/gateway";

describe("API gateway guards", () => {
  const base = { method: "POST", endpoint: "/v1/events", correlationId: "corr-12345678", requestId: "req-12345678", businessEntityId: 11, requiredScope: "entity" as const, actorRole: "user", entityMembership: true, rateCount: 0, rateLimitPerMinute: 60 };
  it("accepts an authenticated entity-scoped request", () => { expect(validateGatewayRequest(base)).toEqual({ accepted: true, code: "ACCEPTED" }); });
  it("denies missing entity scope and central access", () => { expect(validateGatewayRequest({ ...base, businessEntityId: undefined, entityMembership: false })).toMatchObject({ accepted: false, code: "ENTITY_REQUIRED" }); expect(validateGatewayRequest({ ...base, requiredScope: "central", actorRole: "user" })).toMatchObject({ accepted: false, code: "CENTRAL_SCOPE_REQUIRED" }); });
  it("enforces rate limits and endpoint shape", () => { expect(validateGatewayRequest({ ...base, rateCount: 60 })).toMatchObject({ accepted: false, code: "RATE_LIMITED" }); expect(validateGatewayRequest({ ...base, endpoint: "events" })).toMatchObject({ accepted: false, code: "INVALID_REQUEST" }); });
});
