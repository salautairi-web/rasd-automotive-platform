export type FleetVehicleStatus = "available" | "reserved" | "rented" | "maintenance" | "accident" | "inspection" | "ready" | "out_of_service" | "sold_transferred";

const allowedTransitions: Record<FleetVehicleStatus, FleetVehicleStatus[]> = {
  available: ["reserved", "rented", "maintenance", "inspection", "accident", "out_of_service", "sold_transferred"],
  reserved: ["available", "rented", "maintenance", "accident", "out_of_service"],
  rented: ["available", "maintenance", "accident", "inspection", "out_of_service"],
  maintenance: ["inspection", "ready", "out_of_service", "available"],
  accident: ["maintenance", "inspection", "out_of_service", "available"],
  inspection: ["ready", "maintenance", "out_of_service", "available"],
  ready: ["available", "reserved", "rented", "maintenance", "out_of_service"],
  out_of_service: ["maintenance", "available", "sold_transferred"],
  sold_transferred: [],
};

export function canTransitionFleetVehicle(from: FleetVehicleStatus, to: FleetVehicleStatus) {
  return from !== to && allowedTransitions[from]?.includes(to) === true;
}

export function isRentalEligible(status: FleetVehicleStatus) {
  return status === "available" || status === "ready";
}

export function calculateFuelCost(liters: number, unitPriceMinor: number) {
  if (!Number.isFinite(liters) || liters <= 0 || !Number.isInteger(unitPriceMinor) || unitPriceMinor < 0) throw new Error("Invalid fuel values");
  return Math.round(liters * unitPriceMinor);
}

export function calculateFuelEconomy(distanceKm: number, fuelLiters: number) {
  if (distanceKm < 0 || fuelLiters <= 0) return 0;
  return Math.round((distanceKm / fuelLiters) * 100) / 100;
}

export function calculateCostPerKm(totalCostMinor: number, distanceKm: number) {
  if (distanceKm <= 0) return 0;
  return Math.round(totalCostMinor / distanceKm);
}

export function isOdometerMonotonic(previousOdometer: number, nextOdometer: number) {
  return nextOdometer >= previousOdometer;
}

export function isFreshTelematicsEvent(occurredAt: Date, now = new Date(), maxAgeMs = 15 * 60 * 1000) {
  const age = now.getTime() - occurredAt.getTime();
  return age >= -60_000 && age <= maxAgeMs;
}

export function maskCoordinate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric.toFixed(2);
}
