import { describe, expect, it } from "vitest";
import { canAccessMatter, canVerifyRemediation, isExpiring, isOverdue } from "../shared/compliance42";

describe("compliance42 governance guards", () => {
  it("limits legal matter access to the same entity and authorized scope", () => {
    expect(canAccessMatter({ businessEntityId: 1, role: "user", hasMatterAccess: true }, 1)).toBe(true);
    expect(canAccessMatter({ businessEntityId: 1, role: "user", hasMatterAccess: false }, 1)).toBe(false);
    expect(canAccessMatter({ businessEntityId: 1, role: "admin", hasMatterAccess: false }, 2)).toBe(false);
  });

  it("detects permit and contract expiry windows without inventing dates", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(isExpiring(new Date("2026-01-15T00:00:00Z"), now, 30)).toBe(true);
    expect(isExpiring(new Date("2026-03-01T00:00:00Z"), now, 30)).toBe(false);
    expect(isExpiring(null, now, 30)).toBe(false);
  });

  it("allows remediation verification only after submission", () => {
    expect(canVerifyRemediation("submitted")).toBe(true);
    expect(canVerifyRemediation("in_progress")).toBe(false);
    expect(canVerifyRemediation("closed")).toBe(false);
  });

  it("identifies overdue obligations deterministically", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    expect(isOverdue(new Date("2026-01-09T00:00:00Z"), now)).toBe(true);
    expect(isOverdue(new Date("2026-01-10T00:00:00Z"), now)).toBe(false);
    expect(isOverdue(undefined, now)).toBe(false);
  });
});
