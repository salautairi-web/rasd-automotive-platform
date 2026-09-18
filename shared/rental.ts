export function hasReservationConflict(existingStart: Date, existingEnd: Date, requestedStart: Date, requestedEnd: Date) {
  return existingStart < requestedEnd && existingEnd > requestedStart;
}

export function validateOdometer(previous: number, next: number) {
  if (next < previous) throw new Error("Odometer cannot decrease");
  return next;
}

export function maintenanceState(now: Date, dueDate?: Date | null, currentOdometer = 0, dueOdometer?: number | null) {
  if ((dueDate && dueDate.getTime() < now.getTime()) || (dueOdometer != null && currentOdometer >= dueOdometer)) return "overdue" as const;
  return "healthy" as const;
}

export function canCheckoutContract(contractStatus: string, vehicleStatus: string, currentOdometer: number, checkoutOdometer: number) {
  return contractStatus === "draft" && ["available", "reserved", "ready"].includes(vehicleStatus) && checkoutOdometer >= currentOdometer;
}

export function canCheckinContract(contractStatus: string, currentOdometer: number, checkinOdometer: number) {
  return ["active", "extended"].includes(contractStatus) && checkinOdometer >= currentOdometer;
}

export function calculateDepositSettlement(amountMinor: number, deductionsMinor: number, priorRefundMinor = 0) {
  if (amountMinor < 0 || deductionsMinor < 0 || priorRefundMinor < 0 || deductionsMinor + priorRefundMinor > amountMinor) throw new Error("Invalid deposit settlement");
  return { refundableMinor: amountMinor - deductionsMinor - priorRefundMinor, deductedMinor: deductionsMinor };
}

export type RentalChargeInput = {
  mileage: number;
  allowedMileage?: number | null;
  fuelLevel: number;
  fuelTargetLevel?: number;
  fuelRateMinor: number;
  extraMileageRateMinor: number;
  lateDays: number;
  lateDayRateMinor: number;
  additionalDrivers: number;
  additionalDriverRateMinor: number;
};

export function calculateRentalCharges(input: RentalChargeInput) {
  const extraKm = Math.max(0, input.mileage - (input.allowedMileage ?? input.mileage));
  const fuelGap = Math.max(0, (input.fuelTargetLevel ?? 100) - input.fuelLevel);
  const charges = {
    fuelMinor: fuelGap * input.fuelRateMinor,
    extraMileageMinor: extraKm * input.extraMileageRateMinor,
    lateReturnMinor: input.lateDays * input.lateDayRateMinor,
    additionalDriverMinor: input.additionalDrivers * input.additionalDriverRateMinor,
  };
  return { ...charges, extraKm, fuelGap, totalMinor: Object.values(charges).reduce((sum, amount) => sum + amount, 0) };
}

export function validateDepositSettlementApproval(status: string, role: string) {
  if (status !== "pending_accountant") throw new Error("Settlement is not awaiting approval");
  if (!["admin", "accountant"].includes(role)) throw new Error("Accountant approval is required");
  return true;
}

export function vehicleProfitability(revenueMinor: number, expenseMinor: number) {
  const netContributionMinor = revenueMinor - expenseMinor;
  return { netContributionMinor, marginBps: revenueMinor > 0 ? Math.round(netContributionMinor * 10000 / revenueMinor) : 0 };
}
