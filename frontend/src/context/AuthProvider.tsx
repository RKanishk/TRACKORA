/**
 * AuthProvider — owns session state for the whole app.
 *
 * On mount it attempts a single silent session restore via POST /auth/refresh
 * (the httpOnly cookie survives reloads; the access token never touches
 * storage). It also registers session handlers with the api-client so that a
 * failed *silent* refresh mid-session cleanly logs the user out.
 *
 * A ref guard prevents the initial refresh from firing twice under React
 * StrictMode's intentional double-invoke — important because the backend
 * rotates refresh tokens and a duplicate use would trip reuse-detection.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth-context";
import { roleHasAnyPermission, roleHasPermission, type Permission } from "@/lib/permissions";
import { registerSessionHandlers } from "@/services/api-client";
import {
  bootstrapSession,
  login as loginRequest,
  logout as logoutRequest,
} from "@/services/auth.service";
import type { LoginInput, PublicUser } from "@/types/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [bootstrapError, setBootstrapError] = useState(false);
  const didBootstrap = useRef(false);

  const runBootstrap = useCallback(async () => {
    setStatus("loading");
    setBootstrapError(false);
    try {
      const session = await bootstrapSession();
      if (session) {
        setUser(session.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      // A non-auth failure (offline, server down): surface a retry screen
      // rather than pretending the user is simply logged out.
      setUser(null);
      setStatus("unauthenticated");
      setBootstrapError(true);
    }
  }, []);

  // Register api-client session handlers once. A failed silent refresh during
  // normal use fires onCleared → we drop the session.
  useEffect(() => {
    registerSessionHandlers({
      onRefreshed: () => {
        // The new token is already stored inside the api-client. No-op.
      },
      onCleared: () => {
        setUser(null);
        setStatus("unauthenticated");
      },
    });
    return () => registerSessionHandlers({});
  }, []);

  // Restore the session exactly once, even under StrictMode double-invoke.
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    void runBootstrap();
  }, [runBootstrap]);

  const login = useCallback(async (input: LoginInput) => {
    const session = await loginRequest(input);
    setUser(session.user);
    setStatus("authenticated");
    setBootstrapError(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      bootstrapError,
      retryBootstrap: () => {
        void runBootstrap();
      },
      login,
      logout,
      hasPermission: (permission: Permission) =>
        user ? roleHasPermission(user.role, permission) : false,
      hasAnyPermission: (permissions: Permission[]) =>
        user ? roleHasAnyPermission(user.role, permissions) : false,
    }),
    [status, user, bootstrapError, runBootstrap, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
