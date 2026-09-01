import { describe, expect, it } from "vitest";
import { createMfaChallenge, hashMfaValue, isChallengeUsable, isStepUpFresh, sessionStatus, verifyMfaValue } from "../shared/mfa";

describe("MFA hardening", () => {
  it("never exposes a stored plaintext challenge value", () => { const challenge = createMfaChallenge(); expect(challenge.raw).not.toBe(challenge.hash); expect(verifyMfaValue(challenge.raw, challenge.hash)).toBe(true); expect(verifyMfaValue("wrong-value", challenge.hash)).toBe(false); });
  it("expires and locks challenges deterministically", () => { const expiresAt = new Date(10_000); expect(isChallengeUsable({ status: "pending", attempts: 0, maxAttempts: 5, expiresAt }, new Date(9_000))).toBe(true); expect(isChallengeUsable({ status: "pending", attempts: 5, maxAttempts: 5, expiresAt }, new Date(9_000))).toBe(false); expect(isChallengeUsable({ status: "pending", attempts: 0, maxAttempts: 5, expiresAt }, new Date(11_000))).toBe(false); });
  it("enforces fresh step-up and session expiry", () => { expect(isStepUpFresh(new Date(1_000), new Date(5_000), new Date(4_999))).toBe(true); expect(isStepUpFresh(new Date(1_000), new Date(5_000), new Date(5_000))).toBe(false); expect(sessionStatus(new Date(1_000), new Date(2_000))).toBe("expired"); });
  it("uses one-way hashes for stored values", () => { expect(hashMfaValue("abc")).toHaveLength(64); });
});
