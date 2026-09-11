import { describe, expect, it } from "vitest";
import { auditScore, canCloseFinding, continuousExceptionSeverity, evidenceVersion, isReviewerIndependent } from "../shared/audit50";

describe("audit assurance step 50", () => {
  it("keeps audit reviewer independent from transaction approver", () => {
    expect(isReviewerIndependent(10, 10)).toBe(false);
    expect(isReviewerIndependent(10, 11)).toBe(true);
    expect(isReviewerIndependent(10, null)).toBe(true);
  });
  it("preserves evidence version and integrity metadata", () => {
    expect(evidenceVersion(1, "a", "b")).toEqual({ version: 2, integrityChanged: true, immutableReference: true });
  });
  it("classifies continuous exceptions conservatively", () => {
    expect(continuousExceptionSeverity({ thresholdMinor: 100, amountMinor: 101 })).toBe("high");
    expect(continuousExceptionSeverity({ thresholdMinor: 100, duplicate: true })).toBe("critical");
  });
  it("requires validation and management response before closure", () => {
    expect(canCloseFinding("awaiting_validation", "pass", "تم التصحيح")).toBe(true);
    expect(canCloseFinding("awaiting_validation", "fail", "تم التصحيح")).toBe(false);
    expect(auditScore(3, 2, 4)).toBe(24);
  });
});
