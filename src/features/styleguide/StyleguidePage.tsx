import { useEffect, useState } from "react";
import { Card } from "../../components/ornament/Card";
import { Frame } from "../../components/ornament/Frame";
import { Divider } from "../../components/ornament/Divider";
import { WaxSeal } from "../../components/ornament/WaxSeal";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { Fog } from "../../components/atmosphere/Fog";
import { Dust } from "../../components/atmosphere/Dust";
import { Grain } from "../../components/atmosphere/Grain";
import { Vignette } from "../../components/atmosphere/Vignette";
import { Lantern } from "../../components/atmosphere/Lantern";
import { Guilloche } from "../../components/ornament/Guilloche";
import { Section } from "../../components/ornament/Section";
import { useMode } from "../../app/modes/ModeProvider";
import { useAtmosphereSetting } from "../../hooks/useAtmosphereSetting";
import { Splash } from "../../components/brand/Splash";
import { CandleEmpty } from "../../components/brand/CandleEmpty";
import { Corner } from "../../components/ornament/Corner";
import { AccountantIllustration } from "../../components/illustrations/AccountantIllustration";
import { CpaIllustration } from "../../components/illustrations/CpaIllustration";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { BankerIllustration } from "../../components/illustrations/BankerIllustration";
import { InvestorIllustration } from "../../components/illustrations/InvestorIllustration";
import { StatCard } from "../../components/ui/StatCard";

const PALETTE = [
  { name: "--bg", label: "Background", value: "var(--bg)" },
  { name: "--bg-2", label: "Background 2", value: "var(--bg-2)" },
  { name: "--surface", label: "Surface", value: "var(--surface)" },
  { name: "--border", label: "Border", value: "var(--border)" },
  { name: "--border-strong", label: "Border Strong", value: "var(--border-strong)" },
  { name: "--text", label: "Text", value: "var(--text)" },
  { name: "--muted", label: "Muted", value: "var(--muted)" },
  { name: "--danger", label: "Danger", value: "var(--danger)" },
  { name: "--gold", label: "Gold", value: "var(--gold)" },
  { name: "--accent", label: "Accent (Current Mode)", value: "var(--accent)" },
  { name: "--accent-2", label: "Accent 2 (Current Mode)", value: "var(--accent-2)" },
];

const FONTS = [
  { name: "Display", value: "var(--font-display)", sample: "Cormorant Garamond" },
  { name: "Body", value: "var(--font-body)", sample: "EB Garamond / JetBrains Mono" },
  { name: "Mono", value: "var(--font-mono)", sample: "JetBrains Mono" },
];

export function StyleguidePage() {
  const { mode } = useMode();
  const { level, setLevel } = useAtmosphereSetting();
  const [animatedValue, setAnimatedValue] = useState(1234567.89);
  const [splashKey, setSplashKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedValue((prev) => prev + Math.random() * 10000 - 5000);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleReplaySplash = () => {
    setSplashKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-8">
      <Section n={1} title="Palette">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PALETTE.map((color) => (
            <div key={color.name} className="flex flex-col gap-2 p-3 rounded-lg bg-white/5">
              <div
                className="h-16 rounded border border-border"
                style={{ backgroundColor: color.value } as React.CSSProperties}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted">{color.label}</span>
                <code className="text-xs font-mono text-text/80">{color.name}</code>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section n={2} title="Typography">
        <div className="grid gap-4 sm:grid-cols-3">
          {FONTS.map((font) => (
            <div key={font.name} className="p-3 rounded-lg bg-white/5">
              <span className="text-xs font-medium text-muted">{font.name}</span>
              <code className="text-xs font-mono text-text/80 block mb-2">{font.value}</code>
              <p style={{ fontFamily: font.value, fontSize: "14px", lineHeight: 1.6 } as React.CSSProperties}>
                {font.sample} — The quick brown fox jumps over the lazy dog. 123,456.78
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section n={3} title="Components">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <h3 className="text-sm font-medium mb-3">Card (ornament)</h3>
            <Card interactive accent={mode.accent} className="p-5">
              <p className="text-sm text-muted">Interactive card with guilloche watermark</p>
              <AnimatedNumber value={animatedValue} formatOptions={{ style: "currency", currency: "USD" }} className="mt-2 text-xl font-display font-semibold" />
            </Card>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Frame</h3>
            <Frame variant="card" accent={mode.accent} className="p-4 min-h-[120px]">
              <p className="text-sm text-muted">Frame variant: card</p>
            </Frame>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Frame (panel)</h3>
            <Frame variant="panel" accent={mode.accent} className="p-4 min-h-[120px]">
              <p className="text-sm text-muted">Frame variant: panel</p>
            </Frame>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Frame (hero)</h3>
            <Frame variant="hero" accent={mode.accent} className="p-6 min-h-[140px]">
              <p className="text-sm text-muted">Frame variant: hero</p>
            </Frame>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Divider</h3>
            <div className="space-y-4">
              <Divider accent={mode.accent} />
              <Divider accent={mode.accent} ornament={
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
                </svg>
              } />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">WaxSeal</h3>
            <div className="flex flex-wrap items-center gap-4">
              <WaxSeal size={56} accent={mode.accent} aria-label="Primary action" />
              <WaxSeal size={40} accent={mode.accent} aria-label="Secondary action" />
              <WaxSeal size={28} accent={mode.accent} aria-label="Tertiary action" />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">AnimatedNumber</h3>
            <div className="flex flex-col gap-2">
              <AnimatedNumber value={animatedValue} formatOptions={{ style: "currency", currency: "USD" }} className="text-2xl font-display font-semibold" />
              <AnimatedNumber value={0.1234567} formatOptions={{ style: "percent", minimumFractionDigits: 2 }} className="text-lg" />
              <AnimatedNumber value={-987654.32} formatOptions={{ style: "currency", currency: "USD" }} className="text-lg text-danger" />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Guilloche</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Guilloche size={120} density={6} color={mode.accent} opacity={0.4} />
              <Guilloche size={120} density={8} color={mode.accent} opacity={0.3} />
              <Guilloche size={120} density={10} color={mode.accent} opacity={0.2} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Roman Numerals</h3>
            <div className="flex flex-wrap items-center gap-4 text-lg font-display">
              {[1, 2, 3, 4, 5, 10, 50, 100, 500, 1000].map((n) => (
                <span key={n} className="text-accent">{n}.</span>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section n={4} title="Atmosphere Layers">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {(["full", "lite", "off"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${level === l ? "bg-accent/20 text-accent" : "text-muted hover:text-text"}`}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">Current: {level}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 min-h-[150px] relative overflow-hidden rounded border border-border">
            <h4 className="text-sm font-medium mb-2">Fog</h4>
            <p className="text-xs text-muted mb-3">3 layered radial gradients, CSS GPU animation</p>
            <div className="relative h-32 rounded border border-border overflow-hidden">
              <Fog accent={mode.accent} opacity={0.05} contained />
            </div>
          </div>
          <div className="p-4 min-h-[150px] relative overflow-hidden rounded border border-border">
            <h4 className="text-sm font-medium mb-2">Dust</h4>
            <p className="text-xs text-muted mb-3">~40 canvas motes, pointer parallax</p>
            <div className="relative h-32 rounded border border-border overflow-hidden">
              <Dust count={20} opacity={0.3} contained />
            </div>
          </div>
          <div className="p-4 min-h-[150px] relative overflow-hidden rounded border border-border">
            <h4 className="text-sm font-medium mb-2">Grain</h4>
            <p className="text-xs text-muted mb-3">SVG feTurbulence, 4% opacity</p>
            <div className="relative h-32 rounded border border-border overflow-hidden">
              <Grain opacity={0.1} contained />
            </div>
          </div>
          <div className="p-4 min-h-[150px] relative overflow-hidden rounded border border-border">
            <h4 className="text-sm font-medium mb-2">Vignette</h4>
            <p className="text-xs text-muted mb-3">Radial gradient darkening edges</p>
            <div className="relative h-32 rounded border border-border overflow-hidden">
              <Vignette strength={0.8} contained />
            </div>
          </div>
          <div className="p-4 min-h-[150px] relative overflow-hidden rounded border border-border">
            <h4 className="text-sm font-medium mb-2">Lantern (desktop)</h4>
            <p className="text-xs text-muted mb-3">Pointer-following radial light, soft-light blend</p>
            <div className="relative h-32 rounded border border-border overflow-hidden">
              <Lantern accent={mode.accent} radius={200} opacity={0.15} contained />
            </div>
          </div>
          <div className="p-4 min-h-[150px] relative overflow-hidden rounded border border-border">
            <h4 className="text-sm font-medium mb-2">Candle Flicker</h4>
            <p className="text-xs text-muted mb-3">.flicker utility class for accent elements</p>
            <div className="flex items-center gap-3">
              <span className="flicker px-4 py-2 rounded border border-accent/40 text-accent text-sm">
                Flickering accent text
              </span>
              <WaxSeal size={32} accent={mode.accent} className="flicker" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Section>

      <Section n={5} title="Empty State Illustration">
        <div className="p-8 text-center">
          <CandleEmpty />
          <h3 className="text-lg font-display font-semibold mb-2">Your books. Your deals. Your device.</h3>
          <p className="text-sm text-muted max-w-xs mx-auto">No cloud. No account. Your ledger never leaves this device.</p>
        </div>
      </Section>

      <Section n={6} title="Splash Animation Preview">
        <div className="p-8 text-center">
          <div className="mx-auto mb-4">
            <ErrorBoundary label="splash" compact>
              <Splash key={splashKey} />
            </ErrorBoundary>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleReplaySplash}
              className="px-4 py-2 rounded border border-accent/40 text-accent text-sm hover:bg-accent/10 transition-colors"
            >
              Replay
            </button>
            <p className="text-sm text-muted">Guilloche draws line by line → Seal stamps in → Wordmark fades with tightening letter-spacing</p>
          </div>
        </div>
      </Section>

      <Section n={7} title="Counting House">
        <div className="space-y-8">
          {/* Wax Seals - all 4 tones */}
          <div>
            <h3 className="text-sm font-medium mb-4">Wax Seals — Four Tones</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <WaxSeal size={48} accent="var(--oxblood)" tone="oxblood" aria-label="Oxblood seal" />
                <span className="font-caps text-[10px] text-muted">Oxblood</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <WaxSeal size={48} accent="#5FB8A5" tone="accent" aria-label="Accountant seal" />
                <span className="font-caps text-[10px] text-muted">Accountant</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <WaxSeal size={48} accent="#9B87C9" tone="accent" aria-label="CPA seal" />
                <span className="font-caps text-[10px] text-muted">CPA</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <WaxSeal size={48} accent="#8FC1E3" tone="accent" aria-label="Banker seal" />
                <span className="font-caps text-[10px] text-muted">Banker</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <WaxSeal size={48} accent="#C9A45C" tone="accent" aria-label="Investor seal" />
                <span className="font-caps text-[10px] text-muted">Investor</span>
              </div>
            </div>
          </div>

          {/* Corners */}
          <div>
            <h3 className="text-sm font-medium mb-4">Corners — Fixed 28px</h3>
            <div className="relative w-48 h-48 border border-border rounded-[var(--radius)] bg-[var(--bg-2)] p-4">
              <Corner position="top-left" accent="var(--accent)" />
              <Corner position="top-right" accent="var(--accent)" />
              <Corner position="bottom-left" accent="var(--accent)" />
              <Corner position="bottom-right" accent="var(--accent)" />
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
                28px fixed corners
              </div>
            </div>
          </div>

          {/* Cursors with live hover zone */}
          <div>
            <h3 className="text-sm font-medium mb-4">Custom Cursors</h3>
            <div className="relative w-full max-w-md h-48 border border-border rounded-[var(--radius)] bg-[var(--bg-2)] p-4 flex items-center justify-center">
              <div className="text-center">
                <p className="font-caps text-[10px] text-muted mb-2">Hover this zone</p>
                <div
                  className="inline-block w-32 h-32 rounded-xl border-2 border-dashed border-accent/30 bg-white/5 flex items-center justify-center cursor-pointer"
                  data-interactive
                  style={{ cursor: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2 C15 7 19 10 19 15 A7 7 0 0 1 5 15 C5 11 9 9 12 2Z' fill='%23E9B872' stroke='%23120A05' stroke-width='1.2'/></svg>\") 12 3, pointer" } as React.CSSProperties}
                >
                  <span className="font-caps text-[10px] text-accent">Candle</span>
                </div>
                <p className="mt-2 text-xs text-muted">Default: four-point star (frost)<br/>Interactive: candle flame</p>
              </div>
            </div>
          </div>

          {/* Banknote stat plate */}
          <div>
            <h3 className="text-sm font-medium mb-4">Banknote Stat Plate</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Monthly Revenue"
                value={48250}
                formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
                delta={3.2}
                index={1}
              />
              <StatCard
                label="Portfolio IRR"
                value={0.124}
                formatOptions={{ style: "percent", maximumFractionDigits: 1 }}
                delta={0.8}
                index={2}
              />
            </div>
          </div>

          {/* Mode Illustrations */}
          <div>
            <h3 className="text-sm font-medium mb-4">Mode Room Illustrations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative aspect-square border border-border rounded-[var(--radius)] bg-[var(--bg-2)] overflow-hidden">
                <AccountantIllustration accent="var(--accent)" />
              </div>
              <div className="relative aspect-square border border-border rounded-[var(--radius)] bg-[var(--bg-2)] overflow-hidden">
                <CpaIllustration accent="var(--accent)" />
              </div>
              <div className="relative aspect-square border border-border rounded-[var(--radius)] bg-[var(--bg-2)] overflow-hidden">
                <BankerIllustration accent="var(--accent)" />
              </div>
              <div className="relative aspect-square border border-border rounded-[var(--radius)] bg-[var(--bg-2)] overflow-hidden">
                <InvestorIllustration accent="var(--accent)" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">Hidden under 640px and reduced motion</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default StyleguidePage;