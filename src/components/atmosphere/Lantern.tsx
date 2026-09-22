import { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

interface LanternProps {
  accent?: string;
  radius?: number;
  opacity?: number;
  contained?: boolean;
}

export function Lantern({ accent = "var(--candle)", radius = 220, opacity = 0.1, contained = false }: LanternProps) {
  const reduceMotion = useRef(false);
  const [pointer, setPointer] = useState({ x: -9999, y: -9999 });
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkPointer = () => {
      const mediaQuery = window.matchMedia("(pointer: fine)");
      setIsFinePointer(mediaQuery.matches);
      reduceMotion.current = mediaQuery.matches === false;
    };

    checkPointer();
    const mediaQuery = window.matchMedia("(pointer: fine)");
    mediaQuery.addEventListener?.("change", checkPointer);
    return () => mediaQuery.removeEventListener?.("change", checkPointer);
  }, []);

  useEffect(() => {
    if (!isFinePointer) return;

    const target = contained ? containerRef.current : window;

    const handlePointerMove = (e: Event) => {
      const pe = e as PointerEvent;
      if (contained && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPointer({ x: pe.clientX - rect.left, y: pe.clientY - rect.top });
      } else {
        setPointer({ x: pe.clientX, y: pe.clientY });
      }
    };

    target?.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => target?.removeEventListener("pointermove", handlePointerMove);
  }, [isFinePointer, contained]);

  // Detect hover over interactive elements (inputs, tables, forms)
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactiveSelectors = "input, textarea, [contenteditable=true], select, table, [role=grid], form";
      const isInteractive =
        target.matches(interactiveSelectors) ||
        target.closest(interactiveSelectors);
      setIsOverInteractive(!!isInteractive);
    };

    const handleMouseOut = () => setIsOverInteractive(false);

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
    };
  }, []);

  // Spring for heavy-lantern lag (~80ms)
  const springX = useSpring(0, { stiffness: 80, damping: 20, mass: 1.5 });
  const springY = useSpring(0, { stiffness: 80, damping: 20, mass: 1.5 });

  // Update spring targets with lag
  useEffect(() => {
    if (reduceMotion.current) return;
    const updateSpring = () => {
      springX.set(pointer.x);
      springY.set(pointer.y);
      requestAnimationFrame(updateSpring);
    };
    updateSpring();
  }, [pointer, springX, springY]);

  if (!isFinePointer || reduceMotion.current) return null;

  const positionClass = contained ? "absolute" : "fixed";
  const zIndex = contained ? "-z-10" : "-z-10";

  return (
    <div ref={containerRef} className="relative" style={{ width: "100%", height: "100%" }}>
      <motion.div
        style={{
          position: positionClass,
          zIndex,
          pointerEvents: "none",
          x: springX,
          y: springY,
          width: radius * 2,
          height: radius * 2,
          background: `radial-gradient(circle at center, ${accent} 0, transparent 70)`,
          opacity: isOverInteractive ? 0 : opacity,
          mixBlendMode: "screen",
          borderRadius: "50%",
          filter: "blur(40px)",
          willChange: "transform, opacity",
          transformOrigin: "center center",
          transform: "translate(-50%, -50%)",
          transition: "opacity 200ms ease",
        }}
      >
      </motion.div>
    </div>
  );
}