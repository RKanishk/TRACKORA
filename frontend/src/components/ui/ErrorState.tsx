import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

import { cn } from "@/lib/cn";
import { toFriendlyError } from "@/lib/errors";
import { Button } from "./Button";

/**
 * Error state for a failed query. Derives a friendly title/message from any
 * thrown value (see toFriendlyError) and optionally offers a retry.
 */
export function ErrorState({
  error,
  onRetry,
  className,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const friendly = toFriendlyError(error);
  const Icon = friendly.isNetwork ? WifiOff : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-ink">{friendly.title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{friendly.message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw size={14} />
          Try again
        </Button>
      )}
    </div>
  );
}
