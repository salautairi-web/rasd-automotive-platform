import { describe, expect, it } from "vitest";
import { calculateWorkshopEstimate, calculateWorkshopKpis, canDeliverWorkshopJob, canTransitionWorkshopJob, maskWorkshopCustomer } from "../shared/workshop59";

describe("workshop59", () => {
  it("allows only valid job-card transitions", () => {
    expect(canTransitionWorkshopJob("received", "diagnosing")).toBe(true);
    expect(canTransitionWorkshopJob("received", "delivered")).toBe(false);
    expect(canTransitionWorkshopJob("qc", "in_progress")).toBe(true);
  });
  it("calculates deterministic estimate totals", () => {
    expect(calculateWorkshopEstimate({ laborMinor: 1000, partsMinor: 2500, subcontractMinor: 0, consumablesMinor: 100, taxMinor: 540, discountMinor: 140 })).toBe(4000);
  });
  it("blocks delivery until quality, payment, documents, and acknowledgement are complete", () => {
    expect(canDeliverWorkshopJob({ status: "ready", invoiceStatus: "issued", paymentStatus: "paid", customerAcknowledgement: true, requiredDocumentsPresent: true, qcPassed: true })).toBe(true);
    expect(canDeliverWorkshopJob({ status: "ready", invoiceStatus: "issued", paymentStatus: "pending", customerAcknowledgement: true, requiredDocumentsPresent: true, qcPassed: true })).toBe(false);
  });
  it("calculates workshop KPI rates and masks customer data", () => {
    expect(calculateWorkshopKpis([{ revenueMinor: 1000, costMinor: 600, cycleHours: 4, comeback: false, firstTimeFix: true }, { revenueMinor: 2000, costMinor: 1000, cycleHours: 8, comeback: true, firstTimeFix: false }])).toEqual({ revenueMinor: 3000, grossMarginMinor: 1400, averageRepairOrderMinor: 1500, averageCycleHours: 6, comebackRateBps: 5000, firstTimeFixRateBps: 5000 });
    expect(maskWorkshopCustomer("Customer-1234", false)).toBe("Cu••••34");
  });
});
