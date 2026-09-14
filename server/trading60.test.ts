import { describe, expect, it } from "vitest";
import { calculateTradingProfitability, canCompleteReturn, canDeliverTradingStock, canRegisterContract, canReserveTradingStock, paymentBalance, tradingQuoteStatus } from "../shared/trading60";

describe("Trading 60 domain rules", () => {
  it("requires approval when price falls below minimum or discount exceeds 10%", () => {
    expect(tradingQuoteStatus(100000, 5000, 90000)).toBe("approved");
    expect(tradingQuoteStatus(100000, 15000, 90000)).toBe("pending_approval");
    expect(tradingQuoteStatus(100000, 5000, 98000)).toBe("pending_approval");
  });
  it("only reserves ready stock and delivers with confirmed reservation", () => {
    expect(canReserveTradingStock("ready")).toBe(true);
    expect(canReserveTradingStock("sold")).toBe(false);
    expect(canDeliverTradingStock("reserved", true)).toBe(true);
    expect(canDeliverTradingStock("ready", false)).toBe(false);
  });
  it("reconciles purchase, acquisition, reconditioning, and selling costs", () => {
    expect(calculateTradingProfitability(120000, 90000, 5000, 7000, 3000)).toEqual({ grossProfitMinor: 15000, marginBps: 1250 });
  });
  it("accepts payments only within the remaining contract balance", () => {
    expect(paymentBalance(100000, 25000, 75000)).toEqual({ accepted: true, remainingMinor: 0 });
    expect(paymentBalance(100000, 25000, 75001).accepted).toBe(false);
    expect(paymentBalance(100000, 25000, 0).accepted).toBe(false);
  });
  it("enforces contract approval and return lifecycle gates", () => {
    expect(canRegisterContract("approved")).toBe(true);
    expect(canRegisterContract("pending_approval")).toBe(false);
    expect(canCompleteReturn("approved")).toBe(true);
    expect(canCompleteReturn("completed")).toBe(false);
  });
});
