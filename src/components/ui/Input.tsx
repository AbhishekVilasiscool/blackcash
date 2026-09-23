import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, className = "", id: providedId, ...props },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const generatedId = useId();
  const inputId = providedId ?? generatedId;
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const labelTransform = reduceMotion
    ? { y: 0, scale: 1 }
    : isFocused || hasValue
    ? { y: -20, scale: 0.85 }
    : { y: 0, scale: 1 };

  const labelTransition = reduceMotion
    ? undefined
    : { type: "spring" as const, stiffness: 300, damping: 25 };

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`}>
      {label !== undefined && (
        <motion.label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wide text-muted pointer-events-none absolute top-6 left-3 origin-left transition-colors duration-150"
          style={{
            transformOrigin: "left top",
            color: isFocused ? "var(--accent)" : "inherit",
          }}
          animate={labelTransform}
          transition={labelTransition}
        >
          {label}
        </motion.label>
      )}
      <input
        id={inputId}
        ref={ref}
        className="w-full rounded-xl border border-border bg-black/25 px-3 py-2.5 text-sm text-text transition-colors duration-150 placeholder:text-muted/60 focus:border-accent focus:outline-none"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setHasValue(e.target.value.length > 0)}
        {...props}
      />
      {hint !== undefined && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
});

Input.displayName = "Input";