import { describe, expect, it } from "vitest";
import { exponentialBackoff, isSupportedSchemaVersion, signWebhookPayload, transformPayload, verifyWebhookSignature } from "../shared/integration";

describe("integration contracts", () => {
  it("transforms nested payloads without leaking unmapped fields", () => {
    expect(transformPayload({ customer: { id: 42, name: "س" }, secret: "omit" }, [{ from: "customer.id", to: "customerId" }, { from: "customer.name", to: "displayName" }])).toEqual({ customerId: 42, displayName: "س" });
  });
  it("verifies signed webhooks with timestamp tolerance and rejects replay-age", () => {
    const payload = JSON.stringify({ event: "PaymentPosted", amount: 100 });
    const timestamp = 1_700_000_000_000;
    const signature = signWebhookPayload(payload, "test-secret", timestamp);
    expect(verifyWebhookSignature(payload, signature, "test-secret", timestamp, timestamp)).toBe(true);
    expect(verifyWebhookSignature(payload, signature, "test-secret", timestamp, timestamp + 301_000)).toBe(false);
    expect(verifyWebhookSignature(payload, signature + "x", "test-secret", timestamp, timestamp)).toBe(false);
  });
  it("supports explicit schema compatibility and capped retries", () => {
    expect(isSupportedSchemaVersion("v1", ["v1", "v2"])).toBe(true);
    expect(isSupportedSchemaVersion("v3", ["v1", "v2"])).toBe(false);
    expect(exponentialBackoff(1)).toBe(30);
    expect(exponentialBackoff(10)).toBe(3600);
  });
});
