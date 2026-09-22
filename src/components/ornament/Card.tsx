import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Guilloche } from "./Guilloche";

export interface CardProps {
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: string;
  padded?: boolean;
}

export function Card({
  children,
  interactive = false,
  accent = "var(--accent)",
  padded = true,
  className = "",
}: CardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={interactive && !reduceMotion ? { y: -2 } : undefined}
      className={`relative overflow-hidden rounded-[var(--radius)] ${interactive ? "cursor-pointer" : ""} ${className}`}
      style={{
        "--card-accent": accent,
        background: `
          var(--bg-2),
          linear-gradient(180deg, rgba(180,205,215,0.06) 0%, transparent 4px, transparent calc(100% - 4px), rgba(180,205,215,0.03) 100%)
        `,
        border: "1px solid var(--border)",
        boxShadow: `
          inset 0 1px 0 rgba(180,205,215,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.2),
          0 4px 24px -8px rgba(0,0,0,0.4)
        `,
      } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
        aria-hidden="true"
        style={{ "--guilloche-color": accent } as React.CSSProperties}
      >
        <Guilloche size={400} density={8} color="var(--guilloche-color)" opacity={1} />
      </div>

      <svg
        className="absolute inset-0 -z-10 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ width: "100%", height: "100%" } as React.CSSProperties}
      >
        <defs>
          <style>{`
            .card-inner-border {
              fill: none;
              stroke: var(--border-strong);
              stroke-width: 0.8;
              stroke-opacity: 0.4;
            }
            .card-top-edge {
              fill: none;
              stroke: url(#frost-gradient);
              stroke-width: 1.5;
            }
          `}</style>
          <linearGradient id="frost-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--card-accent)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--card-accent)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--card-accent)" stopOpacity="0.5" />
            <stop offset="80%" stopColor="var(--card-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--card-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x="2%"
          y="2%"
          width="96%"
          height="96%"
          rx="calc(var(--radius) * 0.6)"
          className="card-inner-border"
        />
        <line
          x1="2%"
          y1="2%"
          x2="98%"
          y2="2%"
          className="card-top-edge"
        />
      </svg>

      <div className={padded ? "p-5" : ""}>{children}</div>

      {!reduceMotion && interactive && (
        <motion.div
          className="absolute inset-0 -z-10 pointer-events-none"
          animate={{
            opacity: [0, 1, 0],
            transform: ["scaleX(0)", "scaleX(1)", "scaleX(0)"],
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, transparent, var(--card-accent), transparent)`,
            opacity: 0.15,
            mixBlendMode: "screen",
          } as React.CSSProperties}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}