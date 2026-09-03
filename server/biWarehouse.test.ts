import { describe, expect, it } from "vitest";
import { duplicateIngestionKey, forecastConfidenceLabel, isEntityVisible, qualityScore, reconcileDelta } from "../shared/biWarehouse";

describe("BI warehouse foundations", () => {
  it("scores quality from bounded dimensions", () => {
    expect(qualityScore({ total: 100, complete: 100, valid: 90, unique: 80, timely: 70 })).toBe(85);
    expect(qualityScore({ total: 0, complete: 0, valid: 0, unique: 0, timely: 0 })).toBe(100);
  });
  it("creates stable duplicate-ingestion keys", () => {
    expect(duplicateIngestionKey({ sourceId: 2, sourceRecordKey: "sale-7", checksum: "abc" })).toBe("2:sale-7:abc");
  });
  it("keeps row-level entity scope closed by default", () => {
    expect(isEntityVisible([1, 2], 3)).toBe(false);
    expect(isEntityVisible([1, 2], 2)).toBe(true);
    expect(isEntityVisible("portfolio", 3)).toBe(true);
    expect(isEntityVisible([], undefined)).toBe(false);
  });
  it("reconciles source and warehouse values deterministically", () => {
    expect(reconcileDelta(1000, 1012.345)).toBe(12.35);
    expect(reconcileDelta(1000, 1000)).toBe(0);
  });
  it("labels forecast confidence without inventing confidence", () => {
    expect(forecastConfidenceLabel()).toBe("غير محددة");
    expect(forecastConfidenceLabel(8500)).toBe("مرتفعة");
    expect(forecastConfidenceLabel(5000)).toBe("منخفضة");
  });
});
