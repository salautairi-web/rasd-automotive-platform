import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { numberingRules } from "../drizzle/schema";
import { formatRasdNumber } from "../shared/rasd";

export async function nextRasdNumber(input: { organizationId: number; entityKey: string }) {
  const db = await getDb();
  if (!db) return formatRasdNumber({ prefix: input.entityKey.toUpperCase().slice(0, 3), sequence: 1 });
  return db.transaction(async (tx) => {
    const rule = (await tx.select().from(numberingRules).where(and(eq(numberingRules.organizationId, input.organizationId), eq(numberingRules.entityKey, input.entityKey))).limit(1))[0];
    if (!rule) return formatRasdNumber({ prefix: input.entityKey.toUpperCase().slice(0, 3), sequence: 1 });
    const nextSequence = rule.sequence + 1;
    await tx.update(numberingRules).set({ sequence: nextSequence }).where(eq(numberingRules.id, rule.id));
    return formatRasdNumber({ prefix: rule.prefix, includeYear: rule.includeYear === 1, sequence: nextSequence });
  });
}
