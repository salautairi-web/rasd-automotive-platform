import { TRPCError } from "@trpc/server";
import { z } from "zod";

export function validEmailFrom(value: string) {
  if (/[\r\n]/.test(value)) return false;
  const address = value.includes("<")
    ? value.match(/^[^<>]+<([^<>]+)>$/)?.[1]
    : value;
  return Boolean(
    address && z.string().email().safeParse(address.trim()).success
  );
}
export function deliveryAvailability(env = process.env) {
  const email =
    /^re_[A-Za-z0-9_-]+$/.test(env.RASD_RESEND_API_KEY ?? "") &&
    validEmailFrom(env.RASD_EMAIL_FROM ?? "");
  const sms =
    /^SK[0-9a-fA-F]{32}$/.test(env.RASD_TWILIO_API_KEY ?? "") &&
    Boolean(env.RASD_TWILIO_API_SECRET) &&
    /^AC[0-9a-fA-F]{32}$/.test(env.RASD_TWILIO_ACCOUNT_SID ?? "") &&
    /^VA[0-9a-fA-F]{32}$/.test(env.RASD_TWILIO_VERIFY_SERVICE_SID ?? "");
  return { email, sms };
}
export function assertDeliveryAvailable(channel: "email" | "sms") {
  if (!deliveryAvailability()[channel])
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        channel === "email"
          ? "إرسال البريد غير مهيأ بعد. يرجى التواصل مع الشركة."
          : "رسائل التحقق بالجوال غير مهيأة بعد. يرجى التواصل مع الشركة.",
    });
}
function providerError() {
  return new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "تعذر إرسال رمز التحقق حالياً. حاول لاحقاً.",
  });
}
export async function sendEmailCode(
  to: string,
  code: string,
  challengeId: string,
  purpose: string
) {
  assertDeliveryAvailable("email");
  const label =
    purpose === "password_reset"
      ? "استعادة كلمة المرور"
      : "توثيق البريد الإلكتروني";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RASD_RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `rasd-customer-${challengeId}`,
      },
      body: JSON.stringify({
        from: process.env.RASD_EMAIL_FROM,
        to: [to],
        subject: `RASD — ${label}`,
        text: `رمز ${label}: ${code}\nالرمز صالح لمدة 10 دقائق ويُستخدم مرة واحدة.\nلا تشارك الرمز مع أحد. إذا لم تطلب هذه العملية تجاهل هذه الرسالة.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw providerError();
    const data = await response.json();
    if (typeof data.id !== "string" || !data.id) throw providerError();
    return data.id as string;
  } catch {
    throw providerError();
  }
}
function twilioHeaders() {
  return {
    Authorization: `Basic ${Buffer.from(`${process.env.RASD_TWILIO_API_KEY}:${process.env.RASD_TWILIO_API_SECRET}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}
export async function startSmsVerification(to: string) {
  assertDeliveryAvailable("sms");
  try {
    const r = await fetch(
      `https://verify.twilio.com/v2/Services/${process.env.RASD_TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: "POST",
        headers: twilioHeaders(),
        body: new URLSearchParams({ To: to, Channel: "sms", Locale: "ar" }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!r.ok) throw providerError();
    const data = await r.json();
    if (
      !/^VE[0-9a-fA-F]{32}$/.test(data.sid ?? "") ||
      data.status !== "pending" ||
      data.to !== to ||
      data.channel !== "sms" ||
      data.service_sid !== process.env.RASD_TWILIO_VERIFY_SERVICE_SID ||
      data.account_sid !== process.env.RASD_TWILIO_ACCOUNT_SID
    )
      throw providerError();
    return data.sid as string;
  } catch {
    throw providerError();
  }
}
export async function checkSmsVerification(
  to: string,
  sid: string,
  code: string
) {
  assertDeliveryAvailable("sms");
  if (!/^VE[0-9a-fA-F]{32}$/.test(sid)) return false;
  try {
    const r = await fetch(
      `https://verify.twilio.com/v2/Services/${process.env.RASD_TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: "POST",
        headers: twilioHeaders(),
        body: new URLSearchParams({ VerificationSid: sid, Code: code }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if ([400, 404, 429].includes(r.status)) return false;
    if (!r.ok) throw providerError();
    const data = await r.json();
    return (
      data.status === "approved" &&
      data.sid === sid &&
      data.to === to &&
      data.channel === "sms" &&
      data.service_sid === process.env.RASD_TWILIO_VERIFY_SERVICE_SID &&
      data.account_sid === process.env.RASD_TWILIO_ACCOUNT_SID
    );
  } catch {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "تعذر فحص الرمز حالياً. حاول لاحقاً.",
    });
  }
}
