export type LayoutPreferences<T extends string> = {
  visibleDomains: T[];
  domainOrder: T[];
  serviceOrder: Record<string, string[]>;
};

export function moveLayoutItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const next = [...items];
  const target = index + direction;
  if (index < 0 || index >= next.length || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function readLayoutPreferences<T extends string>(raw: string | null, defaults: readonly T[]): LayoutPreferences<T> {
  const fallback = [...defaults];
  try {
    const saved = raw ? JSON.parse(raw) : null;
    const valid = (value: unknown): value is T => typeof value === "string" && defaults.includes(value as T);
    const order = Array.isArray(saved?.domainOrder) ? saved.domainOrder.filter(valid) : [];
    const visible = Array.isArray(saved?.visibleDomains) ? saved.visibleDomains.filter(valid) : [];
    const unique = (items: T[]) => items.filter((item, index) => items.indexOf(item) === index);
    const uniqueOrder = unique([...order, ...fallback]);
    const visibleDomains = unique(visible).filter(item => uniqueOrder.includes(item));
    const serviceOrder = saved?.serviceOrder && typeof saved.serviceOrder === "object" ? saved.serviceOrder : {};
    return { domainOrder: uniqueOrder, visibleDomains, serviceOrder };
  } catch {
    return { domainOrder: fallback, visibleDomains: fallback, serviceOrder: {} };
  }
}
