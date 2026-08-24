import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A small, dependency-free dropdown menu. Handles outside-click and Escape
 * to close, and basic ARIA wiring. Not a full menubar/roving-tabindex
 * implementation, but keyboard-dismissable and screen-reader labelled.
 */
export function DropdownMenu({
  trigger,
  children,
  align = "right",
  className,
  menuClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: "left" | "right";
  className?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v), id: menuId })}
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-[13rem] origin-top overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-dropdown animate-scale-in",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

/** A single menu row. */
export function DropdownItem({
  icon,
  children,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-50",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-ink-soft hover:bg-canvas hover:text-ink",
      )}
    >
      {icon && <span className="text-ink-faint">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-1.5 text-2xs font-medium uppercase tracking-wide text-ink-faint">{children}</div>;
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-line" />;
}
