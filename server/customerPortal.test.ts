import { describe, expect, it } from "vitest";
import { canReplyToPortalTicket, filterPortalActivity, formatPortalMoney, ownsPortalRecord, type PortalActivity } from "../shared/customerPortal";

const items: PortalActivity[] = [
  { id: "1", kind: "order", title: "قطع غيار", reference: "ORD-1", status: "submitted", createdAt: new Date("2026-10-01T10:00:00Z") },
  { id: "2", kind: "reservation", title: "تأجير", reference: "RSV-2", status: "confirmed", createdAt: new Date("2026-10-03T10:00:00Z") },
  { id: "3", kind: "payment", title: "دفعة", reference: "PAY-3", status: "failed", createdAt: new Date("2026-10-02T10:00:00Z") },
];
describe("Customer portal display rules", () => {
  const defaults = { query: "", kind: "all", status: "all", sort: "newest" };
  it("sorts by UTC date without mutating the source", () => {
    expect(filterPortalActivity(items, defaults).map(i => i.id)).toEqual(["2", "3", "1"]);
    expect(filterPortalActivity(items, { ...defaults, sort: "oldest" }).map(i => i.id)).toEqual(["1", "3", "2"]);
    expect(items.map(i => i.id)).toEqual(["1", "2", "3"]);
  });
  it("combines type and status filters", () => {
    expect(filterPortalActivity(items, { ...defaults, kind: "payment", status: "failed" })).toEqual([items[2]]);
    expect(filterPortalActivity(items, { ...defaults, kind: "order", status: "confirmed" })).toEqual([]);
  });
  it("searches Arabic labels and case-insensitive references", () => {
    expect(filterPortalActivity(items, { ...defaults, query: " قيد المراجعة " })).toEqual([items[0]]);
    expect(filterPortalActivity(items, { ...defaults, query: "rsv-2" })).toEqual([items[1]]);
  });
  it("formats minor amounts according to the ISO currency, not always /1000", () => {
    expect(formatPortalMoney(1250, "OMR", "en-US")).toContain("1.250");
    expect(formatPortalMoney(1250, "USD", "en-US")).toBe("$12.50");
    expect(formatPortalMoney(1250, "JPY", "en-US")).toContain("1,250");
  });
  it("blocks replies after resolution or closure", () => {
    expect(canReplyToPortalTicket("open")).toBe(true);
    expect(canReplyToPortalTicket("in_progress")).toBe(true);
    expect(canReplyToPortalTicket("resolved")).toBe(false);
    expect(canReplyToPortalTicket("closed")).toBe(false);
  });
  it("isolates record ownership by user, entity and relationship", () => {
    const record = { portalUserId: 7, businessEntityId: 101, relationshipId: 42 };
    expect(ownsPortalRecord(record, record)).toBe(true);
    for (const key of ["portalUserId", "businessEntityId", "relationshipId"] as const) expect(ownsPortalRecord(record, { ...record, [key]: 999 })).toBe(false);
  });
});
