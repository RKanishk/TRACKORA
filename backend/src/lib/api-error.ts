/**
 * Base class for every error thrown deliberately by the service layer.
 * `errorHandler` middleware knows how to translate this into a
 * consistent JSON error response; anything that isn't an `ApiError`
 * is treated as an unexpected 500 and logged with full detail.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(details: unknown, message = "Validation failed") {
    super(422, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "You don't have permission to perform this action") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict", details?: unknown) {
    super(409, "CONFLICT", message, details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too many requests") {
    super(429, "TOO_MANY_REQUESTS", message);
  }
}
