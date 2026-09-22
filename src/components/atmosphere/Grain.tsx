import { useReducedMotion } from "framer-motion";

interface GrainProps {
  opacity?: number;
  contained?: boolean;
}

export function Grain({ opacity = 0.04, contained = false }: GrainProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  const positionClass = contained ? "absolute inset-0" : "fixed inset-0";
  const zIndex = contained ? "-z-10" : "-z-30";

  return (
    <svg
      className={`${positionClass} ${zIndex} pointer-events-none`}
      aria-hidden="true"
      style={{ opacity } as React.CSSProperties}
    >
      <filter id="grain-filter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="4"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="saturate"
          values="0"
        />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 1" />
        </feComponentTransfer>
      </filter>
      <rect
        width="100%"
        height="100%"
        filter="url(#grain-filter)"
        style={{ mixBlendMode: "overlay" } as React.CSSProperties}
      />
    </svg>
  );
}