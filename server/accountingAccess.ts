import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { accountingBooks, journalEntries } from "../drizzle/schema";
import { getDb } from "./db";
import { assertEntityAccess } from "./entityAccess";

export async function assertAccountingManageAccess(
  userId: number,
  userRole: string,
  businessEntityId: number,
) {
  await assertEntityAccess(userId, userRole, businessEntityId, "accounting.manage");
  return true;
}

export async function assertJournalEntityOwnership(
  journalEntryId: number,
  businessEntityId: number,
) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "قاعدة البيانات غير متاحة",
    });
  }

  const [entry] = await db
    .select({
      id: journalEntries.id,
      businessEntityId: journalEntries.businessEntityId,
      status: journalEntries.status,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.id, journalEntryId),
        eq(journalEntries.businessEntityId, businessEntityId),
      ),
    )
    .limit(1);

  if (!entry) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "القيد المحاسبي خارج نطاق الكيان المحدد",
    });
  }

  return entry;
}

export async function listEntityAccountingBooks(businessEntityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(accountingBooks)
    .where(eq(accountingBooks.businessEntityId, businessEntityId));
}
