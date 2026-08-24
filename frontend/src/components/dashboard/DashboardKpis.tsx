import { AlertTriangle, Boxes, Target, Timer } from "lucide-react";

import { KpiCard } from "./KpiCard";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatCount, formatDurationSeconds, formatPercent } from "@/lib/format";
import type { AnalyticsOverview } from "@/types/api";

/**
 * The four hero operations metrics, driven entirely by GET /analytics/overview.
 * `onTimeRate` and `averageDeliverySeconds` render an honest "—" when the
 * backend returns null (no delivered history) — never a fabricated figure.
 */
export function DashboardKpis({
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
  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={onRetry} compact />
      </Card>
    );
  }

  const delayed = data?.shipmentsByStatus.delayed ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Active shipments"
        icon={Boxes}
        tone="active"
        loading={loading}
        value={formatCount(data?.activeShipments)}
        sublabel="Queued, in transit & delayed"
      />
      <KpiCard
        label="On-time rate"
        icon={Target}
        tone="success"
        loading={loading}
        value={formatPercent(data?.onTimeRate)}
        sublabel="Last 30 days"
      />
      <KpiCard
        label="Avg. delivery time"
        icon={Timer}
        tone="info"
        loading={loading}
        value={formatDurationSeconds(data?.averageDeliverySeconds)}
        sublabel="Last 30 days"
      />
      <KpiCard
        label="Delayed"
        icon={AlertTriangle}
        tone={delayed > 0 ? "warning" : "neutral"}
        loading={loading}
        value={formatCount(delayed)}
        sublabel="Needs attention"
      />
    </div>
  );
}
