import { describe, expect, it } from "vitest";
import { countVariance, isTraceComplete, labelPayload, nextOfflineState, normalizeScan, retryDelayMs } from "../shared/inventoryOffline56";

describe("inventory offline and trace controls", () => {
  it("normalizes scan values for stable catalog lookup", () => {
    expect(normalizeScan("  sku-001 ")).toBe("SKU-001");
  });

  it("requires the configured batch or serial reference", () => {
    expect(isTraceComplete("none")).toBe(true);
    expect(isTraceComplete("batch")).toBe(false);
    expect(isTraceComplete("batch", "B-01")).toBe(true);
    expect(isTraceComplete("serial", undefined, "S-01")).toBe(true);
  });

  it("keeps retry delays bounded and transitions queue states deterministically", () => {
    expect(retryDelayMs(0)).toBe(1000);
    expect(retryDelayMs(20)).toBe(300000);
    expect(nextOfflineState("queued", true)).toBe("synced");
    expect(nextOfflineState("retryable", false)).toBe("retryable");
    expect(nextOfflineState("syncing", false, true)).toBe("permanent_failure");
  });

  it("calculates count variance and value in minor currency units", () => {
    expect(countVariance(10, 7, 125)).toEqual({ varianceQty: -3, varianceValueMinor: -375 });
  });

  it("creates an entity-bound label payload without losing trace identifiers", () => {
    expect(JSON.parse(labelPayload(4, 21, "QR-21", "B-9", "S-2"))).toEqual({ entityId: 4, productId: 21, encodedValue: "QR-21", batchNo: "B-9", serialNo: "S-2" });
  });
});
