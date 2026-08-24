import { Link } from "react-router-dom";
import { ArrowRight, PackageOpen } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/Table";
import { buttonClasses } from "@/components/ui/Button";
import { useApiResource } from "@/hooks/useApiResource";
import { listShipments } from "@/services/shipments.service";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { formatRelativeTime } from "@/lib/format";
import type { Shipment } from "@/types/api";

const LIMIT = 6;

function driverLabel(shipment: Shipment, driverNames: Map<string, string> | null): string {
  if (!shipment.driverId) return "Unassigned";
  return driverNames?.get(shipment.driverId) ?? "Assigned";
}

/** Newest shipments (the backend already returns them createdAt-desc). */
export function RecentShipmentsCard({ driverNames }: { driverNames: Map<string, string> | null }) {
  const { data, loading, error, reload } = useApiResource(
    (signal) => listShipments({ pageSize: LIMIT }, signal),
    [],
  );

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader
        title="Recent shipments"
        description="Latest orders across the workspace"
        action={
          <Link to="/orders" className={buttonClasses("ghost", "sm")}>
            View all
            <ArrowRight size={14} />
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-2 px-5 pb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} compact />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={<PackageOpen size={20} />}
          title="No shipments yet"
          description="New shipments will show up here as they're created."
        />
      ) : (
        <TableWrap className="px-2 pb-2">
          <Table>
            <THead>
              <TR>
                <TH className="pl-3">Tracking</TH>
                <TH>Route</TH>
                <TH>Status</TH>
                <TH>Driver</TH>
                <TH className="pr-3 text-right">Created</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((s) => (
                <TR key={s.id} className="hover:bg-canvas/60">
                  <TD className="pl-3">
                    <span className="tabular font-mono text-xs font-medium text-ink">
                      {s.trackingCode}
                    </span>
                  </TD>
                  <TD className="max-w-[16rem]">
                    <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <span className="truncate">{s.originAddress}</span>
                      <ArrowRight size={12} className="shrink-0 text-ink-faint" />
                      <span className="truncate">{s.destinationAddress}</span>
                    </div>
                  </TD>
                  <TD>
                    <StatusBadge
                      meta={SHIPMENT_STATUS_META[s.status]}
                      pulse={s.status === "in_transit"}
                    />
                  </TD>
                  <TD>
                    <span className="text-xs text-ink-soft">{driverLabel(s, driverNames)}</span>
                  </TD>
                  <TD className="pr-3 text-right">
                    <span className="whitespace-nowrap text-xs text-ink-muted">
                      {formatRelativeTime(s.createdAt)}
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}
    </Card>
  );
}
