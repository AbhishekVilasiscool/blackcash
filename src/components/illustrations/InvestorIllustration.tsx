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

export function InvestorIllustration({ accent = "var(--accent)", className = "" }: IllustrationProps) {
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

      {/* Hourglass */}
      <g transform="translate(80, 100)">
        {/* Top bulb */}
        <path
          d="M-40 -60 Q-40 -80 0 -80 Q40 -80 40 -60 Q40 -40 0 -40 Q-40 -40 -40 -60"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.45 : 0}
          strokeDasharray={240}
          strokeDashoffset={draw ? 0 : 240}
          style={{ transition: "stroke-dashoffset 1.2s ease-out, stroke-opacity 0.3s" } as React.CSSProperties}
        />
        {/* Bottom bulb */}
        <path
          d="M-40 60 Q-40 80 0 80 Q40 80 40 60 Q40 40 0 40 Q-40 40 -40 60"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.45 : 0}
          strokeDasharray={240}
          strokeDashoffset={draw ? 0 : 240}
          style={{ transition: "stroke-dashoffset 1.2s ease-out 0.2s, stroke-opacity 0.3s 0.2s" } as React.CSSProperties}
        />
        {/* Narrow neck */}
        <rect
          x="-4"
          y="-2"
          width="8"
          height="4"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.5 : 0}
          strokeDasharray={20}
          strokeDashoffset={draw ? 0 : 20}
          style={{ transition: "stroke-dashoffset 0.5s ease-out 0.4s, stroke-opacity 0.3s 0.4s" } as React.CSSProperties}
        />

        {/* Sand in top bulb - static */}
        <path
          d="M-35 -58 Q-35 -76 0 -76 Q35 -76 35 -58 Q35 -42 0 -42 Q-35 -42 -35 -58"
          fill={`url(#${hatchId})`}
          fillOpacity={draw ? 0.15 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 0.8s" } as React.CSSProperties}
        />
        {/* Falling sand stream */}
        <g stroke={accent} strokeWidth="0.8" strokeLinecap="round" strokeOpacity={draw ? 0.4 : 0}>
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1={(i - 3.5) * 2}
              y1={-4 + (i % 3) * 2}
              x2={(i - 3.5) * 2}
              y2={4 + (i % 3) * 2}
              stroke={accent}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeOpacity={draw ? 0.4 : 0}
              strokeDasharray={8}
              strokeDashoffset={draw ? 0 : 8}
              style={{ transition: `stroke-dashoffset 0.5s ease-out ${0.6 + i * 0.05}s, stroke-opacity 0.3s ${0.6 + i * 0.05}s` } as React.CSSProperties}
            />
          ))}
        </g>
        {/* Sand accumulated in bottom */}
        <path
          d="M-35 62 Q-35 78 0 78 Q35 78 35 62 Q35 48 0 48 Q-35 48 -35 62"
          fill={`url(#${hatchId})`}
          fillOpacity={draw ? 0.15 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 1s" } as React.CSSProperties}
        />

        {/* Hourglass frame */}
        <path
          d="M-44 -84 H44 M-44 84 H44"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity={draw ? 0.45 : 0}
          strokeDasharray={88}
          strokeDashoffset={draw ? 0 : 88}
          style={{ transition: "stroke-dashoffset 0.8s ease-out 0.3s, stroke-opacity 0.3s 0.3s" } as React.CSSProperties}
        />
        <path
          d="M-44 -84 V84 M44 -84 V84"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.35 : 0}
          strokeDasharray={168}
          strokeDashoffset={draw ? 0 : 168}
          style={{ transition: "stroke-dashoffset 0.8s ease-out 0.4s, stroke-opacity 0.3s 0.4s" } as React.CSSProperties}
        />
      </g>

      {/* Pocket watch */}
      <g transform="translate(190, 100)">
        {/* Watch case */}
        <circle
          cx="0"
          cy="0"
          r="40"
          fill="none"
          stroke={accent}
          strokeWidth="2"
          strokeOpacity={draw ? 0.45 : 0}
          strokeDasharray={250}
          strokeDashoffset={draw ? 0 : 250}
          style={{ transition: "stroke-dashoffset 1.2s ease-out 0.4s, stroke-opacity 0.3s 0.4s" } as React.CSSProperties}
        />
        {/* Inner bezel */}
        <circle
          cx="0"
          cy="0"
          r="32"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.35 : 0}
          strokeDasharray={200}
          strokeDashoffset={draw ? 0 : 200}
          style={{ transition: "stroke-dashoffset 1s ease-out 0.5s, stroke-opacity 0.3s 0.5s" } as React.CSSProperties}
        />
        {/* Watch face hatching */}
        <circle
          cx="0"
          cy="0"
          r="30"
          fill={`url(#${hatchId})`}
          fillOpacity={draw ? 0.1 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 1s" } as React.CSSProperties}
        />
        {/* Hour markers */}
        <g stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={draw ? 0.4 : 0}>
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const x1 = Math.cos(angle) * 24;
            const y1 = Math.sin(angle) * 24;
            const x2 = Math.cos(angle) * 28;
            const y2 = Math.sin(angle) * 28;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={accent}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeOpacity={draw ? 0.4 : 0}
                strokeDasharray={4}
                strokeDashoffset={draw ? 0 : 4}
                style={{ transition: `stroke-dashoffset 0.4s ease-out ${0.7 + i * 0.03}s, stroke-opacity 0.3s ${0.7 + i * 0.03}s` } as React.CSSProperties}
              />
            );
          })}
        </g>
        {/* Hands */}
        <g stroke={accent} strokeWidth="2" strokeLinecap="round" strokeOpacity={draw ? 0.5 : 0}>
          {/* Hour hand */}
          <line
            x1="0"
            y1="0"
            x2={Math.cos(-Math.PI / 6) * 14}
            y2={Math.sin(-Math.PI / 6) * 14}
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity={draw ? 0.55 : 0}
            strokeDasharray={14}
            strokeDashoffset={draw ? 0 : 14}
            style={{ transition: "stroke-dashoffset 0.8s ease-out 0.9s, stroke-opacity 0.3s 0.9s" } as React.CSSProperties}
          />
          {/* Minute hand */}
          <line
            x1="0"
            y1="0"
            x2={Math.cos(-Math.PI / 2) * 20}
            y2={Math.sin(-Math.PI / 2) * 20}
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity={draw ? 0.5 : 0}
            strokeDasharray={20}
            strokeDashoffset={draw ? 0 : 20}
            style={{ transition: "stroke-dashoffset 0.8s ease-out 1s, stroke-opacity 0.3s 1s" } as React.CSSProperties}
          />
        </g>
        {/* Crown */}
        <rect
          x="38"
          y="-6"
          width="10"
          height="12"
          rx="2"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.4 : 0}
          strokeDasharray={30}
          strokeDashoffset={draw ? 0 : 30}
          style={{ transition: "stroke-dashoffset 0.6s ease-out 0.8s, stroke-opacity 0.3s 0.8s" } as React.CSSProperties}
        />
        {/* Chain loop */}
        <ellipse
          cx="43"
          cy="-25"
          rx="8"
          ry="5"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.35 : 0}
          strokeDasharray={40}
          strokeDashoffset={draw ? 0 : 40}
          style={{ transition: "stroke-dashoffset 0.6s ease-out 0.9s, stroke-opacity 0.3s 0.9s" } as React.CSSProperties}
        />
      </g>
    </svg>
  );
}