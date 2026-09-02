import { describe, expect, it } from "vitest";
import { calculateCostPerKm, calculateFuelCost, calculateFuelEconomy, canTransitionFleetVehicle, isFreshTelematicsEvent, isOdometerMonotonic, isRentalEligible, maskCoordinate } from "../shared/fleetOperations";

describe("fleet operations invariants", () => {
  it("allows only safe lifecycle transitions", () => {
    expect(canTransitionFleetVehicle("available", "reserved")).toBe(true);
    expect(canTransitionFleetVehicle("maintenance", "rented")).toBe(false);
    expect(canTransitionFleetVehicle("sold_transferred", "available")).toBe(false);
    expect(isRentalEligible("available")).toBe(true);
    expect(isRentalEligible("maintenance")).toBe(false);
  });
  it("calculates fuel and cost metrics deterministically", () => {
    expect(calculateFuelCost(42.5, 180)).toBe(7650);
    expect(calculateFuelEconomy(425, 42.5)).toBe(10);
    expect(calculateCostPerKm(7650, 425)).toBe(18);
  });
  it("prevents odometer rollback and masks location precision", () => {
    expect(isOdometerMonotonic(1000, 1000)).toBe(true);
    expect(isOdometerMonotonic(1000, 999)).toBe(false);
    expect(maskCoordinate(24.7136)).toBe("24.71");
    expect(maskCoordinate("not-a-coordinate")).toBeNull();
  });
  it("accepts fresh telematics events but rejects stale ones", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    expect(isFreshTelematicsEvent(new Date("2026-08-31T23:55:00Z"), now)).toBe(true);
    expect(isFreshTelematicsEvent(new Date("2026-08-31T23:00:00Z"), now)).toBe(false);
  });
});
