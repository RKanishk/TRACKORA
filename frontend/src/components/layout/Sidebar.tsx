import { NavLink } from "react-router-dom";
import { MapPin, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { useAuth } from "@/context/auth-context";
import { NAV_ITEMS } from "@/config/navigation";

/**
 * The dark navigation rail. On desktop it's a static column; on mobile it
 * renders as an overlay drawer controlled by `open`/`onClose`.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasAnyPermission } = useAuth();
  const items = NAV_ITEMS.filter((item) =>
    !item.permissions || item.permissions.length === 0
      ? true
      : hasAnyPermission(item.permissions),
  );

  return (
    <>
      {/* Mobile scrim */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden
        onClick={onClose}
      />

      <aside
        className={cn(
          "rail-scroll fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-rail-bg text-rail-text shadow-rail",
          "transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Primary navigation"
      >
        {/* Brand + mobile close */}
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <MapPin size={16} className="text-white" />
            </span>
            <span className="text-base font-semibold tracking-tight">Trackora</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-rail-muted hover:bg-rail-hover hover:text-rail-text lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-rail-panel text-white"
                      : "text-rail-muted hover:bg-rail-hover hover:text-rail-text",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "text-brand-300" : "text-rail-muted group-hover:text-rail-text",
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.planned && (
                      <span className="rounded-full bg-rail-hover px-1.5 py-0.5 text-2xs font-medium text-rail-muted">
                        Soon
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-rail-border px-4 py-3">
          <p className="text-2xs text-rail-muted">Operations Console</p>
        </div>
      </aside>
    </>
  );
}
