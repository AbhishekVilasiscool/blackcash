import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface FogProps {
  accent?: string;
  opacity?: number;
  contained?: boolean;
}

export function Fog({ accent = "var(--accent)", opacity = 0.025, contained = false }: FogProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const container = containerRef.current;
    if (!container) return;

    container.style.setProperty("--fog-accent", accent);
    container.style.setProperty("--fog-opacity", opacity.toString());
  }, [accent, opacity, reduceMotion]);

  if (reduceMotion) return null;

  const positionClass = contained ? "absolute inset-0" : "fixed inset-0";
  const zIndex = contained ? "-z-10" : "-z-50";

  return (
    <div
      ref={containerRef}
      className={`${positionClass} ${zIndex} pointer-events-none overflow-hidden fog-container`}
      aria-hidden="true"
      style={{ willChange: "transform" } as React.CSSProperties}
    >
      <div className="fog-blob" aria-hidden="true" />
      <div className="fog-blob" aria-hidden="true" />
      <div className="fog-blob" aria-hidden="true" />
    </div>
  );
}