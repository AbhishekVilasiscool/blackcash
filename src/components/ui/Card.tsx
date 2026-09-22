import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface CardProps {
  children?: ReactNode;
  className?: string;
  /** Lift on hover (used for tool tiles). */
  interactive?: boolean;
  /** Accent glow on hover. */
  glow?: boolean;
}

export function Card({
  children,
  interactive = false,
  glow = false,
  className = "",
}: CardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={interactive && !reduceMotion ? { y: -4 } : undefined}
      className={`rounded-[var(--radius)] border border-border bg-surface backdrop-blur ${interactive ? "cursor-pointer" : ""} ${glow ? "transition-[box-shadow,border-color] duration-300 hover:border-accent/40 hover:shadow-[0_8px_48px_-12px_rgba(52,211,153,0.45)]" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}