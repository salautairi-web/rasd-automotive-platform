export type RiskSeverity = "low" | "medium" | "high" | "critical";

export const riskScore = (likelihood: number, impact: number, velocity: number) => {
  const safe = (value: number) => Math.max(1, Math.min(5, Math.trunc(value)));
  return safe(likelihood) * safe(impact) * safe(velocity);
};

export const riskBreach = (score: number, appetiteScore: number, toleranceScore: number) => ({
  appetiteBreached: score > appetiteScore,
  toleranceBreached: score > toleranceScore,
  severity: score >= 75 ? "critical" as const : score >= 40 ? "high" as const : score >= 15 ? "medium" as const : "low" as const,
});

export const validateRtoRpo = (rtoMinutes: number, rpoMinutes: number, maxDowntimeMinutes: number) => rtoMinutes > 0 && rpoMinutes >= 0 && maxDowntimeMinutes >= rtoMinutes;

export const controlTestCreatesFinding = (result: "pass" | "fail" | "pass_with_exception" | "not_applicable") => result === "fail" || result === "pass_with_exception";

export const isAuthorizedRiskAcceptance = (role: string, residualScore: number, toleranceScore: number) => role === "admin" && residualScore <= toleranceScore;

export const continuityReadiness = (input: { approvedBia: number; activeBcp: number; testedDr: number; openCriticalFindings: number }) => {
  const denominator = Math.max(1, input.approvedBia + input.activeBcp + input.testedDr);
  const numerator = input.approvedBia + input.activeBcp + input.testedDr;
  return { scorePercent: Math.round((numerator / denominator) * 100), blocked: input.openCriticalFindings > 0 };
};
