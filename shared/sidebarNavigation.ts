export type SidebarEntry = { path: string; label: string; keywords?: readonly string[] };

/** Search ignores Arabic vowel marks, tatweel, alef variants and the definite article. */
export function normalizeSidebarSearch(value: string): string {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLocaleLowerCase()
    .replace(/(^|\s)ال(?=[\u0621-\u064A])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchSidebarItems<T extends SidebarEntry>(items: readonly T[], query: string): T[] {
  const terms = normalizeSidebarSearch(query).split(" ").filter(Boolean);
  return items.filter(item => {
    const text = normalizeSidebarSearch(`${item.label} ${item.path} ${(item.keywords ?? []).join(" ")}`);
    return terms.every(term => text.includes(term));
  });
}

export function normalizeSidebarFavorites(value: unknown, items: readonly SidebarEntry[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(items.map(item => item.path));
  return Array.from(new Set(value.filter((path): path is string => typeof path === "string" && allowed.has(path))));
}

export function readSidebarFavorites(raw: string | null, items: readonly SidebarEntry[]): string[] {
  if (!raw || raw.length > 20000) return [];
  try { return normalizeSidebarFavorites(JSON.parse(raw), items); } catch { return []; }
}

export function toggleSidebarFavorite(paths: readonly string[], path: string, items: readonly SidebarEntry[]): string[] {
  const current = normalizeSidebarFavorites(paths, items);
  if (!items.some(item => item.path === path)) return current;
  return current.includes(path) ? current.filter(item => item !== path) : [...current, path];
}

export function sidebarFavoritesKey(userId: number | string): string {
  return `rasd:sidebar-favorites:v1:${userId}`;
}
