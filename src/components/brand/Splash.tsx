import { useEffect, useState } from "react";
import { Laurel } from "../../components/ornament/Laurel";
import { WaxSeal } from "../../components/ornament/WaxSeal";
import { useMode } from "../../app/modes/ModeProvider";

interface SplashProps {
  onComplete?: () => void;
}

export function Splash({ onComplete }: SplashProps) {
  const { mode } = useMode();
  const [phase, setPhase] = useState<"laurel" | "seal" | "wordmark" | "done">("laurel");

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Laurel draws (pathLength animation ~1.2s)
    timers.push(setTimeout(() => setPhase("seal"), 1200));
    // Seal stamps down with rotation settle (~0.8s)
    timers.push(setTimeout(() => setPhase("wordmark"), 2000));
    // Wordmark fades in
    timers.push(setTimeout(() => setPhase("done"), 2600));
    timers.push(setTimeout(() => onComplete?.(), 2600));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative" style={{ width: 120, height: 120 }}>
        {/* Laurel draws itself */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 120, height: 120 } as React.CSSProperties}
        >
          <Laurel
            r={27}
            count={9}
            className={phase === "laurel" ? "animate-laurel-draw" : "laurel-drawn"}
          />
        </svg>

        {/* Seal stamps down with rotation settle */}
        {(phase === "seal" || phase === "wordmark" || phase === "done") && (
          <WaxSeal
            size={56}
            accent={mode.accent}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-seal-in"
            aria-hidden="true"
          />
        )}

        {(phase === "wordmark" || phase === "done") && (
          <WaxSeal
            size={56}
            accent={mode.accent}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        )}
      </div>

      {(phase === "wordmark" || phase === "done") && (
        <h1
          className="text-3xl font-caps font-semibold tracking-widest animate-wordmark-in"
          style={{ letterSpacing: phase === "wordmark" ? "0.12em" : "0.22em" } as React.CSSProperties}
        >
          BLACKCASH
        </h1>
      )}
    </div>
  );
}

export default Splash;