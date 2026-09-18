import { describe, expect, it } from "vitest";
import { calculateDepositSettlement, calculateRentalCharges, canCheckinContract, canCheckoutContract, hasReservationConflict, maintenanceState, validateDepositSettlementApproval, validateOdometer, vehicleProfitability } from "../shared/rental";

describe("Rental lifecycle invariants", () => {
  it("detects overlapping reservations", () => {
    expect(hasReservationConflict(new Date("2026-09-01"), new Date("2026-09-05"), new Date("2026-09-04"), new Date("2026-09-06"))).toBe(true);
    expect(hasReservationConflict(new Date("2026-09-01"), new Date("2026-09-05"), new Date("2026-09-05"), new Date("2026-09-06"))).toBe(false);
  });
  it("prevents odometer rollback", () => {
    expect(validateOdometer(1000, 1100)).toBe(1100);
    expect(() => validateOdometer(1000, 900)).toThrow("Odometer cannot decrease");
  });
  it("marks maintenance overdue by date or mileage", () => {
    expect(maintenanceState(new Date("2026-09-10"), new Date("2026-09-01"), 1000, 2000)).toBe("overdue");
    expect(maintenanceState(new Date("2026-09-01"), new Date("2026-09-10"), 2500, 2000)).toBe("overdue");
  });
  it("guards checkout and checkin transitions", () => {
    expect(canCheckoutContract("draft", "available", 1200, 1200)).toBe(true);
    expect(canCheckoutContract("active", "available", 1200, 1200)).toBe(false);
    expect(canCheckinContract("active", 1200, 1350)).toBe(true);
    expect(canCheckinContract("active", 1400, 1350)).toBe(false);
  });
  it("settles deposits without overdrawing the held amount", () => {
    expect(calculateDepositSettlement(100000, 25000)).toEqual({ refundableMinor: 75000, deductedMinor: 25000 });
    expect(() => calculateDepositSettlement(100000, 110000)).toThrow("Invalid deposit settlement");
  });
  it("calculates per-vehicle net contribution and margin", () => {
    expect(vehicleProfitability(200000, 50000)).toEqual({ netContributionMinor: 150000, marginBps: 7500 });
  });
  it("calculates fuel, mileage, lateness, and additional driver charges", () => {
    expect(calculateRentalCharges({ mileage: 1400, allowedMileage: 1000, fuelLevel: 75, fuelRateMinor: 1500, extraMileageRateMinor: 250, lateDays: 2, lateDayRateMinor: 10000, additionalDrivers: 1, additionalDriverRateMinor: 5000 })).toMatchObject({ fuelGap: 25, extraKm: 400, fuelMinor: 37500, extraMileageMinor: 100000, lateReturnMinor: 20000, additionalDriverMinor: 5000, totalMinor: 162500 });
  });
  it("requires an accountant role and pending status for deposit approval", () => {
    expect(validateDepositSettlementApproval("pending_accountant", "accountant")).toBe(true);
    expect(() => validateDepositSettlementApproval("pending_accountant", "sales_agent")).toThrow("Accountant approval is required");
    expect(() => validateDepositSettlementApproval("applied", "accountant")).toThrow("Settlement is not awaiting approval");
  });
});
