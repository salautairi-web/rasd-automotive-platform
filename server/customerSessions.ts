import type { Request, Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  customerCredentials,
  customerSessions,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

export const CUSTOMER_SESSION_COOKIE = "rasd_customer_session";
export const CUSTOMER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CustomerActor = {
  userId: number;
  credentialId: number;
  sessionId: number;
  name: string;
  email: string;
  phone: string;
};

export function hashCustomerSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function isHttps(req: Request) {
  if (req.protocol === "https") return true;
  const forwarded = req.headers["x-forwarded-proto"];
  return (
    typeof forwarded === "string" &&
    forwarded.split(",")[0]?.trim().toLowerCase() === "https"
  );
}

export function customerCookieOptions(req: Request) {
  const secure = isHttps(req);
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/" as const,
    maxAge: CUSTOMER_SESSION_TTL_MS,
  };
}

export function setCustomerSessionCookie(
  res: Response,
  req: Request,
  token: string
) {
  res.cookie(CUSTOMER_SESSION_COOKIE, token, customerCookieOptions(req));
}

export function clearCustomerSessionCookie(res: Response, req: Request) {
  res.clearCookie(CUSTOMER_SESSION_COOKIE, {
    ...customerCookieOptions(req),
    maxAge: -1,
  });
}

export function newCustomerSessionToken() {
  return randomBytes(32).toString("base64url");
}

/** Inserts a session while keeping the raw opaque token outside the database. */
export async function insertCustomerSession(
  db: any,
  credentialId: number,
  now = Date.now()
) {
  const token = newCustomerSessionToken();
  const expiresAt = now + CUSTOMER_SESSION_TTL_MS;
  const result = await db
    .insert(customerSessions)
    .values({
      credentialId,
      tokenHash: hashCustomerSessionToken(token),
      expiresAt,
    });
  return { token, sessionId: Number(result[0]?.insertId), expiresAt };
}

export async function revokeCustomerSession(
  db: any,
  sessionId: number,
  now = Date.now()
) {
  await db
    .update(customerSessions)
    .set({ revokedAt: now })
    .where(
      and(
        eq(customerSessions.id, sessionId),
        isNull(customerSessions.revokedAt),
        gt(customerSessions.expiresAt, now),
        eq(customerCredentials.status, "active")
      )
    );
}

export async function revokeAllCustomerSessions(
  db: any,
  credentialId: number,
  now = Date.now()
) {
  await db
    .update(customerSessions)
    .set({ revokedAt: now })
    .where(
      and(
        eq(customerSessions.credentialId, credentialId),
        isNull(customerSessions.revokedAt),
        gt(customerSessions.expiresAt, now),
        eq(customerCredentials.status, "active")
      )
    );
}

/** Resolves only a customer cookie; OAuth app_session_id is deliberately never read here. */
export async function resolveCustomerSession(
  req: Request
): Promise<CustomerActor | null> {
  const token = readCookie(req, CUSTOMER_SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  try {
    const db = await getDb();
    if (!db) return null;
    const tokenHash = hashCustomerSessionToken(token);
    const now = Date.now();
    const rows = await db
      .select({
        sessionId: customerSessions.id,
        credentialId: customerCredentials.id,
        userId: users.id,
        name: users.name,
        email: customerCredentials.email,
        phone: customerCredentials.phone,
        credentialStatus: customerCredentials.status,
        expiresAt: customerSessions.expiresAt,
        revokedAt: customerSessions.revokedAt,
      })
      .from(customerSessions)
      .innerJoin(
        customerCredentials,
        eq(customerCredentials.id, customerSessions.credentialId)
      )
      .innerJoin(users, eq(users.id, customerCredentials.userId))
      .where(
        and(
          eq(customerSessions.tokenHash, tokenHash),
          isNull(customerSessions.revokedAt),
          gt(customerSessions.expiresAt, now),
          eq(customerCredentials.status, "active")
        )
      )
      .limit(1);
    const row = rows[0];
    if (
      !row ||
      row.credentialStatus !== "active" ||
      row.expiresAt <= now ||
      row.revokedAt !== null
    )
      return null;
    return {
      userId: row.userId,
      credentialId: row.credentialId,
      sessionId: row.sessionId,
      name: row.name ?? "",
      email: row.email,
      phone: row.phone,
    };
  } catch {
    // Customer authentication is optional in context; a malformed/expired cookie is a normal null.
    return null;
  }
}
