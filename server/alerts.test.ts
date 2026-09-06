import { describe, expect, it } from "vitest";
import { alertDedupeKey, canCloseAlert, evaluateThreshold, requiresHumanApproval, shouldEscalate } from "../shared/alerts";

describe("early warning controls", () => {
  it("evaluates absolute thresholds", () => { expect(evaluateThreshold(101, "gt", 100)).toBe(true); expect(evaluateThreshold(99, "gte", 100)).toBe(false); });
  it("creates stable entity-scoped dedupe keys", () => { expect(alertDedupeKey(1, 2, "vehicle", "V-1", "maintenance")).toBe("1:2:vehicle:V-1:maintenance"); });
  it("escalates overdue high-risk alerts only", () => { const now = new Date("2026-01-02T00:00:00Z"); expect(shouldEscalate("open", new Date("2026-01-01T00:00:00Z"), now, "high")).toBe(true); expect(shouldEscalate("open", new Date("2026-01-01T00:00:00Z"), now, "low")).toBe(false); });
  it("requires human approval for sensitive alert actions", () => { expect(requiresHumanApproval("critical", "financial")).toBe(true); expect(requiresHumanApproval("critical", "create_task")).toBe(false); });
  it("requires evidence before closing critical alerts", () => { expect(canCloseAlert("critical", false)).toBe(false); expect(canCloseAlert("critical", true)).toBe(true); });
});
