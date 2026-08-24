import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export interface AvatarProps {
  name: string | null | undefined;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-7 w-7 text-2xs",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

/** Circular avatar: shows the image when present, otherwise colored initials. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const label = name ?? "Unknown";
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={cn("rounded-full object-cover ring-1 ring-line", SIZES[size], className)}
      />
    );
  }
  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-brand-200",
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
