import { describe, expect, it } from "vitest";
import { canApprove, canGrantRole, canReadResource, defaultDeny, isEntityInScope, needsStepUp } from "../shared/security";

const context = { userId: 7, role: "user", membershipEntityIds: [11], permissionKeys: ["workshop.workorder.read", "workshop.workorder.approve"], approvalLimitMinor: 5000 };

describe("IAM security decisions", () => {
  it("denies a direct cross-entity read", () => { expect(isEntityInScope(context, 12)).toBe(false); expect(canReadResource(context, "workshop.workorder.read", 12)).toBe(false); });
  it("requires permission and disallows maker-checker self approval", () => { expect(canApprove(context, "workshop.workorder.approve", 11, 7, 100)).toBe(false); expect(canApprove(context, "workshop.workorder.approve", 11, 8, 100)).toBe(true); });
  it("does not let entity actors grant central roles", () => { expect(canGrantRole("user", "central")).toBe(false); expect(canGrantRole("user", "entity")).toBe(true); });
  it("marks financial and critical actions for step-up", () => { expect(needsStepUp("critical")).toBe(true); expect(needsStepUp("normal", 100)).toBe(true); });
  it("returns an explicit default-deny decision", () => { expect(defaultDeny(false, "scope")).toEqual({ allowed: false, reason: "default_deny" }); });
});
