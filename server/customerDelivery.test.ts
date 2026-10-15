import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  assertDeliveryAvailable,
  checkSmsVerification,
  deliveryAvailability,
  sendEmailCode,
  startSmsVerification,
  validEmailFrom,
} from "./customerDelivery";

const EMAIL_KEY = "re_test_resend_key";
const EMAIL_FROM = "security@example.invalid";
const TWILIO_KEY = `SK${"a".repeat(32)}`;
const TWILIO_SECRET = "twilio-test-secret";
const ACCOUNT_SID = `AC${"b".repeat(32)}`;
const SERVICE_SID = `VA${"c".repeat(32)}`;
const VERIFY_SID = `VE${"d".repeat(32)}`;
const to = "+96891234567";
const code = "123456";

type FetchMock = ReturnType<typeof vi.fn>;
function fetchMock() {
  return globalThis.fetch as unknown as FetchMock;
}
function configureEmail(from = EMAIL_FROM) {
  vi.stubEnv("RASD_RESEND_API_KEY", EMAIL_KEY);
  vi.stubEnv("RASD_EMAIL_FROM", from);
}
function configureSms() {
  vi.stubEnv("RASD_TWILIO_API_KEY", TWILIO_KEY);
  vi.stubEnv("RASD_TWILIO_API_SECRET", TWILIO_SECRET);
  vi.stubEnv("RASD_TWILIO_ACCOUNT_SID", ACCOUNT_SID);
  vi.stubEnv("RASD_TWILIO_VERIFY_SERVICE_SID", SERVICE_SID);
}
function response(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  };
}
function twilioCheckResult(overrides: Record<string, unknown> = {}) {
  return {
    status: "approved",
    sid: VERIFY_SID,
    to,
    channel: "sms",
    service_sid: SERVICE_SID,
    account_sid: ACCOUNT_SID,
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  for (const key of [
    "RASD_RESEND_API_KEY",
    "RASD_EMAIL_FROM",
    "RASD_TWILIO_API_KEY",
    "RASD_TWILIO_API_SECRET",
    "RASD_TWILIO_ACCOUNT_SID",
    "RASD_TWILIO_VERIFY_SERVICE_SID",
  ]) vi.stubEnv(key, "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("customer delivery configuration", () => {
  it("requires every Resend and Twilio flag, rejects malformed credentials, and accepts a bare email sender", () => {
    expect(validEmailFrom(EMAIL_FROM)).toBe(true);
    expect(validEmailFrom("Display Name <security@example.invalid>")).toBe(true);
    expect(validEmailFrom("security@example.invalid\r\nBcc: attacker@example.invalid")).toBe(false);
    expect(validEmailFrom("Display <not-an-email>")).toBe(false);

    expect(
      deliveryAvailability({
        RASD_RESEND_API_KEY: EMAIL_KEY,
        RASD_EMAIL_FROM: EMAIL_FROM,
        RASD_TWILIO_API_KEY: TWILIO_KEY,
        RASD_TWILIO_API_SECRET: TWILIO_SECRET,
        RASD_TWILIO_ACCOUNT_SID: ACCOUNT_SID,
        RASD_TWILIO_VERIFY_SERVICE_SID: SERVICE_SID,
      }),
    ).toEqual({ email: true, sms: true });
    expect(deliveryAvailability({ RASD_RESEND_API_KEY: EMAIL_KEY, RASD_EMAIL_FROM: "" }).email).toBe(false);
    expect(deliveryAvailability({ RASD_RESEND_API_KEY: "re_invalid space", RASD_EMAIL_FROM: EMAIL_FROM }).email).toBe(false);
    expect(deliveryAvailability({ RASD_TWILIO_API_KEY: TWILIO_KEY, RASD_TWILIO_API_SECRET: TWILIO_SECRET, RASD_TWILIO_ACCOUNT_SID: ACCOUNT_SID }).sms).toBe(false);
    expect(deliveryAvailability({ RASD_TWILIO_API_KEY: `SK${"z".repeat(32)}`, RASD_TWILIO_API_SECRET: TWILIO_SECRET, RASD_TWILIO_ACCOUNT_SID: ACCOUNT_SID, RASD_TWILIO_VERIFY_SERVICE_SID: SERVICE_SID }).sms).toBe(false);
  });

  it("fails unconfigured delivery before any network request", async () => {
    expect(() => assertDeliveryAvailable("email")).toThrowError(TRPCError);
    expect(() => assertDeliveryAvailable("sms")).toThrowError(TRPCError);
    await expect(sendEmailCode(to, code, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "verify_contact")).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(startSmsVerification(to)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(checkSmsVerification(to, VERIFY_SID, code)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(fetchMock()).not.toHaveBeenCalled();
  });
});

describe("sendEmailCode", () => {
  it.each([
    ["verify_contact", "توثيق البريد الإلكتروني"],
    ["password_reset", "استعادة كلمة المرور"],
  ])("sends the %s purpose as plaintext Arabic content with idempotency", async (purpose, label) => {
    configureEmail();
    fetchMock().mockResolvedValue(response({ id: "email-message-123" }));
    const challengeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    await expect(sendEmailCode(to, code, challengeId, purpose)).resolves.toBe("email-message-123");
    expect(fetchMock()).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock().mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Bearer ${EMAIL_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `rasd-customer-${challengeId}`,
    });
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      from: EMAIL_FROM,
      to: [to],
      subject: `RASD — ${label}`,
      text: expect.stringContaining(`رمز ${label}: ${code}`),
    });
    expect(body.text).toContain("الرمز صالح لمدة 10 دقائق");
    expect(body.text).toContain("يُستخدم مرة واحدة");
    expect(body.text).not.toContain(JSON.stringify({ challengeId }));
  });

  it("sanitizes provider failures and never returns the Resend secret", async () => {
    configureEmail();
    const secret = EMAIL_KEY;
    fetchMock().mockRejectedValue(new Error(`Resend rejected ${secret}`));
    const error = await sendEmailCode(to, code, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "verify_contact").catch(value => value);
    expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "تعذر إرسال رمز التحقق حالياً. حاول لاحقاً." });
    expect(error.message).not.toContain(secret);

    fetchMock().mockReset();
    fetchMock().mockResolvedValue(response({ error: "provider secret details" }, { ok: false, status: 503 }));
    await expect(sendEmailCode(to, code, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "verify_contact")).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});

describe("Twilio Verify delivery", () => {
  it("starts SMS verification with exact Twilio POST URL, Basic auth, and URL-encoded fields", async () => {
    configureSms();
    fetchMock().mockResolvedValue(response({ sid: VERIFY_SID, status: "pending", to, channel: "sms", service_sid: SERVICE_SID, account_sid: ACCOUNT_SID }, { status: 201 }));
    await expect(startSmsVerification(to)).resolves.toBe(VERIFY_SID);

    const [url, init] = fetchMock().mock.calls[0]!;
    expect(url).toBe(`https://verify.twilio.com/v2/Services/${SERVICE_SID}/Verifications`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Basic ${Buffer.from(`${TWILIO_KEY}:${TWILIO_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect(Object.fromEntries((init.body as URLSearchParams).entries())).toEqual({ To: to, Channel: "sms", Locale: "ar" });
  });

  it("rejects a provider response with the wrong status or identity without exposing secrets", async () => {
    configureSms();
    fetchMock().mockResolvedValue(response({ sid: VERIFY_SID, status: "approved", to, channel: "sms", service_sid: SERVICE_SID, account_sid: ACCOUNT_SID }));
    const error = await startSmsVerification(to).catch(value => value);
    expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "تعذر إرسال رمز التحقق حالياً. حاول لاحقاً." });
    expect(error.message).not.toContain(TWILIO_SECRET);
  });

  it("accepts a verification check only when every result field exactly matches", async () => {
    configureSms();
    fetchMock().mockResolvedValue(response(twilioCheckResult()));
    await expect(checkSmsVerification(to, VERIFY_SID, code)).resolves.toBe(true);
    const [url, init] = fetchMock().mock.calls[0]!;
    expect(url).toBe(`https://verify.twilio.com/v2/Services/${SERVICE_SID}/VerificationCheck`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Basic ${Buffer.from(`${TWILIO_KEY}:${TWILIO_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(Object.fromEntries((init.body as URLSearchParams).entries())).toEqual({ VerificationSid: VERIFY_SID, Code: code });

    const mismatches: Array<[string, unknown]> = [
      ["status", "pending"],
      ["sid", `VE${"e".repeat(32)}`],
      ["to", "+96890000000"],
      ["channel", "voice"],
      ["service_sid", `VA${"e".repeat(32)}`],
      ["account_sid", `AC${"e".repeat(32)}`],
    ];
    for (const [field, value] of mismatches) {
      fetchMock().mockReset();
      fetchMock().mockResolvedValue(response(twilioCheckResult({ [field]: value })));
      await expect(checkSmsVerification(to, VERIFY_SID, code)).resolves.toBe(false);
    }
  });

  it("returns false for Twilio's invalid-code statuses and malformed provider SIDs", async () => {
    configureSms();
    for (const status of [400, 404, 429]) {
      fetchMock().mockReset();
      fetchMock().mockResolvedValue(response({}, { ok: false, status }));
      await expect(checkSmsVerification(to, VERIFY_SID, code)).resolves.toBe(false);
    }
    fetchMock().mockReset();
    await expect(checkSmsVerification(to, "not-a-verify-sid", code)).resolves.toBe(false);
    expect(fetchMock()).not.toHaveBeenCalled();
  });

  it("sanitizes unexpected Twilio failures", async () => {
    configureSms();
    fetchMock().mockResolvedValue(response({}, { ok: false, status: 500 }));
    await expect(checkSmsVerification(to, VERIFY_SID, code)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "تعذر فحص الرمز حالياً. حاول لاحقاً." });
  });
});
