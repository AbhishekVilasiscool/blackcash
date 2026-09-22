import { useMemo } from "react";
import type { ReactNode } from "react";
import { Corner } from "./Corner";
import { Laurel } from "./Laurel";

type FrameVariant = "card" | "panel" | "hero";

interface FrameVariantConfig {
  borderWidth: string;
  rules: number;
  cornerGlow: boolean;
  notched?: boolean;
  topOrnament?: boolean;
}

interface FrameProps {
  children: ReactNode;
  accent?: string;
  variant?: FrameVariant;
  className?: string;
}

const variantConfig: Record<FrameVariant, FrameVariantConfig> = {
  card: { borderWidth: "1px", rules: 2, cornerGlow: true },
  panel: { borderWidth: "1.5px", rules: 2, cornerGlow: true, notched: true },
  hero: { borderWidth: "2px", rules: 3, cornerGlow: true, topOrnament: true },
};

export function Frame({ children, accent = "var(--accent)", variant = "card", className = "" }: FrameProps) {
  const config = variantConfig[variant];

  const padding = useMemo(() => {
    switch (variant) {
      case "card": return "p-4";
      case "panel": return "p-6";
      case "hero": return "p-8";
    }
  }, [variant]);

  return (
    <div
      className={`relative ${padding} ${className}`}
      style={{
        "--frame-accent": accent,
        "--frame-border-width": config.borderWidth,
        "--frame-rules": config.rules,
      } as React.CSSProperties}
    >
      {/* Double/triple rule border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: `${config.borderWidth} solid var(--border-strong)`,
          borderRadius: config.notched ? "0" : "var(--radius)",
          boxShadow: `
            inset 0 0 0 1px var(--border),
            inset 0 0 0 ${config.rules >= 2 ? "2px" : "0"} var(--border-strong),
            inset 0 0 0 ${config.rules >= 3 ? "4px" : "0"} var(--border)
          `,
        } as React.CSSProperties}
      />

      {/* Fixed 28px corners at each corner */}
      <Corner position="top-left" accent={accent} />
      <Corner position="top-right" accent={accent} />
      <Corner position="bottom-left" accent={accent} />
      <Corner position="bottom-right" accent={accent} />

      {/* Hero variant: top-center ornament (laurel + diamond) */}
      {config.topOrnament && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
          style={{ width: "auto" } as React.CSSProperties}
        >
          <Laurel r={18} count={6} className="opacity-60" />
          <div
            className="w-3 h-3 rotate-45 border border-current opacity-60"
            style={{ borderColor: accent } as React.CSSProperties}
          />
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}