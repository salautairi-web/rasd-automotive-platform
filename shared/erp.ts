export type JournalLineInput = { debitMinor: number; creditMinor: number };

export function localEntityNumber(entityCode: string, kind: "CUS" | "VH" | "PRD", sequence: number) {
  const normalized = entityCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalized || sequence < 1 || !Number.isInteger(sequence)) throw new Error("Invalid local entity number input");
  return `${normalized}-${kind}-${String(sequence).padStart(4, "0")}`;
}

export function validateBalancedJournal(lines: JournalLineInput[]) {
  if (lines.length < 2) return { valid: false, debitMinor: 0, creditMinor: 0 };
  const debitMinor = lines.reduce((sum, line) => sum + line.debitMinor, 0);
  const creditMinor = lines.reduce((sum, line) => sum + line.creditMinor, 0);
  return { valid: debitMinor > 0 && debitMinor === creditMinor, debitMinor, creditMinor };
}
