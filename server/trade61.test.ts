import { describe, expect, it } from "vitest";
import { customsReadiness, landedCostAllocation, shippingDocumentChecksum } from "../shared/trade61";

describe("Trade 61 domain rules", () => {
  it("blocks customs release when required documents are missing", () => {
    expect(customsReadiness(JSON.stringify(["invoice", "origin"]), JSON.stringify(["origin"])).ready).toBe(false);
    expect(customsReadiness(JSON.stringify(["invoice", "origin"]), "[]").ready).toBe(true);
  });
  it("uses a stable SHA-256 checksum for shipping evidence", () => {
    expect(shippingDocumentChecksum(new TextEncoder().encode("RASD-SHIPPING"))).toBe("c2c00813fffb5b23920bcf211b4267abcff427f52dd467d563d8286d43546636");
  });
  it("normalizes landed cost allocation without creating financial entries", () => {
    expect(landedCostAllocation(1250.7, "per_vehicle")).toEqual({ totalMinor: 1251, basis: "per_vehicle" });
    expect(() => landedCostAllocation(-1, "equal")).toThrow();
  });
});
