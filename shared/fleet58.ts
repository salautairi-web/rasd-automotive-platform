export type FleetLifecycle58 = "available" | "reserved" | "rented" | "maintenance" | "accident" | "inspection" | "ready" | "out_of_service" | "sold_transferred";

export function calculateUtilization58(input: { availableDays: number; rentedDays: number; maintenanceDays: number; accidentDays: number; idleDays: number }) {
  const denominator = Math.max(0, input.availableDays + input.rentedDays + input.maintenanceDays + input.accidentDays + input.idleDays);
  const utilizationPercent = denominator === 0 ? 0 : (input.rentedDays / denominator) * 100;
  const availabilityPercent = denominator === 0 ? 0 : (input.availableDays / denominator) * 100;
  const downtimePercent = denominator === 0 ? 0 : ((input.maintenanceDays + input.accidentDays) / denominator) * 100;
  return { utilizationPercent: Number(utilizationPercent.toFixed(3)), availabilityPercent: Number(availabilityPercent.toFixed(3)), downtimePercent: Number(downtimePercent.toFixed(3)) };
}

export function calculateFuelAnalytics58(distanceKm: number, liters: number, totalMinor: number, expectedPer100Km = 8) {
  const actualPer100Km = distanceKm > 0 ? (liters / distanceKm) * 100 : 0;
  const costPerKmMinor = distanceKm > 0 ? totalMinor / distanceKm : 0;
  const deviationPercent = expectedPer100Km > 0 ? ((actualPer100Km - expectedPer100Km) / expectedPer100Km) * 100 : 0;
  return { actualPer100Km: Number(actualPer100Km.toFixed(3)), costPerKmMinor: Number(costPerKmMinor.toFixed(3)), deviationPercent: Number(deviationPercent.toFixed(3)), anomalous: deviationPercent >= 25 || deviationPercent <= -25 };
}

export function driverCompliance58(licenseExpiresAt: Date | null, trainingStatus: "valid" | "expiring" | "expired" | "not_started", now = new Date(), warningDays = 30) {
  const daysToExpiry = licenseExpiresAt ? Math.ceil((licenseExpiresAt.getTime() - now.getTime()) / 86_400_000) : null;
  const licenseOk = daysToExpiry !== null && daysToExpiry >= 0;
  const warning = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= warningDays;
  return { licenseOk, warning, daysToExpiry, trainingOk: trainingStatus === "valid" };
}

export function telemetryAccess58(input: { purpose: "maintenance" | "safety" | "utilization" | "incident" | "rental"; allowLiveTracking: boolean; maskCoordinates: boolean; role: string; allowedRoles: string[] }) {
  const allowed = input.allowedRoles.includes(input.role) || input.role === "admin";
  return { allowed, liveTrackingAllowed: allowed && input.allowLiveTracking && input.purpose === "safety", coordinatesMasked: input.maskCoordinates || !allowed };
}

export function isFuelAnomaly58(actualPer100Km: number, expectedPer100Km: number, tolerancePercent = 25) {
  if (expectedPer100Km <= 0) return false;
  return Math.abs(((actualPer100Km - expectedPer100Km) / expectedPer100Km) * 100) >= tolerancePercent;
}

export function lifecycleTransition58(from: FleetLifecycle58, to: FleetLifecycle58) {
  const transitions: Record<FleetLifecycle58, FleetLifecycle58[]> = {
    available: ["reserved", "rented", "maintenance", "accident", "out_of_service"], reserved: ["available", "rented", "maintenance", "accident"], rented: ["available", "maintenance", "accident"], maintenance: ["ready", "out_of_service", "accident"], accident: ["maintenance", "out_of_service", "ready"], inspection: ["ready", "maintenance", "out_of_service"], ready: ["available", "reserved", "rented", "maintenance"], out_of_service: ["maintenance", "sold_transferred"], sold_transferred: [],
  };
  return from === to || transitions[from].includes(to);
}
