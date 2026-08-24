import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Contact,
  MapPinned,
  Package,
  PackageCheck,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

interface PlaceholderContent {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Honest note about what this section will do and any current backend gap. */
  note: string;
}

/**
 * Honest placeholders for nav destinations that aren't backed by the current
 * API. They never render fabricated data — they explain what will live here
 * and, where relevant, that the backend doesn't expose the data yet. These
 * routes still respect RBAC (gated by <RequirePermission> in the router).
 */
export const PLACEHOLDER_CONTENT = {
  orders: {
    title: "Orders",
    description: "Create, assign, and track delivery orders.",
    icon: Package,
    note: "Order management builds on the existing Shipments API. The full create-and-manage workspace lands in an upcoming phase — today's dashboard already surfaces recent and active shipments.",
  },
  drivers: {
    title: "Drivers",
    description: "Manage your driver roster, availability, and assignments.",
    icon: Truck,
    note: "The Drivers API is live and already powers the dashboard's driver-status panel. The dedicated roster and assignment views arrive in an upcoming phase.",
  },
  customers: {
    title: "Customers",
    description: "A directory of customers and their delivery history.",
    icon: Contact,
    note: "There is no customer entity in the backend yet, so nothing here is fabricated. This section is reserved for when a customers API becomes available.",
  },
  deliveries: {
    title: "Deliveries",
    description: "Monitor in-progress and completed deliveries.",
    icon: PackageCheck,
    note: "Deliveries map to the Shipments domain. The dashboard's active-deliveries panel is live now; the full deliveries board follows in an upcoming phase.",
  },
  tracking: {
    title: "Live Tracking",
    description: "Real-time vehicle positions on a live map.",
    icon: MapPinned,
    note: "Live tracking needs GPS / location data that the backend does not emit yet. Rather than show fake pins, this section stays a placeholder until location data is available.",
  },
  analytics: {
    title: "Analytics",
    description: "Trends, performance, and operational insights.",
    icon: BarChart3,
    note: "The analytics summary endpoint already powers your dashboard KPIs. The expanded analytics workspace — historical trends and breakdowns — arrives in an upcoming phase.",
  },
  team: {
    title: "Team",
    description: "Invite teammates and manage roles and permissions.",
    icon: Users,
    note: "The Users API is live and read access is respected here. Inviting and managing teammates is coming in an upcoming phase.",
  },
} satisfies Record<string, PlaceholderContent>;

export type PlaceholderId = keyof typeof PLACEHOLDER_CONTENT;

export function PlaceholderPage({ id }: { id: PlaceholderId }) {
  const { title, description, icon: Icon, note } = PLACEHOLDER_CONTENT[id];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </div>

      <Card>
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-ink-muted ring-1 ring-inset ring-line">
            <Icon size={26} />
          </div>
          <div className="mb-3">
            <Badge tone="info" dot={false}>
              Planned
            </Badge>
          </div>
          <h2 className="text-base font-semibold text-ink">{title} is on the way</h2>
          <p className="mt-2 max-w-md text-sm text-ink-muted">{note}</p>
          <Link to="/" className={buttonClasses("secondary", "md", "mt-6")}>
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
