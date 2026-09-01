import { describe, expect, it } from "vitest";
import { assertSameProcurementEntity, isOpenProcurementStatus, summarizeProcurement } from "../shared/procurementNetwork";

describe("procurement network invariants", () => {
  it("keeps procurement records inside one business entity", () => {
    expect(assertSameProcurementEntity(7, 7, 7, 7)).toBe(true);
    expect(assertSameProcurementEntity(7, 7, 8)).toBe(false);
  });

  it("classifies terminal procurement states", () => {
    expect(isOpenProcurementStatus("pending_approval")).toBe(true);
    expect(isOpenProcurementStatus("closed")).toBe(false);
    expect(isOpenProcurementStatus("cancelled")).toBe(false);
  });

  it("summarizes live procurement state without synthetic rows", () => {
    expect(summarizeProcurement({
      requisitionStatuses: ["draft", "closed", "pending_approval"],
      rfqStatuses: ["open", "cancelled"],
      purchaseOrderTotalsMinor: [12500, 7500],
      invoiceStatuses: ["matched", "variance", "rejected"],
      pendingApprovals: 2,
    })).toEqual({ openRequisitions: 2, openRfqs: 1, poValueMinor: 20000, exceptions: 4 });
  });
});
