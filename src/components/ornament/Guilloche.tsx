import { useMemo, useState, useEffect } from "react";

interface GuillocheProps {
  size?: number;
  density?: number;
  color?: string;
  opacity?: number;
  className?: string;
  animate?: boolean;
}

export function Guilloche({
  size = 300,
  density = 12,
  color = "currentColor",
  opacity = 0.08,
  className = "",
  animate = false,
}: GuillocheProps) {
  const paths = useMemo(() => {
    const paths: string[] = [];
    const center = size / 2;
    const maxRadius = size * 0.45;

    for (let layer = 0; layer < density; layer++) {
      const radius = (maxRadius * (layer + 1)) / density;
      const points: string[] = [];
      const steps = 180;
      const a = 1 + layer * 0.3;
      const b = 1 + layer * 0.2;
      const k = 0.8 + layer * 0.15;

      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2 * 3;
        const r = radius * (0.7 + 0.3 * Math.sin(t * k));
        const x = center + r * Math.cos(a * t);
        const y = center + r * Math.sin(b * t);
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      }

      paths.push(`M ${points.join(" L ")}`);
    }

    return paths;
  }, [size, density]);

  const [drawProgress, setDrawProgress] = useState(0);

  useEffect(() => {
    if (!animate) {
      setDrawProgress(1);
      return;
    }

    setDrawProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1 / 60;
      if (progress >= 1) {
        clearInterval(interval);
        setDrawProgress(1);
      } else {
        setDrawProgress(progress);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [animate]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
      style={{ opacity } as React.CSSProperties}
    >
      <defs>
        <style>{`
          .guilloche-path {
            stroke-dasharray: 1000;
            stroke-dashoffset: ${1000 * (1 - drawProgress)};
            transition: stroke-dashoffset 0.01s linear;
          }
        `}</style>
      </defs>
      <g fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        {paths.map((path, i) => (
          <path key={i} d={path} className="guilloche-path" style={{ strokeDasharray: path.length * 2 }} />
        ))}
      </g>
    </svg>
  );
}