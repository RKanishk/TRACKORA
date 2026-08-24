import type { NextFunction, Request, Response } from "express";

import { roleHasPermission, type Permission } from "../lib/permissions";
import { ForbiddenError, UnauthorizedError } from "../lib/api-error";

/**
 * Must run after `authenticate` (or `authenticateApiKey`). Requiring
 * ALL listed permissions (not any) keeps call sites unambiguous —
 * routes needing an "or" relationship compose two separate checks in
 * the handler instead.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError());
    }

    const missing = permissions.filter((p) => !roleHasPermission(req.auth!.role, p));
    if (missing.length > 0) {
      return next(
        new ForbiddenError(
          `Your role (${req.auth.role}) doesn't have permission: ${missing.join(", ")}`,
        ),
      );
    }

    return next();
  };
}

/** For routes only the tenant owner may perform (e.g. deleting the workspace). */
export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(new UnauthorizedError());
  if (req.auth.role !== "owner") {
    return next(new ForbiddenError("Only the workspace owner can perform this action"));
  }
  return next();
}
