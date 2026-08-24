import bcrypt from "bcryptjs";
import { randomBytes, randomInt, createHash } from "node:crypto";

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** A 6-digit numeric OTP for email verification. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** A high-entropy opaque token for password-reset links. */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * OTPs, reset tokens, and refresh tokens are all stored hashed
 * (SHA-256 is fine here — these are high-entropy random values, not
 * user-chosen passwords, so a fast hash is intentional, not a
 * shortcut).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Raw key shown once at creation; only the hash + prefix are persisted. */
export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const secret = randomBytes(24).toString("hex");
  const raw = `trk_live_${secret}`;
  const prefix = raw.slice(0, 14);
  return { raw, prefix, hash: hashToken(raw) };
}
