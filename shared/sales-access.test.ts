import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertSalesInvoiceTotal } from "../server/salesAccess";

describe("sales invoice payment guards", () => {
  it("accepts a payment within the outstanding balance", () => {
    expect(assertSalesInvoiceTotal(100_000, 60_000, 40_000)).toBe(true);
  });

  it("rejects overpayment", () => {
    expect(() => assertSalesInvoiceTotal(100_000, 60_000, 40_001)).toThrow(TRPCError);
  });

  it("rejects invalid amounts", () => {
    expect(() => assertSalesInvoiceTotal(-1, 0, 1)).toThrow(TRPCError);
    expect(() => assertSalesInvoiceTotal(100, -1, 1)).toThrow(TRPCError);
    expect(() => assertSalesInvoiceTotal(100, 50, 0)).toThrow(TRPCError);
  });
});
