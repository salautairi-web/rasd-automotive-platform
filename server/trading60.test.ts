import { describe, expect, it } from "vitest";
import { calculateTradingProfitability, canDeliverTradingStock, canReserveTradingStock, tradingQuoteStatus } from "../shared/trading60";

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
});
