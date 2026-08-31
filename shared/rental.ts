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

export function vehicleProfitability(revenueMinor: number, expenseMinor: number) {
  const netContributionMinor = revenueMinor - expenseMinor;
  return { netContributionMinor, marginBps: revenueMinor > 0 ? Math.round(netContributionMinor * 10000 / revenueMinor) : 0 };
}
