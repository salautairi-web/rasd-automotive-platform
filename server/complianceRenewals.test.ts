import { describe, expect, it } from "vitest";
import { buildRenewalSummary, daysUntil, filterRenewals, renewalUrgency, type RenewalItem } from "../shared/compliance42";

const now = new Date("2026-09-01T00:00:00Z");
const items: RenewalItem[] = [
  { id: 1, type: "permit", label: "تصريح البلدية", expiryDate: "2026-08-28T00:00:00Z", status: "active", sourceKey: "فرع الرياض" },
  { id: 2, type: "contract", label: "عقد المورد الرئيسي", expiryDate: "2026-09-05T00:00:00Z", status: "active", sourceKey: "توريد" },
  { id: 3, type: "permit", label: "ترخيص ورشة", expiryDate: "2026-10-15T00:00:00Z", status: "active", sourceKey: "الورشة" },
  { id: 4, type: "contract", label: "عقد خدمات", expiryDate: null, status: "draft", sourceKey: "خدمات" },
];

describe("compliance renewal early warnings", () => {
  it("calculates deterministic day bands", () => {
    expect(daysUntil("2026-09-05T00:00:00Z", now)).toBe(4);
    expect(renewalUrgency("2026-08-28T00:00:00Z", now)).toBe("overdue");
    expect(renewalUrgency("2026-09-05T00:00:00Z", now)).toBe("critical");
    expect(renewalUrgency("2026-10-15T00:00:00Z", now)).toBe("planned");
    expect(renewalUrgency(null, now)).toBe("unknown");
  });

  it("summarizes attention items without fabricating missing dates", () => {
    const summary = buildRenewalSummary(items, now);
    expect(summary.total).toBe(4);
    expect(summary.counts.overdue).toBe(1);
    expect(summary.counts.critical).toBe(1);
    expect(summary.counts.unknown).toBe(1);
    expect(summary.attention).toBe(2);
  });

  it("filters by type, urgency, horizon, and Arabic query", () => {
    expect(filterRenewals(items, { type: "permit", urgency: "all", horizonDays: "all" }, now).map((item) => item.id)).toEqual([1, 3]);
    expect(filterRenewals(items, { type: "all", urgency: "critical", horizonDays: "all" }, now).map((item) => item.id)).toEqual([2]);
    expect(filterRenewals(items, { type: "all", urgency: "all", horizonDays: 30 }, now).map((item) => item.id)).toEqual([1, 2]);
    expect(filterRenewals(items, { type: "all", urgency: "all", query: "الورشة", horizonDays: "all" }, now).map((item) => item.id)).toEqual([3]);
  });

  it("keeps source records scoped by the supplied collection", () => {
    const entityOne = items.filter((item) => item.id <= 2);
    const entityTwo = items.filter((item) => item.id > 2);
    expect(buildRenewalSummary(entityOne, now).total).toBe(2);
    expect(buildRenewalSummary(entityTwo, now).total).toBe(2);
    expect(filterRenewals(entityOne, { type: "all", urgency: "all", horizonDays: "all" }, now).some((item) => item.id === 3)).toBe(false);
  });
});
