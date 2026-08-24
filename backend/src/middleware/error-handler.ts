import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../lib/api-error";
import { logger } from "../lib/logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, err.message);
    } else {
      logger.warn({ code: err.code, requestId: req.requestId }, err.message);
    }

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      requestId: req.requestId,
    });
  }

  // Anything not deliberately thrown as an ApiError is a bug — log
  // full detail server-side, but never leak internals to the client.
  logger.error({ err, requestId: req.requestId }, "Unhandled error");

  return res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" },
    requestId: req.requestId,
  });
}
