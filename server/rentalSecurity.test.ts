import { describe, expect, it } from "vitest";
import { filterAndSortRentalAuditTrail, filterAndSortRentalNotifications, rentalNotificationLabel, requiresRentalFinancialMfa } from "../shared/rentalSecurity";

const date = (day: number) => new Date(`2026-10-${String(day).padStart(2, "0")}T10:00:00Z`);

describe("Rental security rules", () => {
  it("requires MFA only for non-admin financial rental roles", () => {
    expect(requiresRentalFinancialMfa({ isAdmin: true, roleKey: "finance_manager" })).toBe(false);
    expect(requiresRentalFinancialMfa({ isAdmin: false, roleKey: "finance_manager" })).toBe(true);
    expect(requiresRentalFinancialMfa({ isAdmin: false, roleKey: "accountant" })).toBe(true);
    expect(requiresRentalFinancialMfa({ isAdmin: false, roleKey: "rental_agent" })).toBe(false);
  });

  it("keeps notification categories clear in the Arabic dashboard", () => {
    expect(rentalNotificationLabel("reservation")).toBe("حجز");
    expect(rentalNotificationLabel("contract")).toBe("عقد");
    expect(rentalNotificationLabel("deposit")).toBe("وديعة");
    expect(rentalNotificationLabel("invoice")).toBe("فاتورة");
  });

  it("filters and sorts notifications by type, severity, and urgency", () => {
    const items = [
      { id: "a", type: "reservation", severity: "normal", createdAt: date(1) },
      { id: "b", type: "invoice", severity: "critical", createdAt: date(3) },
      { id: "c", type: "invoice", severity: "high", createdAt: date(2) },
    ];
    expect(filterAndSortRentalNotifications(items, { type: "invoice", sort: "urgency" }).map(item => item.id)).toEqual(["b", "c"]);
    expect(filterAndSortRentalNotifications(items, { severity: "critical" }).map(item => item.id)).toEqual(["b"]);
  });

  it("filters audit events by date, resource type, outcome, and order", () => {
    const events = [
      { id: 1, action: "login", resourceType: "session", resourceId: "s1", outcome: "success", createdAt: date(1) },
      { id: 2, action: "invoice.post", resourceType: "financial", resourceId: "i1", outcome: "success", createdAt: date(2) },
      { id: 3, action: "entity.update", resourceType: "entity", resourceId: "e1", outcome: "denied", createdAt: date(3) },
    ];
    expect(filterAndSortRentalAuditTrail(events, { from: date(2), to: date(3), resourceType: "financial", outcome: "success" }).map(event => event.id)).toEqual([2]);
    expect(filterAndSortRentalAuditTrail(events, { sort: "oldest" }).map(event => event.id)).toEqual([1, 2, 3]);
  });
});
