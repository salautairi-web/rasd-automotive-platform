import { describe, expect, it } from "vitest";
import { allocationTotal, canAccessSalary, canReversePayroll, effectiveRecordAt, leaveBalanceAfter, payrollGross, piiVisible, validateMultiEntityAssignment } from "../shared/hr41";

describe("Step 41 HR workforce controls", () => {
  it("masks restricted PII for non-HR roles", () => { expect(piiVisible("manager", "restricted")).toBe(false); expect(piiVisible("admin", "restricted")).toBe(true); });
  it("conserves leave balances", () => { expect(leaveBalanceAfter(30, 5, 2, 3).pendingAfter).toBe(5); expect(() => leaveBalanceAfter(10, 8, 1, 2)).toThrow("insufficient_leave_balance"); });
  it("keeps payroll gross-to-net explicit and non-negative", () => { expect(payrollGross({ basic: 1000, allowances: 200, overtime: 100, bonuses: 50, deductions: 150 })).toEqual({ gross: 1350, net: 1200 }); expect(() => payrollGross({ basic: 100, allowances: 0, overtime: 0, bonuses: 0, deductions: 200 })).toThrow(); });
  it("prevents employee cost allocations from exceeding 100 percent", () => { expect(allocationTotal([40, 60])).toBe(100); expect(() => allocationTotal([60, 50])).toThrow("allocation_exceeds_100_percent"); });
  it("locks and reverses only approved or posted payroll", () => { expect(canReversePayroll("posted")).toBe(true); expect(canReversePayroll("draft")).toBe(false); });
  it("honors effective-dated records", () => { expect(effectiveRecordAt(new Date("2026-06-01"), new Date("2026-01-01"), new Date("2026-12-31"))).toBe(true); expect(effectiveRecordAt(new Date("2027-01-01"), new Date("2026-01-01"), new Date("2026-12-31"))).toBe(false); });
  it("restricts salary access and multi-entity assignments", () => { expect(canAccessSalary("manager", true)).toBe(false); expect(canAccessSalary("hr_manager", true)).toBe(true); expect(validateMultiEntityAssignment(1, 2, true)).toBe(true); expect(validateMultiEntityAssignment(1, 2, false)).toBe(false); });
});
