import { Link } from "react-router-dom";
import { ArrowRight, Truck } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { DRIVER_STATUSES, type Driver } from "@/types/api";
import { DRIVER_STATUS_META, type Tone } from "@/lib/status";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/cn";

const CHIP_DOT: Record<Tone, string> = {
  neutral: "bg-slate-400",
  info: "bg-blue-500",
  active: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

/**
 * Driver roster health. Counts are computed from the loaded page (up to 100
 * drivers); `total` is the true count from the API. When they differ we say
 * so rather than implying the counts cover every driver.
 */
export function DriverStatusCard({
  drivers,
  total,
  loading,
  error,
  onRetry,
}: {
  drivers: Driver[] | null;
  total: number;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const list = drivers ?? [];
  const counts: Record<string, number> = {};
  for (const status of DRIVER_STATUSES) counts[status] = 0;
  for (const d of list) counts[d.status] = (counts[d.status] ?? 0) + 1;

  const partial = total > list.length;
  const preview = list.slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Driver status"
        icon={<Truck size={16} />}
        description={
          loading
            ? undefined
            : `${formatCount(total)} total${partial ? ` · showing ${list.length}` : ""}`
        }
        action={
          <Link to="/drivers" className={buttonClasses("ghost", "sm")}>
            View all
            <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="px-5 pb-5">
        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} compact />
        ) : list.length === 0 ? (
          <EmptyState
            compact
            icon={<Truck size={20} />}
            title="No drivers yet"
            description="Add drivers to start assigning deliveries."
          />
        ) : (
          <div className="space-y-4">
            {/* Status breakdown */}
            <div className="grid grid-cols-3 gap-2">
              {DRIVER_STATUSES.map((status) => {
                const meta = DRIVER_STATUS_META[status];
                return (
                  <div key={status} className="rounded-lg border border-line bg-canvas/50 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", CHIP_DOT[meta.tone])} />
                      <span className="truncate text-2xs text-ink-muted">{meta.label}</span>
                    </div>
                    <p className="tabular mt-0.5 text-lg font-semibold text-ink">
                      {formatCount(counts[status])}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* A few drivers */}
            <ul className="space-y-1">
              {preview.map((d) => (
                <li key={d.id} className="flex items-center gap-2.5 py-1">
                  <Avatar name={d.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                    <p className="tabular truncate text-2xs text-ink-faint">{d.phone}</p>
                  </div>
                  <StatusBadge meta={DRIVER_STATUS_META[d.status]} dot={false} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
