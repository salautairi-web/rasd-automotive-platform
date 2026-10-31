export const adminSectionKeys = ["home", "master", "access", "operations", "governance"] as const;
export type AdminSectionKey = (typeof adminSectionKeys)[number];

const validSections = new Set<string>(adminSectionKeys);

export function adminSectionPreferenceKey(userId: number | string): string {
  return `rasd:admin-section:v1:${userId}`;
}

export function normalizeAdminSection(value: unknown, fallback: AdminSectionKey = "home"): AdminSectionKey {
  return typeof value === "string" && validSections.has(value) ? value as AdminSectionKey : fallback;
}

export function readAdminSectionPreference(raw: string | null, fallback: AdminSectionKey = "home"): AdminSectionKey {
  if (!raw || raw.length > 100) return fallback;
  return normalizeAdminSection(raw, fallback);
}

export function adminSectionFromShortcut(key: string): AdminSectionKey | null {
  const index = Number(key) - 1;
  return Number.isInteger(index) && index >= 0 && index < adminSectionKeys.length ? adminSectionKeys[index] : null;
}
