export type FinancialLine = { accountCode: string; debitMinor: number; creditMinor: number };

export function validateFinancialLines(lines: FinancialLine[]) {
  if (lines.length < 2) return { valid: false, debitMinor: 0, creditMinor: 0 };
  if (lines.some(line => line.debitMinor < 0 || line.creditMinor < 0 || (line.debitMinor > 0 && line.creditMinor > 0))) {
    return { valid: false, debitMinor: 0, creditMinor: 0 };
  }
  const debitMinor = lines.reduce((sum, line) => sum + line.debitMinor, 0);
  const creditMinor = lines.reduce((sum, line) => sum + line.creditMinor, 0);
  return { valid: debitMinor > 0 && debitMinor === creditMinor, debitMinor, creditMinor };
}

export function buildReversalLines(lines: FinancialLine[]): FinancialLine[] {
  return lines.map(line => ({
    accountCode: line.accountCode,
    debitMinor: line.creditMinor,
    creditMinor: line.debitMinor,
  }));
}
