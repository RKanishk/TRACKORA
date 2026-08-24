import rateLimit from "express-rate-limit";

import { env } from "../config/env";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many requests" } },
});

/**
 * Auth endpoints (login, register, OTP, password reset) get a much
 * tighter limit, keyed by IP — this is the primary defense against
 * credential-stuffing and OTP brute-forcing at the edge, on top of the
 * OTP attempt counter enforced in the service layer.
 */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts, please slow down" } },
});
