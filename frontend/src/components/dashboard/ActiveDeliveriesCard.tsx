import { Link } from "react-router-dom";
import { ArrowRight, Clock, Route as RouteIcon, Truck } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonClasses } from "@/components/ui/Button";
import { useApiResource } from "@/hooks/useApiResource";
import { listShipments } from "@/services/shipments.service";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { formatWindow } from "@/lib/format";
import type { Shipment } from "@/types/api";

interface ActiveData {
  items: Shipment[];
  inTransitTotal: number;
  delayedTotal: number;
}

function driverLabel(shipment: Shipment, driverNames: Map<string, string> | null): string {
  if (!shipment.driverId) return "Unassigned";
  return driverNames?.get(shipment.driverId) ?? "Assigned";
}

/**
 * Deliveries currently on the road. There's no GPS/live-location data in the
 * backend, so "active" is defined honestly as in-transit + delayed shipments
 * (two status-filtered queries merged, delayed first as the more urgent).
 */
export function ActiveDeliveriesCard({ driverNames }: { driverNames: Map<string, string> | null }) {
  const { data, loading, error, reload } = useApiResource<ActiveData>(async (signal) => {
    const [inTransit, delayed] = await Promise.all([
      listShipments({ status: "in_transit", pageSize: 8 }, signal),
      listShipments({ status: "delayed", pageSize: 8 }, signal),
    ]);
    return {
      items: [...delayed.items, ...inTransit.items].slice(0, 6),
      inTransitTotal: inTransit.total,
      delayedTotal: delayed.total,
    };
  }, []);

  const description = data
    ? `${data.inTransitTotal} in transit · ${data.delayedTotal} delayed`
    : undefined;

  return (
    <Card>
      <CardHeader
        title="Active deliveries"
        description={description}
        icon={<Truck size={16} />}
        action={
          <Link to="/deliveries" className={buttonClasses("ghost", "sm")}>
            View all
            <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="px-5 pb-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} compact />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            compact
            icon={<Truck size={20} />}
            title="Nothing on the road"
            description="Shipments that are in transit or delayed will appear here."
          />
        ) : (
          <ul className="space-y-2">
            {data.items.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="tabular font-mono text-xs font-medium text-ink">
                      {s.trackingCode}
                    </span>
                    <StatusBadge
                      meta={SHIPMENT_STATUS_META[s.status]}
                      pulse={s.status === "in_transit"}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                    <RouteIcon size={12} className="shrink-0 text-ink-faint" />
                    <span className="truncate">{s.originAddress}</span>
                    <ArrowRight size={11} className="shrink-0 text-ink-faint" />
                    <span className="truncate">{s.destinationAddress}</span>
                  </div>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <div className="flex items-center justify-end gap-1 text-xs text-ink-soft">
                    <Clock size={12} className="text-ink-faint" />
                    {formatWindow(s.windowStart, s.windowEnd)}
                  </div>
                  <p className="mt-0.5 text-2xs text-ink-faint">{driverLabel(s, driverNames)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
