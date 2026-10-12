import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { passwordIssue } from "../shared/customerAuth";

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}
export const CUSTOMER_PASSWORD_VERSION = "v1";
export const CUSTOMER_PASSWORD_N = 16_384;
export const CUSTOMER_PASSWORD_R = 8;
export const CUSTOMER_PASSWORD_P = 1;
export const CUSTOMER_PASSWORD_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

// A valid, fixed-cost hash used to keep account-absent login timing comparable.
const DUMMY_HASH = `scrypt$${CUSTOMER_PASSWORD_VERSION}$N=${CUSTOMER_PASSWORD_N},r=${CUSTOMER_PASSWORD_R},p=${CUSTOMER_PASSWORD_P}$${Buffer.alloc(SALT_LENGTH).toString("base64url")}$${Buffer.alloc(CUSTOMER_PASSWORD_KEY_LENGTH).toString("base64url")}`;

type ParsedHash = {
  salt: Buffer;
  digest: Buffer;
  N: number;
  r: number;
  p: number;
};

function parseHash(encoded: string): ParsedHash | null {
  const parts = encoded.split("$");
  if (
    parts.length !== 5 ||
    parts[0] !== "scrypt" ||
    parts[1] !== CUSTOMER_PASSWORD_VERSION
  )
    return null;
  const params = /^N=(\d+),r=(\d+),p=(\d+)$/.exec(parts[2] ?? "");
  if (!params) return null;
  const N = Number(params[1]);
  const r = Number(params[2]);
  const p = Number(params[3]);
  if (
    N !== CUSTOMER_PASSWORD_N ||
    r !== CUSTOMER_PASSWORD_R ||
    p !== CUSTOMER_PASSWORD_P
  )
    return null;
  try {
    const salt = Buffer.from(parts[3]!, "base64url");
    const digest = Buffer.from(parts[4]!, "base64url");
    if (
      salt.length !== SALT_LENGTH ||
      digest.length !== CUSTOMER_PASSWORD_KEY_LENGTH
    )
      return null;
    return { salt, digest, N, r, p };
  } catch {
    return null;
  }
}

async function derive(
  password: string,
  salt: Buffer,
  N = CUSTOMER_PASSWORD_N,
  r = CUSTOMER_PASSWORD_R,
  p = CUSTOMER_PASSWORD_P
) {
  return scryptAsync(password, salt, CUSTOMER_PASSWORD_KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: 32 * 1024 * 1024,
  });
}

export async function hashCustomerPassword(password: string): Promise<string> {
  const issue = passwordIssue(password);
  if (issue) throw new Error(issue);
  const salt = randomBytes(SALT_LENGTH);
  const digest = await derive(password, salt);
  return `scrypt$${CUSTOMER_PASSWORD_VERSION}$N=${CUSTOMER_PASSWORD_N},r=${CUSTOMER_PASSWORD_R},p=${CUSTOMER_PASSWORD_P}$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

export async function verifyCustomerPassword(
  password: string,
  encodedHash: string | null | undefined
): Promise<boolean> {
  const parsed = parseHash(encodedHash ?? "");
  if (!parsed) {
    // Still spend the same scrypt work when a row has a malformed/legacy hash.
    await verifyAgainstParsed(password, parseHash(DUMMY_HASH)!);
    return false;
  }
  return verifyAgainstParsed(password, parsed);
}

async function verifyAgainstParsed(password: string, parsed: ParsedHash) {
  const digest = await derive(
    password,
    parsed.salt,
    parsed.N,
    parsed.r,
    parsed.p
  );
  return (
    digest.length === parsed.digest.length &&
    timingSafeEqual(digest, parsed.digest)
  );
}

export function dummyCustomerPasswordHash() {
  return DUMMY_HASH;
}
