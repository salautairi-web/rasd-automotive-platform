import { describe, expect, it } from "vitest";
import { canTransitionFieldStatus, classifySyncQueue, decideOfflineReplay, hasValidLocationConsent, summarizeFieldAssignments } from "../shared/mobile46";

describe("mobile field operations", () => {
  it("guards field lifecycle transitions", () => {
    expect(canTransitionFieldStatus("assigned", "accepted")).toBe(true);
    expect(canTransitionFieldStatus("completed", "in_progress")).toBe(false);
  });
  it("distinguishes new replay and conflict offline operations", () => {
    expect(decideOfflineReplay(undefined, "a")).toBe("new");
    expect(decideOfflineReplay({ fingerprint: "a" }, "a")).toBe("replay");
    expect(decideOfflineReplay({ fingerprint: "a" }, "b")).toBe("conflict");
  });
  it("classifies sync states for safe mobile UX", () => {
    expect(classifySyncQueue("conflict")).toBe("requires_review");
    expect(classifySyncQueue("failed")).toBe("retryable");
    expect(classifySyncQueue("succeeded")).toBe("settled");
  });
  it("requires active location consent", () => {
    expect(hasValidLocationConsent({ decision: "granted" })).toBe(true);
    expect(hasValidLocationConsent({ decision: "granted", expiresAt: new Date(Date.now() - 1000) })).toBe(false);
    expect(hasValidLocationConsent({ decision: "withdrawn" })).toBe(false);
  });
  it("summarizes assigned field work without fabrication", () => {
    expect(summarizeFieldAssignments([{ status: "assigned" }, { status: "completed" }, { status: "assigned" }])).toEqual({ assigned: 2, completed: 1 });
  });
});
