import { describe, expect, it } from "vitest";
import {
  canTransferBranch,
  operationalImpactTotal,
  requiresOperationalAcknowledgement,
} from "../shared/entityGovernance";

describe("entity governance safeguards", () => {
  const impact = { reservations: 2, contracts: 1, invoices: 3 };

  it("summarizes operational impact and requires explicit acknowledgement", () => {
    expect(operationalImpactTotal(impact)).toBe(6);
    expect(requiresOperationalAcknowledgement("inactive", impact, false)).toBe(true);
    expect(requiresOperationalAcknowledgement("archived", impact, false)).toBe(true);
    expect(requiresOperationalAcknowledgement("active", impact, false)).toBe(false);
    expect(requiresOperationalAcknowledgement("inactive", impact, true)).toBe(false);
  });

  it("requires an active target for branch transfers", () => {
    expect(canTransferBranch({ branchStatus: "active", targetStatus: "planned", isSameEntity: false, acknowledged: false })).toEqual({ allowed: false, reason: "target_not_active" });
    expect(canTransferBranch({ branchStatus: "active", targetStatus: "active", isSameEntity: true, acknowledged: false })).toEqual({ allowed: false, reason: "same_entity" });
  });

  it("requires an explicit acknowledgement for an inactive branch", () => {
    expect(canTransferBranch({ branchStatus: "inactive", targetStatus: "active", isSameEntity: false, acknowledged: false })).toEqual({ allowed: false, reason: "inactive_branch_ack_required" });
    expect(canTransferBranch({ branchStatus: "inactive", targetStatus: "active", isSameEntity: false, acknowledged: true })).toEqual({ allowed: true });
  });
});
