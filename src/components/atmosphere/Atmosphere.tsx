import { useEffect, useRef } from "react";
import { Fog } from "./Fog";
import { Dust } from "./Dust";
import { Grain } from "./Grain";
import { Vignette } from "./Vignette";
import { Lantern } from "./Lantern";
import { useAtmosphereSetting } from "../../hooks/useAtmosphereSetting";
import { ErrorBoundary } from "../ErrorBoundary";

function WrapVignette() { return <ErrorBoundary label="vignette" compact><Vignette strength={0.65} /></ErrorBoundary>; }
function WrapGrain() { return <ErrorBoundary label="grain" compact><Grain opacity={0.04} /></ErrorBoundary>; }
function WrapFog({ accent, contained }: { accent?: string; contained?: boolean }) { return <ErrorBoundary label="fog" compact><Fog accent={accent} opacity={0.12} contained={contained} /></ErrorBoundary>; }
function WrapGrainLite() { return <ErrorBoundary label="grain" compact><Grain opacity={0.03} contained /></ErrorBoundary>; }
function WrapVignetteLite() { return <ErrorBoundary label="vignette" compact><Vignette strength={0.65} contained /></ErrorBoundary>; }
function WrapWarmCornerLight() { return <ErrorBoundary label="warm-corner-light" compact><div className="fixed top-[6%] left-[12%] w-[300px] h-[300px] pointer-events-none -z-20" aria-hidden="true"><div className="absolute inset-0 rounded-full flicker" style={{ background: "radial-gradient(circle at center, var(--candle) 0%, transparent 70%)", opacity: 0.07, mixBlendMode: "screen" } as React.CSSProperties} /></div></ErrorBoundary>; }
function WrapFogFull({ accent }: { accent?: string }) { return <ErrorBoundary label="fog" compact><Fog accent={accent} opacity={0.14} contained /></ErrorBoundary>; }
function WrapDust() { return <ErrorBoundary label="dust" compact><Dust count={40} opacity={0.15} contained warmRatio={0.3} /></ErrorBoundary>; }
function WrapGrainFull() { return <ErrorBoundary label="grain" compact><Grain opacity={0.04} contained /></ErrorBoundary>; }
function WrapVignetteFull() { return <ErrorBoundary label="vignette" compact><Vignette strength={0.65} contained /></ErrorBoundary>; }
function WrapLantern({ accent }: { accent?: string }) { return <ErrorBoundary label="lantern" compact><Lantern accent={accent} radius={220} opacity={0.1} contained /></ErrorBoundary>; }

export function Atmosphere() {
  const { level, setLevel } = useAtmosphereSetting();
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (level === "off") return;

    let animationId: number;
    const measureFps = (now: number) => {
      frameCountRef.current++;
      if (now - lastTimeRef.current >= 3000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        if (currentFps < 40 && level === "full") {
          setLevel("lite");
        }
      }
      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationId);
  }, [level, setLevel]);

  useEffect(() => {
    if (level !== "off") return;
    const root = document.documentElement;
    root.style.setProperty("--fog-opacity", "0");
    root.style.setProperty("--dust-opacity", "0");
  }, [level]);

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5FB8A5";

  if (level === "off") {
    return (
      <>
        <WrapVignette />
        <WrapGrain />
      </>
    );
  }

  if (level === "lite") {
    return (
      <>
        <WrapFog accent={accent} contained />
        <WrapGrainLite />
        <WrapVignetteLite />
        <WrapWarmCornerLight />
      </>
    );
  }

  return (
    <>
      <WrapFogFull accent={accent} />
      <WrapDust />
      <WrapGrainFull />
      <WrapVignetteFull />
      <WrapLantern accent={accent} />
      <WrapWarmCornerLight />
    </>
  );
}