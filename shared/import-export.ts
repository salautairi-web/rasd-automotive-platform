export type AllocationItem = { id: number; purchaseCostMinor: number; quantity: number; weightGrams: number; volumeCm3: number };
export function allocateLandedCost(items: AllocationItem[], additionalMinor: number, method: "value"|"weight"|"quantity"|"volume") {
  if (!items.length || additionalMinor < 0) throw new Error("Invalid allocation input");
  const basis = (i: AllocationItem) => method === "value" ? i.purchaseCostMinor : method === "weight" ? i.weightGrams : method === "volume" ? i.volumeCm3 : i.quantity;
  const totalBasis = items.reduce((s, i) => s + basis(i), 0); if (totalBasis <= 0) throw new Error("Allocation basis must be positive");
  let allocated = 0;
  return items.map((item, index) => { const share = index === items.length - 1 ? additionalMinor - allocated : Math.round(additionalMinor * basis(item) / totalBasis); allocated += share; return { shipmentItemId: item.id, purchaseCostMinor: item.purchaseCostMinor, allocatedCostMinor: share, landedCostMinor: item.purchaseCostMinor + share, allocationBasis: basis(item) }; });
}
export function canFinalizeLandedCost(status: string, allocatedMinor: number, expectedMinor: number) { return status === "calculated" && allocatedMinor === expectedMinor; }
