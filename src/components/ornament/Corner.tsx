import { useSvgId } from "../../lib/useSvgId";

interface CornerProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  accent?: string;
  className?: string;
}

const transforms: Record<CornerProps["position"], string> = {
  "top-left": "scale(1, 1)",
  "top-right": "scale(-1, 1)",
  "bottom-left": "scale(1, -1)",
  "bottom-right": "scale(-1, -1)",
};

const positions: Record<CornerProps["position"], React.CSSProperties> = {
  "top-left": { top: 0, left: 0 },
  "top-right": { top: 0, right: 0 },
  "bottom-left": { bottom: 0, left: 0 },
  "bottom-right": { bottom: 0, right: 0 },
};

export function Corner({ position, accent = "var(--accent)", className = "" }: CornerProps) {
  const hatchId = useSvgId();

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={className}
      style={{
        position: "absolute",
        ...positions[position],
        transform: transforms[position],
        transformOrigin: "center center",
        color: accent,
        opacity: 0.6,
        transition: "opacity 200ms ease, color 200ms ease",
      } as React.CSSProperties}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={hatchId}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="0.6" />
        </pattern>
      </defs>
      <path d="M1 27V1H27" />
      <path d="M5 23V5H23" opacity="0.55" />
      {[1, 2, 3, 4].map((i) => (
        <path key={i} d={`M1 1L27 ${1 + i * 6}`} opacity="0.35" />
      ))}
      <path d="M1 1L27 1" strokeWidth="2" />
      <rect x="6" y="6" width="3" height="3" transform="rotate(45 7.5 7.5)" fill="currentColor" stroke="none" />
    </svg>
  );
}