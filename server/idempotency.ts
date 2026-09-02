import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";
import { idempotencyKeys } from "../drizzle/schema";
import { getDb } from "./db";

export function hashIdempotencyRequest(parts: Array<string | number | null | undefined>) {
  return createHash("sha256")
    .update(parts.map(value => String(value ?? "")).join("|"))
    .digest("hex");
}

export async function readIdempotency(key: string, requestHash: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
  const [existing] = await db
    .select({ requestHash: idempotencyKeys.requestHash, responsePayload: idempotencyKeys.responsePayload })
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key))
    .limit(1);
  if (!existing) return null;
  if (existing.requestHash !== requestHash) {
    throw new TRPCError({ code: "CONFLICT", message: "لا يمكن إعادة استخدام مفتاح idempotency لطلب مختلف" });
  }
  return existing.responsePayload ? JSON.parse(existing.responsePayload) : { replay: true };
}

export async function storeIdempotency(key: string, operation: string, requestHash: string, response: unknown) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
  try {
    await db.insert(idempotencyKeys).values({
      key,
      operation,
      requestHash,
      responsePayload: JSON.stringify(response),
    });
  } catch {
    const [existing] = await db
      .select({ requestHash: idempotencyKeys.requestHash, responsePayload: idempotencyKeys.responsePayload })
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1);
    if (!existing) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر تسجيل مفتاح idempotency" });
    if (existing.requestHash !== requestHash) {
      throw new TRPCError({ code: "CONFLICT", message: "لا يمكن إعادة استخدام مفتاح idempotency لطلب مختلف" });
    }
    return existing.responsePayload ? JSON.parse(existing.responsePayload) : { replay: true };
  }
  return response;
}
