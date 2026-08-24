import { ApiError } from "@/services/api-client";

export interface FriendlyError {
  title: string;
  message: string;
  /** 403 — the user's role lacks the permission. Callers may hide the panel entirely instead. */
  isPermission: boolean;
  /** Connectivity failure rather than an HTTP status. */
  isNetwork: boolean;
  /** The originating request id, when the backend supplied one. */
  requestId?: string;
}

/** Normalize any thrown value into a user-facing error description. */
export function toFriendlyError(error: unknown): FriendlyError {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return {
        title: "Can't reach the server",
        message: "Check your connection and try again.",
        isPermission: false,
        isNetwork: true,
      };
    }
    if (error.status === 403) {
      return {
        title: "Not available for your role",
        message: "You don't have permission to view this.",
        isPermission: true,
        isNetwork: false,
        requestId: error.requestId,
      };
    }
    if (error.status === 401) {
      return {
        title: "Session expired",
        message: "Please sign in again.",
        isPermission: false,
        isNetwork: false,
        requestId: error.requestId,
      };
    }
    return {
      title: "Something went wrong",
      message: error.message || "The request could not be completed.",
      isPermission: false,
      isNetwork: false,
      requestId: error.requestId,
    };
  }

  return {
    title: "Something went wrong",
    message: error instanceof Error && error.message ? error.message : "An unexpected error occurred.",
    isPermission: false,
    isNetwork: false,
  };
}

/** True when the value is (or wraps) a 403 Forbidden from the API. */
export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
