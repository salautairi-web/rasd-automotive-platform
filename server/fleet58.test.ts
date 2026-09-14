import { describe, expect, it } from "vitest";
import { calculateFuelAnalytics58, calculateUtilization58, driverCompliance58, isFuelAnomaly58, lifecycleTransition58, telemetryAccess58 } from "../shared/fleet58";

describe("fleet 58 invariants", () => {
  it("calculates utilization and downtime deterministically", () => {
    expect(calculateUtilization58({ availableDays: 10, rentedDays: 12, maintenanceDays: 2, accidentDays: 1, idleDays: 5 })).toEqual({ utilizationPercent: 40, availabilityPercent: 33.333, downtimePercent: 10 });
  });
  it("detects fuel deviation and calculates cost per km", () => {
    const result = calculateFuelAnalytics58(200, 30, 6000, 8);
    expect(result.actualPer100Km).toBe(15);
    expect(result.costPerKmMinor).toBe(30);
    expect(result.anomalous).toBe(true);
    expect(isFuelAnomaly58(15, 8)).toBe(true);
  });
  it("enforces driver licence and training compliance", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(driverCompliance58(new Date("2026-01-20T00:00:00Z"), "valid", now).warning).toBe(true);
    expect(driverCompliance58(new Date("2025-12-20T00:00:00Z"), "valid", now).licenseOk).toBe(false);
    expect(driverCompliance58(new Date("2026-12-20T00:00:00Z"), "not_started", now).trainingOk).toBe(false);
  });
  it("restricts lifecycle and telemetry by policy", () => {
    expect(lifecycleTransition58("available", "rented")).toBe(true);
    expect(lifecycleTransition58("sold_transferred", "available")).toBe(false);
    expect(telemetryAccess58({ purpose: "maintenance", allowLiveTracking: true, maskCoordinates: true, role: "fleet", allowedRoles: ["fleet"] })).toEqual({ allowed: true, liveTrackingAllowed: false, coordinatesMasked: true });
    expect(telemetryAccess58({ purpose: "safety", allowLiveTracking: true, maskCoordinates: false, role: "viewer", allowedRoles: ["fleet"] }).coordinatesMasked).toBe(true);
  });
});
