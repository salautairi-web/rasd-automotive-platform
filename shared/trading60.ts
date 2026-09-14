export type TradingStockStatus = "acquired" | "inspection" | "preparation" | "ready" | "reserved" | "sold" | "delivered" | "returned" | "on_hold";

export function tradingQuoteStatus(listPriceMinor: number, discountMinor: number, minimumPriceMinor: number): "approved" | "pending_approval" {
  if (listPriceMinor - discountMinor < minimumPriceMinor) return "pending_approval";
  return discountMinor * 10000 > listPriceMinor * 1000 ? "pending_approval" : "approved";
}

export function canReserveTradingStock(status: TradingStockStatus): boolean { return status === "ready"; }
export function canDeliverTradingStock(status: TradingStockStatus, reservationConfirmed: boolean): boolean { return (status === "reserved" || status === "ready") && reservationConfirmed; }
export function calculateTradingProfitability(sellingPriceMinor: number, purchasePriceMinor: number, acquisitionCostsMinor: number, reconditioningMinor: number, sellingCostsMinor: number) { const grossProfitMinor = sellingPriceMinor - purchasePriceMinor - acquisitionCostsMinor - reconditioningMinor - sellingCostsMinor; return { grossProfitMinor, marginBps: sellingPriceMinor > 0 ? Math.round((grossProfitMinor * 10000) / sellingPriceMinor) : 0 }; }
