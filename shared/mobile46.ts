export type FieldStatus = "assigned" | "accepted" | "in_progress" | "paused" | "completed" | "cancelled" | "blocked";

const allowed: Record<FieldStatus, FieldStatus[]> = {
  assigned: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["paused", "completed", "blocked"],
  paused: ["in_progress", "cancelled"],
  completed: [],
  cancelled: [],
  blocked: ["in_progress", "cancelled"],
};

export function canTransitionFieldStatus(from: FieldStatus, to: FieldStatus) {
  return allowed[from]?.includes(to) ?? false;
}

export function decideOfflineReplay(existing: { fingerprint: string } | undefined, fingerprint: string) {
  if (!existing) return "new" as const;
  return existing.fingerprint === fingerprint ? "replay" as const : "conflict" as const;
}

export function classifySyncQueue(status: string) {
  if (status === "conflict") return "requires_review" as const;
  if (status === "failed") return "retryable" as const;
  if (status === "queued" || status === "processing") return "pending" as const;
  return "settled" as const;
}

export function hasValidLocationConsent(consent: { decision: "granted" | "withdrawn"; expiresAt?: Date | null } | undefined, now = new Date()) {
  return Boolean(consent?.decision === "granted" && (!consent.expiresAt || consent.expiresAt.getTime() > now.getTime()));
}

export function summarizeFieldAssignments(items: Array<{ status: FieldStatus }>) {
  return items.reduce((summary, item) => { summary[item.status] = (summary[item.status] ?? 0) + 1; return summary; }, {} as Partial<Record<FieldStatus, number>>);
}
