import { describe, expect, it } from "vitest";
import { rentalNotificationLabel, requiresRentalFinancialMfa } from "../shared/rentalSecurity";

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
});
