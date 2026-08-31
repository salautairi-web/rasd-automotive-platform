export function canReserveStock(availableQty: number, requestedQty: number) {
  return requestedQty > 0 && availableQty >= requestedQty;
}

export function requiresMarginApproval(costMinor: number, priceMinor: number, minimumMarginBps: number) {
  if (costMinor < 0 || priceMinor <= 0) throw new Error("Invalid parts pricing");
  const marginBps = Math.floor(((priceMinor - costMinor) * 10_000) / priceMinor);
  return { marginBps, requiresApproval: marginBps < minimumMarginBps };
}

export function stockAfterMovement(availableQty: number, movementQty: number) {
  const next = availableQty + movementQty;
  if (next < 0) throw new Error("Negative stock is not allowed");
  return next;
}
