export type IdempotencyDecision = "new" | "replay" | "conflict";

export function decideIdempotency(existingHash: string | null, requestHash: string): IdempotencyDecision {
  if (!existingHash) return "new";
  return existingHash === requestHash ? "replay" : "conflict";
}

export function nextJournalStatus(current: "draft" | "validated" | "approved" | "posted" | "reversed", action: "post" | "reverse") {
  if (action === "post" && current === "validated") return "posted" as const;
  if (action === "reverse" && current === "posted") return "reversed" as const;
  throw new Error("Invalid immutable journal transition");
}
