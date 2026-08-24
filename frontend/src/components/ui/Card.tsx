import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** A surface card with a hairline border and soft shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface shadow-card", className)}
      {...props}
    />
  );
}

/**
 * Card header with an optional action slot on the right (e.g. a "View all"
 * link). Renders a title, optional description, and optional trailing node.
 */
export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4 pb-3", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 text-ink-muted">{icon}</span>}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 border-t border-line px-5 py-3", className)}
      {...props}
    />
  );
}

/** A thin divider matching the card's hairline border. */
export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("border-t border-line", className)} />;
}
