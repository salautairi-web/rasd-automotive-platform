export type WorkshopJobStatus = "received" | "diagnosing" | "awaiting_approval" | "awaiting_parts" | "in_progress" | "qc" | "road_test" | "ready" | "delivered" | "closed" | "warranty_repeat";

const transitions: Record<WorkshopJobStatus, WorkshopJobStatus[]> = {
  received: ["diagnosing", "cancelled" as WorkshopJobStatus], diagnosing: ["awaiting_approval", "awaiting_parts", "in_progress"], awaiting_approval: ["awaiting_parts", "in_progress", "received"], awaiting_parts: ["in_progress"], in_progress: ["qc", "awaiting_parts", "warranty_repeat"], qc: ["road_test", "ready", "in_progress"], road_test: ["ready", "in_progress"], ready: ["delivered"], delivered: ["closed", "warranty_repeat"], closed: ["warranty_repeat"], warranty_repeat: ["diagnosing", "in_progress"],
};

export function canTransitionWorkshopJob(from: WorkshopJobStatus, to: WorkshopJobStatus) {
  // Delivery is a guarded business operation, never a generic status transition.
  return from === to || (to !== "delivered" && (transitions[from] ?? []).includes(to));
}

export function calculateWorkshopEstimate(input: { laborMinor: number; partsMinor: number; subcontractMinor: number; consumablesMinor: number; taxMinor: number; discountMinor: number }) {
  const subtotal = input.laborMinor + input.partsMinor + input.subcontractMinor + input.consumablesMinor;
  return Math.max(0, subtotal + input.taxMinor - input.discountMinor);
}

export function estimateStatusAfterDecision(decision: "approved" | "rejected" | "change_requested") {
  return decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "partially_approved";
}

export function isValidWorkshopMileage(startMileage: number, endMileage: number) {
  return Number.isInteger(startMileage) && Number.isInteger(endMileage) && startMileage >= 0 && endMileage >= startMileage;
}

export function isValidWorkshopScheduleWindow(startsAt: Date, endsAt: Date) {
  return startsAt instanceof Date && endsAt instanceof Date && !Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime()) && endsAt.getTime() > startsAt.getTime();
}

export function workshopScheduleOverlaps(input: { startsAt: Date; endsAt: Date; existing: Array<{ startsAt: Date; endsAt: Date; status: string }> }) {
  if (!isValidWorkshopScheduleWindow(input.startsAt, input.endsAt)) return true;
  return input.existing.some(item => item.status !== "cancelled" && item.startsAt.getTime() < input.endsAt.getTime() && item.endsAt.getTime() > input.startsAt.getTime());
}

export function canDeliverWorkshopJob(input: { status: WorkshopJobStatus; invoiceStatus: "pending" | "issued" | "paid"; paymentStatus: "pending" | "partial" | "paid" | "waived"; customerAcknowledgement: boolean; requiredDocumentsPresent: boolean; qcPassed: boolean }) {
  return input.status === "ready" && input.qcPassed && input.requiredDocumentsPresent && input.customerAcknowledgement && (input.paymentStatus === "paid" || input.paymentStatus === "waived") && input.invoiceStatus !== "pending";
}

export function calculateWorkshopKpis(rows: Array<{ revenueMinor: number; costMinor: number; cycleHours: number; comeback: boolean; firstTimeFix: boolean }>) {
  if (!rows.length) return { revenueMinor: 0, grossMarginMinor: 0, averageRepairOrderMinor: 0, averageCycleHours: 0, comebackRateBps: 0, firstTimeFixRateBps: 0 };
  const revenueMinor = rows.reduce((sum, row) => sum + row.revenueMinor, 0);
  const costMinor = rows.reduce((sum, row) => sum + row.costMinor, 0);
  return { revenueMinor, grossMarginMinor: revenueMinor - costMinor, averageRepairOrderMinor: Math.round(revenueMinor / rows.length), averageCycleHours: Math.round(rows.reduce((sum, row) => sum + row.cycleHours, 0) / rows.length), comebackRateBps: Math.round(rows.filter(row => row.comeback).length / rows.length * 10000), firstTimeFixRateBps: Math.round(rows.filter(row => row.firstTimeFix).length / rows.length * 10000) };
}

export function maskWorkshopCustomer(value: string, allowed: boolean) {
  return allowed ? value : value.length <= 4 ? "••••" : `${value.slice(0, 2)}••••${value.slice(-2)}`;
}
