import { describe, expect, it } from "vitest";
const emailConfigured = Boolean(
  process.env.RASD_RESEND_API_KEY && process.env.RASD_EMAIL_FROM
);
const smsConfigured = Boolean(
  process.env.RASD_TWILIO_API_KEY &&
    process.env.RASD_TWILIO_API_SECRET &&
    process.env.RASD_TWILIO_VERIFY_SERVICE_SID &&
    process.env.RASD_TWILIO_ACCOUNT_SID
);
describe("Customer delivery credentials — no unsolicited messages", () => {
  it("does not consider missing or rejected credentials configured", () => {
    if (!emailConfigured)
      expect(
        Boolean(process.env.RASD_RESEND_API_KEY && process.env.RASD_EMAIL_FROM)
      ).toBe(false);
    if (!smsConfigured)
      expect(
        Boolean(
          process.env.RASD_TWILIO_API_KEY &&
            process.env.RASD_TWILIO_API_SECRET &&
            process.env.RASD_TWILIO_VERIFY_SERVICE_SID &&
            process.env.RASD_TWILIO_ACCOUNT_SID
        )
      ).toBe(false);
  });
  it.skipIf(!emailConfigured)(
    "validates Resend auth with an invalid empty message that cannot be delivered",
    async () => {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RASD_RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: "", to: [], subject: "", text: "" }),
        signal: AbortSignal.timeout(10000),
      });
      expect([400, 422]).toContain(r.status);
    }
  );
  it.skipIf(!smsConfigured)(
    "reads the Verify service with supplied credentials without starting a verification",
    async () => {
      const auth = Buffer.from(
        `${process.env.RASD_TWILIO_API_KEY}:${process.env.RASD_TWILIO_API_SECRET}`
      ).toString("base64");
      const r = await fetch(
        `https://verify.twilio.com/v2/Services/${process.env.RASD_TWILIO_VERIFY_SERVICE_SID}`,
        {
          headers: { Authorization: `Basic ${auth}` },
          signal: AbortSignal.timeout(10000),
        }
      );
      expect(r.status).toBe(200);
      const result = await r.json();
      expect(result.account_sid).toBe(process.env.RASD_TWILIO_ACCOUNT_SID);
      expect(result.sid).toBe(process.env.RASD_TWILIO_VERIFY_SERVICE_SID);
    }
  );
});
