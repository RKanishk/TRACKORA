/**
 * Auth context definition and hook.
 *
 * Kept separate from the provider component so this module exports only
 * non-component values (satisfies react-refresh/only-export-components).
 */

import { createContext, useContext } from "react";

import type { Permission } from "@/lib/permissions";
import type { LoginInput, PublicUser } from "@/types/api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  /** Session lifecycle: "loading" until the initial refresh attempt settles. */
  status: AuthStatus;
  /** The signed-in user, or null when unauthenticated. */
  user: PublicUser | null;
  /** True when the initial session restore failed for a non-auth reason (e.g. offline). */
  bootstrapError: boolean;
  /** Retry the initial session restore (used by the connectivity error screen). */
  retryBootstrap: () => void;
  /** Workspace-scoped sign in. Throws ApiError on failure (bad creds, etc.). */
  login: (input: LoginInput) => Promise<void>;
  /** Sign out and clear the refresh cookie. */
  logout: () => Promise<void>;
  /** Does the current user's role hold this permission? False when logged out. */
  hasPermission: (permission: Permission) => boolean;
  /** Does the current user's role hold ANY of these permissions? */
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
