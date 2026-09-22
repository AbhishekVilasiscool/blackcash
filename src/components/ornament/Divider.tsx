import type { ReactNode } from "react";

interface DividerProps {
  accent?: string;
  ornament?: ReactNode;
  className?: string;
}

export function Divider({ accent = "var(--accent)", ornament, className = "" }: DividerProps) {
  return (
    <div
      className={`flex items-center gap-4 ${className}`}
      role="separator"
      aria-orientation="horizontal"
      style={{ "--divider-accent": accent } as React.CSSProperties}
    >
      <div
        className="flex-1 h-[1px] bg-gradient-to-r"
        style={{
          backgroundImage: "linear-gradient(to right, transparent, var(--divider-accent), transparent)",
        } as React.CSSProperties}
      />
      {ornament ? (
        <span className="shrink-0 flex items-center" style={{ color: accent } as React.CSSProperties}>
          {ornament}
        </span>
      ) : (
        <svg
          className="shrink-0"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{ color: accent } as React.CSSProperties}
        >
          <path
            d="M8 2L10 8H6L8 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.3"
          />
        </svg>
      )}
      <div
        className="flex-1 h-[1px] bg-gradient-to-l"
        style={{
          backgroundImage: "linear-gradient(to left, transparent, var(--divider-accent), transparent)",
        } as React.CSSProperties}
      />
    </div>
  );
}