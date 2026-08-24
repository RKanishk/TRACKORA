import { useNavigate } from "react-router-dom";
import { Bell, ChevronsUpDown, LogOut, Menu, Settings as SettingsIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/auth-context";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import type { Tenant } from "@/types/api";

const PLAN_LABELS: Record<Tenant["plan"], string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

export function Header({
  tenant,
  tenantLoading,
  onMenuClick,
}: {
  tenant: Tenant | null;
  tenantLoading: boolean;
  onMenuClick: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:px-6">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-soft hover:bg-canvas lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Company identity */}
      <div className="flex min-w-0 items-center gap-2.5">
        {tenantLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <>
            <span className="truncate text-sm font-semibold text-ink">
              {tenant?.name ?? "Your workspace"}
            </span>
            {tenant && (
              <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200 sm:inline">
                {PLAN_LABELS[tenant.plan]}
              </span>
            )}
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Notifications — no backend notifications source exists yet, so this
            is deliberately an honest empty state (no fabricated unread count). */}
        <DropdownMenu
          trigger={({ toggle, open, id }) => (
            <button
              type="button"
              onClick={toggle}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={id}
              className="relative rounded-lg p-2 text-ink-soft hover:bg-canvas"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
          )}
          menuClassName="w-72"
        >
          {() => (
            <div>
              <DropdownLabel>Notifications</DropdownLabel>
              <EmptyState
                compact
                title="You're all caught up"
                description="Delivery alerts and updates will appear here."
              />
            </div>
          )}
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu
          trigger={({ toggle, open, id }) => (
            <button
              type="button"
              onClick={toggle}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={id}
              className={cn(
                "flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-canvas",
                open && "bg-canvas",
              )}
            >
              <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
              <span className="hidden max-w-[8rem] flex-col items-start leading-tight sm:flex">
                <span className="w-full truncate text-sm font-medium text-ink">{user?.name}</span>
                <span className="text-2xs text-ink-muted">
                  {user ? ROLE_LABELS[user.role] : ""}
                </span>
              </span>
              <ChevronsUpDown size={14} className="hidden text-ink-faint sm:block" />
            </button>
          )}
        >
          {({ close }) => (
            <div>
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                {user && (
                  <span className="mt-1.5 inline-block rounded-full bg-canvas px-2 py-0.5 text-2xs font-medium text-ink-soft ring-1 ring-inset ring-line">
                    {ROLE_LABELS[user.role]}
                  </span>
                )}
              </div>
              <DropdownSeparator />
              <DropdownItem
                icon={<SettingsIcon size={16} />}
                onClick={() => {
                  close();
                  navigate("/settings");
                }}
              >
                Workspace settings
              </DropdownItem>
              <DropdownItem
                icon={<LogOut size={16} />}
                danger
                onClick={() => {
                  close();
                  void handleLogout();
                }}
              >
                Log out
              </DropdownItem>
            </div>
          )}
        </DropdownMenu>
      </div>
    </header>
  );
}
