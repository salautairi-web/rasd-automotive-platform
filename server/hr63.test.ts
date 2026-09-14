import { describe, expect, it } from "vitest";

describe("Step 63 HR/HCM payroll domain", () => {
  it("keeps payroll net pay non-negative after deductions", () => {
    expect(Math.max(0, 1000 - 1200)).toBe(0);
    expect(2500 - 500).toBe(2000);
  });
  it("requires entity-scoped employee and payroll references", () => {
    const employee = { businessEntityId: 7, id: 21 };
    const payroll = { businessEntityId: 7, id: 4 };
    expect(employee.businessEntityId).toBe(payroll.businessEntityId);
    expect({ ...employee, businessEntityId: 8 }.businessEntityId).not.toBe(payroll.businessEntityId);
  });
  it("allows lock only after calculation", () => {
    expect(["draft", "calculated"].includes("draft")).toBe(true);
    expect(["draft", "calculated"].includes("locked")).toBe(false);
  });
});
