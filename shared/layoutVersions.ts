import type { LayoutConfig } from "./layoutTemplates";

export function nextLayoutVersion(latestVersion?: number | null) {
  return Math.max(0, latestVersion ?? 0) + 1;
}

export function layoutVersionRestoreNote(sourceVersion: number, note?: string | null) {
  const trimmed = note?.trim();
  return trimmed || `استرجاع الإصدار ${sourceVersion}`;
}

export function diffLayoutConfigs(left: LayoutConfig, right: LayoutConfig) {
  const serviceKeys = Array.from(new Set([...Object.keys(left.serviceOrder), ...Object.keys(right.serviceOrder)]));
  return {
    domainOrderChanged: JSON.stringify(left.domainOrder) !== JSON.stringify(right.domainOrder),
    visibleDomainsChanged: JSON.stringify(left.visibleDomains) !== JSON.stringify(right.visibleDomains),
    serviceOrderChanged: serviceKeys.filter(key => JSON.stringify(left.serviceOrder[key] ?? []) !== JSON.stringify(right.serviceOrder[key] ?? [])),
  };
}
