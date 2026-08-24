import { Link } from "react-router-dom";
import { ArrowRight, MapPinned, Radio } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { formatCount } from "@/lib/format";

/**
 * Live operations map preview.
 *
 * The backend has NO GPS / live-location data (no coordinates on shipments,
 * drivers, or vehicles), so this is a deliberate, clearly-labelled placeholder
 * — never fabricated positions. It surfaces the real in-transit count and
 * links to the future Live Tracking section (Phase 9).
 */
export function LiveOpsPreviewCard({ inTransitCount }: { inTransitCount: number | null }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Live operations"
        icon={<MapPinned size={16} />}
        action={
          <Link to="/tracking" className={buttonClasses("ghost", "sm")}>
            Open
            <ArrowRight size={14} />
          </Link>
        }
      />
      <div className="px-5 pb-5">
        <div className="relative overflow-hidden rounded-lg border border-line bg-rail-bg">
          {/* Decorative grid backdrop — abstract, not a real map. */}
          <div
            aria-hidden
            className="h-40 w-full opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 40%, rgba(99,102,241,0.25), transparent 45%), radial-gradient(circle at 75% 65%, rgba(56,189,248,0.18), transparent 40%), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "100% 100%, 100% 100%, 28px 28px, 28px 28px",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rail-panel/80 px-2.5 py-1 text-2xs font-medium text-rail-muted ring-1 ring-inset ring-rail-border">
              <Radio size={12} />
              Live tracking · Phase 9
            </span>
            <p className="text-sm font-medium text-rail-text">
              {inTransitCount === null
                ? "Real-time map coming soon"
                : `${formatCount(inTransitCount)} shipment${inTransitCount === 1 ? "" : "s"} in transit`}
            </p>
            <p className="mt-1 max-w-xs text-xs text-rail-muted">
              Live vehicle positions will appear here once location data is available.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
