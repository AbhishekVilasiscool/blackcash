import { useReducedMotion } from "framer-motion";

interface VignetteProps {
  strength?: number;
  contained?: boolean;
}

export function Vignette({ strength = 0.6, contained = false }: VignetteProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  const positionClass = contained ? "absolute inset-0" : "fixed inset-0";
  const zIndex = contained ? "-z-10" : "-z-20";

  return (
    <div
      className={`${positionClass} ${zIndex} pointer-events-none`}
      aria-hidden="true"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, transparent 40%, rgba(5, 8, 10, ${strength * 0.3}) 70%, rgba(5, 8, 10, ${strength}) 100%)`,
      } as React.CSSProperties}
    />
  );
}