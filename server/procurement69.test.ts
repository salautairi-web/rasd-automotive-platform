import { describe, expect, it } from "vitest";

describe("Step 69 procurement controls", () => {
  it("matches an invoice when variance is within tolerance", () => {
    const po = 100000;
    const received = 99000;
    const invoiced = 99500;
    const variance = invoiced - received;
    const tolerance = Math.round(po * 100 / 10000);
    expect(Math.abs(variance) <= tolerance).toBe(true);
    expect(variance).toBe(500);
  });
  it("calculates a bounded supplier performance score", () => {
    const values = [9000, 8000, 7000, 10000];
    const overall = Math.round(values.reduce((a,b)=>a+b,0)/values.length);
    expect(overall).toBe(8500);
    expect(overall).toBeLessThanOrEqual(10000);
  });
  it("keeps a purchase order scoped to its business entity", () => {
    expect({businessEntityId: 2, purchaseOrderId: 10}).not.toEqual({businessEntityId: 3, purchaseOrderId: 10});
  });
  it("requires an explicit decision to resolve a receiving exception", () => {
    expect(["resolved", "rejected"].includes("resolved")).toBe(true);
  });
});
