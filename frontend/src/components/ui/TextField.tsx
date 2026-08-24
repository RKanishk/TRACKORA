import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Validation/error message shown below the field. */
  error?: string;
  hint?: ReactNode;
  /** Optional adornment rendered inside the field on the left (e.g. a slug prefix). */
  prefix?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, prefix, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center rounded-lg border bg-surface transition-colors focus-within:ring-2 focus-within:ring-brand-500/60",
          error ? "border-red-300 focus-within:ring-red-500/50" : "border-line focus-within:border-brand-400",
        )}
      >
        {prefix && (
          <span className="pl-3 text-sm text-ink-faint select-none">{prefix}</span>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "h-10 w-full rounded-lg bg-transparent px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none",
            prefix && "pl-1.5",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
