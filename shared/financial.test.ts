import { describe, expect, it } from "vitest";
import { buildReversalLines, validateFinancialLines } from "./financial";

describe("financial journal helpers", () => {
  it("accepts balanced debit/credit lines", () => {
    expect(validateFinancialLines([
      { accountCode: "1100", debitMinor: 1000, creditMinor: 0 },
      { accountCode: "4000", debitMinor: 0, creditMinor: 1000 },
    ])).toEqual({ valid: true, debitMinor: 1000, creditMinor: 1000 });
  });

  it("rejects unbalanced or negative lines", () => {
    expect(validateFinancialLines([
      { accountCode: "1100", debitMinor: 1000, creditMinor: 0 },
      { accountCode: "4000", debitMinor: 0, creditMinor: 900 },
    ]).valid).toBe(false);
    expect(validateFinancialLines([
      { accountCode: "1100", debitMinor: -1, creditMinor: 0 },
      { accountCode: "4000", debitMinor: 0, creditMinor: 1 },
    ]).valid).toBe(false);
  });

  it("builds a balanced reversal without mutating the original", () => {
    const original = [
      { accountCode: "1100", debitMinor: 1000, creditMinor: 0 },
      { accountCode: "4000", debitMinor: 0, creditMinor: 1000 },
    ];
    const reversal = buildReversalLines(original);
    expect(reversal).toEqual([
      { accountCode: "1100", debitMinor: 0, creditMinor: 1000 },
      { accountCode: "4000", debitMinor: 1000, creditMinor: 0 },
    ]);
    expect(original).toEqual([
      { accountCode: "1100", debitMinor: 1000, creditMinor: 0 },
      { accountCode: "4000", debitMinor: 0, creditMinor: 1000 },
    ]);
  });
});
