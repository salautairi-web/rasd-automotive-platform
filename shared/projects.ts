export const PROJECT_LIFECYCLES = ["idea", "assessment", "business_case", "approval", "planning", "execution", "monitoring", "go_live", "closure", "post_implementation_review"] as const;
export type ProjectLifecycle = (typeof PROJECT_LIFECYCLES)[number];

export const PROJECT_TASK_STATUSES = ["backlog", "planned", "in_progress", "blocked", "review", "completed", "cancelled"] as const;
export type ProjectTaskStatus = (typeof PROJECT_TASK_STATUSES)[number];

const lifecycleOrder: Record<ProjectLifecycle, number> = {
  idea: 0, assessment: 1, business_case: 2, approval: 3, planning: 4,
  execution: 5, monitoring: 6, go_live: 7, closure: 8, post_implementation_review: 9,
};

export function canTransitionLifecycle(from: ProjectLifecycle, to: ProjectLifecycle): boolean {
  if (from === to) return true;
  if (to === "cancelled" as ProjectLifecycle) return from !== "closure" && from !== "post_implementation_review";
  if (from === "post_implementation_review") return false;
  return lifecycleOrder[to] === lifecycleOrder[from] + 1;
}

export function isProjectLifecycleComplete(lifecycle: ProjectLifecycle, checks: { businessCaseApproved: boolean; gateApproved: boolean; goLiveApproved: boolean; financialClose: boolean }): boolean {
  if (lifecycle === "approval" || lifecycle === "planning") return checks.businessCaseApproved && checks.gateApproved;
  if (lifecycle === "go_live") return checks.goLiveApproved;
  if (lifecycle === "closure") return checks.financialClose && checks.goLiveApproved;
  return true;
}

export function dependencyCreatesCycle(edges: Array<{ sourceId: number; targetId: number }>, sourceId: number, targetId: number): boolean {
  if (sourceId === targetId) return true;
  const graph = new Map<number, number[]>();
  for (const edge of edges) graph.set(edge.sourceId, [...(graph.get(edge.sourceId) ?? []), edge.targetId]);
  graph.set(sourceId, [...(graph.get(sourceId) ?? []), targetId]);
  const visited = new Set<number>();
  const stack = [sourceId];
  while (stack.length) {
    const current = stack.pop()!;
    if (current === sourceId && visited.has(current)) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of graph.get(current) ?? []) {
      if (next === sourceId) return true;
      stack.push(next);
    }
  }
  return false;
}

export function calculateBudgetRemaining(budgetMinor: number, committedMinor: number, actualMinor: number, forecastMinor = 0): number {
  return budgetMinor - committedMinor - actualMinor - forecastMinor;
}

export function calculateRiskScore(probabilityBps: number, impactBps: number): number {
  return Math.round(Math.max(0, Math.min(10000, probabilityBps)) * Math.max(0, Math.min(10000, impactBps)) / 10000);
}

export function portfolioProgress(progressBps: number[]): number {
  if (!progressBps.length) return 0;
  return Math.round(progressBps.reduce((sum, value) => sum + value, 0) / progressBps.length);
}
