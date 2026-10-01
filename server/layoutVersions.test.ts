import { describe, expect, it } from "vitest";
import { defaultLayoutForRole } from "../shared/layoutTemplates";
import { diffLayoutConfigs, layoutVersionRestoreNote, nextLayoutVersion } from "../shared/layoutVersions";

describe("layout template versioning", () => {
  it("increments from the latest version and handles an empty history", () => {
    expect(nextLayoutVersion(undefined)).toBe(1);
    expect(nextLayoutVersion(0)).toBe(1);
    expect(nextLayoutVersion(7)).toBe(8);
  });

  it("keeps an explicit restore note and creates a safe default note", () => {
    expect(layoutVersionRestoreNote(3, "  استرجاع بعد مراجعة  ")).toBe("استرجاع بعد مراجعة");
    expect(layoutVersionRestoreNote(3, " ")).toBe("استرجاع الإصدار 3");
    expect(layoutVersionRestoreNote(3)).toBe("استرجاع الإصدار 3");
  });

  it("reports changed domains, visibility, and service order", () => {
    const left = defaultLayoutForRole("rental_manager");
    const right = defaultLayoutForRole("rental_manager");
    right.domainOrder = ["workshop", "rental", "sales", "parts", "finance"];
    right.visibleDomains = ["rental", "workshop"];
    right.serviceOrder.rental = ["contracts", "reservations"];
    const diff = diffLayoutConfigs(left, right);
    expect(diff.domainOrderChanged).toBe(true);
    expect(diff.visibleDomainsChanged).toBe(true);
    expect(diff.serviceOrderChanged).toEqual(["rental"]);
  });
});
