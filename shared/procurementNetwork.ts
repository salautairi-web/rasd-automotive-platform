export type ProcurementStatus = string;

export function isOpenProcurementStatus(status: ProcurementStatus) {
  return !["closed", "cancelled", "rejected", "received", "paid"].includes(status);
}

export function assertSameProcurementEntity(expectedEntityId: number, ...recordEntityIds: number[]) {
  return recordEntityIds.every((entityId) => entityId === expectedEntityId);
}

export function summarizeProcurement(input: {
  requisitionStatuses: ProcurementStatus[];
  rfqStatuses: ProcurementStatus[];
  purchaseOrderTotalsMinor: number[];
  invoiceStatuses: ProcurementStatus[];
  pendingApprovals: number;
}) {
  return {
    openRequisitions: input.requisitionStatuses.filter(isOpenProcurementStatus).length,
    openRfqs: input.rfqStatuses.filter(isOpenProcurementStatus).length,
    poValueMinor: input.purchaseOrderTotalsMinor.reduce((sum, value) => sum + value, 0),
    exceptions: input.invoiceStatuses.filter((status) => ["variance", "rejected"].includes(status)).length + input.pendingApprovals,
  };
}
