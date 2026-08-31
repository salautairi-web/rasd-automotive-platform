import { describe, expect, it } from "vitest";
import { hasReservationConflict, maintenanceState, validateOdometer } from "../shared/rental";

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
});
