import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Express 5 forwards rejected promises from async handlers
 * automatically, but wrapping explicitly keeps this codebase correct
 * even if it's ever downgraded, and makes the intent obvious at every
 * call site.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
