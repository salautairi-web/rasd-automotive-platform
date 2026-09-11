import { describe, expect, it } from "vitest";
import { allowedTransition, canApprove, delegationActive, idempotencyMatches, quorumReached, shouldEscalate, workflowProgress } from "../shared/workflow52";

describe("Workflow BPM 52", () => {
  it("validates lifecycle transitions", () => {
    expect(allowedTransition("running", "waiting_approval")).toBe(true);
    expect(allowedTransition("completed", "running")).toBe(false);
  });
  it("enforces maker-checker and step-up", () => {
    expect(canApprove(4, 5, false, false)).toBe(true);
    expect(canApprove(4, 4, false, true)).toBe(false);
    expect(canApprove(4, 5, true, false)).toBe(false);
    expect(canApprove(4, 5, true, true)).toBe(true);
  });
  it("supports quorum, delegation expiry and idempotency", () => {
    expect(quorumReached(2, 2)).toBe(true);
    expect(quorumReached(1, 2)).toBe(false);
    expect(delegationActive("active", new Date("2026-01-01"), new Date("2026-02-01"), new Date("2026-01-15"))).toBe(true);
    expect(delegationActive("active", new Date("2026-01-01"), new Date("2026-02-01"), new Date("2026-03-01"))).toBe(false);
    expect(idempotencyMatches("abc", "abc")).toBe(true);
  });
  it("detects overdue work and exposes progress", () => {
    expect(shouldEscalate(new Date("2026-01-01"), new Date("2026-01-02"))).toBe(true);
    expect(workflowProgress("waiting_approval")).toBe(55);
  });
});
