export type WorkOrderStatus = "draft" | "approved" | "in_progress" | "waiting_parts" | "waiting_approval" | "quality_check" | "ready" | "delivered" | "cancelled";

const allowed: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  draft: ["approved", "cancelled"], approved: ["in_progress", "cancelled"],
  in_progress: ["waiting_parts", "waiting_approval", "quality_check", "cancelled"],
  waiting_parts: ["in_progress", "cancelled"], waiting_approval: ["in_progress", "cancelled"],
  quality_check: ["in_progress", "ready"], ready: ["delivered"], delivered: [], cancelled: [],
};

export function canTransitionWorkOrder(from: WorkOrderStatus, to: WorkOrderStatus) {
  return allowed[from].includes(to);
}

export function canDeliverWorkshopVehicle(status: WorkOrderStatus, qualityPassed: boolean, outstandingMinor: number, override = false) {
  return status === "ready" && qualityPassed && (outstandingMinor <= 0 || override);
}

export function requiresEstimateApproval(totalMinor: number, thresholdMinor: number) {
  return totalMinor > thresholdMinor;
}
