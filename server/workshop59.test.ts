import { describe, expect, it } from "vitest";
import { calculateWorkshopEstimate, calculateWorkshopKpis, canDeliverWorkshopJob, canTransitionWorkshopJob, estimateStatusAfterDecision, isValidWorkshopMileage, isValidWorkshopScheduleWindow, maskWorkshopCustomer, workshopScheduleOverlaps } from "../shared/workshop59";

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
  it("maps customer estimate decisions to safe estimate states", () => {
    expect(estimateStatusAfterDecision("approved")).toBe("approved");
    expect(estimateStatusAfterDecision("rejected")).toBe("rejected");
    expect(estimateStatusAfterDecision("change_requested")).toBe("partially_approved");
  });
  it("rejects road-test odometer rollback", () => {
    expect(isValidWorkshopMileage(12000, 12037)).toBe(true);
    expect(isValidWorkshopMileage(12037, 12000)).toBe(false);
    expect(isValidWorkshopMileage(-1, 20)).toBe(false);
  });
  it("validates appointment windows and prevents active bay overlaps", () => {
    const start = new Date("2026-10-03T08:00:00Z");
    const end = new Date("2026-10-03T09:00:00Z");
    expect(isValidWorkshopScheduleWindow(start, end)).toBe(true);
    expect(isValidWorkshopScheduleWindow(end, start)).toBe(false);
    expect(workshopScheduleOverlaps({ startsAt: start, endsAt: end, existing: [{ startsAt: new Date("2026-10-03T08:30:00Z"), endsAt: new Date("2026-10-03T09:30:00Z"), status: "confirmed" }] })).toBe(true);
    expect(workshopScheduleOverlaps({ startsAt: start, endsAt: end, existing: [{ startsAt: new Date("2026-10-03T08:30:00Z"), endsAt: new Date("2026-10-03T09:30:00Z"), status: "cancelled" }] })).toBe(false);
  });
});
