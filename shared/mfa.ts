import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function hashMfaValue(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function createMfaChallenge() { const raw = randomBytes(24).toString("base64url"); return { raw, hash: hashMfaValue(raw) }; }
export function isChallengeUsable(input: { status: string; attempts: number; maxAttempts: number; expiresAt: Date }, now = new Date()) { return input.status === "pending" && input.attempts < input.maxAttempts && input.expiresAt.getTime() > now.getTime(); }
export function verifyMfaValue(value: string, expectedHash: string) { const actual = Buffer.from(hashMfaValue(value), "utf8"); const expected = Buffer.from(expectedHash, "utf8"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export function isStepUpFresh(verifiedAt: Date, expiresAt: Date, now = new Date()) { return verifiedAt.getTime() <= now.getTime() && expiresAt.getTime() > now.getTime(); }
export function sessionStatus(expiresAt: Date, now = new Date()) { return expiresAt.getTime() <= now.getTime() ? "expired" as const : "active" as const; }
