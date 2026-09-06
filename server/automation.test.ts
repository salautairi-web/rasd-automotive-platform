import { describe, expect, it } from "vitest";
import { canPublishWorkflow, compensationRequired, evaluateRuleGroup, exceedsWorkflowDepth, isDuplicateWorkflowEvent, isQuietHour, pinExecutionVersion, requiresDualEntityApproval, retryBackoffSeconds, shouldDeadLetter } from "../shared/automation";

describe("automation engine controls", () => {
  it("evaluates compound rules", () => expect(evaluateRuleGroup([{ field: "amount", operator: "gte", value: 100 }, { field: "entity", operator: "eq", value: 4 }], "and", { amount: 150, entity: 4 })).toBe(true));
  it("uses exponential capped backoff", () => { expect(retryBackoffSeconds(1)).toBe(30); expect(retryBackoffSeconds(9)).toBe(3600); });
  it("blocks loops and dead letters exhausted work", () => { expect(exceedsWorkflowDepth(8, 8)).toBe(true); expect(shouldDeadLetter(3, 3, true)).toBe(true); });
  it("supports overnight quiet hours", () => expect(isQuietHour(23, 22, 7)).toBe(true));
  it("only publishes a defined workflow in an approved lifecycle state", () => { expect(canPublishWorkflow("approved", true)).toBe(true); expect(canPublishWorkflow("archived", true)).toBe(false); });
  it("pins an execution to the requested version or current version", () => { expect(pinExecutionVersion(4)).toBe(4); expect(pinExecutionVersion(4, 2)).toBe(2); });
  it("deduplicates repeated events by idempotency key", () => { expect(isDuplicateWorkflowEvent("evt-1", "evt-1")).toBe(true); expect(isDuplicateWorkflowEvent("evt-1", "evt-2")).toBe(false); });
  it("requires dual approval for financial inter-entity effects", () => { expect(requiresDualEntityApproval(1, 2, true)).toBe(true); expect(requiresDualEntityApproval(1, 1, true)).toBe(false); });
  it("requires compensation after failed external effects", () => { expect(compensationRequired("failed", true)).toBe(true); expect(compensationRequired("failed", false)).toBe(false); });
});
