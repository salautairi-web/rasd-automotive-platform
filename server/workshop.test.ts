import { describe, expect, it } from "vitest";
import { canDeliverWorkshopVehicle, canTransitionWorkOrder, requiresEstimateApproval } from "../shared/workshop";

describe("Workshop lifecycle invariants", () => {
  it("allows only valid work-order transitions", () => {
    expect(canTransitionWorkOrder("approved", "in_progress")).toBe(true);
    expect(canTransitionWorkOrder("delivered", "in_progress")).toBe(false);
  });
  it("requires quality approval and settlement before delivery", () => {
    expect(canDeliverWorkshopVehicle("ready", true, 0)).toBe(true);
    expect(canDeliverWorkshopVehicle("ready", true, 100)).toBe(false);
    expect(canDeliverWorkshopVehicle("quality_check", true, 0)).toBe(false);
  });
  it("routes estimates above the entity threshold for approval", () => {
    expect(requiresEstimateApproval(100001, 100000)).toBe(true);
    expect(requiresEstimateApproval(100000, 100000)).toBe(false);
  });
});
