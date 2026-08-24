import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/auth-context";
import type { Permission } from "@/lib/permissions";

/**
 * Route-level RBAC guard. Renders its children (or nested routes) only when
 * the signed-in user's role holds at least one of the required permissions;
 * otherwise shows an in-shell "not available for your role" panel.
 *
 * This mirrors the backend's own permission checks purely for UX — the API
 * still enforces authorization on every request regardless of what renders.
 */
export function RequirePermission({
  permissions,
  children,
}: {
  permissions: Permission[];
  children?: ReactNode;
}) {
  const { hasAnyPermission } = useAuth();

  if (!hasAnyPermission(permissions)) {
    return (
      <div className="mx-auto max-w-md py-16">
        <EmptyState
          icon={<ShieldAlert size={22} />}
          title="Not available for your role"
          description="You don't have permission to view this section. If you think this is a mistake, contact a workspace owner or admin."
        />
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
