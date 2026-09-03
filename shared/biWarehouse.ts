export type WarehouseRecord = { sourceId: number; sourceRecordKey: string; businessEntityId?: number | null; checksum: string };
export type QualityCounts = { total: number; complete: number; valid: number; unique: number; timely: number };

export function qualityScore(counts: QualityCounts) {
  if (counts.total <= 0) return 100;
  const ratios = [counts.complete, counts.valid, counts.unique, counts.timely].map(value => Math.max(0, Math.min(1, value / counts.total)));
  return Math.round(ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length * 100);
}

export function duplicateIngestionKey(record: WarehouseRecord) { return `${record.sourceId}:${record.sourceRecordKey}:${record.checksum}`; }

export function isEntityVisible(allowedEntityIds: number[] | "portfolio", requestedEntityId?: number | null) {
  return requestedEntityId == null ? allowedEntityIds === "portfolio" || allowedEntityIds.length > 0 : allowedEntityIds === "portfolio" || allowedEntityIds.includes(requestedEntityId);
}

export function reconcileDelta(sourceValue: number, warehouseValue: number) { return Math.round((warehouseValue - sourceValue) * 100) / 100; }

export function forecastConfidenceLabel(confidenceBps?: number | null) {
  if (confidenceBps == null) return "غير محددة";
  if (confidenceBps >= 8000) return "مرتفعة";
  if (confidenceBps >= 6000) return "متوسطة";
  return "منخفضة";
}
