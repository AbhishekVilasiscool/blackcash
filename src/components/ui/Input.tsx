import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, className = "", id, ...props },
  ref,
) {
  const inputId =
    id ?? (label === undefined ? undefined : label.toLowerCase().replace(/\s+/g, "-"));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label !== undefined && (
        <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className="w-full rounded-xl border border-border bg-black/25 px-3 py-2.5 text-sm text-text transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none"
        {...props}
      />
      {hint !== undefined && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
});