import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
const state = vi.hoisted(() => ({
  rows: [] as any[],
  reads: 0,
  condition: null as any,
  stored: null as any,
}));
vi.mock("./db", () => ({ getDb: async () => db }));
const dialect = new MySqlDialect();
const db: any = {
  select: () => {
    state.reads++;
    const q: any = {
      from: () => q,
      innerJoin: () => q,
      where: (s: any) => {
        state.condition = dialect.sqlToQuery(s);
        return q;
      },
      limit: async () => state.rows,
    };
    return q;
  },
  insert: () => ({
    values: async (value: any) => {
      state.stored = value;
      return [{ insertId: 12 }];
    },
  }),
};
import {
  CUSTOMER_SESSION_COOKIE,
  customerCookieOptions,
  hashCustomerSessionToken,
  insertCustomerSession,
  newCustomerSessionToken,
  resolveCustomerSession,
} from "./customerSessions";
const token = "A".repeat(43);
const req = (cookie: string) =>
  ({ headers: { cookie }, protocol: "https" }) as any;
const actorRow = () => ({
  sessionId: 12,
  credentialId: 9,
  userId: 7,
  name: "عميل تجريبي",
  email: "qa@example.invalid",
  phone: "+96891234567",
  credentialStatus: "active",
  expiresAt: Date.now() + 60000,
  revokedAt: null,
});
beforeEach(() => {
  state.rows = [];
  state.reads = 0;
  state.condition = null;
  state.stored = null;
});
describe("Opaque customer sessions", () => {
  it("uses random independent tokens and stores only a SHA-256 fingerprint", async () => {
    const one = newCustomerSessionToken();
    const two = newCustomerSessionToken();
    expect(one).toHaveLength(43);
    expect(two).not.toBe(one);
    const issued = await insertCustomerSession(db, 9, 1000);
    expect(state.stored.tokenHash).toHaveLength(64);
    expect(state.stored.tokenHash).toBe(hashCustomerSessionToken(issued.token));
    expect(state.stored.tokenHash).not.toBe(issued.token);
    expect(state.stored.credentialId).toBe(9);
    expect(issued.expiresAt).toBe(1000 + 7 * 24 * 60 * 60 * 1000);
  });
  it("resolves only a customer token and includes revocation, expiry and active-credential constraints", async () => {
    state.rows = [actorRow()];
    const result = await resolveCustomerSession(
      req(`${CUSTOMER_SESSION_COOKIE}=${token}`)
    );
    expect(result).toMatchObject({ userId: 7, credentialId: 9, sessionId: 12 });
    expect(state.condition.sql).toContain("revokedAt");
    expect(state.condition.sql).toContain("expiresAt");
    expect(state.condition.sql).toContain("status");
    expect(state.condition.params[0]).toBe(hashCustomerSessionToken(token));
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("role");
  });
  it.each([
    "",
    "app_session_id=employee-session",
    "rasd_customer_session=%E0%A4%A",
    "rasd_customer_session=short",
    `rasd_customer_session=${"x".repeat(200)}`,
  ])(
    "does not query storage for absent, employee-only or malformed cookies: %s",
    async cookie => {
      expect(await resolveCustomerSession(req(cookie))).toBeNull();
      expect(state.reads).toBe(0);
    }
  );
  it.each(["expired", "revoked", "suspended"])(
    "rejects %s sessions even if a storage adapter returns them",
    async kind => {
      state.rows = [
        {
          ...actorRow(),
          ...(kind === "expired"
            ? { expiresAt: Date.now() - 1 }
            : kind === "revoked"
              ? { revokedAt: Date.now() }
              : { credentialStatus: "suspended" }),
        },
      ];
      expect(
        await resolveCustomerSession(req(`${CUSTOMER_SESSION_COOKIE}=${token}`))
      ).toBeNull();
    }
  );
  it("uses HttpOnly cookies with Secure in HTTPS and localhost-compatible development settings", () => {
    expect(
      customerCookieOptions({ protocol: "https", headers: {} } as any)
    ).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "none",
      path: "/",
    });
    expect(
      customerCookieOptions({
        protocol: "http",
        headers: { "x-forwarded-proto": "https" },
      } as any).secure
    ).toBe(true);
    expect(
      customerCookieOptions({ protocol: "http", headers: {} } as any)
    ).toMatchObject({ secure: false, httpOnly: true, sameSite: "lax" });
  });
});
