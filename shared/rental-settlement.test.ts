import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { calculateRentalPayment } from "./rental-settlement";

describe("calculateRentalPayment", () => {
  it("marks an invoice partially paid", () => {
    expect(calculateRentalPayment(100_000, 25_000, 30_000)).toEqual({
      outstandingMinor: 75_000,
      nextPaidMinor: 55_000,
      status: "partially_paid",
    });
  });

  it("marks an invoice fully paid", () => {
    expect(calculateRentalPayment(100_000, 60_000, 40_000)).toEqual({
      outstandingMinor: 40_000,
      nextPaidMinor: 100_000,
      status: "paid",
    });
  });

  it("rejects overpayment", () => {
    expect(() => calculateRentalPayment(100_000, 90_000, 20_000)).toThrow(TRPCError);
  });

  it("rejects negative balances and payments", () => {
    expect(() => calculateRentalPayment(100_000, -1, 1_000)).toThrow(TRPCError);
    expect(() => calculateRentalPayment(100_000, 1_000, -1)).toThrow(TRPCError);
  });
});
