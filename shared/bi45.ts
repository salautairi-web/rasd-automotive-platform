export type QualityAssessment = { completenessBps: number; accuracyBps: number; timelinessBps: number; consistencyBps: number; duplicateCount: number };

export function qualityScore(assessment: QualityAssessment | null): number | null {
  if (!assessment) return null;
  const base = (assessment.completenessBps + assessment.accuracyBps + assessment.timelinessBps + assessment.consistencyBps) / 4;
  return Math.max(0, Math.min(10000, Math.round(base - Math.min(1000, assessment.duplicateCount * 10))));
}

export function reconciliationStatus(sourceTotal: number, targetTotal: number, tolerance = 0.01): "matched" | "difference" {
  return Math.abs(sourceTotal - targetTotal) <= tolerance ? "matched" : "difference";
}

export function canDrillIntoEntity(scope: "portfolio" | "entity", requestedEntityId: number | undefined, allowedEntityIds: number[]): boolean {
  if (scope === "portfolio") return requestedEntityId === undefined || allowedEntityIds.includes(requestedEntityId);
  return requestedEntityId !== undefined && allowedEntityIds.includes(requestedEntityId);
}

export function sourceTrace(sourceSystem: string, sourceReference: string, factKey: string) {
  return { sourceSystem, sourceReference, factKey, immutable: true as const };
}
