import { describe, expect, it } from "vitest";
import { controlTestCreatesFinding, continuityReadiness, isAuthorizedRiskAcceptance, riskBreach, riskScore, validateRtoRpo } from "../shared/risk49";

describe("risk and resilience step 49", () => {
  it("calculates bounded deterministic risk scores and appetite breaches", () => {
    expect(riskScore(5, 4, 3)).toBe(60);
    expect(riskBreach(60, 25, 50)).toEqual({ appetiteBreached: true, toleranceBreached: true, severity: "high" });
  });
  it("requires evidence of control failure before creating a finding", () => {
    expect(controlTestCreatesFinding("fail")).toBe(true);
    expect(controlTestCreatesFinding("pass_with_exception")).toBe(true);
    expect(controlTestCreatesFinding("pass")).toBe(false);
  });
  it("validates continuity objectives", () => {
    expect(validateRtoRpo(60, 30, 120)).toBe(true);
    expect(validateRtoRpo(180, 30, 120)).toBe(false);
  });
  it("blocks unauthorized risk acceptance and protects readiness", () => {
    expect(isAuthorizedRiskAcceptance("user", 10, 20)).toBe(false);
    expect(isAuthorizedRiskAcceptance("admin", 10, 20)).toBe(true);
    expect(continuityReadiness({ approvedBia: 1, activeBcp: 1, testedDr: 1, openCriticalFindings: 0 })).toEqual({ scorePercent: 100, blocked: false });
    expect(continuityReadiness({ approvedBia: 1, activeBcp: 0, testedDr: 0, openCriticalFindings: 1 }).blocked).toBe(true);
  });
});
