import { cn } from "@/lib/cn";

/**
 * Shimmer placeholder used by loading states. The `.skeleton` class (see
 * index.css) provides the animated sheen; sizing comes from className.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** A block of stacked skeleton lines, handy inside loading cards. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
