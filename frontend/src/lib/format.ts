/** Small, dependency-free formatting helpers for display. */

/** Relative time like "just now", "5m ago", "3h ago", "2d ago", else a date. */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDate(iso);
}

/** Short absolute date, e.g. "Aug 21, 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Date + time, e.g. "Aug 21, 2026, 4:30 PM". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** A delivery window "start – end", tolerant of missing bounds. */
export function formatWindow(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return "—";
  if (start && end) return `${formatShortTime(start)} – ${formatShortTime(end)}`;
  return formatDateTime(start ?? end);
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Humanize a duration given in seconds, e.g. "1h 45m", "3m", "—". */
export function formatDurationSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
  const total = Math.max(0, Math.round(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${total}s`;
}

/** A 0–1 ratio as a whole-number percent, e.g. 0.9231 → "92%". Null → "—". */
export function formatPercent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return "—";
  return `${Math.round(ratio * 100)}%`;
}

/** Compact integer, e.g. 1234 → "1,234". */
export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

/** Initials from a name, e.g. "Ada Lovelace" → "AL". Falls back to "?". */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Turn an audit action key like "shipment.status_changed" into a readable
 * phrase like "Shipment status changed". Purely cosmetic; the raw action is
 * always preserved for tooltips/debugging by the caller.
 */
export function humanizeAction(action: string): string {
  const withoutDots = action.replace(/[._]+/g, " ").trim();
  if (!withoutDots) return action;
  return withoutDots.charAt(0).toUpperCase() + withoutDots.slice(1);
}
