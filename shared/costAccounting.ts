export type AllocationInput = { poolMinor: number; driverQuantity: number; totalDriverQuantity: number };

export function allocateCost({ poolMinor, driverQuantity, totalDriverQuantity }: AllocationInput) {
  if (totalDriverQuantity <= 0 || driverQuantity < 0) throw new Error("invalid_driver_quantity");
  if (driverQuantity > totalDriverQuantity) throw new Error("driver_quantity_exceeds_total");
  return Math.round((poolMinor * driverQuantity) / totalDriverQuantity);
}

export function allocationConserves(inputMinor: number, allocationsMinor: number[], toleranceMinor = 0) {
  return Math.abs(inputMinor - allocationsMinor.reduce((sum, value) => sum + value, 0)) <= toleranceMinor;
}

export function profitability(revenueMinor: number, directCostMinor: number, allocatedCostMinor: number) {
  const contributionMinor = revenueMinor - directCostMinor - allocatedCostMinor;
  const marginBps = revenueMinor === 0 ? 0 : Math.round((contributionMinor / Math.abs(revenueMinor)) * 10000);
  return { contributionMinor, marginBps };
}

export function classifyVariance(standardMinor: number, actualMinor: number) {
  const differenceMinor = actualMinor - standardMinor;
  const varianceBps = standardMinor === 0 ? 0 : Math.round((differenceMinor / Math.abs(standardMinor)) * 10000);
  const status = Math.abs(varianceBps) >= 2000 ? "critical" : Math.abs(varianceBps) >= 1000 ? "warning" : "normal";
  return { differenceMinor, varianceBps, status } as const;
}

export function entityScoped<T extends { businessEntityId: number }>(rows: T[], businessEntityId: number) {
  return rows.filter((row) => row.businessEntityId === businessEntityId);
}
