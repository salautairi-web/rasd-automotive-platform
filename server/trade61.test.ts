import { describe, expect, it } from "vitest";
import { customsReadiness, landedCostAllocation } from "../shared/trade61";

describe("Trade 61 domain rules", () => {
  it("blocks customs release when required documents are missing", () => {
    expect(customsReadiness(JSON.stringify(["invoice", "origin"]), JSON.stringify(["origin"])).ready).toBe(false);
    expect(customsReadiness(JSON.stringify(["invoice", "origin"]), "[]").ready).toBe(true);
  });
  it("normalizes landed cost allocation without creating financial entries", () => {
    expect(landedCostAllocation(1250.7, "per_vehicle")).toEqual({ totalMinor: 1251, basis: "per_vehicle" });
    expect(() => landedCostAllocation(-1, "equal")).toThrow();
  });
});
