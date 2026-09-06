export function piiVisible(role: "admin" | "hr_manager" | "manager" | "employee", classification: "restricted" | "confidential" | "internal") {
  if (role === "admin" || role === "hr_manager") return true;
  return classification === "internal" || (role === "employee" && classification === "confidential");
}

export function leaveBalanceAfter(entitled: number, used: number, pending: number, requested: number, allowNegative = false) {
  if (requested <= 0) throw new Error("invalid_leave_days");
  const available = entitled - used - pending;
  if (!allowNegative && requested > available) throw new Error("insufficient_leave_balance");
  return { pendingAfter: pending + requested, availableAfter: available - requested };
}

export function payrollGross(input: { basic: number; allowances: number; overtime: number; bonuses: number; deductions: number }) {
  const gross = input.basic + input.allowances + input.overtime + input.bonuses;
  const net = gross - input.deductions;
  if ([input.basic, input.allowances, input.overtime, input.bonuses, input.deductions].some(value => value < 0) || net < 0) throw new Error("invalid_payroll_components");
  return { gross, net };
}

export function allocationTotal(values: number[]) {
  if (values.some(value => value < 0) || values.length === 0) throw new Error("invalid_allocation");
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total > 100.0001) throw new Error("allocation_exceeds_100_percent");
  return total;
}

export function canReversePayroll(status: "draft" | "calculated" | "pending_approval" | "approved" | "posted" | "cancelled") {
  return status === "posted" || status === "approved";
}

export function effectiveRecordAt(date: Date, effectiveFrom: Date, effectiveTo?: Date) {
  return date.getTime() >= effectiveFrom.getTime() && (!effectiveTo || date.getTime() < effectiveTo.getTime());
}

export function canAccessSalary(role: "admin" | "hr_manager" | "manager" | "employee", sameEntity: boolean) {
  return sameEntity && (role === "admin" || role === "hr_manager");
}

export function validateMultiEntityAssignment(employerEntityId: number, serviceEntityId: number, approved: boolean) {
  return employerEntityId !== serviceEntityId && approved;
}
