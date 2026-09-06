export function loyaltyBalanceAfter(current: number, type: "earn" | "redeem" | "expire" | "adjust" | "reverse", points: number) {
  if (!Number.isInteger(points) || points === 0) throw new Error("invalid_points");
  const next = type === "earn" || type === "adjust" ? current + points : current - Math.abs(points);
  if (next < 0) throw new Error("insufficient_points");
  return next;
}

export function canSendMarketing(decision: "granted" | "withdrawn" | "opted_out" | undefined, expiresAt?: Date, now = new Date()) {
  return decision === "granted" && (!expiresAt || expiresAt.getTime() > now.getTime());
}

export function sourcingScore(input: { technicalBps: number; commercialBps: number; riskBps: number }, weights = { technical: 4000, commercial: 4000, risk: 2000 }) {
  const values = [input.technicalBps, input.commercialBps, input.riskBps, weights.technical, weights.commercial, weights.risk];
  if (values.some(value => value < 0 || value > 10000)) throw new Error("invalid_score");
  return Math.round((input.technicalBps * weights.technical + input.commercialBps * weights.commercial + (10000 - input.riskBps) * weights.risk) / 10000);
}

export function inventoryAdjustmentAllowed(requesterUserId: number, approverUserId: number | undefined, quantity: number, hasEvidence: boolean) {
  return quantity !== 0 && hasEvidence && Boolean(approverUserId) && requesterUserId !== approverUserId;
}

export function transferConservesQuantity(shipped: number, received: number, damaged = 0) {
  return shipped >= 0 && received >= 0 && damaged >= 0 && Math.abs(shipped - received - damaged) < 0.0001;
}

export function componentDepreciationMonthly(costMinor: number, residualMinor: number, usefulLifeMonths: number) {
  if (costMinor < 0 || residualMinor < 0 || residualMinor > costMinor || usefulLifeMonths <= 0) throw new Error("invalid_component_basis");
  return Math.floor((costMinor - residualMinor) / usefulLifeMonths);
}

export function canExecuteInterEntityAssetTransfer(sourceEntityId: number, targetEntityId: number | undefined, type: "internal" | "inter_entity_sale" | "inter_entity_transfer") {
  return type === "internal" ? !targetEntityId || sourceEntityId === targetEntityId : Boolean(targetEntityId && sourceEntityId !== targetEntityId);
}
