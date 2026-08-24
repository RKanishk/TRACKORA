import jwt from "jsonwebtoken";

import { env } from "../config/env";
import type { UserRole } from "../db/schema/enums";

/**
 * The access token payload is intentionally the full authorization
 * context (userId, tenantId, role) — every downstream check reads
 * from the verified token, never re-fetches the user just to know
 * their role. This keeps `authenticate` + `tenantContext` +
 * `authorize` cheap and side-effect-free on the hot path.
 */
export interface AccessTokenPayload {
  sub: string; // userId
  tenantId: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  tenantId: string;
  /** Identifies the specific refresh_tokens row, for rotation/revocation. */
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
    issuer: "trackora-api",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "trackora-api",
  }) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d`,
    issuer: "trackora-api",
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "trackora-api",
  }) as RefreshTokenPayload;
}
