import { setTimeout as wait } from "node:timers/promises";
import {
  createHash,
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  customerCredentials,
  customerVerificationChallenges as challenges,
  portalAudit,
} from "../drizzle/schema";
import { loginSchema, passwordIssue } from "../shared/customerAuth";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  assertCsrf,
  auditValues,
  clientIp,
  consumeAttempts,
} from "./customerAuth";
import {
  assertDeliveryAvailable,
  checkSmsVerification,
  deliveryAvailability,
  sendEmailCode,
  startSmsVerification,
} from "./customerDelivery";
import { hashCustomerPassword } from "./customerPasswords";
import {
  clearCustomerSessionCookie,
  revokeAllCustomerSessions,
} from "./customerSessions";

const channelInput = z.object({ channel: z.enum(["email", "sms"]) });
const codeInput = z.object({
  challengeId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .transform(value =>
      value.replace(/[٠-٩۰-۹]/g, d =>
        String(
          "٠١٢٣٤٥٦٧٨٩".includes(d)
            ? "٠١٢٣٤٥٦٧٨٩".indexOf(d)
            : "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
        )
      )
    )
    .pipe(z.string().regex(/^\d{4,10}$/, "أدخل رمز التحقق الرقمي")),
});
const resetInput = codeInput
  .extend({
    newPassword: z
      .string()
      .min(12)
      .max(128)
      .refine(v => !passwordIssue(v), "كلمة المرور تحتاج حرفاً ورقماً"),
    confirmPassword: z.string().max(128),
  })
  .refine(v => v.newPassword === v.confirmPassword, {
    message: "تأكيد كلمة المرور غير مطابق",
    path: ["confirmPassword"],
  });
const resetStartInput = channelInput.extend({
  identifier: loginSchema.shape.identifier,
});
const TTL = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const GENERIC_RESET =
  "إذا كان الحساب نشطاً ووسيلة الاتصال موثقة فستصلك تعليمات الاستعادة. لا نكشف وجود الحساب.";
const invalid = () =>
  new TRPCError({
    code: "BAD_REQUEST",
    message: "الرمز غير صحيح أو منتهٍ أو مُستخدم. اطلب رمزاً جديداً.",
  });
export function verificationDigest(
  id: string,
  purpose: string,
  destination: string,
  code: string
) {
  if (!process.env.JWT_SECRET)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "إعداد التحقق غير مكتمل",
    });
  return createHmac("sha256", process.env.JWT_SECRET)
    .update(`${id}:${purpose}:${destination}:${code}`)
    .digest("hex");
}
const fingerprint = (hash: string) =>
  createHash("sha256").update(hash).digest("hex");
async function dbRequired() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "خدمة الحساب غير متاحة",
    });
  return db;
}
function requireCustomer(ctx: any) {
  if (!ctx.customer)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "يلزم تسجيل الدخول لحساب العميل",
    });
  return ctx.customer;
}
async function currentCredential(db: any, actor: any, lock = false) {
  const query = db
    .select()
    .from(customerCredentials)
    .where(
      and(
        eq(customerCredentials.id, actor.credentialId),
        eq(customerCredentials.userId, actor.userId)
      )
    )
    .limit(1);
  const rows = await (lock ? query.for("update") : query);
  if (!rows[0] || rows[0].status !== "active")
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "حساب العميل غير نشط",
    });
  return rows[0];
}
async function createChallenge(
  db: any,
  credential: any,
  channel: "email" | "sms",
  purpose: "verify_contact" | "password_reset"
) {
  const id = randomUUID();
  const now = Date.now();
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  const destination = channel === "email" ? credential.email : credential.phone;
  await db.transaction(async (tx: any) => {
    const locked = await currentCredential(
      tx,
      { credentialId: credential.id, userId: credential.userId },
      true
    );
    if (
      locked.passwordHash !== credential.passwordHash ||
      locked[channel === "email" ? "email" : "phone"] !== destination
    )
      throw invalid();
    if (
      purpose === "password_reset" &&
      !locked[channel === "email" ? "emailVerifiedAt" : "phoneVerifiedAt"]
    )
      throw invalid();
    const last = await tx
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.credentialId, credential.id),
          eq(challenges.channel, channel)
        )
      )
      .orderBy(desc(challenges.createdAt))
      .limit(1)
      .for("update");
    if (last[0] && last[0].createdAt > now - 60000)
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "انتظر دقيقة قبل طلب رمز آخر",
      });
    await tx
      .update(challenges)
      .set({ status: "revoked" })
      .where(
        and(
          eq(challenges.credentialId, credential.id),
          eq(challenges.channel, channel),
          inArray(challenges.status, ["sending", "active"])
        )
      );
    await tx.insert(challenges).values({
      id,
      credentialId: credential.id,
      channel,
      purpose,
      destination,
      codeHash:
        channel === "email"
          ? verificationDigest(id, purpose, destination, code)
          : null,
      status: "sending",
      expiresAt: now + TTL,
      createdAt: now,
      passwordFingerprint: fingerprint(credential.passwordHash),
    });
  });
  try {
    const providerSid =
      channel === "email"
        ? await sendEmailCode(destination, code, id, purpose)
        : await startSmsVerification(destination);
    await db
      .update(challenges)
      .set({ status: "active", providerSid })
      .where(and(eq(challenges.id, id), eq(challenges.status, "sending")));
  } catch (error) {
    await db
      .update(challenges)
      .set({ status: "failed" })
      .where(and(eq(challenges.id, id), eq(challenges.status, "sending")));
    throw error;
  }
  await db.insert(portalAudit).values(
    auditValues({
      userId: credential.userId,
      action: `customer.${purpose}.${channel}.sent`,
      outcome: "success",
    })
  );
  return { challengeId: id, expiresAt: now + TTL, resendAt: now + 60000 };
}
async function useChallenge(
  db: any,
  input: z.infer<typeof codeInput>,
  purpose: "verify_contact" | "password_reset",
  actor?: any,
  newPassword?: string
) {
  const [preliminary] = await db
    .select({ credentialId: challenges.credentialId })
    .from(challenges)
    .where(eq(challenges.id, input.challengeId))
    .limit(1);
  if (
    !preliminary?.credentialId ||
    (actor && preliminary.credentialId !== actor.credentialId)
  )
    return { error: true };
  return db.transaction(async (tx: any) => {
    const [credential] = await tx
      .select()
      .from(customerCredentials)
      .where(eq(customerCredentials.id, preliminary.credentialId))
      .limit(1)
      .for("update");
    const [challenge] = await tx
      .select()
      .from(challenges)
      .where(eq(challenges.id, input.challengeId))
      .limit(1)
      .for("update");
    if (
      !credential ||
      credential.status !== "active" ||
      (actor && credential.userId !== actor.userId) ||
      !challenge ||
      challenge.credentialId !== credential.id ||
      challenge.purpose !== purpose ||
      challenge.status !== "active" ||
      challenge.expiresAt <= Date.now() ||
      challenge.attempts >= MAX_ATTEMPTS ||
      challenge.passwordFingerprint !== fingerprint(credential.passwordHash)
    )
      return { error: true };
    const destination =
      challenge.channel === "email" ? credential.email : credential.phone;
    if (
      destination !== challenge.destination ||
      (purpose === "password_reset" &&
        !credential[
          challenge.channel === "email" ? "emailVerifiedAt" : "phoneVerifiedAt"
        ])
    )
      return { error: true };
    // Persist attempts even when verification or delivery fails; do not throw inside the transaction.
    const nextAttempts = challenge.attempts + 1;
    let approved = false;
    try {
      if (challenge.channel === "sms")
        approved = await checkSmsVerification(
          destination,
          challenge.providerSid ?? "",
          input.code
        );
      else {
        const actual = Buffer.from(
          verificationDigest(challenge.id, purpose, destination, input.code),
          "hex"
        );
        const expected = Buffer.from(challenge.codeHash ?? "", "hex");
        approved =
          actual.length === expected.length &&
          timingSafeEqual(actual, expected);
      }
    } catch {
      approved = false;
    }
    approved = approved && challenge.expiresAt > Date.now();
    await tx
      .update(challenges)
      .set({
        attempts: nextAttempts,
        status: approved
          ? "used"
          : nextAttempts >= MAX_ATTEMPTS
            ? "locked"
            : "active",
        consumedAt: approved ? Date.now() : null,
      })
      .where(eq(challenges.id, challenge.id));
    if (!approved) {
      await tx.insert(portalAudit).values(
        auditValues({
          userId: credential.userId,
          action: `customer.${purpose}.denied`,
          outcome: "denied",
        })
      );
      return { error: true };
    }
    if (purpose === "verify_contact") {
      await tx
        .update(customerCredentials)
        .set(
          challenge.channel === "email"
            ? { emailVerifiedAt: new Date() }
            : { phoneVerifiedAt: new Date() }
        )
        .where(eq(customerCredentials.id, credential.id));
    } else {
      const passwordHash = await hashCustomerPassword(newPassword!);
      await tx
        .update(customerCredentials)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(customerCredentials.id, credential.id));
      await revokeAllCustomerSessions(tx, credential.id);
      await tx
        .update(challenges)
        .set({ status: "revoked" })
        .where(
          and(
            eq(challenges.credentialId, credential.id),
            inArray(challenges.status, ["active", "sending"])
          )
        );
    }
    await tx.insert(portalAudit).values(
      auditValues({
        userId: credential.userId,
        action: `customer.${purpose}.${challenge.channel}.confirmed`,
        outcome: "success",
      })
    );
    return { error: false, channel: challenge.channel as "email" | "sms" };
  });
}
export const customerVerificationRouter = router({
  availability: publicProcedure.query(() => ({
    ...deliveryAvailability(),
    codeMinutes: 10,
    resendSeconds: 60,
  })),
  status: publicProcedure.query(async ({ ctx }) => {
    const actor = requireCustomer(ctx);
    const credential = await currentCredential(await dbRequired(), actor);
    return {
      email: credential.email,
      phone: credential.phone,
      emailVerifiedAt: credential.emailVerifiedAt,
      phoneVerifiedAt: credential.phoneVerifiedAt,
      delivery: deliveryAvailability(),
    };
  }),
  send: publicProcedure.input(channelInput).mutation(async ({ ctx, input }) => {
    assertCsrf(ctx.req);
    const actor = requireCustomer(ctx);
    assertDeliveryAvailable(input.channel);
    const db = await dbRequired();
    await consumeAttempts(db, [
      [`verify-send:${actor.credentialId}:${input.channel}`, 5],
      [`verify-ip:${clientIp(ctx.req)}`, 30],
    ]);
    const credential = await currentCredential(db, actor);
    return createChallenge(db, credential, input.channel, "verify_contact");
  }),
  confirm: publicProcedure.input(codeInput).mutation(async ({ ctx, input }) => {
    assertCsrf(ctx.req);
    const actor = requireCustomer(ctx);
    const db = await dbRequired();
    await consumeAttempts(db, [
      [`verify-check:${actor.credentialId}`, 30],
      [`verify-check-ip:${clientIp(ctx.req)}`, 100],
    ]);
    const result = await useChallenge(db, input, "verify_contact", actor);
    if (result.error) throw invalid();
    return { verified: true, channel: result.channel };
  }),
  requestReset: publicProcedure
    .input(resetStartInput)
    .mutation(async ({ ctx, input }) => {
      assertCsrf(ctx.req);
      assertDeliveryAvailable(input.channel);
      const db = await dbRequired();
      const responseStartedAt = Date.now();
      const identifier = input.identifier;
      await consumeAttempts(db, [
        [`reset-ip:${clientIp(ctx.req)}`, 20],
        [`reset-id:${identifier}`, 3],
      ]);
      const [credential] = await db
        .select()
        .from(customerCredentials)
        .where(
          identifier.includes("@")
            ? eq(customerCredentials.email, identifier)
            : eq(customerCredentials.phone, identifier)
        )
        .limit(1);
      const fallback = {
        challengeId: randomUUID(),
        expiresAt: Date.now() + TTL,
        resendAt: Date.now() + 60000,
      };
      let challenge = fallback;
      if (
        credential?.status === "active" &&
        credential[
          input.channel === "email" ? "emailVerifiedAt" : "phoneVerifiedAt"
        ]
      ) {
        try {
          challenge = await createChallenge(
            db,
            credential,
            input.channel,
            "password_reset"
          );
        } catch {
          /* Same public response on missing/blocked delivery and unknown accounts. */
        }
      }
      // Equal minimum response time for known, unknown and unverified accounts; provider timeout is 10 seconds.
      await wait(Math.max(0, 12000 - (Date.now() - responseStartedAt)));
      return { ...challenge, message: GENERIC_RESET };
    }),
  completeReset: publicProcedure
    .input(resetInput)
    .mutation(async ({ ctx, input }) => {
      assertCsrf(ctx.req);
      const db = await dbRequired();
      await consumeAttempts(db, [
        [`reset-check-ip:${clientIp(ctx.req)}`, 30],
        [`reset-check:${input.challengeId}`, 5],
      ]);
      const result = await useChallenge(
        db,
        input,
        "password_reset",
        undefined,
        input.newPassword
      );
      if (result.error) throw invalid();
      clearCustomerSessionCookie(ctx.res, ctx.req);
      return {
        reset: true,
        message:
          "تم تغيير كلمة المرور وإغلاق الجلسات القديمة. سجّل الدخول بكلمة المرور الجديدة.",
      };
    }),
});
