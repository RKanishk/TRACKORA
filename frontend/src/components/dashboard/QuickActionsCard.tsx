import { Link } from "react-router-dom";
import {
  BarChart3,
  PackagePlus,
  Settings as SettingsIcon,
  Truck,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Card, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/context/auth-context";
import type { Permission } from "@/lib/permissions";

interface QuickAction {
  label: string;
  to: string;
  icon: LucideIcon;
  permission: Permission;
}

/**
 * Actions link to the relevant section (create flows land in later phases).
 * Each is shown only when the user's role holds the matching permission —
 * so a viewer or driver, who can manage nothing, sees no quick actions and
 * the card hides itself entirely.
 */
const ACTIONS: QuickAction[] = [
  { label: "New shipment", to: "/orders", icon: PackagePlus, permission: "shipments:manage" },
  { label: "Add driver", to: "/drivers", icon: Truck, permission: "drivers:manage" },
  { label: "Invite teammate", to: "/team", icon: UserPlus, permission: "users:manage" },
  { label: "View analytics", to: "/analytics", icon: BarChart3, permission: "analytics:read" },
  { label: "Workspace settings", to: "/settings", icon: SettingsIcon, permission: "tenant:manage" },
];

export function QuickActionsCard() {
  const { hasPermission } = useAuth();
  const actions = ACTIONS.filter((a) => hasPermission(a.permission));

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Quick actions" icon={<Zap size={16} />} />
      <div className="grid grid-cols-2 gap-2 px-5 pb-5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to + action.label}
              to={action.to}
              className="group flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-canvas text-ink-muted ring-1 ring-inset ring-line transition-colors group-hover:bg-white group-hover:text-brand-600 group-hover:ring-brand-200">
                <Icon size={15} />
              </span>
              <span className="truncate">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
