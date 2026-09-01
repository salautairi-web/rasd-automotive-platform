import { describe, expect, it } from "vitest";
import { canSendCommunication, communicationIdempotencyKey, nextDeliveryStatus, validateTemplateVariables } from "../shared/communication";

describe("Communication Center contracts", () => {
  it("requires explicit consent for marketing and protects transactional delivery", () => { expect(canSendCommunication({ purpose: "marketing", consentDecision: "granted" })).toBe(true); expect(canSendCommunication({ purpose: "marketing", consentDecision: "opted_out" })).toBe(false); expect(canSendCommunication({ purpose: "transactional", consentDecision: "opted_out" })).toBe(false); expect(canSendCommunication({ purpose: "service" })).toBe(true); });
  it("validates template variables without accepting undefined fields", () => { expect(validateTemplateVariables(["name", "amount"], { name: "ليان", amount: 120 })).toBe(true); expect(validateTemplateVariables(["name"], { name: "ليان", hidden: "x" })).toBe(false); });
  it("keeps delivery lifecycle and idempotency deterministic", () => { expect(nextDeliveryStatus("queued", "send")).toBe("sent"); expect(nextDeliveryStatus("sent", "deliver")).toBe("delivered"); expect(nextDeliveryStatus("queued", "retry")).toBe("retrying"); expect(nextDeliveryStatus("sent", "fail")).toBe("failed"); expect(communicationIdempotencyKey(12, "sms", "abc")).toBe("communication:12:sms:abc"); });
});
