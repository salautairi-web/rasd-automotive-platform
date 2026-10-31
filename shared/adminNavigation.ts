export const adminSectionKeys = ["home", "master", "access", "operations", "governance"] as const;
export type AdminSectionKey = (typeof adminSectionKeys)[number];
export type AdminTabPreferences = Partial<Record<AdminSectionKey, string>>;

const validSections = new Set<string>(adminSectionKeys);

export function adminSectionPreferenceKey(userId: number | string): string {
  return `rasd:admin-section:v1:${userId}`;
}

export function adminTabPreferencesKey(userId: number | string): string {
  return `rasd:admin-tabs:v1:${userId}`;
}

export function normalizeAdminSection(value: unknown, fallback: AdminSectionKey = "home"): AdminSectionKey {
  return typeof value === "string" && validSections.has(value) ? value as AdminSectionKey : fallback;
}

export function readAdminSectionPreference(raw: string | null, fallback: AdminSectionKey = "home"): AdminSectionKey {
  if (!raw || raw.length > 100) return fallback;
  return normalizeAdminSection(raw, fallback);
}

export function normalizeAdminTabPreferences(value: unknown): AdminTabPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([section, tab]) => validSections.has(section) && typeof tab === "string" && tab.length <= 100),
  ) as AdminTabPreferences;
}

export function readAdminTabPreferences(raw: string | null): AdminTabPreferences {
  if (!raw || raw.length > 5000) return {};
  try {
    return normalizeAdminTabPreferences(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function adminSectionFromShortcut(key: string): AdminSectionKey | null {
  const index = Number(key) - 1;
  return Number.isInteger(index) && index >= 0 && index < adminSectionKeys.length ? adminSectionKeys[index] : null;
}
