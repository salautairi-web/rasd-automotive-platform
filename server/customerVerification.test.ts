import { createHash } from "node:crypto";
import { getTableName, MySqlDialect } from "drizzle-orm/mysql-core";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  assertCsrf: vi.fn((req: any) => {
    const origin = req.headers?.origin;
    const host = req.headers?.host;
    if (origin && origin !== `https://${host}` && origin !== `http://${host}`)
      throw new TRPCError({ code: "FORBIDDEN", message: "طلب غير مسموح" });
  }),
  consumeAttempts: vi.fn().mockResolvedValue(undefined),
  clientIp: vi.fn(() => "198.51.100.10"),
  auditValues: vi.fn((input: any) => ({
    portalUserId: undefined,
    businessEntityId: undefined,
    action: input.action,
    resourceType: "customer_auth",
    resourceId: input.userId ? String(input.userId) : undefined,
    outcome: input.outcome,
    correlationId: "customer-test-correlation",
  })),
}));

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("node:timers/promises", () => ({ setTimeout: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./customerAuth", () => authMocks);
vi.mock("./customerDelivery", () => ({
  assertDeliveryAvailable: vi.fn(),
  deliveryAvailability: vi.fn(() => ({ email: true, sms: true })),
  sendEmailCode: vi.fn(),
  startSmsVerification: vi.fn(),
  checkSmsVerification: vi.fn(),
}));
vi.mock("./customerPasswords", () => ({ hashCustomerPassword: vi.fn() }));
vi.mock("./customerSessions", () => ({
  clearCustomerSessionCookie: vi.fn((res: any, req: any) => res.clearCookie("rasd_customer_session", { maxAge: -1 })),
  revokeAllCustomerSessions: vi.fn().mockResolvedValue(undefined),
}));

import { getTableName as tableName } from "drizzle-orm";
import { customerVerificationChallenges, customerCredentials } from "../drizzle/schema";
import { customerVerificationRouter, verificationDigest } from "./customerVerification";
import { getDb } from "./db";
import { assertDeliveryAvailable, checkSmsVerification, sendEmailCode, startSmsVerification } from "./customerDelivery";
import { hashCustomerPassword } from "./customerPasswords";
import { clearCustomerSessionCookie, revokeAllCustomerSessions } from "./customerSessions";

// The fake deliberately compiles every predicate. This keeps tests about the actual
// router callers rather than about an unscoped data-builder mock.
type Row = Record<string, any>;
type QueueState = {
  rows: Map<string, Row[][]>;
  where: Array<{ table: string; query: any }>;
  selects: string[];
  locks: string[];
  writes: Array<{ action: string; table: string; values?: Row; query?: any }>;
  transactions: number;
  nextId: number;
};
const dialect = new MySqlDialect();
const table = (value: any) => tableName(value);

class SelectQuery implements PromiseLike<Row[]> {
  private source?: any;
  private condition?: any;
  constructor(private readonly db: FakeDb, private readonly state: QueueState) {}
  from(source: any) { this.source = source; this.state.selects.push(table(source)); return this; }
  innerJoin() { return this; }
  leftJoin() { return this; }
  where(condition: any) {
    this.condition = condition;
    if (this.source) this.state.where.push({ table: table(this.source), query: dialect.sqlToQuery(condition) });
    return this;
  }
  orderBy() { return this; }
  limit() { return this; }
  for(lock: string) {
    if (lock === "update" && this.source) this.state.locks.push(table(this.source));
    return Promise.resolve(this.result());
  }
  private result() {
    const name = this.source ? table(this.source) : "unknown";
    const queue = this.state.rows.get(name) ?? [];
    return queue.length ? queue.shift()! : [];
  }
  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result()).then(onfulfilled, onrejected);
  }
}

class MutationQuery implements PromiseLike<Array<{ insertId?: number }>> {
  private values_: Row = {};
  private condition?: any;
  constructor(private readonly action: "insert" | "update", private readonly source: any, private readonly state: QueueState) {}
  values(values: Row) { this.values_ = values; return this; }
  set(values: Row) { this.values_ = values; return this; }
  where(condition: any) {
    this.condition = condition;
    this.state.writes.push({ action: this.action, table: table(this.source), values: this.values_, query: dialect.sqlToQuery(condition) });
    return this;
  }
  then<TResult1 = Array<{ insertId?: number }>, TResult2 = never>(
    onfulfilled?: ((value: Array<{ insertId?: number }>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    if (this.action === "insert") this.state.writes.push({ action: this.action, table: table(this.source), values: this.values_ });
    const result = this.action === "insert" ? [{ insertId: this.state.nextId++ }] : [];
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

class FakeDb {
  constructor(public readonly state: QueueState) {}
  select() { return new SelectQuery(this, this.state); }
  insert(source: any) { return new MutationQuery("insert", source, this.state); }
  update(source: any) { return new MutationQuery("update", source, this.state); }
  async transaction<T>(callback: (tx: this) => Promise<T>) { this.state.transactions++; return callback(this); }
}

const actor = {
  userId: 12,
  credentialId: 44,
  sessionId: 900,
  name: "عميل اختبار",
  email: "stale-actor@example.invalid",
  phone: "+96890000001",
};
const credential = {
  id: 44,
  userId: actor.userId,
  email: "db-source@example.invalid",
  phone: "+96891234567",
  passwordHash: "scrypt$old-hash",
  status: "active",
  emailVerifiedAt: new Date(Date.now() - 60_000),
  phoneVerifiedAt: new Date(Date.now() - 60_000),
};
const UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SMS_SID = "VE" + "a".repeat(32);

function state(): QueueState {
  return { rows: new Map(), where: [], selects: [], locks: [], writes: [], transactions: 0, nextId: 700 };
}
function queue(s: QueueState, name: string, ...answers: Row[][]) { s.rows.set(name, answers); }
function callerContext(customer: any = actor, extra: any = {}) {
  const cleared: any[] = [];
  return {
    ctx: {
      req: { protocol: "https", headers: { host: "portal.example.test" }, socket: { remoteAddress: "198.51.100.10" } },
      res: { clearCookie: (...args: any[]) => cleared.push(args) },
      customer,
      user: null,
      ...extra,
    } as any,
    cleared,
  };
}
function insertOf(s: QueueState, name: string) { return s.writes.find(w => w.action === "insert" && w.table === name)?.values; }
function updatesOf(s: QueueState, name: string) { return s.writes.filter(w => w.action === "update" && w.table === name); }
function fingerprint(hash: string) { return createHash("sha256").update(hash).digest("hex"); }
function validChallenge(overrides: Row = {}) {
  const purpose = overrides.purpose ?? "verify_contact";
  const channel = overrides.channel ?? "email";
  const destination = overrides.destination ?? credential.email;
  const code = overrides.code ?? "123456";
  const id = overrides.id ?? UUID;
  return {
    id,
    credentialId: credential.id,
    purpose,
    channel,
    destination,
    codeHash: channel === "email" ? verificationDigest(id, purpose, destination, code) : null,
    providerSid: channel === "sms" ? SMS_SID : null,
    status: "active",
    attempts: 0,
    expiresAt: Date.now() + 600_000,
    createdAt: Date.now() - 120_000,
    passwordFingerprint: fingerprint(credential.passwordHash),
    ...overrides,
  };
}
function queueUseChallenge(s: QueueState, challenge: Row, preliminaryCredentialId = credential.id, credentialRow = credential) {
  queue(s, "customer_verification_challenges", [{ credentialId: preliminaryCredentialId }, [challenge] as any].flat() as any);
  // The preceding expression is intentionally expanded below for the per-query queue.
  s.rows.set("customer_verification_challenges", [[{ credentialId: preliminaryCredentialId }], [challenge]]);
  queue(s, "customer_credentials", [credentialRow]);
}

let db: FakeDb;
let s: QueueState;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("JWT_SECRET", "unit-test-jwt-secret");
  s = state();
  db = new FakeDb(s);
  vi.mocked(getDb).mockResolvedValue(db as any);
  vi.mocked(assertDeliveryAvailable).mockImplementation(() => undefined);
  vi.mocked(sendEmailCode).mockResolvedValue("email-provider-id");
  vi.mocked(startSmsVerification).mockResolvedValue(SMS_SID);
  vi.mocked(checkSmsVerification).mockResolvedValue(true);
  vi.mocked(hashCustomerPassword).mockResolvedValue("scrypt$new-hash");
  vi.mocked(revokeAllCustomerSessions).mockResolvedValue(undefined);
  authMocks.assertCsrf.mockImplementation((req: any) => {
    const origin = req.headers?.origin;
    const host = req.headers?.host;
    if (origin && origin !== `https://${host}` && origin !== `http://${host}`)
      throw new TRPCError({ code: "FORBIDDEN", message: "طلب غير مسموح" });
  });
});

describe("customerVerificationRouter — authenticated contact verification", () => {
  it("rechecks the active credential under credentialId+userId scope and uses DB contacts, not actor/input destinations", async () => {
    queue(s, "customer_credentials", [credential], [credential]);
    queue(s, "customer_verification_challenges", [[]]);
    const result = await customerVerificationRouter.createCaller(callerContext().ctx).send({ channel: "email" });
    expect(result.challengeId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(sendEmailCode).toHaveBeenCalledWith(credential.email, expect.stringMatching(/^\d{6}$/), result.challengeId, "verify_contact");
    expect(insertOf(s, "customer_verification_challenges")).toMatchObject({ destination: credential.email, purpose: "verify_contact", channel: "email", status: "sending" });
    const credentialPredicates = s.where.filter(w => w.table === "customer_credentials").map(w => w.query.params);
    expect(credentialPredicates.some(params => params.includes(credential.id) && params.includes(credential.userId))).toBe(true);
  });

  it("fails before challenge work when the credential is absent or the customer actor is missing", async () => {
    queue(s, "customer_credentials", []);
    try {
      await customerVerificationRouter.createCaller(callerContext().ctx).send({ channel: "email" });
      throw new Error("expected rejection");
    } catch (error) {
      expect(error).toMatchObject({ code: "UNAUTHORIZED" });
    }
    expect(sendEmailCode).not.toHaveBeenCalled();
    expect(s.writes).toEqual([]);
    const unauthenticated = callerContext(null);
    await expect(customerVerificationRouter.createCaller(unauthenticated.ctx).send({ channel: "email" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(vi.mocked(getDb)).toHaveBeenCalledTimes(1);
  });

  it("rejects a cross-origin request before reading the database or actor", async () => {
    const { ctx } = callerContext(null, { req: { headers: { host: "portal.example.test", origin: "https://evil.example" } } });
    await expect(customerVerificationRouter.createCaller(ctx).send({ channel: "email" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked(getDb)).not.toHaveBeenCalled();
    expect(s.writes).toEqual([]);
  });

  it("creates a ten-minute UUID challenge with an HMAC hash, never plaintext code, and provider status", async () => {
    queue(s, "customer_credentials", [credential], [credential]);
    queue(s, "customer_verification_challenges", [[]]);
    const result = await customerVerificationRouter.createCaller(callerContext().ctx).send({ channel: "email" });
    const sentCode = vi.mocked(sendEmailCode).mock.calls[0]![1];
    const inserted = insertOf(s, "customer_verification_challenges")!;
    expect(result.challengeId).toBe(inserted.id);
    expect(inserted.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(inserted.expiresAt - inserted.createdAt).toBe(600_000);
    expect(inserted.codeHash).toBe(verificationDigest(inserted.id, "verify_contact", credential.email, sentCode));
    expect(inserted.codeHash).not.toContain(sentCode);
    expect(inserted.codeHash).not.toBe(sentCode);
    expect(updatesOf(s, "customer_verification_challenges")).toContainEqual(expect.objectContaining({ values: { status: "active", providerSid: "email-provider-id" } }));
    expect(result.expiresAt).toBe(inserted.expiresAt);
    expect(result.resendAt).toBe(inserted.createdAt + 60_000);
  });

  it("marks a challenge failed and does not emit a success audit when the provider fails", async () => {
    vi.mocked(sendEmailCode).mockRejectedValueOnce(new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "provider unavailable" }));
    queue(s, "customer_credentials", [credential], [credential]);
    queue(s, "customer_verification_challenges", [[]]);
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).send({ channel: "email" })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(updatesOf(s, "customer_verification_challenges")).toContainEqual(expect.objectContaining({ values: { status: "failed" } }));
    expect(authMocks.auditValues).not.toHaveBeenCalledWith(expect.objectContaining({ outcome: "success" }));
  });

  it("enforces the one-minute cooldown inside the transaction", async () => {
    queue(s, "customer_credentials", [credential], [credential]);
    queue(s, "customer_verification_challenges", [{ createdAt: Date.now() - 5_000 }]);
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).send({ channel: "email" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(sendEmailCode).not.toHaveBeenCalled();
    expect(insertOf(s, "customer_verification_challenges")).toBeUndefined();
    expect(s.transactions).toBe(1);
  });
});

describe("customerVerificationRouter — confirmations and reset security", () => {
  it("persists a wrong code attempt and denied audit, and locks the fifth attempt", async () => {
    const challenge = validChallenge({ codeHash: verificationDigest(UUID, "verify_contact", credential.email, "654321") });
    queueUseChallenge(s, challenge);
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updatesOf(s, "customer_verification_challenges")[0]?.values).toMatchObject({ attempts: 1, status: "active", consumedAt: null });
    expect(insertOf(s, "portal_audit")).toMatchObject({ action: "customer.verify_contact.denied", outcome: "denied" });

    s = state(); db = new FakeDb(s); vi.mocked(getDb).mockResolvedValue(db as any);
    const fifth = validChallenge({ attempts: 4, codeHash: verificationDigest(UUID, "verify_contact", credential.email, "654321") });
    queueUseChallenge(s, fifth);
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updatesOf(s, "customer_verification_challenges")[0]?.values).toMatchObject({ attempts: 5, status: "locked" });
  });

  it.each([
    ["expired", validChallenge({ expiresAt: Date.now() - 1 })],
    ["used", validChallenge({ status: "used" })],
    ["wrong purpose", validChallenge({ purpose: "password_reset", codeHash: verificationDigest(UUID, "password_reset", credential.email, "123456") })],
  ])("denies %s challenges without updating them", async (_label, challenge) => {
    queueUseChallenge(s, challenge);
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updatesOf(s, "customer_verification_challenges")).toEqual([]);
    expect(updatesOf(s, "customer_credentials")).toEqual([]);
  });

  it("denies a challenge belonging to another credential before opening a transaction", async () => {
    queueUseChallenge(s, validChallenge(), 999);
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.transactions).toBe(0);
    expect(s.writes).toEqual([]);
  });

  it("updates only emailVerifiedAt after a correct email code and rejects replay", async () => {
    queueUseChallenge(s, validChallenge());
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).resolves.toEqual({ verified: true, channel: "email" });
    const credentialUpdate = updatesOf(s, "customer_credentials").find(w => w.values?.emailVerifiedAt);
    expect(credentialUpdate?.values).toEqual({ emailVerifiedAt: expect.any(Date) });
    expect(credentialUpdate?.values).not.toHaveProperty("phoneVerifiedAt");
    expect(updatesOf(s, "customer_verification_challenges")[0]?.values).toMatchObject({ attempts: 1, status: "used" });

    s = state(); db = new FakeDb(s); vi.mocked(getDb).mockResolvedValue(db as any);
    queueUseChallenge(s, validChallenge({ status: "used" }));
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.writes).toEqual([]);
  });

  it("rejects a code when the password fingerprint changed", async () => {
    queueUseChallenge(s, validChallenge({ passwordFingerprint: fingerprint("a-different-password") }));
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.writes).toEqual([]);
  });

  it("confirms an SMS code only through the mocked provider and checks the actor scope", async () => {
    const sms = validChallenge({ channel: "sms", destination: credential.phone, codeHash: null });
    queueUseChallenge(s, sms);
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).confirm({ challengeId: UUID, code: "123456" })).resolves.toEqual({ verified: true, channel: "sms" });
    expect(checkSmsVerification).toHaveBeenCalledWith(credential.phone, SMS_SID, "123456");
    expect(updatesOf(s, "customer_credentials")[0]?.values).toEqual({ phoneVerifiedAt: expect.any(Date) });
  });

  it("stores the reset password, revokes all sessions and challenge rows, then clears only the customer cookie", async () => {
    const reset = validChallenge({ purpose: "password_reset" });
    queueUseChallenge(s, reset);
    const { ctx, cleared } = callerContext();
    await expect(customerVerificationRouter.createCaller(ctx).completeReset({ challengeId: UUID, code: "123456", newPassword: "NewCorrectHorse1", confirmPassword: "NewCorrectHorse1" })).resolves.toMatchObject({ reset: true });
    expect(hashCustomerPassword).toHaveBeenCalledWith("NewCorrectHorse1");
    expect(updatesOf(s, "customer_credentials")).toContainEqual(expect.objectContaining({ values: { passwordHash: "scrypt$new-hash", updatedAt: expect.any(Date) } }));
    expect(revokeAllCustomerSessions).toHaveBeenCalledWith(db, credential.id);
    expect(updatesOf(s, "customer_verification_challenges")).toContainEqual(expect.objectContaining({ values: { status: "revoked" } }));
    expect(cleared).toHaveLength(1);
  });

  it("rejects a mismatched reset password before opening the database", async () => {
    await expect(customerVerificationRouter.createCaller(callerContext().ctx).completeReset({ challengeId: UUID, code: "123456", newPassword: "NewCorrectHorse1", confirmPassword: "OtherCorrectHorse1" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(vi.mocked(getDb)).not.toHaveBeenCalled();
    expect(s.writes).toEqual([]);
  });
});

describe("customerVerificationRouter — generic password reset disclosure", () => {
  it("returns a fake UUID for an unknown account without creating or sending a challenge", async () => {
    queue(s, "customer_credentials", []);
    const result = await customerVerificationRouter.createCaller(callerContext(null).ctx).requestReset({ channel: "email", identifier: "missing@example.invalid" });
    expect(result.challengeId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.message).toContain("لا نكشف وجود الحساب");
    expect(insertOf(s, "customer_verification_challenges")).toBeUndefined();
    expect(sendEmailCode).not.toHaveBeenCalled();
  });

  it("returns the same generic response for an unverified reset account without sending", async () => {
    queue(s, "customer_credentials", [{ ...credential, emailVerifiedAt: null }]);
    const result = await customerVerificationRouter.createCaller(callerContext(null).ctx).requestReset({ channel: "email", identifier: credential.email });
    expect(result.challengeId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(insertOf(s, "customer_verification_challenges")).toBeUndefined();
    expect(sendEmailCode).not.toHaveBeenCalled();
  });

  it("stores a password fingerprint for a known verified reset challenge and returns its UUID", async () => {
    queue(s, "customer_credentials", [credential], [credential]);
    queue(s, "customer_verification_challenges", [[]]);
    const result = await customerVerificationRouter.createCaller(callerContext(null).ctx).requestReset({ channel: "email", identifier: credential.email });
    const inserted = insertOf(s, "customer_verification_challenges")!;
    expect(result.challengeId).toBe(inserted.id);
    expect(inserted).toMatchObject({ purpose: "password_reset", passwordFingerprint: fingerprint(credential.passwordHash), destination: credential.email });
    expect(sendEmailCode).toHaveBeenCalledWith(credential.email, expect.any(String), inserted.id, "password_reset");
  });
});
