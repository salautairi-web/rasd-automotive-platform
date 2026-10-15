import { randomUUID, createHash } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  businessEntities,
  customerAuthLimits,
  customerCredentials,
  customerRegistrationSettings,
  customerSessions,
  customers,
  branches,
  organizations,
  portalAudit,
  portalEntityRelationships,
  portalProfiles,
  portalUsers,
  users,
} from "../drizzle/schema";
import {
  changePasswordSchema,
  canEnableCustomerRegistration,
  loginSchema,
  normalizeCustomerEmail,
  normalizeCustomerPhone,
  registerSchema,
} from "../shared/customerAuth";
import {
  hashCustomerPassword,
  verifyCustomerPassword,
} from "./customerPasswords";
import {
  CUSTOMER_SESSION_COOKIE,
  clearCustomerSessionCookie,
  insertCustomerSession,
  revokeAllCustomerSessions,
  revokeCustomerSession,
  resolveCustomerSession,
  setCustomerSessionCookie,
} from "./customerSessions";

const GENERIC_LOGIN_ERROR = "بيانات الدخول غير صحيحة";
const GENERIC_REGISTER_ERROR =
  "تعذر إنشاء الحساب. راجع البيانات وحاول مرة أخرى.";
const LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IDENTIFIER_LIMIT = 8;
const LOGIN_IP_LIMIT = 200;
const SIGNUP_IP_LIMIT = 20;

function dbRequired() {
  return getDb().then(db => {
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "خدمة الحساب غير متاحة حالياً",
      });
    return db;
  });
}

function requestHost(req: any) {
  const host =
    req.headers?.host || (typeof req.host === "string" ? req.host : null);
  return typeof host === "string"
    ? host.split(",")[0]!.trim().toLowerCase()
    : null;
}

export function assertCsrf(req: any) {
  const origin = req.headers?.origin;
  // Non-browser callers/tests may omit Origin. A supplied browser Origin must match this request host.
  if (!origin) {
    if (req.headers?.["sec-fetch-site"] === "cross-site")
      throw new TRPCError({ code: "FORBIDDEN", message: "طلب غير مسموح" });
    return;
  }
  try {
    const parsed = new URL(String(origin));
    const host = requestHost(req);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      !host ||
      parsed.host.toLowerCase() !== host
    )
      throw new Error("origin mismatch");
  } catch {
    throw new TRPCError({ code: "FORBIDDEN", message: "طلب غير مسموح" });
  }
}

export function clientIp(req: any) {
  // Never trust arbitrary X-Forwarded-For; Express' req.ip is safe only when proxy trust is configured.
  const value = req.ip || req.socket?.remoteAddress || "unknown";
  return typeof value === "string" && value.length <= 180 ? value : "unknown";
}

function keyHash(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function limitState(db: any, key: string, max: number, now = Date.now()) {
  const hashed = keyHash(key);
  const rows = await db
    .select({
      attempts: customerAuthLimits.attempts,
      expiresAt: customerAuthLimits.expiresAt,
    })
    .from(customerAuthLimits)
    .where(eq(customerAuthLimits.keyHash, hashed))
    .limit(1);
  const row = rows[0];
  return {
    allowed: !row || row.expiresAt <= now || row.attempts < max,
    hashed,
    row,
  };
}

async function recordLimitFailure(
  db: any,
  key: string,
  max: number,
  now = Date.now()
) {
  const hashed = keyHash(key);
  const expiresAt = now + LIMIT_WINDOW_MS;
  await db
    .insert(customerAuthLimits)
    .values({ keyHash: hashed, attempts: 1, expiresAt })
    .onDuplicateKeyUpdate({
      set: {
        attempts: sql`CASE WHEN ${customerAuthLimits.expiresAt} <= ${now} THEN 1 ELSE ${customerAuthLimits.attempts} + 1 END`,
        expiresAt: sql`CASE WHEN ${customerAuthLimits.expiresAt} <= ${now} THEN ${expiresAt} ELSE ${customerAuthLimits.expiresAt} END`,
      },
    });
  return (await limitState(db, key, max, now)).allowed;
}

export async function consumeAttempts(db: any, keys: Array<[string, number]>) {
  // Consume atomically BEFORE password work; concurrent requests cannot all pass a stale count.
  await Promise.all(
    keys.map(async ([key, max]) => {
      await recordLimitFailure(db, key, max);
      const state = await limitState(db, key, max);
      if (state.row && Number(state.row.attempts) > max)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "محاولات كثيرة. حاول لاحقاً.",
        });
    })
  );
}

function validPhone(phone: string) {
  return /^\+\d{8,15}$/.test(phone);
}

function publicUser(user: {
  id: number;
  name: string | null;
  email: string;
  phone: string;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
}) {
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    phone: user.phone,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
  };
}

export function auditValues(input: {
  userId?: number;
  businessEntityId?: number;
  action: string;
  outcome: "success" | "failure" | "denied";
}) {
  return {
    portalUserId: undefined,
    businessEntityId: input.businessEntityId,
    action: input.action,
    resourceType: "customer_auth",
    resourceId: input.userId ? String(input.userId) : undefined,
    outcome: input.outcome,
    correlationId: `customer-${randomUUID()}`,
  };
}

async function configuredEntity(
  db: any,
  businessEntityId: number,
  lock = false
) {
  const query = db
    .select({
      entityId: businessEntities.id,
      entityName: businessEntities.nameAr,
      entityStatus: businessEntities.status,
      organizationId: organizations.id,
      organizationStatus: organizations.status,
      settingEnabled: customerRegistrationSettings.enabled,
    })
    .from(customerRegistrationSettings)
    .innerJoin(
      businessEntities,
      eq(businessEntities.id, customerRegistrationSettings.businessEntityId)
    )
    .innerJoin(
      organizations,
      eq(organizations.id, customerRegistrationSettings.organizationId)
    )
    .where(
      and(
        eq(customerRegistrationSettings.businessEntityId, businessEntityId),
        eq(customerRegistrationSettings.enabled, true),
        eq(businessEntities.status, "active"),
        eq(organizations.status, "active")
      )
    )
    .limit(1);
  const rows = await (lock ? query.for("update") : query);
  return rows[0];
}

function duplicateError(error: unknown) {
  const value = error as { code?: string; errno?: number; sqlState?: string };
  return (
    value?.code === "ER_DUP_ENTRY" ||
    value?.errno === 1062 ||
    value?.sqlState === "23000"
  );
}

export const customerAuthRouter = router({
  entities: publicProcedure.query(async () => {
    const db = await dbRequired();
    return db
      .select({ id: businessEntities.id, nameAr: businessEntities.nameAr })
      .from(customerRegistrationSettings)
      .innerJoin(
        businessEntities,
        eq(businessEntities.id, customerRegistrationSettings.businessEntityId)
      )
      .innerJoin(
        organizations,
        eq(organizations.id, customerRegistrationSettings.organizationId)
      )
      .where(
        and(
          eq(customerRegistrationSettings.enabled, true),
          eq(businessEntities.status, "active"),
          eq(organizations.status, "active")
        )
      )
      .orderBy(businessEntities.nameAr);
  }),

  me: publicProcedure.query(({ ctx }) =>
    ctx.customer
      ? {
          id: ctx.customer.userId,
          name: ctx.customer.name,
          email: ctx.customer.email,
          phone: ctx.customer.phone,
          emailVerified: Boolean(ctx.customer.emailVerifiedAt),
          phoneVerified: Boolean(ctx.customer.phoneVerifiedAt),
        }
      : null
  ),

  registrationSettings: adminProcedure.query(async () => {
    const db = await dbRequired();
    const [entities, organizationRows, settings] = await Promise.all([
      db
        .select({
          id: businessEntities.id,
          nameAr: businessEntities.nameAr,
          status: businessEntities.status,
        })
        .from(businessEntities)
        .where(inArray(businessEntities.status, ["active", "planned"]))
        .orderBy(businessEntities.nameAr),
      db
        .select({ id: organizations.id, nameAr: organizations.nameAr })
        .from(organizations)
        .where(eq(organizations.status, "active"))
        .orderBy(organizations.nameAr),
      db
        .select({
          businessEntityId: customerRegistrationSettings.businessEntityId,
          organizationId: customerRegistrationSettings.organizationId,
          enabled: customerRegistrationSettings.enabled,
        })
        .from(customerRegistrationSettings),
    ]);
    return { entities, organizations: organizationRows, settings };
  }),

  configureRegistration: adminProcedure
    .input(
      z.object({
        businessEntityId: z.number().int().positive(),
        organizationId: z.number().int().positive(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertCsrf(ctx.req);
      const db = await dbRequired();
      const [entity] = await db
        .select({ id: businessEntities.id, status: businessEntities.status })
        .from(businessEntities)
        .where(
          and(
            eq(businessEntities.id, input.businessEntityId),
            inArray(businessEntities.status, ["active", "planned"])
          )
        )
        .limit(1);
      const [organization] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          and(
            eq(organizations.id, input.organizationId),
            eq(organizations.status, "active")
          )
        )
        .limit(1);
      if (!entity || !organization)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "الكيان أو المنظمة غير صالح",
        });
      if (input.enabled && !canEnableCustomerRegistration(entity.status))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "فعّل الكيان أولاً قبل إتاحة التسجيل للعملاء",
        });
      const organizationEntitySettings = await db
        .select({ businessEntityId: customerRegistrationSettings.businessEntityId })
        .from(customerRegistrationSettings)
        .where(eq(customerRegistrationSettings.organizationId, input.organizationId));
      const canAutoLinkBranches = organizationEntitySettings.every(
        row => row.businessEntityId === input.businessEntityId
      );
      await db.transaction(async (tx: any) => {
        await tx
          .insert(customerRegistrationSettings)
          .values(input)
          .onDuplicateKeyUpdate({
            set: {
              organizationId: input.organizationId,
              enabled: input.enabled,
            },
          });
        await tx
          .insert(portalAudit)
          .values(
            auditValues({
              userId: ctx.user.id,
              businessEntityId: input.businessEntityId,
              action: "customer.registration.settings",
              outcome: "success",
            })
          );
        if (canAutoLinkBranches)
          await tx
            .update(branches)
            .set({ businessEntityId: input.businessEntityId })
            .where(
              and(
                eq(branches.organizationId, input.organizationId),
                isNull(branches.businessEntityId)
              )
            );
      });
      return { success: true };
    }),

  activateEntity: adminProcedure
    .input(z.object({ businessEntityId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertCsrf(ctx.req);
      const db = await dbRequired();
      const [entity] = await db
        .select({ id: businessEntities.id, status: businessEntities.status })
        .from(businessEntities)
        .where(eq(businessEntities.id, input.businessEntityId))
        .limit(1);
      if (!entity)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الكيان غير موجود",
        });
      if (entity.status === "inactive")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "لا يمكن تفعيل كيان غير نشط؛ راجع دورة حياة الكيان أولاً",
        });
      if (entity.status === "archived")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "الكيان مؤرشف ولا يمكن إعادة تفعيله؛ أنشئ كياناً جديداً أو راجع الإدارة المركزية",
        });
      if (entity.status === "active") return { activated: false as const };
      await db.transaction(async (tx: any) => {
        await tx
          .update(businessEntities)
          .set({ status: "active" })
          .where(eq(businessEntities.id, input.businessEntityId));
        await tx.insert(portalAudit).values(
          auditValues({
            userId: ctx.user.id,
            businessEntityId: input.businessEntityId,
            action: "customer.registration.entity.activate",
            outcome: "success",
          })
        );
      });
      return { activated: true as const };
    }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      assertCsrf(ctx.req);
      const db = await dbRequired();
      const email = normalizeCustomerEmail(input.email);
      const phone = normalizeCustomerPhone(input.phone);
      if (!z.string().email().safeParse(email).success || !validPhone(phone))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "بيانات الاتصال غير صالحة",
        });
      await consumeAttempts(db, [
        [`signup-ip:${clientIp(ctx.req)}`, SIGNUP_IP_LIMIT],
      ]);
      const configured = await configuredEntity(db, input.businessEntityId);
      if (!configured)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "التسجيل غير متاح لهذا الكيان",
        });
      const passwordHash = await hashCustomerPassword(input.password);
      const now = new Date();
      try {
        const result = await db.transaction(async (tx: any) => {
          const lockedSetting = await configuredEntity(
            tx,
            input.businessEntityId,
            true
          );
          if (!lockedSetting)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "التسجيل غير متاح لهذا الكيان",
            });
          const userInsert = await tx
            .insert(users)
            .values({
              openId: `customer:${randomUUID()}`,
              name: input.name.trim(),
              email,
              loginMethod: "customer_password",
              role: "user",
              lastSignedIn: now,
            });
          const userId = Number(userInsert[0].insertId);
          const credentialInsert = await tx
            .insert(customerCredentials)
            .values({ userId, email, phone, passwordHash, status: "active" });
          const credentialId = Number(credentialInsert[0].insertId);
          const customerNo = `CUS-${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`;
          const customerInsert = await tx
            .insert(customers)
            .values({
              customerNo,
              organizationId: lockedSetting.organizationId,
              businessEntityId: input.businessEntityId,
              nameAr: input.name.trim(),
              phone,
              email,
              status: "active",
            });
          const customerId = Number(customerInsert[0].insertId);
          const portalUserInsert = await tx
            .insert(portalUsers)
            .values({
              userId,
              userType: "customer",
              status: "active",
              verifiedAt: null,
            });
          const portalUserId = Number(portalUserInsert[0].insertId);
          const profileInsert = await tx
            .insert(portalProfiles)
            .values({
              userId,
              businessEntityId: input.businessEntityId,
              profileType: "customer",
              localRecordType: "customer",
              localRecordId: customerId,
              displayName: input.name.trim(),
              status: "active",
              linkedAt: now,
            });
          const profileId = Number(profileInsert[0].insertId);
          await tx
            .insert(portalEntityRelationships)
            .values({
              portalUserId,
              businessEntityId: input.businessEntityId,
              relationshipType: "customer",
              sourceProfileId: customerId,
              status: "active",
              permissionsJson: JSON.stringify(["own.portal"]),
            });
          const session = await insertCustomerSession(tx, credentialId);
          await tx
            .insert(portalAudit)
            .values(
              auditValues({
                userId,
                businessEntityId: input.businessEntityId,
                action: "customer.register",
                outcome: "success",
              })
            );
          return { userId, credentialId, session, profileId };
        });
        setCustomerSessionCookie(ctx.res, ctx.req, result.session.token);
        return {
          success: true,
          user: {
            id: result.userId,
            name: input.name.trim(),
            email,
            phone,
            emailVerified: false,
            phoneVerified: false,
          },
        };
      } catch (error) {
        if (duplicateError(error))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: GENERIC_REGISTER_ERROR,
          });
        throw error;
      }
    }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    assertCsrf(ctx.req);
    const db = await dbRequired();
    const normalizedIdentifier = input.identifier.includes("@")
      ? normalizeCustomerEmail(input.identifier)
      : normalizeCustomerPhone(input.identifier);
    const ipKey = `login-ip:${clientIp(ctx.req)}`;
    const identifierKey = `login-identifier:${normalizedIdentifier}`;
    await consumeAttempts(db, [
      [ipKey, LOGIN_IP_LIMIT],
      [identifierKey, LOGIN_IDENTIFIER_LIMIT],
    ]);
    const rows = await db
      .select({ credential: customerCredentials, user: users })
      .from(customerCredentials)
      .innerJoin(users, eq(users.id, customerCredentials.userId))
      .where(orIdentifier(normalizedIdentifier))
      .limit(1);
    const row = rows[0];
    const valid = await verifyCustomerPassword(
      input.password,
      row?.credential.passwordHash
    );
    if (!row || row.credential.status !== "active" || !valid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: GENERIC_LOGIN_ERROR,
      });
    }
    const current = await resolveCustomerSession(ctx.req);
    const result = await db.transaction(async (tx: any) => {
      const [lockedCredential] = await tx
        .select()
        .from(customerCredentials)
        .where(eq(customerCredentials.id, row.credential.id))
        .limit(1)
        .for("update");
      if (
        !lockedCredential ||
        lockedCredential.status !== "active" ||
        lockedCredential.passwordHash !== row.credential.passwordHash
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: GENERIC_LOGIN_ERROR,
        });
      if (current) await revokeCustomerSession(tx, current.sessionId);
      const session = await insertCustomerSession(tx, row.credential.id);
      await tx
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, row.user.id));
      await tx
        .insert(portalAudit)
        .values(
          auditValues({
            userId: row.user.id,
            action: "customer.login",
            outcome: "success",
          })
        );
      return session;
    });
    setCustomerSessionCookie(ctx.res, ctx.req, result.token);
    return {
      success: true,
      user: publicUser({
        id: row.user.id,
        name: row.user.name,
        email: row.credential.email,
        phone: row.credential.phone,
        emailVerifiedAt: row.credential.emailVerifiedAt,
        phoneVerifiedAt: row.credential.phoneVerifiedAt,
      }),
    };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    assertCsrf(ctx.req);
    const db = await dbRequired();
    if (ctx.customer) {
      await db.transaction(async (tx: any) => {
        await revokeCustomerSession(tx, ctx.customer!.sessionId);
        await tx
          .insert(portalAudit)
          .values(
            auditValues({
              userId: ctx.customer!.userId,
              action: "customer.logout",
              outcome: "success",
            })
          );
      });
    }
    clearCustomerSessionCookie(ctx.res, ctx.req);
    return { success: true };
  }),

  changePassword: publicProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      assertCsrf(ctx.req);
      if (!ctx.customer) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "يلزم تسجيل دخول العميل",
        });
      }
      const db = await dbRequired();
      await consumeAttempts(db, [
        [
          `password-change:${ctx.customer.credentialId}`,
          LOGIN_IDENTIFIER_LIMIT,
        ],
      ]);
      const result = await db.transaction(async (tx: any) => {
        const rows = await tx
          .select({ credential: customerCredentials, user: users })
          .from(customerCredentials)
          .innerJoin(users, eq(users.id, customerCredentials.userId))
          .where(eq(customerCredentials.id, ctx.customer!.credentialId))
          .limit(1)
          .for("update");
        const row = rows[0];
        if (
          !row ||
          row.credential.userId !== ctx.customer!.userId ||
          row.credential.status !== "active" ||
          !(await verifyCustomerPassword(
            input.currentPassword,
            row.credential.passwordHash
          ))
        )
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "كلمة السر الحالية غير صحيحة",
          });
        const passwordHash = await hashCustomerPassword(input.newPassword);
        await tx
          .update(customerCredentials)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(customerCredentials.id, ctx.customer!.credentialId));
        await revokeAllCustomerSessions(tx, ctx.customer!.credentialId);
        const session = await insertCustomerSession(
          tx,
          ctx.customer!.credentialId
        );
        await tx
          .insert(portalAudit)
          .values(
            auditValues({
              userId: ctx.customer!.userId,
              action: "customer.password.changed",
              outcome: "success",
            })
          );
        return session;
      });
      setCustomerSessionCookie(ctx.res, ctx.req, result.token);
      return { success: true };
    }),
});

function orIdentifier(identifier: string) {
  return identifier.includes("@")
    ? eq(customerCredentials.email, identifier)
    : eq(customerCredentials.phone, identifier);
}

export { CUSTOMER_SESSION_COOKIE };
