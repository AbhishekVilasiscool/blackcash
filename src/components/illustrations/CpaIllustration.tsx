import { useEffect, useState } from "react";
import { useSvgId } from "../../lib/useSvgId";
import { useReducedMotion } from "framer-motion";

interface IllustrationProps {
  accent?: string;
  className?: string;
}

function createHatchPattern(id: string) {
  return (
    <pattern
      id={id}
      width="4"
      height="4"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="0.6" />
    </pattern>
  );
}

export function CpaIllustration({ accent = "var(--accent)", className = "" }: IllustrationProps) {
  const reduceMotion = useReducedMotion();
  const [draw, setDraw] = useState(false);
  const hatchId = useSvgId();

  useEffect(() => {
    if (reduceMotion) {
      setDraw(true);
      return;
    }
    const timer = setTimeout(() => setDraw(true), 100);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <svg
      width="260"
      height="200"
      viewBox="0 0 260 200"
      className={className}
      style={{ opacity: 0.45 } as React.CSSProperties}
      aria-hidden="true"
    >
      <defs>
        {createHatchPattern(hatchId)}
      </defs>

      {/* Archive cabinet */}
      <g transform="translate(30, 20)">
        <rect
          x="0"
          y="0"
          width="200"
          height="160"
          rx="4"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.45 : 0}
          strokeDasharray={600}
          strokeDashoffset={draw ? 0 : 600}
          style={{ transition: "stroke-dashoffset 1.5s ease-out, stroke-opacity 0.3s" } as React.CSSProperties}
        />

        {/* Drawers grid - 4 columns x 4 rows */}
        {[0, 1, 2, 3].flatMap((row) =>
          [0, 1, 2, 3].map((col) => {
            const isAjar = row === 1 && col === 2;
            const x = 8 + col * 46;
            const y = 8 + row * 36;
            return (
              <g key={`${row}-${col}`} transform={`translate(${x}, ${y})`}>
                <rect
                  x="0"
                  y="0"
                  width="40"
                  height="30"
                  rx="2"
                  fill="none"
                  stroke={accent}
                  strokeWidth={isAjar ? "1.5" : "1"}
                  strokeOpacity={draw ? (isAjar ? 0.5 : 0.35) : 0}
                  strokeDasharray={120}
                  strokeDashoffset={draw ? 0 : 120}
                  style={{
                    transition: `stroke-dashoffset 1s ease-out ${0.3 + (row * 4 + col) * 0.05}s, stroke-opacity 0.3s ${0.3 + (row * 4 + col) * 0.05}s`,
                  } as React.CSSProperties}
                />
                {/* Drawer handle */}
                <ellipse
                  cx={isAjar ? 30 : 20}
                  cy={15}
                  rx={4}
                  ry={2}
                  fill="none"
                  stroke={accent}
                  strokeWidth={isAjar ? "1.2" : "0.8"}
                  strokeOpacity={draw ? (isAjar ? 0.5 : 0.3) : 0}
                  strokeDasharray={isAjar ? 20 : 15}
                  strokeDashoffset={draw ? 0 : (isAjar ? 20 : 15)}
                  style={{
                    transition: `stroke-dashoffset 0.6s ease-out ${0.5 + (row * 4 + col) * 0.05}s, stroke-opacity 0.3s ${0.5 + (row * 4 + col) * 0.05}s`,
                  } as React.CSSProperties}
                />
                {/* Hatching inside drawers */}
                <rect
                  x="2"
                  y="2"
                  width="36"
                  height="26"
                  rx="1"
                  fill={`url(#${hatchId})`}
                  fillOpacity={draw ? 0.1 : 0}
                  style={{ transition: "fill-opacity 0.5s ease-out 1s" } as React.CSSProperties}
                />
              </g>
            );
          })
        )}

        {/* One ajar drawer - slightly open */}
        <rect
          x={8 + 2 * 46 - 8}
          y={8 + 1 * 36}
          width="40"
          height="30"
          rx="2"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.3 : 0}
          strokeDasharray={120}
          strokeDashoffset={draw ? 0 : 120}
          style={{
            transform: "translateX(-8px)",
            transition: "transform 0.5s ease-out 1s, stroke-dashoffset 1s ease-out 0.3s, stroke-opacity 0.3s 0.3s",
          } as React.CSSProperties}
        />
      </g>

      {/* Old key on a ring */}
      <g transform="translate(130, 180)">
        <circle
          cx="0"
          cy="0"
          r="12"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.4 : 0}
          strokeDasharray={75}
          strokeDashoffset={draw ? 0 : 75}
          style={{ transition: "stroke-dashoffset 1s ease-out 0.8s, stroke-opacity 0.3s 0.8s" } as React.CSSProperties}
        />
        {/* Key bow */}
        <circle cx="0" cy="0" r="6" fill="none" stroke={accent} strokeWidth="2" strokeOpacity={draw ? 0.5 : 0} />
        {/* Key shaft */}
        <rect
          x="-1.5"
          y="6"
          width="3"
          height="20"
          rx="1.5"
          fill={accent}
          fillOpacity={draw ? 0.5 : 0}
          transform="translate(0, 0)"
          style={{ transition: "fill-opacity 0.3s 1s" } as React.CSSProperties}
        />
        {/* Key teeth */}
        <g stroke={accent} strokeWidth="2" strokeLinecap="round" strokeOpacity={draw ? 0.5 : 0}>
          <line x1="-4" y1="20" x2="4" y2="20" />
          <line x1="-3" y1="24" x2="3" y2="24" />
        </g>
        {/* Ring through bow */}
        <circle cx="0" cy="-10" r="4" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity={draw ? 0.4 : 0} />
      </g>
    </svg>
  );
}