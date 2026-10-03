import { describe, expect, it } from "vitest";
import { countActiveMemberships, roleMatchesQuery } from "../shared/adminRoleManagement";

describe("admin role management helpers", () => {
  it("matches roles by Arabic name, key, or scope", () => {
    const role = { nameAr: "مدير الورشة", roleKey: "workshop_manager", scopeType: "branch" };
    expect(roleMatchesQuery(role, "الورشة")).toBe(true);
    expect(roleMatchesQuery(role, "workshop_manager")).toBe(true);
    expect(roleMatchesQuery(role, "entity")).toBe(false);
    expect(roleMatchesQuery(role, " ")).toBe(true);
  });

  it("counts only active memberships", () => {
    expect(countActiveMemberships([{ status: "active" }, { status: "suspended" }, { status: "revoked" }, { status: "active" }])).toBe(2);
  });
});
