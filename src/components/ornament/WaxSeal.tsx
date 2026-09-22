import { useMemo } from "react";
import { useSvgId } from "../../lib/useSvgId";
import { motion, useReducedMotion } from "framer-motion";
import { Laurel } from "./Laurel";

interface WaxSealProps {
  children?: React.ReactNode;
  size?: number;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  "aria-label"?: string;
  seed?: number;
  tone?: "oxblood" | "accent";
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function catmullRomToBezier(points: { x: number; y: number }[]): string {
  if (points.length < 4) return "";
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 3; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path + " Z";
}

export function WaxSeal({
  children,
  size = 56,
  accent = "var(--accent)",
  className = "",
  onClick,
  "aria-label": ariaLabel = "Action",
  seed = 12345,
  tone = "oxblood",
}: WaxSealProps) {
  const reduceMotion = useReducedMotion();
  const isButton = typeof onClick === "function";
  const Component = isButton ? "button" : "div";
  const gradientId = useSvgId();
  const innerGlowId = useSvgId();

  const waxBlobPath = useMemo(() => {
    const rand = mulberry32(seed);
    const center = 50;
    const baseRadius = 44;
    const jitter = 3;
    const numPoints = 28;
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = baseRadius + (rand() - 0.5) * jitter * 2;
      points.push({
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
      });
    }
    // Close the loop by repeating first 3 points at the end
    points.push(points[0], points[1], points[2]);
    return catmullRomToBezier(points);
  }, [seed]);

  const waxColors = tone === "oxblood"
    ? { base: "var(--oxblood)", deep: "var(--oxblood-deep)" }
    : { base: accent, deep: accent };

  const waxFill = `url(#${gradientId})`;

  return (
    <motion.span
      whileTap={!reduceMotion && isButton ? { scale: 0.92 } : undefined}
      whileHover={!reduceMotion && isButton ? { scale: 1.03 } : undefined}
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        "--seal-size": `${size}px`,
        "--seal-accent": accent,
      } as React.CSSProperties}
    >
      <Component
        type={isButton ? "button" : undefined}
        onClick={onClick}
        aria-label={ariaLabel}
        className="relative flex items-center justify-center"
        style={{
          width: "var(--seal-size)",
          height: "var(--seal-size)",
          position: "relative",
          cursor: isButton ? "pointer" : "default",
        } as React.CSSProperties}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={gradientId} cx="35%" cy="30%" r="100%">
              <stop offset="0%" stopColor={waxColors.base} stopOpacity={1} />
              <stop offset="100%" stopColor={waxColors.deep} stopOpacity={1} />
            </radialGradient>
            <radialGradient id={innerGlowId} cx="35%" cy="30%" r="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" stopOpacity={1} />
              <stop offset="50%" stopColor="transparent" stopOpacity={0} />
            </radialGradient>
            <filter id="wax-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.4)" />
            </filter>
            <filter id="emboss" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
              <feSpecularLighting
                in="blur"
                surfaceScale="3"
                specularConstant="0.5"
                specularExponent="20"
                lighting-color="white"
                result="spec"
              >
                <fePointLight x="50" y="-50" z="100" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
              <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
            </filter>
          </defs>

          {/* 1) Irregular wax blob */}
          <path
            d={waxBlobPath}
            fill={waxFill}
            filter="url(#wax-shadow)"
          />

          {/* 2) Embossed inner ring at radius 34 */}
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke={waxColors.deep}
            strokeWidth="2"
            filter="url(#emboss)"
          />
          {/* Inner highlight (bevel) */}
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke="url(#innerGlowId)"
            strokeWidth="1"
          />

          {/* 3) Laurel wreath at radius 27 (debossed) */}
          <g fill="rgba(0,0,0,0.35)">
            <Laurel r={27} count={9} />
          </g>
          {/* Laurel bone highlight (debossed look) */}
          <g fill="rgba(216,208,188,0.35)" transform="translate(1 1)">
            <Laurel r={27} count={9} />
          </g>

          {/* 4) Center "B" in --font-display, 34px */}
          <text
            x="50"
            y="56"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-display)"
            fontSize="34"
            fontWeight="600"
            fill={waxColors.deep}
            filter="url(#emboss)"
            style={{ letterSpacing: "0.02em" } as React.CSSProperties}
          >
            B
          </text>
          {/* B emboss highlight */}
          <text
            x="49"
            y="55"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-display)"
            fontSize="34"
            fontWeight="600"
            fill="rgba(216,208,188,0.35)"
            style={{ letterSpacing: "0.02em" } as React.CSSProperties}
          >
            B
          </text>

          {children && (
            <g transform="translate(50, 50) scale(0.6)">
              {children}
            </g>
          )}
        </svg>

        {!reduceMotion && isButton && (
          <motion.span
            className="absolute inset-0 rounded-full"
            animate={{ boxShadow: ["0 0 0 0 var(--seal-accent)", "0 0 20px 4px var(--seal-accent)"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            style={{ opacity: 0.15 } as React.CSSProperties}
            aria-hidden="true"
          />
        )}
      </Component>
    </motion.span>
  );
}