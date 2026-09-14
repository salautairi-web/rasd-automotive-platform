import { describe, expect, it } from "vitest";
import { calculateRoadTestDistance, canTransitionWorkshopPart, normalizeMediaRefs, warrantyIsEligible } from "../shared/workshop59Extension";

describe("workshop 59 operational extension", () => {
  it("normalizes and deduplicates inspection media references", () => {
    expect(normalizeMediaRefs(" a.jpg, b.jpg, a.jpg ,, ")).toEqual(["a.jpg", "b.jpg"]);
  });
  it("rejects odometer rollback and calculates road-test distance", () => {
    expect(calculateRoadTestDistance(12000, 12037)).toBe(37);
    expect(calculateRoadTestDistance(12037, 12000)).toBe(-1);
  });
  it("enforces parts request transitions", () => {
    expect(canTransitionWorkshopPart("requested", "reserved")).toBe(true);
    expect(canTransitionWorkshopPart("issued", "reserved")).toBe(false);
    expect(canTransitionWorkshopPart("reserved", "returned")).toBe(true);
  });
  it("requires coverage for warranty eligibility and permits comeback review", () => {
    expect(warrantyIsEligible("eligible", true, false)).toBe(true);
    expect(warrantyIsEligible("eligible", false, false)).toBe(false);
    expect(warrantyIsEligible("submitted", true, true)).toBe(true);
  });
});
