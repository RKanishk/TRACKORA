import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/status";

const TONE_CLASSES: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  info: { pill: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  active: { pill: "bg-brand-50 text-brand-700 ring-brand-200", dot: "bg-brand-500" },
  success: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  warning: { pill: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  danger: { pill: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
};

export interface BadgeProps {
  tone?: Tone;
  /** Show the leading status dot. */
  dot?: boolean;
  /** Pulse the dot (used for live "active" states). */
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", dot = true, pulse = false, className, children }: BadgeProps) {
  const c = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        c.pill,
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", c.dot)}
            />
          )}
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", c.dot)} />
        </span>
      )}
      {children}
    </span>
  );
}

/** Convenience wrapper for a { label, tone } status meta object. */
export function StatusBadge({
  meta,
  pulse = false,
  dot = true,
  className,
}: {
  meta: { label: string; tone: Tone };
  pulse?: boolean;
  dot?: boolean;
  className?: string;
}) {
  return (
    <Badge tone={meta.tone} pulse={pulse} dot={dot} className={className}>
      {meta.label}
    </Badge>
  );
}
