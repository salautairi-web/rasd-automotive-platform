import { validateFinancialLines, type FinancialLine } from "./financial";

export type FinancialEvent = {
  eventId: string;
  businessEntityId: number;
  sourceSystem: string;
  sourceType: string;
  sourceId: string;
  correlationId: string;
  currency: string;
  lines: FinancialLine[];
};

export function validateFinancialEvent(event: FinancialEvent) {
  if (!Number.isInteger(event.businessEntityId) || event.businessEntityId <= 0) return { valid: false, reason: "invalid_entity" as const };
  if (!event.eventId.trim() || !event.sourceSystem.trim() || !event.sourceType.trim() || !event.sourceId.trim() || !event.correlationId.trim()) {
    return { valid: false, reason: "missing_identity" as const };
  }
  if (!/^[A-Z]{3}$/.test(event.currency.toUpperCase())) return { valid: false, reason: "invalid_currency" as const };
  const balance = validateFinancialLines(event.lines);
  return balance.valid ? { valid: true as const, debitMinor: balance.debitMinor, creditMinor: balance.creditMinor } : { valid: false as const, reason: "unbalanced_or_invalid_lines" as const, debitMinor: balance.debitMinor, creditMinor: balance.creditMinor };
}
