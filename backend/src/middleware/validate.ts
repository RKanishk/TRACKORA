import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { ValidationError } from "../lib/api-error";

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates and REPLACES `req.body` / `req.query` / `req.params` with
 * the parsed (and coerced/defaulted) result, so controllers always
 * work with trusted, typed data — never the raw request.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        return next(new ValidationError(result.error.flatten(), "Invalid request body"));
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        return next(new ValidationError(result.error.flatten(), "Invalid query parameters"));
      }
      // Express 5 defines `req.query` as a getter-only accessor (it's
      // lazily parsed from the URL), so a plain `req.query = ...`
      // assignment throws "Cannot set property query of
      // #<IncomingMessage> which has only a getter". Redefining the
      // property is the supported way to replace it post-validation.
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        return next(new ValidationError(result.error.flatten(), "Invalid route parameters"));
      }
      req.params = result.data as typeof req.params;
    }

    return next();
  };
}
