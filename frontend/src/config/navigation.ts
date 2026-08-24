/**
 * Sidebar navigation model.
 *
 * The exact item set the Phase 6 brief calls for. Each item declares the
 * any-of permissions required to *see* it (mirroring the backend RBAC, for
 * UX only). Items whose destination isn't backed by the current API are
 * flagged `planned: true` — their pages are honest "coming in a later phase"
 * placeholders rather than fabricated data.
 *
 * Reconciliation with the real backend domain:
 *   - "Orders" and "Deliveries" both map to the Shipments domain.
 *   - "Customers" and "Live Tracking" have no backend entity/endpoint yet.
 *   - "Analytics" summary powers the dashboard; the full page is Phase 10.
 *   - "Settings" and "Dashboard" are the two fully-live destinations now.
 */

import {
  BarChart3,
  Contact,
  LayoutDashboard,
  MapPinned,
  Package,
  PackageCheck,
  Settings,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/permissions";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Any-of permissions needed to see the item. Empty/undefined = all authenticated users. */
  permissions?: Permission[];
  /** Exact-match routing (used for the index/dashboard route). */
  end?: boolean;
  /** Feature not yet backed by the API — page is an honest placeholder. */
  planned?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { label: "Orders", to: "/orders", icon: Package, permissions: ["shipments:read"], planned: true },
  { label: "Drivers", to: "/drivers", icon: Truck, permissions: ["drivers:read"], planned: true },
  { label: "Customers", to: "/customers", icon: Contact, permissions: ["shipments:manage"], planned: true },
  { label: "Deliveries", to: "/deliveries", icon: PackageCheck, permissions: ["shipments:read"], planned: true },
  { label: "Live Tracking", to: "/tracking", icon: MapPinned, permissions: ["shipments:read"], planned: true },
  { label: "Analytics", to: "/analytics", icon: BarChart3, permissions: ["analytics:read"], planned: true },
  { label: "Team", to: "/team", icon: Users, permissions: ["users:read"], planned: true },
  { label: "Settings", to: "/settings", icon: Settings },
];
