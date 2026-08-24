import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PackageOpen } from "lucide-react";
import { SHIPMENT_STATUSES, type AnalyticsOverview } from "@/types/api";
import { SHIPMENT_STATUS_META, type Tone } from "@/lib/status";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/cn";

const BAR_COLOR: Record<Tone, string> = {
  neutral: "bg-slate-300",
  info: "bg-blue-500",
  active: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const DOT_COLOR: Record<Tone, string> = {
  neutral: "bg-slate-400",
  info: "bg-blue-500",
  active: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

/** Shipment status breakdown as a stacked bar + legend, from analytics overview. */
export function StatusDistribution({
  data,
  loading,
  error,
  onRetry,
}: {
  data: AnalyticsOverview | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const counts = data?.shipmentsByStatus;
  const total = counts ? SHIPMENT_STATUSES.reduce((sum, s) => sum + counts[s], 0) : 0;

  return (
    <Card>
      <CardHeader title="Shipment status" description="All shipments by current status" />
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} compact />
        ) : total === 0 ? (
          <EmptyState
            compact
            icon={<PackageOpen size={20} />}
            title="No shipments yet"
            description="Status breakdown will appear once shipments are created."
          />
        ) : (
          <div className="space-y-4">
            {/* Stacked bar */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-canvas">
              {SHIPMENT_STATUSES.map((status) => {
                const value = counts![status];
                if (value === 0) return null;
                const meta = SHIPMENT_STATUS_META[status];
                return (
                  <div
                    key={status}
                    className={cn("h-full", BAR_COLOR[meta.tone])}
                    style={{ width: `${(value / total) * 100}%` }}
                    title={`${meta.label}: ${value}`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {SHIPMENT_STATUSES.map((status) => {
                const meta = SHIPMENT_STATUS_META[status];
                const value = counts![status];
                return (
                  <li key={status} className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT_COLOR[meta.tone])} />
                    <span className="truncate text-xs text-ink-muted">{meta.label}</span>
                    <span className="tabular ml-auto text-xs font-semibold text-ink">
                      {formatCount(value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
