import { describe, expect, it } from "vitest";
import { canAccessRelationship, portalEventKey, replaySafe } from "../shared/portalV2";

describe("Portal 2.0 isolation", () => {
  const relationship = { portalUserId: 7, businessEntityId: 101, status: "active", permissionsJson: JSON.stringify(["portal.order.create", "portal.ticket.create"]) };
  it("allows only the active user/entity relationship", () => { expect(canAccessRelationship({ actorPortalUserId: 7, businessEntityId: 101, relationship })).toBe(true); expect(canAccessRelationship({ actorPortalUserId: 7, businessEntityId: 202, relationship })).toBe(false); expect(canAccessRelationship({ actorPortalUserId: 8, businessEntityId: 101, relationship })).toBe(false); });
  it("enforces relationship permissions and default deny", () => { expect(canAccessRelationship({ actorPortalUserId: 7, businessEntityId: 101, relationship, permissionKey: "portal.order.create" })).toBe(true); expect(canAccessRelationship({ actorPortalUserId: 7, businessEntityId: 101, relationship, permissionKey: "portal.payment.refund" })).toBe(false); expect(canAccessRelationship({ actorPortalUserId: 7, businessEntityId: 101, relationship: { ...relationship, status: "revoked" } })).toBe(false); });
  it("returns replay-safe responses and scoped event keys", () => { expect(replaySafe({ id: 4, status: "submitted" })).toEqual({ id: 4, status: "submitted", replay: true }); expect(replaySafe(undefined)).toBeNull(); expect(portalEventKey(101, "order.created", "4")).toBe("portal:101:order.created:4"); });
});
