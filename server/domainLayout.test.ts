import { describe, expect, it } from "vitest";
import { moveLayoutItem, readLayoutPreferences } from "../client/src/lib/domainLayout";

describe("domain layout preferences", () => {
  const defaults = ["rental", "workshop", "sales"] as const;

  it("moves an item while keeping boundaries safe", () => {
    expect(moveLayoutItem(defaults, 1, -1)).toEqual(["workshop", "rental", "sales"]);
    expect(moveLayoutItem(defaults, 2, 1)).toEqual([...defaults]);
  });

  it("normalizes saved order and restores missing defaults", () => {
    const result = readLayoutPreferences(JSON.stringify({ domainOrder: ["sales", "sales", "invalid"], visibleDomains: ["workshop", "invalid"], serviceOrder: { sales: ["offers"] } }), defaults);
    expect(result.domainOrder).toEqual(["sales", "rental", "workshop"]);
    expect(result.visibleDomains).toEqual(["workshop"]);
    expect(result.serviceOrder).toEqual({ sales: ["offers"] });
  });

  it("falls back safely when local storage is malformed", () => {
    expect(readLayoutPreferences("{bad-json", defaults)).toEqual({ domainOrder: [...defaults], visibleDomains: [...defaults], serviceOrder: {} });
  });
});
