import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const normalizeEmployeeUsername = (value: string) => value.trim().toLowerCase();

export function hashEmployeePassword(password: string, salt = randomBytes(16).toString("hex")) {
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyEmployeePassword(password: string, encoded: string) {
  const [, salt, digest] = encoded.split("$");
  if (!salt || !digest) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const MFA_ROLE_PATTERNS = ["finance", "accountant", "treasury", "admin", "security", "hr_manager", "project_manager"];
export const roleRequiresMfa = (roleKey: string) => {
  const normalized = roleKey.trim().toLowerCase();
  return MFA_ROLE_PATTERNS.some(pattern => normalized.includes(pattern));
};
