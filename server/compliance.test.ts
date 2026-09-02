import { describe, expect, it } from "vitest";
import { canTransitionLicense, complianceLicenseState, complianceScore, daysUntilExpiry, legalHoldBlocksDeletion, maskLegalReference } from "../shared/compliance";

describe("compliance rules", () => {
  it("allows the ordered license lifecycle and rejects unsafe jumps", () => {
    expect(canTransitionLicense("requested", "submitted")).toBe(true);
    expect(canTransitionLicense("submitted", "under_review")).toBe(true);
    expect(canTransitionLicense("requested", "active")).toBe(false);
    expect(canTransitionLicense("cancelled", "active")).toBe(false);
  });
  it("classifies expiry and preserves exceptional states", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(daysUntilExpiry(new Date("2026-01-15T00:00:00Z"), now)).toBe(14);
    expect(complianceLicenseState(new Date("2025-12-31T00:00:00Z"), "active", now)).toBe("expired");
    expect(complianceLicenseState(new Date("2026-01-10T00:00:00Z"), "active", now)).toBe("expiring");
    expect(complianceLicenseState(new Date("2025-12-01T00:00:00Z"), "suspended", now)).toBe("suspended");
  });
  it("calculates a bounded score without inventing an empty portfolio risk", () => {
    expect(complianceScore({ active: 0, expiring: 0, expired: 0, overdue: 0, openIncidents: 0, highRisks: 0 })).toBe(100);
    expect(complianceScore({ active: 2, expiring: 1, expired: 1, overdue: 1, openIncidents: 1, highRisks: 1 })).toBeGreaterThanOrEqual(0);
    expect(complianceScore({ active: 2, expiring: 1, expired: 1, overdue: 1, openIncidents: 1, highRisks: 1 })).toBeLessThanOrEqual(100);
  });
  it("blocks deletion while a legal hold is active and masks references", () => {
    expect(legalHoldBlocksDeletion("active")).toBe(true);
    expect(legalHoldBlocksDeletion("released")).toBe(false);
    expect(maskLegalReference("CASE-2026-0042")).toMatch(/^••••••••••0042$/);
  });
});
