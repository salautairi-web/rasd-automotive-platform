export type MdmLifecycle = "draft" | "active" | "inactive" | "archived";
export type MdmConflictRule = "source_of_truth" | "latest_approved" | "entity_owned" | "manual_review";

export function qualityScoreBps(dimensions: Partial<Record<"completeness" | "accuracy" | "validity" | "consistency" | "uniqueness" | "timeliness", number>>): number {
  const values = Object.values(dimensions).filter((value): value is number => typeof value === "number");
  if (!values.length) return 0;
  const bounded = values.map(value => Math.max(0, Math.min(10000, Math.trunc(value))));
  return Math.round(bounded.reduce((sum, value) => sum + value, 0) / bounded.length);
}

export function classifyMatch(confidenceBps: number): "exact" | "fuzzy_confirmed" | "manual" {
  if (confidenceBps >= 9800) return "exact";
  if (confidenceBps >= 7500) return "fuzzy_confirmed";
  return "manual";
}

export function canTransitionMdm(current: MdmLifecycle, next: MdmLifecycle): boolean {
  const transitions: Record<MdmLifecycle, MdmLifecycle[]> = {
    draft: ["active", "inactive"],
    active: ["inactive", "archived"],
    inactive: ["active", "archived"],
    archived: [],
  };
  return current === next || transitions[current].includes(next);
}

export function resolveConflict(rule: MdmConflictRule, sourceOfTruth: string, conflictingSource: string): string {
  if (rule === "source_of_truth") return sourceOfTruth;
  if (rule === "entity_owned") return "entity-owned-local-record";
  if (rule === "latest_approved") return "latest-approved-value";
  return `manual-review:${conflictingSource}`;
}

export function sameEntityScope(left?: number | null, right?: number | null): boolean {
  return left == null || right == null || left === right;
}
