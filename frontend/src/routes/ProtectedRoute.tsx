import { Navigate, Outlet, useLocation } from "react-router-dom";

import { FullScreenError, FullScreenLoader } from "@/components/FullScreen";
import { useAuth } from "@/context/auth-context";

/**
 * Gate for all authenticated routes.
 *   - "loading": show the branded loader while the initial refresh settles.
 *   - bootstrap failed for a non-auth reason: offer a retry (don't dump the
 *     user at the login form when the real problem is connectivity).
 *   - "unauthenticated": redirect to /login, remembering where they were headed.
 *   - "authenticated": render the nested routes.
 */
export function ProtectedRoute() {
  const { status, bootstrapError, retryBootstrap } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullScreenLoader />;
  }

  if (bootstrapError) {
    return <FullScreenError onRetry={retryBootstrap} />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
