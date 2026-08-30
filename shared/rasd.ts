export type NumberingRule = { prefix: string; includeYear?: boolean; sequence: number; padLength?: number };

export function formatRasdNumber(rule: NumberingRule, year = new Date().getUTCFullYear()): string {
  const sequence = String(rule.sequence).padStart(rule.padLength ?? 6, "0");
  return [rule.prefix, rule.includeYear === false ? null : year, sequence].filter(Boolean).join("-");
}

export function hasPermission(granted: string[], required: string): boolean {
  return granted.includes("*") || granted.includes(required);
}
