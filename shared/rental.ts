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
