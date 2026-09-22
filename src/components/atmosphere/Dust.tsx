import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface DustProps {
  count?: number;
  opacity?: number;
  contained?: boolean;
  warmRatio?: number;
}

interface Mote {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  phase: number;
  warm: boolean;
}

// Shared rAF loop state
let sharedAnimationId: number | null = null;
const sharedMotesRef = { current: [] as Mote[] };
const sharedCanvasRef = { current: null as HTMLCanvasElement | null };
const sharedCtxRef = { current: null as CanvasRenderingContext2D | null };
const sharedDimensionsRef = { current: { width: 0, height: 0 } };
const sharedPointerRef = { current: { x: 0, y: 0 } };
const sharedVisibleRef = { current: true };
const sharedAccentColorRef = { current: "#5FB8A5" };
const sharedCountRef = { current: 40 };
const sharedOpacityRef = { current: 0.15 };
const sharedWarmRatioRef = { current: 0.3 };
const sharedReduceMotionRef = { current: false as boolean };
let instanceCount = 0;

function startSharedLoop() {
  if (sharedAnimationId !== null) return;

  const canvas = sharedCanvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  sharedCtxRef.current = ctx;

  let lastTime = performance.now();

  const animate = (time: number) => {
    if (sharedReduceMotionRef.current || !sharedVisibleRef.current) {
      sharedAnimationId = requestAnimationFrame(animate);
      return;
    }

    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const { width, height } = sharedDimensionsRef.current;
    if (!width || !height) {
      sharedAnimationId = requestAnimationFrame(animate);
      return;
    }

    const accentColor = sharedAccentColorRef.current;

    ctx.clearRect(0, 0, width, height);

    for (const mote of sharedMotesRef.current) {
      mote.y -= mote.speed * dt * 60 * (height / 1000);
      mote.x += Math.sin(mote.phase + time * 0.0005) * 0.15 * dt * 60;
      mote.phase += dt * 0.5;

      if (mote.y < -10) {
        mote.y = height + 10;
        mote.x = Math.random() * width;
      }
      if (mote.x < -10) mote.x = width + 10;
      if (mote.x > width + 10) mote.x = -10;

      const dpr = window.devicePixelRatio || 1;
      const dx = mote.x - sharedPointerRef.current.x * dpr;
      const dy = mote.y - sharedPointerRef.current.y * dpr;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / 150);
      const pushX = dx * influence * 0.02;
      const pushY = dy * influence * 0.02;
      mote.x += pushX;
      mote.y += pushY;

      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size * dpr, 0, Math.PI * 2);
      const moteColor = mote.warm ? "var(--candle)" : accentColor;
      ctx.fillStyle = moteColor.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, "rgba($1, $2, $3, " + mote.opacity + ")")
        .replace(/#([0-9a-fA-F]{6})/, (_, hex) => {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${mote.opacity})`;
        });
      ctx.fill();
    }

    sharedAnimationId = requestAnimationFrame(animate);
  };

  sharedAnimationId = requestAnimationFrame(animate);
}

function stopSharedLoop() {
  if (sharedAnimationId !== null) {
    cancelAnimationFrame(sharedAnimationId);
    sharedAnimationId = null;
  }
}

function ensureMotes(count: number, opacity: number, width: number, height: number) {
  const moteCount = Math.min(count, Math.floor((width * height) / 50000));
  const warmRatio = sharedWarmRatioRef.current;
  if (sharedMotesRef.current.length !== moteCount) {
    sharedMotesRef.current = Array.from({ length: moteCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * opacity * 0.8 + opacity * 0.2,
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() < warmRatio,
    }));
  }
}

export function Dust({ count = 40, opacity = 0.15, contained = false, warmRatio = 0.3 }: DustProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(true);
  const [accentColor, setAccentColor] = useState("#5FB8A5");

  useEffect(() => {
    const handleVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      setDimensions({ width: canvas.width, height: canvas.height });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && document.documentElement) {
      const color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5FB8A5";
      setAccentColor(color);
    }
  }, []);

  // Sync shared state and manage shared loop lifecycle
  useEffect(() => {
    instanceCount++;
    sharedCanvasRef.current = canvasRef.current;
    sharedCountRef.current = count;
    sharedOpacityRef.current = opacity;
    sharedReduceMotionRef.current = reduceMotion ?? false;
    sharedVisibleRef.current = visible;

    if (canvasRef.current) {
      const { width, height } = dimensions;
      if (width && height) {
        sharedDimensionsRef.current = { width, height };
        ensureMotes(count, opacity, width, height);
      }
    }

    if (instanceCount === 1) {
      startSharedLoop();
    }

    return () => {
      instanceCount--;
      if (instanceCount === 0) {
        stopSharedLoop();
        sharedCanvasRef.current = null;
        sharedCtxRef.current = null;
        sharedMotesRef.current = [];
      }
    };
  }, []);

  // Keep shared state in sync
  useEffect(() => {
    sharedCountRef.current = count;
    sharedOpacityRef.current = opacity;
    sharedWarmRatioRef.current = warmRatio;
    sharedReduceMotionRef.current = reduceMotion ?? false;
    sharedVisibleRef.current = visible;

    const canvas = canvasRef.current;
    if (canvas) {
      const { width, height } = dimensions;
      if (width && height) {
        sharedDimensionsRef.current = { width, height };
        ensureMotes(count, opacity, width, height);
      }
    }
  }, [count, opacity, warmRatio, reduceMotion, visible, dimensions]);

  useEffect(() => {
    sharedAccentColorRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      sharedPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  if (reduceMotion || !visible) return null;

  const positionClass = contained ? "absolute inset-0" : "fixed inset-0";
  const zIndex = contained ? "-z-10" : "-z-40";

  return (
    <canvas
      ref={canvasRef}
      className={`${positionClass} ${zIndex} pointer-events-none`}
      aria-hidden="true"
      style={{ willChange: "contents" } as React.CSSProperties}
    />
  );
}