import { describe, expect, it } from "vitest";
import { evaluateAbacDecision, evaluateConditionalAccess, isBreakGlassActive, isPrivilegeRequestActive } from "../shared/security43";

describe("security step 43 policy logic", () => {
  const base = { userId: 7, businessEntityId: 1, permissionKey: "payment.approve", deviceTrusted: true, mfaFresh: true, riskScore: 10, withinTimeWindow: true, requesterIsApprover: false } as const;

  it("denies by default and respects explicit deny", () => {
    expect(evaluateAbacDecision(base, [])).toBe("deny");
    expect(evaluateAbacDecision(base, [{ effect: "allow", attribute: "permissionKey", operator: "equals", value: "payment.approve" }, { effect: "deny", attribute: "riskScore", operator: "gte", value: 8 }])).toBe("deny");
  });

  it("allows an entity-scoped matching policy", () => {
    expect(evaluateAbacDecision(base, [{ effect: "allow", attribute: "businessEntityId", operator: "equals", value: 1 }, { effect: "allow", attribute: "deviceTrusted", operator: "true" }])).toBe("allow");
    expect(evaluateAbacDecision({ ...base, businessEntityId: null }, [{ effect: "allow", attribute: "businessEntityId", operator: "equals", value: 1 }])).toBe("deny");
  });

  it("returns challenge for untrusted device or stale MFA and denies elevated risk", () => {
    expect(evaluateConditionalAccess({ ...base, deviceTrusted: false }, { requireFreshDevice: true })).toBe("challenge");
    expect(evaluateConditionalAccess({ ...base, mfaFresh: false }, { requireMfa: true })).toBe("challenge");
    expect(evaluateConditionalAccess({ ...base, riskScore: 90 }, { maxRiskScore: 50 })).toBe("deny");
    expect(evaluateConditionalAccess({ ...base, requesterIsApprover: true })).toBe("deny");
  });

  it("enforces privilege and break-glass time windows", () => {
    const now = new Date("2026-09-08T12:00:00Z");
    expect(isPrivilegeRequestActive("approved", new Date("2026-09-08T11:59:00Z"), new Date("2026-09-08T13:00:00Z"), now)).toBe(true);
    expect(isPrivilegeRequestActive("approved", new Date("2026-09-08T10:00:00Z"), new Date("2026-09-08T11:00:00Z"), now)).toBe(false);
    expect(isBreakGlassActive("active", new Date("2026-09-08T12:30:00Z"), now)).toBe(true);
    expect(isBreakGlassActive("revoked", new Date("2026-09-08T12:30:00Z"), now)).toBe(false);
  });
});
