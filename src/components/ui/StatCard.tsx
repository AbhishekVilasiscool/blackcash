import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { Card } from "../ornament/Card";
import { Guilloche } from "../ornament/Guilloche";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toRomanNumeral } from "../ornament/RomanNumeral";

export type StatUnit = "currency" | "count" | "percent" | "ratio";

export interface StatCardProps {
  label: string;
  value: number;
  unit: StatUnit;
  formatOptions?: Intl.NumberFormatOptions;
  delta?: number;
  icon?: LucideIcon;
  className?: string;
  index?: number; // for roman numeral denomination
}

function resolveFormatOptions(unit: StatUnit, customOptions?: Intl.NumberFormatOptions): Intl.NumberFormatOptions {
  if (customOptions) return customOptions;

  switch (unit) {
    case "currency":
      return { style: "currency", currency: "USD", currencySign: "accounting", maximumFractionDigits: 0 };
    case "count":
      return { style: "decimal", maximumFractionDigits: 0, useGrouping: true };
    case "percent":
      return { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 };
    case "ratio":
      return { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 };
    default:
      return { style: "decimal", maximumFractionDigits: 0 };
  }
}

export function StatCard({
  label,
  value,
  unit,
  formatOptions,
  delta,
  icon: Icon,
  className = "",
  index = 1,
}: StatCardProps) {
  const hasDelta = delta !== undefined && delta !== 0;
  const deltaIsPositive = hasDelta && delta >= 0;
  const serialNum = Math.abs(Math.floor(value)).toString().padStart(8, "0");
  const serialSuffix = String.fromCharCode(65 + (index % 26)); // A, B, C...
  const resolvedFormatOptions = resolveFormatOptions(unit, formatOptions);

  return (
    <Card
      className={`relative flex flex-col overflow-hidden bg-[var(--bg-2)] border border-border ${className}`}
    >
      {/* Guilloche header strip */}
      <div className="absolute top-0 left-0 right-0 h-7 pointer-events-none overflow-hidden">
        <Guilloche size={28} density={8} color="var(--accent)" opacity={0.25} className="w-full h-full" />
      </div>

      {/* Roman numeral denomination top-right */}
      <div className="absolute top-2 right-2 z-10">
        <span className="text-accent font-display text-sm" aria-hidden="true">
          {toRomanNumeral(index)}.
        </span>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Label - Cinzel small caps */}
        <div className="flex items-center justify-between gap-2 pt-8 pb-2">
          <span className="font-caps text-[11px] tracking-[0.16em] text-muted uppercase">{label}</span>
          {Icon !== undefined && <Icon className="h-4 w-4 text-accent/50" aria-hidden="true" />}
        </div>

        {/* Figure on solid --bg-2 inset panel with hairline rules */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className="w-full text-center"
            style={{
              background: "var(--bg-2)",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              padding: "12px 0",
            } as React.CSSProperties}
          >
            <AnimatedNumber
              value={value}
              formatOptions={resolvedFormatOptions}
              className="text-[28px] font-mono tabular-nums text-text"
            />
          </div>
        </div>

        {/* Footer: serial + trend arrow */}
        {hasDelta && (
          <div className="flex items-center justify-between gap-2 pt-2 pb-4 border-t border-border/50">
            <span className="font-mono text-[9px] text-muted">
              No. {serialNum}-{serialSuffix}
            </span>
            <span
              className={`flex items-center gap-1 font-mono text-[10px] ${
                deltaIsPositive ? "text-muted" : "text-danger"
              }`}
              aria-label={deltaIsPositive ? `Up ${Math.abs(delta).toFixed(2)}%` : `Down ${Math.abs(delta).toFixed(2)}%`}
            >
              {deltaIsPositive ? (
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              )}
              <span className="num">{Math.abs(delta).toFixed(2)}%</span>
            </span>
          </div>
        )}
      </div>

      {/* Hover glow effect on corners */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-200"
        style={{
          background: `
            radial-gradient(circle at top-left, var(--oxblood) 0%, transparent 50%),
            radial-gradient(circle at top-right, var(--oxblood) 0%, transparent 50%),
            radial-gradient(circle at bottom-left, var(--oxblood) 0%, transparent 50%),
            radial-gradient(circle at bottom-right, var(--oxblood) 0%, transparent 50%)
          `,
        } as React.CSSProperties}
        aria-hidden="true"
      />
    </Card>
  );
}