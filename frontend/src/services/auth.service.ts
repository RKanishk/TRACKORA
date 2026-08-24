/**
 * Auth service — workspace-scoped login, session bootstrap, logout.
 *
 * Maps to the backend auth module (see backend `auth.routes.ts` /
 * `auth.controller.ts`):
 *
 *   POST /auth/login    → { user, accessToken }  (+ Set-Cookie refresh)
 *   POST /auth/refresh  → { user, accessToken }  (+ rotates refresh cookie)
 *   POST /auth/logout   → 204                      (clears refresh cookie)
 *   GET  /auth/me       → { auth }                 (JWT context only)
 *
 * The refresh endpoint returns the full user, so a page reload can recover
 * the complete session (name/email/role) with a single call — `/auth/me`
 * alone only yields the { userId, tenantId, role } JWT context.
 */

import { ApiError, apiRequest, setAccessToken } from "@/services/api-client";
import type { AuthContext, LoginInput, SessionPayload } from "@/types/api";

export async function login(input: LoginInput): Promise<SessionPayload> {
  const payload = await apiRequest<SessionPayload>("/auth/login", {
    method: "POST",
    body: input,
    skipAuth: true,
    skipAuthRefresh: true,
  });
  setAccessToken(payload.accessToken);
  return payload;
}

/**
 * Attempt to restore a session from the httpOnly refresh cookie on app load.
 * Returns the session on success, or null when there is simply no valid
 * session (a 401/403 — the normal "logged out" case). Network/unexpected
 * errors propagate so the caller can distinguish "offline" from "logged out".
 */
export async function bootstrapSession(): Promise<SessionPayload | null> {
  try {
    const payload = await apiRequest<SessionPayload>("/auth/refresh", {
      method: "POST",
      body: {},
      skipAuth: true,
      skipAuthRefresh: true,
    });
    setAccessToken(payload.accessToken);
    return payload;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>("/auth/logout", {
      method: "POST",
      body: {},
      skipAuthRefresh: true,
    });
  } finally {
    // Drop the in-memory token locally regardless of the server outcome.
    setAccessToken(null);
  }
}

/** Returns the JWT authorization context ({ userId, tenantId, role }). */
export async function fetchAuthContext(): Promise<AuthContext> {
  const result = await apiRequest<{ auth: AuthContext }>("/auth/me");
  return result.auth;
}
