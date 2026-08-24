import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { verifyAccessToken } from "../lib/jwt";
import { UnauthorizedError } from "../lib/api-error";

/**
 * Verifies the bearer access token and attaches `req.auth`. This is
 * the ONLY place JWT verification happens — every downstream
 * middleware (authorize, tenant-scoped repositories) trusts
 * `req.auth` rather than re-parsing the token, so there's exactly one
 * place to update if the token format ever changes.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new UnauthorizedError("Missing bearer token"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, tenantId: payload.tenantId, role: payload.role };
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError("Access token expired"));
    }
    return next(new UnauthorizedError("Invalid access token"));
  }
}
