import { useSvgId } from "../../lib/useSvgId";

interface LaurelProps {
  r?: number;
  count?: number;
  className?: string;
}

export function Laurel({ r = 27, count = 9, className = "" }: LaurelProps) {
  const hatchId = useSvgId();

  const leaves = Array.from({ length: count }, (_, i) => {
    const t = (110 + (i / (count - 1)) * 140) * (Math.PI / 180);
    const x = 50 + Math.cos(t) * r;
    const y = 50 + Math.sin(t) * r;
    const rot = (t * 180) / Math.PI + 90 + (i % 2 ? 28 : -28);
    return (
      <ellipse
        key={i}
        cx={x}
        cy={y}
        rx={2.2}
        ry={6}
        transform={`rotate(${rot} ${x} ${y})`}
      />
    );
  });

  return (
    <g className={className} fill="currentColor">
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
      <g>{leaves}</g>
      <g transform="translate(100 0) scale(-1 1)">{leaves}</g>
    </g>
  );
}