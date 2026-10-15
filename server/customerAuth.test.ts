import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableName } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import {
  hashCustomerPassword,
  verifyCustomerPassword,
} from "./customerPasswords";
import {
  registerSchema,
  loginSchema,
  normalizeCustomerEmail,
  normalizeCustomerPhone,
  passwordIssue,
} from "../shared/customerAuth";
const state = vi.hoisted(() => ({
  rows: [] as any[][],
  writes: [] as any[],
  where: [] as any[],
  locks: [] as string[],
  counters: new Map<string, { attempts: number; expiresAt: number }>(),
  nextId: 100,
  transactions: 0,
  duplicateCredentials: false,
}));
const dialect = new MySqlDialect();
const db: any = {
  select: () => {
    let table = "";
    let params: any[] = [];
    const chain: any = {
      from: (value: any) => {
        table = getTableName(value);
        return chain;
      },
      innerJoin: () => chain,
      where: (condition: any) => {
        const query = dialect.sqlToQuery(condition);
        params = query.params;
        state.where.push({ table, ...query });
        return chain;
      },
      orderBy: () => chain,
      limit: () => chain,
      for: () => {
        state.locks.push(table);
        return chain;
      },
      then: (resolve: any) =>
        resolve(
          table === "customer_auth_limits"
            ? state.counters.has(String(params[0]))
              ? [state.counters.get(String(params[0]))]
              : []
            : (state.rows.shift() ?? [])
        ),
    };
    return chain;
  },
  insert: (value: any) => {
    const table = getTableName(value);
    let inserted: any;
    const operation: any = {
      values: (values: any) => {
        inserted = values;
        state.writes.push({ table, values });
        return operation;
      },
      onDuplicateKeyUpdate: () => {
        if (table === "customer_auth_limits") {
          const old = state.counters.get(inserted.keyHash);
          state.counters.set(inserted.keyHash, {
            attempts: old && old.expiresAt > Date.now() ? old.attempts + 1 : 1,
            expiresAt:
              old && old.expiresAt > Date.now()
                ? old.expiresAt
                : inserted.expiresAt,
          });
        }
        return Promise.resolve([{ insertId: 0 }]);
      },
      then: (resolve: any, reject: any) =>
        table === "customer_credentials" && state.duplicateCredentials
          ? Promise.reject(
              Object.assign(new Error("duplicate"), {
                code: "ER_DUP_ENTRY",
                errno: 1062,
              })
            ).then(resolve, reject)
          : Promise.resolve([{ insertId: state.nextId++ }]).then(
              resolve,
              reject
            ),
    };
    return operation;
  },
  update: (value: any) => ({
    set: (set: any) => {
      const table = getTableName(value);
      state.writes.push({ table, set });
      return {
        where: async (s: any) => {
          state.where.push({ table, ...dialect.sqlToQuery(s) });
          return [{ affectedRows: 1 }];
        },
      };
    },
  }),
  transaction: async (fn: any) => {
    state.transactions++;
    return fn(db);
  },
};
vi.mock("./db", () => ({ getDb: async () => db }));
const { customerAuthRouter } = await import("./customerAuth");
function context(extra: any = {}) {
  const cookies: any[] = [];
  return {
    ctx: {
      req: {
        protocol: "https",
        host: "portal.example.test",
        headers: { host: "portal.example.test" },
        socket: { remoteAddress: "198.51.100.10" },
      },
      res: {
        cookie: (...args: any[]) => cookies.push(args),
        clearCookie: (...args: any[]) => cookies.push(args),
      },
      user: null,
      customer: null,
      ...extra,
    } as any,
    cookies,
  };
}
const configured = { entityId: 7, organizationId: 3, settingEnabled: true };
const signup = {
  name: "عميل اختبار",
  email: "CUSTOMER@EXAMPLE.INVALID",
  phone: "٩١٢٣٤٥٦٧",
  password: "CorrectHorse1",
  confirmPassword: "CorrectHorse1",
  businessEntityId: 7,
  acceptTerms: true as const,
};
const actor = {
  userId: 12,
  credentialId: 9,
  sessionId: 20,
  name: "عميل",
  email: "customer@example.invalid",
  phone: "+96891234567",
};
beforeEach(() => {
  state.rows = [];
  state.writes = [];
  state.where = [];
  state.locks = [];
  state.counters.clear();
  state.nextId = 100;
  state.transactions = 0;
  state.duplicateCredentials = false;
});
describe("Customer identifiers and password storage", () => {
  it("normalizes case, whitespace, Oman phones and international Arabic/Persian digits", () => {
    expect(normalizeCustomerEmail("  USER@Example.COM ")).toBe(
      "user@example.com"
    );
    expect(normalizeCustomerPhone("912٣٤٥٦٧")).toBe("+96891234567");
    expect(normalizeCustomerPhone("۰۰۹۶۸۹۱۲۳۴۵۶۷")).toBe("+96891234567");
    expect(normalizeCustomerPhone("+971 (50) 123-4567")).toBe("+971501234567");
  });
  it("does not silently strip letters, double pluses, or ambiguous country codes", () => {
    for (const value of [
      "abcd91234567",
      "++96891234567",
      "123",
      "+000000000",
      "971501234567",
    ])
      expect(normalizeCustomerPhone(value)).toBe("");
  });
  it("rejects digit-only passwords including Arabic digits while preserving spaces and Unicode letters", () => {
    expect(passwordIssue("٩١٢٣٤٥٦٧٨٩١٢٣٤")).not.toBeNull();
    expect(passwordIssue("  Aa1234567890  ")).toBeNull();
    expect(passwordIssue("كلمةمرورقوية123")).toBeNull();
    const result = registerSchema.parse({
      ...signup,
      password: "  Aa1234567890  ",
      confirmPassword: "  Aa1234567890  ",
    });
    expect(result.password).toBe("  Aa1234567890  ");
    expect(result.phone).toBe("+96891234567");
    expect(result.email).toBe("customer@example.invalid");
  });
  it("bounds password and identifier input and refuses mismatched confirmations", () => {
    expect(
      loginSchema.safeParse({
        identifier: actor.email,
        password: "x".repeat(129),
      }).success
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...signup, confirmPassword: "different" })
        .success
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...signup, acceptTerms: false }).success
    ).toBe(false);
  });
  it("uses independent salts, constant-length hashes, correct verification and dummy work for absent/malformed rows", async () => {
    const first = await hashCustomerPassword(signup.password);
    const second = await hashCustomerPassword(signup.password);
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt\$v1\$/);
    expect(await verifyCustomerPassword(signup.password, first)).toBe(true);
    expect(await verifyCustomerPassword("IncorrectHorse1", first)).toBe(false);
    expect(
      await verifyCustomerPassword(
        signup.password,
        first.replace("N=16384", "N=999999999")
      )
    ).toBe(false);
    expect(await verifyCustomerPassword(signup.password, undefined)).toBe(
      false
    );
  });
});
describe("Isolated registration and login", () => {
  it("registers a fresh profile under the explicitly configured organization without emitting an employee cookie", async () => {
    state.rows = [[configured], [configured]];
    const { ctx, cookies } = context();
    const result = await customerAuthRouter
      .createCaller(ctx)
      .register({
        ...signup,
        role: "admin",
        customerId: 999,
        organizationId: 999,
      } as any);
    expect(result.user).toMatchObject({
      email: actor.email,
      phone: actor.phone,
      emailVerified: false,
      phoneVerified: false,
    });
    expect(cookies).toHaveLength(1);
    expect(cookies[0][0]).toBe("rasd_customer_session");
    expect(cookies[0][2]).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    expect(state.transactions).toBe(1);
    expect(state.locks).toContain("customer_registration_settings");
    const user = state.writes.find(r => r.table === "users").values;
    expect(user.role).toBe("user");
    expect(user.loginMethod).toBe("customer_password");
    expect(user.openId).toMatch(/^customer:/);
    const master = state.writes.find(r => r.table === "customers").values;
    expect(master.organizationId).toBe(3);
    expect(master.businessEntityId).toBe(7);
    expect(
      state.writes.find(r => r.table === "portal_entity_relationships").values
        .sourceProfileId
    ).toBe(102);
    expect(
      state.writes.find(r => r.table === "portal_users").values.verifiedAt
    ).toBeNull();
    expect(
      state.writes.some(r => /iam_membership|iam_role/.test(r.table))
    ).toBe(false);
    expect(state.where.some(r => r.table === "customers")).toBe(false);
    expect(
      state.writes.find(r => r.table === "customer_sessions").values.tokenHash
    ).not.toBe(cookies[0][1]);
  });
  it("rejects missing configuration before writing a user", async () => {
    state.rows = [[]];
    const { ctx, cookies } = context();
    await expect(
      customerAuthRouter.createCaller(ctx).register(signup)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.writes.some(r => r.table === "users")).toBe(false);
    expect(cookies).toEqual([]);
  });
  it("rechecks disabled registration under lock without creating an identity", async () => {
    state.rows = [[configured], []];
    const { ctx, cookies } = context();
    await expect(
      customerAuthRouter.createCaller(ctx).register(signup)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.writes.some(r => r.table === "users")).toBe(false);
    expect(cookies).toEqual([]);
  });
  it("returns a generic duplicate-contact error and never starts a session", async () => {
    state.rows = [[configured], [configured]];
    state.duplicateCredentials = true;
    const { ctx, cookies } = context();
    await expect(
      customerAuthRouter.createCaller(ctx).register(signup)
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "تعذر إنشاء الحساب. راجع البيانات وحاول مرة أخرى.",
    });
    expect(cookies).toEqual([]);
    expect(state.writes.some(r => r.table === "customer_sessions")).toBe(false);
  });
  it("returns the same generic error for absent and suspended accounts", async () => {
    const absent = context();
    state.rows = [[]];
    await expect(
      customerAuthRouter
        .createCaller(absent.ctx)
        .login({ identifier: "missing@example.invalid", password: "wrong" })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "بيانات الدخول غير صحيحة",
    });
    const hash = await hashCustomerPassword(signup.password);
    state.rows = [
      [
        {
          credential: {
            ...actor,
            id: 9,
            status: "suspended",
            passwordHash: hash,
          },
          user: { id: 12, name: actor.name },
        },
      ],
    ];
    await expect(
      customerAuthRouter
        .createCaller(context().ctx)
        .login({
          identifier: "suspended@example.invalid",
          password: signup.password,
        })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "بيانات الدخول غير صحيحة",
    });
    expect(state.writes.some(r => r.table === "customer_sessions")).toBe(false);
  });
  it("creates a customer-only session after a locked credential recheck", async () => {
    const hash = await hashCustomerPassword(signup.password);
    const credential = {
      id: 9,
      userId: 12,
      email: actor.email,
      phone: actor.phone,
      status: "active",
      passwordHash: hash,
    };
    state.rows = [
      [{ credential, user: { id: 12, name: actor.name } }],
      [credential],
    ];
    const { ctx, cookies } = context();
    await expect(
      customerAuthRouter
        .createCaller(ctx)
        .login({ identifier: actor.phone, password: signup.password })
    ).resolves.toMatchObject({ user: { id: 12 } });
    expect(state.locks).toContain("customer_credentials");
    expect(cookies[0][0]).toBe("rasd_customer_session");
  });
  it("does not create a session for an old password when the credential changed during login", async () => {
    const hash = await hashCustomerPassword(signup.password);
    const credential = {
      id: 9,
      userId: 12,
      email: actor.email,
      phone: actor.phone,
      status: "active",
      passwordHash: hash,
    };
    state.rows = [
      [{ credential, user: { id: 12 } }],
      [{ ...credential, passwordHash: "changed-concurrently" }],
    ];
    const { ctx, cookies } = context();
    await expect(
      customerAuthRouter
        .createCaller(ctx)
        .login({ identifier: actor.email, password: signup.password })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toEqual([]);
    expect(state.writes.some(r => r.table === "customer_sessions")).toBe(false);
  });
  it("consumes attempts before password work and blocks the ninth login without reading credentials", async () => {
    const { ctx } = context();
    for (let i = 0; i < 8; i++)
      await expect(
        customerAuthRouter
          .createCaller(ctx)
          .login({ identifier: actor.email, password: "wrong" })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    state.where = [];
    await expect(
      customerAuthRouter
        .createCaller(ctx)
        .login({ identifier: actor.email, password: "wrong" })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(state.where.some(r => r.table === "customer_credentials")).toBe(
      false
    );
  });
  it("blocks cross-origin registration and respects ports for same-origin development requests", async () => {
    const { ctx } = context({
      req: {
        host: "localhost",
        headers: { host: "localhost:3000", origin: "https://evil.example" },
      },
    });
    await expect(
      customerAuthRouter.createCaller(ctx).register(signup)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.writes).toEqual([]);
    state.rows = [[configured], [configured]];
    ctx.req.headers.origin = "http://localhost:3000";
    await expect(
      customerAuthRouter.createCaller(ctx).register(signup)
    ).resolves.toMatchObject({ success: true });
  });
});
describe("Password changes and administrative configuration", () => {
  it("lists planned entities for administrators so setup is not an empty selector", async () => {
    state.rows = [
      [{ id: 7, nameAr: "كيان مخطط", status: "planned" }],
      [{ id: 3, nameAr: "شركة رصد", status: "active" }],
      [],
    ];
    const result = await customerAuthRouter
      .createCaller(context({ user: { id: 1, role: "admin" } }).ctx)
      .registrationSettings();
    expect(result.entities).toEqual([
      { id: 7, nameAr: "كيان مخطط", status: "planned" },
    ]);
    expect(result.organizations).toEqual([
      { id: 3, nameAr: "شركة رصد", status: "active" },
    ]);
  });

  it("activates a planned entity atomically and records an audit event", async () => {
    state.rows = [[{ id: 7, status: "planned" }]];
    const result = await customerAuthRouter
      .createCaller(context({ user: { id: 1, role: "admin" } }).ctx)
      .activateEntity({ businessEntityId: 7 });
    expect(result).toEqual({ activated: true });
    expect(state.transactions).toBe(1);
    expect(state.writes).toContainEqual(
      expect.objectContaining({
        table: "business_entities",
        set: { status: "active" },
      })
    );
    expect(state.writes.some(write => write.table === "portal_audit")).toBe(
      true
    );
  });

  it("does not allow OAuth-only identities to change customer credentials", async () => {
    const { ctx } = context({ user: { id: 1, role: "admin" } });
    await expect(
      customerAuthRouter
        .createCaller(ctx)
        .changePassword({
          currentPassword: signup.password,
          newPassword: "ChangedPassword2",
          confirmPassword: "ChangedPassword2",
        })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(state.writes).toEqual([]);
  });
  it("changes the secret, revokes all old sessions and issues one replacement in the same transaction", async () => {
    const hash = await hashCustomerPassword(signup.password);
    state.rows = [
      [
        {
          credential: {
            id: 9,
            userId: 12,
            status: "active",
            passwordHash: hash,
          },
          user: { id: 12 },
        },
      ],
    ];
    const { ctx, cookies } = context({ customer: actor });
    await customerAuthRouter
      .createCaller(ctx)
      .changePassword({
        currentPassword: signup.password,
        newPassword: "ChangedPassword2",
        confirmPassword: "ChangedPassword2",
      });
    expect(state.transactions).toBe(1);
    expect(state.locks).toContain("customer_credentials");
    const changed = state.writes.find(
      r => r.table === "customer_credentials" && r.set
    ).set.passwordHash;
    expect(await verifyCustomerPassword("ChangedPassword2", changed)).toBe(
      true
    );
    expect(
      state.writes.some(
        r => r.table === "customer_sessions" && r.set?.revokedAt
      )
    ).toBe(true);
    expect(
      state.writes.filter(r => r.table === "customer_sessions" && r.values)
    ).toHaveLength(1);
    expect(cookies[0][0]).toBe("rasd_customer_session");
  });
  it("rejects wrong current password without updating credentials or issuing a session", async () => {
    state.rows = [
      [
        {
          credential: {
            id: 9,
            userId: 12,
            status: "active",
            passwordHash: await hashCustomerPassword(signup.password),
          },
          user: { id: 12 },
        },
      ],
    ];
    const { ctx, cookies } = context({ customer: actor });
    await expect(
      customerAuthRouter
        .createCaller(ctx)
        .changePassword({
          currentPassword: "IncorrectHorse1",
          newPassword: "ChangedPassword2",
          confirmPassword: "ChangedPassword2",
        })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(
      state.writes.some(r => r.table === "customer_credentials" && r.set)
    ).toBe(false);
    expect(cookies).toEqual([]);
  });
  it("revokes the current session on logout and clears only its customer cookie", async () => {
    const { ctx, cookies } = context({ customer: actor });
    await customerAuthRouter.createCaller(ctx).logout();
    expect(
      state.writes.find(r => r.table === "customer_sessions").set.revokedAt
    ).toBeGreaterThan(0);
    expect(cookies[0][0]).toBe("rasd_customer_session");
    expect(cookies.some(c => c[0] === "app_session_id")).toBe(false);
  });
  it("blocks customers from listing or modifying signup configuration", async () => {
    const caller = customerAuthRouter.createCaller(
      context({ customer: actor }).ctx
    );
    await expect(caller.registrationSettings()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller.configureRegistration({
        businessEntityId: 7,
        organizationId: 3,
        enabled: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.writes).toEqual([]);
  });
});
