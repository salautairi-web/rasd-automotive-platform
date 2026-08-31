export function canReserveVehicle(status: string) {
  return status === "ready";
}

export function quotationStatus(targetPriceMinor: number, discountMinor: number, approvalRate = 0.1) {
  if (targetPriceMinor <= 0 || discountMinor < 0 || discountMinor > targetPriceMinor) throw new Error("Invalid quotation amounts");
  return discountMinor > Math.floor(targetPriceMinor * approvalRate) ? "pending_approval" as const : "approved" as const;
}

export function canDeliverVehicle(vehicleStatus: string, orderStatus: string) {
  return vehicleStatus === "reserved" && ["paid", "approved"].includes(orderStatus);
}
