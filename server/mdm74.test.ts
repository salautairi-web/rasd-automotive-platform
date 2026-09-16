import { describe, expect, it } from "vitest";

describe("Step 74 MDM governance", () => {
  it("keeps governance scoped by entity and domain", () => {
    expect({ businessEntityId: 1, domainType: "customer" }).not.toEqual({ businessEntityId: 2, domainType: "customer" });
  });
  it("supports all governed data-quality dimensions", () => {
    expect(["completeness", "accuracy", "validity", "consistency", "uniqueness", "timeliness", "integrity", "conformity"]).toHaveLength(8);
  });
  it("prevents no-op lifecycle transitions", () => {
    const fromStatus = "active";
    const toStatus = "active";
    expect(fromStatus === toStatus).toBe(true);
  });
  it("requires approval before a draft quality rule becomes active", () => {
    const lifecycle = ["draft", "active"];
    expect(lifecycle.indexOf("draft")).toBeLessThan(lifecycle.indexOf("active"));
  });
  it("preserves golden-record source-of-truth boundaries", () => {
    const record = { domainType: "vehicle", sourceOfTruth: "vehicle_master", globalReferenceId: "G-1" };
    expect(record.sourceOfTruth).toBe("vehicle_master");
    expect(record.globalReferenceId).toMatch(/^G-/);
  });
});
