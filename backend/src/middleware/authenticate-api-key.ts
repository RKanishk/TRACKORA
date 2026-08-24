import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { apiKeys } from "../db/schema";
import { hashToken } from "../lib/crypto";
import { UnauthorizedError } from "../lib/api-error";

/**
 * Alternate to `authenticate` for server-to-server integrations (the
 * docs page's `curl` example uses this). API keys don't carry a role
 * in the token itself — they're looked up per-request and treated as
 * "dispatcher"-equivalent (full operational access, no user/billing
 * management). Adjust `API_KEY_ROLE` if that default is ever wrong
 * for your use case.
 */
const API_KEY_ROLE = "dispatcher" as const;

export async function authenticateApiKey(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const rawKey = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!rawKey || !rawKey.startsWith("trk_live_")) {
    return next(new UnauthorizedError("Missing or malformed API key"));
  }

  try {
    const keyHash = hashToken(rawKey);
    const [record] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!record || record.revokedAt) {
      return next(new UnauthorizedError("Invalid or revoked API key"));
    }

    req.auth = { userId: record.id, tenantId: record.tenantId, role: API_KEY_ROLE };

    // Best-effort last-used tracking; never blocks the request on failure.
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, record.id))
      .catch(() => undefined);

    return next();
  } catch (error) {
    return next(error);
  }
}
