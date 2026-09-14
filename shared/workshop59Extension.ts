export function normalizeMediaRefs(value?: string): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map(item => item.trim()).filter(Boolean)));
}

export function calculateRoadTestDistance(startMileage: number, endMileage: number): number {
  if (!Number.isFinite(startMileage) || !Number.isFinite(endMileage) || endMileage < startMileage) return -1;
  return endMileage - startMileage;
}

export function canTransitionWorkshopPart(status: string, target: string): boolean {
  const allowed: Record<string, string[]> = { requested: ["reserved", "cancelled"], reserved: ["issued", "returned", "substituted", "cancelled"], issued: ["returned"], substituted: ["reserved", "issued", "returned"], returned: [], cancelled: [] };
  return (allowed[status] ?? []).includes(target);
}

export function warrantyIsEligible(status: string, hasCoverage: boolean, isComeback: boolean): boolean {
  return hasCoverage && (status === "eligible" || (isComeback && status === "submitted"));
}
