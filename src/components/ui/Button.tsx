import { motion, useReducedMotion } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "danger";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-bg hover:brightness-110 focus-visible:outline-accent relative",
  ghost:
    "border border-border bg-transparent text-text hover:bg-white/5 focus-visible:outline-accent",
  danger:
    "border border-danger/30 bg-danger/15 text-danger hover:bg-danger/25 focus-visible:outline-danger",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const isPrimary = variant === "primary";

  // Use a wrapper div for the motion animation, and a regular button for semantics
  return (
    <motion.div
      whileTap={!reduceMotion ? { scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 25 } } : undefined}
      whileHover={!reduceMotion && !isPrimary ? { scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } } : undefined}
      className="inline-flex"
    >
      <button
        type={type}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-caps-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        {children}
        {isPrimary && !reduceMotion && (
          <span
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: "inset 0 0 0 0 rgba(0,0,0,0)",
              transition: "box-shadow 0.08s ease-out",
            } as React.CSSProperties}
          />
        )}
      </button>
    </motion.div>
  );
}