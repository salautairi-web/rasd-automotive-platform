import { describe, expect, it } from "vitest";
import { calculateDepositSettlement, canCheckinContract, canCheckoutContract, hasReservationConflict, maintenanceState, validateOdometer, vehicleProfitability } from "../shared/rental";

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
});
