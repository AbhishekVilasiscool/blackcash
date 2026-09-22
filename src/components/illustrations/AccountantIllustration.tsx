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

export function AccountantIllustration({ accent = "var(--accent)", className = "" }: IllustrationProps) {
  const reduceMotion = useReducedMotion();
  const [draw, setDraw] = useState(false);
  const hatchId = useSvgId();
  const deskId = useSvgId();
  const candleId = useSvgId();

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
        <linearGradient id={deskId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id={candleId} cx="50%" cy="0%" r="50%">
          <stop offset="0%" stopColor="var(--candle)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Desk surface */}
      <rect
        x="20"
        y="140"
        width="220"
        height="40"
        rx="2"
        fill={`url(#${deskId})`}
        style={{
          stroke: accent,
          strokeWidth: 1,
          strokeOpacity: 0.3,
          strokeDasharray: draw ? "0" : "300",
          transition: "stroke-dashoffset 1.2s ease-out",
        } as React.CSSProperties}
      />

      {/* Desk legs */}
      <rect x="35" y="180" width="4" height="20" fill={accent} fillOpacity="0.3" />
      <rect x="221" y="180" width="4" height="20" fill={accent} fillOpacity="0.3" />

      {/* Ledger book */}
      <g transform="translate(60, 80)">
        <rect
          x="0"
          y="0"
          width="140"
          height="90"
          rx="3"
          fill="none"
          stroke={accent}
          strokeWidth="1.2"
          strokeOpacity={draw ? 0.45 : 0}
          strokeDasharray={200}
          strokeDashoffset={draw ? 0 : 200}
          style={{ transition: "stroke-dashoffset 1.2s ease-out, stroke-opacity 0.3s" } as React.CSSProperties}
        />
        {/* Book spine */}
        <path
          d="M70 0 V 90"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.3 : 0}
          strokeDasharray={90}
          strokeDashoffset={draw ? 0 : 90}
          style={{ transition: "stroke-dashoffset 1s ease-out 0.3s, stroke-opacity 0.3s 0.3s" } as React.CSSProperties}
        />
        {/* Hatching on cover */}
        <rect
          x="2"
          y="2"
          width="136"
          height="86"
          rx="2"
          fill={`url(#${hatchId})`}
          fillOpacity={draw ? 0.15 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 0.8s" } as React.CSSProperties}
        />
        {/* Text lines */}
        {[1, 2, 3, 4, 5].map((i) => (
          <line
            key={i}
            x1="15"
            y1={20 + i * 12}
            x2="115"
            y2={20 + i * 12}
            stroke={accent}
            strokeWidth="0.5"
            strokeOpacity={draw ? 0.25 : 0}
            strokeDasharray={100}
            strokeDashoffset={draw ? 0 : 100}
            style={{ transition: `stroke-dashoffset 0.8s ease-out ${0.8 + i * 0.1}s, stroke-opacity 0.3s ${0.8 + i * 0.1}s` } as React.CSSProperties}
          />
        ))}
      </g>

      {/* Quill in inkwell */}
      <g transform="translate(200, 100)">
        <ellipse
          cx="0"
          cy="15"
          rx="12"
          ry="6"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.4 : 0}
          strokeDasharray={80}
          strokeDashoffset={draw ? 0 : 80}
          style={{ transition: "stroke-dashoffset 0.8s ease-out 0.5s, stroke-opacity 0.3s 0.5s" } as React.CSSProperties}
        />
        <ellipse
          cx="0"
          cy="15"
          rx="10"
          ry="5"
          fill={`url(#${hatchId})`}
          fillOpacity={draw ? 0.15 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 1s" } as React.CSSProperties}
        />
        {/* Quill */}
        <path
          d="M-8 -30 Q-4 -25 0 -15 Q4 -25 8 -30"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity={draw ? 0.5 : 0}
          strokeDasharray={60}
          strokeDashoffset={draw ? 0 : 60}
          style={{ transition: "stroke-dashoffset 0.8s ease-out 0.6s, stroke-opacity 0.3s 0.6s" } as React.CSSProperties}
        />
        {/* Quill feather */}
        <path
          d="M-8 -30 Q-15 -35 -12 -40 Q-10 -38 -8 -30"
          stroke={accent}
          strokeWidth="0.8"
          strokeOpacity={draw ? 0.35 : 0}
          strokeDasharray={40}
          strokeDashoffset={draw ? 0 : 40}
          style={{ transition: "stroke-dashoffset 0.6s ease-out 0.7s, stroke-opacity 0.3s 0.7s" } as React.CSSProperties}
        />
        <path
          d="M8 -30 Q15 -35 12 -40 Q10 -38 8 -30"
          stroke={accent}
          strokeWidth="0.8"
          strokeOpacity={draw ? 0.35 : 0}
          strokeDasharray={40}
          strokeDashoffset={draw ? 0 : 40}
          style={{ transition: "stroke-dashoffset 0.6s ease-out 0.7s, stroke-opacity 0.3s 0.7s" } as React.CSSProperties}
        />
      </g>

      {/* Candle */}
      <g transform="translate(240, 80)">
        <rect
          x="-6"
          y="10"
          width="12"
          height="35"
          rx="1"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.4 : 0}
          strokeDasharray={70}
          strokeDashoffset={draw ? 0 : 70}
          style={{ transition: "stroke-dashoffset 0.8s ease-out 0.4s, stroke-opacity 0.3s 0.4s" } as React.CSSProperties}
        />
        <ellipse
          cx="0"
          cy="10"
          rx="8"
          ry="3"
          fill={`url(#${candleId})`}
          fillOpacity={draw ? 0.3 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 0.9s" } as React.CSSProperties}
        />
        {/* Flame */}
        <path
          d="M0 10 Q-4 2 0 -5 Q4 2 0 10"
          fill="var(--candle)"
          fillOpacity={draw ? 0.4 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 1s" } as React.CSSProperties}
        />
      </g>
    </svg>
  );
}