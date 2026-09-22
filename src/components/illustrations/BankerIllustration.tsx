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

export function BankerIllustration({ accent = "var(--accent)", className = "" }: IllustrationProps) {
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

      {/* Vault door - centered */}
      <g transform="translate(130, 100)">
        {/* Outer rim */}
        <circle
          cx="0"
          cy="0"
          r="95"
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeOpacity={draw ? 0.5 : 0}
          strokeDasharray={600}
          strokeDashoffset={draw ? 0 : 600}
          style={{ transition: "stroke-dashoffset 1.5s ease-out, stroke-opacity 0.3s" } as React.CSSProperties}
        />

        {/* Rivets around rim */}
        <g stroke={accent} strokeWidth="2" strokeLinecap="round" strokeOpacity={draw ? 0.5 : 0}>
          {[...Array(24)].map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const x = Math.cos(angle) * 88;
            const y = Math.sin(angle) * 88;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={accent}
                fillOpacity={draw ? 0.5 : 0}
                style={{ transition: `fill-opacity 0.3s ${0.5 + i * 0.02}s` } as React.CSSProperties}
              />
            );
          })}
        </g>

        {/* Middle ring */}
        <circle
          cx="0"
          cy="0"
          r="70"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity={draw ? 0.4 : 0}
          strokeDasharray={440}
          strokeDashoffset={draw ? 0 : 440}
          style={{ transition: "stroke-dashoffset 1.2s ease-out 0.3s, stroke-opacity 0.3s 0.3s" } as React.CSSProperties}
        />

        {/* Inner ring */}
        <circle
          cx="0"
          cy="0"
          r="45"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.3 : 0}
          strokeDasharray={280}
          strokeDashoffset={draw ? 0 : 280}
          style={{ transition: "stroke-dashoffset 1s ease-out 0.5s, stroke-opacity 0.3s 0.5s" } as React.CSSProperties}
        />

        {/* 8 Radial bolts */}
        <g stroke={accent} strokeWidth="2" strokeLinecap="round" strokeOpacity={draw ? 0.5 : 0}>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = Math.cos(angle) * 55;
            const y1 = Math.sin(angle) * 55;
            const x2 = Math.cos(angle) * 40;
            const y2 = Math.sin(angle) * 40;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity={draw ? 0.5 : 0}
                strokeDasharray={25}
                strokeDashoffset={draw ? 0 : 25}
                style={{ transition: `stroke-dashoffset 0.8s ease-out ${0.5 + i * 0.05}s, stroke-opacity 0.3s ${0.5 + i * 0.05}s` } as React.CSSProperties}
              />
            );
          })}
        </g>

        {/* Central spoked wheel */}
        <g stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={draw ? 0.5 : 0}>
          {/* Wheel rim */}
          <circle
            cx="0"
            cy="0"
            r="28"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeOpacity={draw ? 0.45 : 0}
            strokeDasharray={175}
            strokeDashoffset={draw ? 0 : 175}
            style={{ transition: "stroke-dashoffset 1s ease-out 0.5s, stroke-opacity 0.3s 0.5s" } as React.CSSProperties}
          />
          {/* Spokes - 8 spokes */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <line
                key={i}
                x1="0"
                y1="0"
                x2={Math.cos(angle) * 25}
                y2={Math.sin(angle) * 25}
                stroke={accent}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeOpacity={draw ? 0.45 : 0}
                strokeDasharray={25}
                strokeDashoffset={draw ? 0 : 25}
                style={{ transition: `stroke-dashoffset 0.6s ease-out ${0.6 + i * 0.04}s, stroke-opacity 0.3s ${0.6 + i * 0.04}s` } as React.CSSProperties}
              />
            );
          })}
        </g>

        {/* Center hub */}
        <circle
          cx="0"
          cy="0"
          r="8"
          fill={`url(#${hatchId})`}
          fillOpacity={draw ? 0.2 : 0}
          stroke={accent}
          strokeWidth="1"
          strokeOpacity={draw ? 0.4 : 0}
          style={{ transition: "fill-opacity 0.5s ease-out 1s, stroke-opacity 0.3s 0.5s" } as React.CSSProperties}
        />
        <circle cx="0" cy="0" r="4" fill={accent} fillOpacity={draw ? 0.6 : 0} />
      </g>
    </svg>
  );
}