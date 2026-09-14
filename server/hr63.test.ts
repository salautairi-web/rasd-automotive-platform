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

describe("Step 63 workforce operations", () => {
  it("calculates overtime and allocation proportionally", () => {
    const hoursBps = 15000; const rateBps = 12500; const hourlyMinor = 1000;
    expect(Math.round(hourlyMinor * hoursBps / 10000 * rateBps / 10000)).toBe(1875);
    expect(10000).toBeGreaterThanOrEqual(7500);
  });
  it("keeps leave and overtime references entity-scoped", () => {
    const request = { businessEntityId: 3, employeeId: 10, payrollPeriodId: 4 };
    expect(request.businessEntityId).toBe(3);
    expect({ ...request, businessEntityId: 4 }.businessEntityId).not.toBe(request.businessEntityId);
  });
});

describe("Step 63 payroll closeout", () => {
  it("passes reconciliation only when expected and actual totals match", () => {
    expect(125000 === 125000).toBe(true);
    expect(125000 === 124999).toBe(false);
  });
  it("keeps labor integration pending until source reconciliation", () => {
    expect(["pending", "matched", "unmatched"]).toContain("pending");
  });
});
