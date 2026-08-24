import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Tone } from "@/lib/status";

const ACCENT: Record<Tone, { icon: string; ring: string }> = {
  neutral: { icon: "bg-slate-100 text-slate-600", ring: "ring-slate-200" },
  info: { icon: "bg-blue-50 text-blue-600", ring: "ring-blue-200" },
  active: { icon: "bg-brand-50 text-brand-600", ring: "ring-brand-200" },
  success: { icon: "bg-emerald-50 text-emerald-600", ring: "ring-emerald-200" },
  warning: { icon: "bg-amber-50 text-amber-600", ring: "ring-amber-200" },
  danger: { icon: "bg-red-50 text-red-600", ring: "ring-red-200" },
};

export interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  sublabel?: string;
  loading?: boolean;
}

/** A single KPI/summary stat. `value` is pre-formatted by the caller. */
export function KpiCard({ label, value, icon: Icon, tone = "neutral", sublabel, loading }: KpiCardProps) {
  const accent = ACCENT[tone];
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-ink">{value}</p>
          )}
          {sublabel && !loading && <p className="mt-1 text-xs text-ink-faint">{sublabel}</p>}
        </div>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            accent.icon,
            accent.ring,
          )}
        >
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}
