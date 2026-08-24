/**
 * Low-level HTTP client for the Trackora backend.
 *
 * Responsibilities:
 *   - Attach the in-memory access token as a Bearer header.
 *   - Send the refresh cookie by using `credentials: "include"` (the dev
 *     server proxies /api to the backend so it stays first-party).
 *   - Transparently refresh the access token once on a 401, using a
 *     single-flight promise so concurrent 401s don't stampede /auth/refresh.
 *   - Unwrap the `{ data }` success envelope and throw a typed `ApiError`
 *     for the `{ error }` envelope.
 *
 * The access token lives only in memory (never localStorage), matching the
 * backend's security model: the long-lived refresh token is an httpOnly
 * cookie the JS never touches.
 */

import type { ApiErrorBody } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

/* --------------------------------------------------------- Access token */

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/* ---------------------------------------------- Session event handlers */

/**
 * The AuthProvider registers handlers here so the client can notify it when
 * a refresh succeeds (new token) or the session is irrecoverable (cleared),
 * without the client importing React or creating a circular dependency.
 */
interface SessionHandlers {
  onRefreshed?: (token: string) => void;
  onCleared?: () => void;
}

let sessionHandlers: SessionHandlers = {};

export function registerSessionHandlers(handlers: SessionHandlers): void {
  sessionHandlers = handlers;
}

/* --------------------------------------------------------- Error class */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  /** True when the failure is a network/connectivity problem, not an HTTP status. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/* ------------------------------------------------------- Request types */

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Skip attaching the Bearer token (used by login/refresh). */
  skipAuth?: boolean;
  /** Skip the automatic refresh-on-401 dance (used by the refresh call itself). */
  skipAuthRefresh?: boolean;
}

/* -------------------------------------------------------------- Helpers */

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  let url = `${base}${suffix}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  return url;
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, query, signal, skipAuth } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return fetch(buildUrl(path, query), {
    method,
    headers,
    // Always send/receive cookies so the httpOnly refresh cookie flows.
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
}

async function parseErrorBody(
  response: Response,
): Promise<{ code: string; message: string; details?: unknown; requestId?: string }> {
  try {
    const parsed = (await response.json()) as ApiErrorBody;
    if (parsed && parsed.error) {
      return {
        code: parsed.error.code,
        message: parsed.error.message,
        details: parsed.error.details,
        requestId: parsed.requestId,
      };
    }
  } catch {
    // Body wasn't JSON (e.g. a proxy/gateway error page). Fall through.
  }
  return {
    code: "http_error",
    message: `Request failed with status ${response.status}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  if (response.ok) {
    const json = (await response.json()) as { data: T };
    return json.data;
  }

  const { code, message, details, requestId } = await parseErrorBody(response);
  throw new ApiError(response.status, code, message, details, requestId);
}

/* ----------------------------------------------------- Refresh (single-flight) */

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const response = await rawFetch("/auth/refresh", {
      method: "POST",
      body: {},
      skipAuth: true,
      skipAuthRefresh: true,
    });

    if (!response.ok) {
      setAccessToken(null);
      sessionHandlers.onCleared?.();
      return null;
    }

    const json = (await response.json()) as { data: { accessToken: string } };
    const token = json.data.accessToken;
    setAccessToken(token);
    sessionHandlers.onRefreshed?.(token);
    return token;
  } catch {
    setAccessToken(null);
    sessionHandlers.onCleared?.();
    return null;
  }
}

/** Refresh the access token at most once concurrently. */
function ensureRefreshed(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/* ---------------------------------------------------------- Public API */

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await rawFetch(path, options);
  } catch (error) {
    // fetch only rejects on network failure / abort.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(0, "network_error", "Unable to reach the server. Check your connection.");
  }

  // Transparent refresh on a single 401, unless disabled or unauthenticated by design.
  if (
    response.status === 401 &&
    !options.skipAuth &&
    !options.skipAuthRefresh &&
    accessToken !== null
  ) {
    const newToken = await ensureRefreshed();
    if (newToken) {
      try {
        response = await rawFetch(path, options);
      } catch {
        throw new ApiError(0, "network_error", "Unable to reach the server. Check your connection.");
      }
    }
  }

  return handleResponse<T>(response);
}
