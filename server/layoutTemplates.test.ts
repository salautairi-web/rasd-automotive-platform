import { describe, expect, it } from "vitest";
import { cloneLayoutConfig, defaultLayoutForRole, layoutRoleKeys } from "../shared/layoutTemplates";

describe("role-aware layout templates", () => {
  it("keeps the complete domain set and focuses each operational role", () => {
    const rental = defaultLayoutForRole("rental_manager");
    const finance = defaultLayoutForRole("finance_manager");
    expect(rental.domainOrder[0]).toBe("rental");
    expect(finance.domainOrder[0]).toBe("finance");
    expect(rental.visibleDomains).toHaveLength(5);
    expect(layoutRoleKeys).toContain("auditor_readonly");
  });

  it("provides a customer-safe baseline independent of employee roles", () => {
    expect(defaultLayoutForRole("rental_manager", "customer")).toEqual({
      domainOrder: ["rental", "workshop", "sales", "parts", "finance"],
      visibleDomains: ["rental", "workshop", "sales", "parts", "finance"],
      serviceOrder: {},
    });
  });

  it("clones nested service order arrays without shared references", () => {
    const original = defaultLayoutForRole("sales_manager");
    original.serviceOrder.sales = ["offers", "customers"];
    const copy = cloneLayoutConfig(original);
    copy.serviceOrder.sales.push("quotes");
    expect(original.serviceOrder.sales).toEqual(["offers", "customers"]);
  });
});
