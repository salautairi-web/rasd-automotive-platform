import { createHmac, timingSafeEqual } from "node:crypto";

export type IntegrationEventEnvelope = {
  eventId: string;
  eventType: string;
  version: string;
  sourceSystem: string;
  sourceEntityId?: number;
  targetSystem?: string;
  targetEntityId?: number;
  aggregateId?: string;
  commandId?: string;
  correlationId: string;
  occurredAt: string;
  schemaVersion: string;
  payload: Record<string, unknown>;
};

export type FieldMapping = { from: string; to: string; defaultValue?: unknown };

const read = (value: unknown, path: string) => path.split(".").reduce<unknown>((current, key) => current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined, value);
const write = (value: Record<string, unknown>, path: string, result: unknown) => { const parts = path.split("."); const last = parts.pop(); if (!last) return; let cursor = value; for (const part of parts) cursor = (cursor[part] ??= {}) as Record<string, unknown>; cursor[last] = result; };

export function transformPayload(payload: Record<string, unknown>, mappings: FieldMapping[]) {
  const output: Record<string, unknown> = {};
  for (const mapping of mappings) { const source = read(payload, mapping.from); write(output, mapping.to, source === undefined ? mapping.defaultValue : source); }
  return output;
}

export function signWebhookPayload(payload: string, secret: string, timestampMs: number) {
  return createHmac("sha256", secret).update(`${timestampMs}.${payload}`).digest("hex");
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string, timestampMs: number, nowMs = Date.now(), toleranceMs = 300_000) {
  if (!Number.isFinite(timestampMs) || Math.abs(nowMs - timestampMs) > toleranceMs) return false;
  const expected = signWebhookPayload(payload, secret, timestampMs);
  const a = Buffer.from(expected, "utf8"); const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isSupportedSchemaVersion(version: string, supported: string[]) { return supported.includes(version); }
export function exponentialBackoff(attempt: number, baseSeconds = 30, capSeconds = 3600) { return Math.min(capSeconds, baseSeconds * (2 ** Math.max(0, attempt - 1))); }
