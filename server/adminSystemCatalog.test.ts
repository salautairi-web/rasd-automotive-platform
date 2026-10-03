import { describe, expect, it } from "vitest";
import { adminSystemCatalog, moveSystemOrder, systemOrderKeys } from "../shared/adminSystemCatalog";

describe("central admin system catalog", () => {
  it("keeps a stable order key for every catalog system", () => {
    expect(systemOrderKeys).toHaveLength(adminSystemCatalog.length);
    expect(new Set(systemOrderKeys).size).toBe(systemOrderKeys.length);
    expect(systemOrderKeys).toContain("workshop");
    expect(systemOrderKeys).toContain("finance");
  });

  it("moves systems without mutating the current order", () => {
    const original = ["central-erp", "rental", "workshop"];
    const moved = moveSystemOrder(original, 2, -1);
    expect(moved).toEqual(["central-erp", "workshop", "rental"]);
    expect(original).toEqual(["central-erp", "rental", "workshop"]);
    expect(moveSystemOrder(original, 0, -1)).toEqual(original);
    expect(moveSystemOrder(original, 2, 1)).toEqual(original);
  });
});
