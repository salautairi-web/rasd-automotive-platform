import { describe, expect, it } from "vitest";
import {
  canAutoLinkBranches,
  canTransitionEntityStatus,
  entityStatusReason,
} from "../shared/entityLifecycle";

describe("entity lifecycle governance", () => {
  it("allows the supported activation, suspension, reactivation, and archive transitions", () => {
    expect(canTransitionEntityStatus("planned", "active")).toBe(true);
    expect(canTransitionEntityStatus("active", "inactive")).toBe(true);
    expect(canTransitionEntityStatus("inactive", "active")).toBe(true);
    expect(canTransitionEntityStatus("inactive", "archived")).toBe(true);
    expect(canTransitionEntityStatus("archived", "active")).toBe(false);
  });

  it("returns an Arabic reason for blocked transitions", () => {
    expect(entityStatusReason("archived", "active")).toContain("مؤرشف");
    expect(entityStatusReason("active", "active")).toContain("مطابقة");
    expect(entityStatusReason("planned", "inactive")).toContain("مخطط");
    expect(entityStatusReason("planned", "active")).toBeNull();
  });

  it("only auto-links orphan branches when the organization has one known entity", () => {
    expect(canAutoLinkBranches(0, true)).toBe(true);
    expect(canAutoLinkBranches(1, true)).toBe(true);
    expect(canAutoLinkBranches(2, true)).toBe(false);
    expect(canAutoLinkBranches(0, false)).toBe(false);
  });
});
