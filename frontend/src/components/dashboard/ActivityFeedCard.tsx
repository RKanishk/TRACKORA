import {
  Activity,
  Building2,
  KeyRound,
  Package,
  Route as RouteIcon,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiResource } from "@/hooks/useApiResource";
import { listAuditLogs } from "@/services/audit-logs.service";
import { formatRelativeTime, humanizeAction } from "@/lib/format";

/** Pick an icon from the audit entry's entityType (best-effort, with fallback). */
function iconForEntity(entityType: string): LucideIcon {
  const key = entityType.toLowerCase();
  if (key.includes("shipment")) return Package;
  if (key.includes("driver")) return Truck;
  if (key.includes("vehicle")) return Truck;
  if (key.includes("route")) return RouteIcon;
  if (key.includes("user")) return Users;
  if (key.includes("tenant")) return Building2;
  if (key.includes("auth") || key.includes("session") || key.includes("token")) return KeyRound;
  return Activity;
}

/**
 * Recent workspace activity from GET /audit-logs (owner/admin only — the
 * caller gates this card on `audit_logs:read`). Entries are newest-first.
 */
export function ActivityFeedCard() {
  const { data, loading, error, reload } = useApiResource(
    (signal) => listAuditLogs({ pageSize: 8 }, signal),
    [],
  );

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader title="Activity" description="Recent workspace events" icon={<Activity size={16} />} />
      <div className="px-5 pb-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} compact />
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon={<Activity size={20} />}
            title="No activity yet"
            description="Workspace events will appear here as your team works."
          />
        ) : (
          <ul className="-my-1">
            {items.map((entry) => {
              const Icon = iconForEntity(entry.entityType);
              return (
                <li key={entry.id} className="flex items-start gap-3 py-2">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-muted ring-1 ring-inset ring-line">
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink" title={entry.action}>
                      {humanizeAction(entry.action)}
                    </p>
                    <p className="text-2xs text-ink-faint">
                      {entry.entityType}
                      {entry.userId ? "" : " · system"} · {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
