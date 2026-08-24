import { MapPin, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/** Branded full-viewport loader shown while the session is being restored. */
export function FullScreenLoader({ label = "Loading Trackora…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
        <MapPin size={22} className="text-white" />
      </span>
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Spinner size={16} />
        {label}
      </div>
    </div>
  );
}

/** Full-viewport connectivity error with a retry, shown when bootstrap fails. */
export function FullScreenError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
        <WifiOff size={22} />
      </span>
      <div>
        <p className="text-base font-semibold text-ink">Can't reach the server</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          We couldn't restore your session. Check your connection and try again.
        </p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
