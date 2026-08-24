import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { StatusDistribution } from "@/components/dashboard/StatusDistribution";
import { RecentShipmentsCard } from "@/components/dashboard/RecentShipmentsCard";
import { ActiveDeliveriesCard } from "@/components/dashboard/ActiveDeliveriesCard";
import { DriverStatusCard } from "@/components/dashboard/DriverStatusCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { LiveOpsPreviewCard } from "@/components/dashboard/LiveOpsPreviewCard";
import { ActivityFeedCard } from "@/components/dashboard/ActivityFeedCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { useApiResource } from "@/hooks/useApiResource";
import { getAnalyticsOverview } from "@/services/analytics.service";
import { listDrivers } from "@/services/drivers.service";
import type { AnalyticsOverview, Driver, PaginatedResult } from "@/types/api";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const canAnalytics = hasPermission("analytics:read");
  const canDrivers = hasPermission("drivers:read");
  const canShipments = hasPermission("shipments:read");
  const canAudit = hasPermission("audit_logs:read");

  // A manual refresh reloads the page-owned resources (analytics, drivers)
  // and bumps `refreshKey`, which remounts the self-fetching cards below.
  const [refreshKey, setRefreshKey] = useState(0);

  // Shared, permission-gated resources. When not permitted the fetcher
  // resolves null instead of hitting the API (avoiding an expected 403).
  const analytics = useApiResource<AnalyticsOverview | null>(
    (signal) => (canAnalytics ? getAnalyticsOverview(signal) : Promise.resolve(null)),
    [canAnalytics],
  );

  const driversRes = useApiResource<PaginatedResult<Driver> | null>(
    (signal) => (canDrivers ? listDrivers({ pageSize: 100 }, signal) : Promise.resolve(null)),
    [canDrivers],
  );

  const driverNames = useMemo(() => {
    if (!driversRes.data) return null;
    const map = new Map<string, string>();
    for (const d of driversRes.data.items) map.set(d.id, d.name);
    return map;
  }, [driversRes.data]);

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "there";
  const inTransitCount = analytics.data?.shipmentsByStatus.in_transit ?? null;

  function handleRefresh() {
    analytics.reload();
    driversRes.reload();
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Here's what's happening across your operations today.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* KPI row (analytics) */}
      {canAnalytics && (
        <DashboardKpis
          data={analytics.data}
          loading={analytics.loading}
          error={analytics.error}
          onRetry={analytics.reload}
        />
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Primary column */}
        <div className="space-y-6 lg:col-span-2">
          {canAnalytics && (
            <StatusDistribution
              data={analytics.data}
              loading={analytics.loading}
              error={analytics.error}
              onRetry={analytics.reload}
            />
          )}
          {canShipments && <RecentShipmentsCard key={`recent-${refreshKey}`} driverNames={driverNames} />}
          {canShipments && (
            <ActiveDeliveriesCard key={`active-${refreshKey}`} driverNames={driverNames} />
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <QuickActionsCard />
          {canDrivers && (
            <DriverStatusCard
              drivers={driversRes.data?.items ?? null}
              total={driversRes.data?.total ?? 0}
              loading={driversRes.loading}
              error={driversRes.error}
              onRetry={driversRes.reload}
            />
          )}
          <LiveOpsPreviewCard inTransitCount={inTransitCount} />
          {canAudit && <ActivityFeedCard key={`activity-${refreshKey}`} />}
        </div>
      </div>
    </div>
  );
}
