import { describe, expect, it } from "vitest";
import { allocationConserves, allocateCost, classifyVariance, entityScoped, profitability } from "../shared/costAccounting";

describe("cost accounting foundations", () => {
  it("allocates a pool by driver quantity and conserves the total", () => {
    const allocations = [allocateCost({ poolMinor: 10000, driverQuantity: 25, totalDriverQuantity: 100 }), allocateCost({ poolMinor: 10000, driverQuantity: 75, totalDriverQuantity: 100 })];
    expect(allocations).toEqual([2500, 7500]);
    expect(allocationConserves(10000, allocations)).toBe(true);
  });
  it("rejects invalid driver quantities", () => {
    expect(() => allocateCost({ poolMinor: 100, driverQuantity: 2, totalDriverQuantity: 0 })).toThrow("invalid_driver_quantity");
    expect(() => allocateCost({ poolMinor: 100, driverQuantity: 11, totalDriverQuantity: 10 })).toThrow("driver_quantity_exceeds_total");
  });
  it("calculates contribution and margin basis points from persisted amounts", () => {
    expect(profitability(10000, 2500, 1500)).toEqual({ contributionMinor: 6000, marginBps: 6000 });
  });
  it("classifies cost variance by relative materiality", () => {
    expect(classifyVariance(10000, 10500).status).toBe("normal");
    expect(classifyVariance(10000, 11500).status).toBe("warning");
    expect(classifyVariance(10000, 12500).status).toBe("critical");
  });
  it("keeps cost views entity scoped", () => {
    expect(entityScoped([{ businessEntityId: 1, id: 1 }, { businessEntityId: 2, id: 2 }], 1)).toEqual([{ businessEntityId: 1, id: 1 }]);
  });
});
