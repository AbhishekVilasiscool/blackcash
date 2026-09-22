import { useEffect, useRef, useState } from "react";
import { useReducedMotion, useSpring } from "framer-motion";

export interface AnimatedNumberProps {
  value: number;
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  className?: string;
}

const defaultFormatOptions: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "USD",
  currencySign: "accounting",
};

function resolveFormatOptions(formatOptions?: Intl.NumberFormatOptions): Intl.NumberFormatOptions {
  if (!formatOptions) return defaultFormatOptions;

  if (formatOptions.style === "percent") {
    const minFd = Math.min(Math.max(formatOptions.minimumFractionDigits ?? 2, 0), 20);
    const maxFd = Math.min(Math.max(formatOptions.maximumFractionDigits ?? 2, minFd), 20);
    return {
      ...formatOptions,
      style: "percent",
      minimumFractionDigits: minFd,
      maximumFractionDigits: maxFd,
    };
  }

  if (formatOptions.style === "currency") {
    return {
      ...defaultFormatOptions,
      ...formatOptions,
      currencySign: "accounting",
    };
  }

  return formatOptions;
}

function getNumberParts(formatter: Intl.NumberFormat, value: number) {
  const parts = formatter.formatToParts(value);
  const currencySymbol = parts.find((p) => p.type === "currency")?.value ?? "";
  const numberParts = parts.filter((p) => 
    p.type === "integer" || p.type === "group" || p.type === "decimal" || p.type === "fraction"
  );
  const numberString = numberParts.map((p) => p.value).join("");
  return { currencySymbol, numberString };
}

/**
 * Counts smoothly towards `value` whenever it changes, using a spring
 * animation. The displayed number is formatted with `Intl.NumberFormat`.
 * When `prefers-reduced-motion` is set the value is rendered immediately
 * without animation.
 *
 * Default formatOptions for currency include currencySign: "accounting"
 * so negatives render as ($1,250.00) in --danger.
 * Percent values are fractions (0.1235 => 12.35%).
 * Locale and currency are workspace settings (default en-US/USD; support en-IN/INR lakh grouping).
 */
export function AnimatedNumber({
  value,
  locale = "en-US",
  formatOptions,
  className = "",
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const spring = useSpring(0, { stiffness: 80, damping: 22, mass: 1 });
  const prevValueRef = useRef(value);
  const resolvedOptions = resolveFormatOptions(formatOptions);
  const formatterRef = useRef(new Intl.NumberFormat(locale, resolvedOptions));

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    if (value !== prevValueRef.current) {
      setShowCoinFlip(true);
      setTimeout(() => setShowCoinFlip(false), 400);
      prevValueRef.current = value;
    }

    spring.set(value);
    const unsubscribe = spring.on("change", (latest) => setDisplay(latest));
    return unsubscribe;
  }, [value, reduceMotion, spring]);

  const formatter = formatterRef.current;
  const { currencySymbol, numberString } = getNumberParts(formatter, display);

  const isNegative = value < 0;
  const negativeClass = isNegative ? "text-danger" : "";

  return (
    <span className={`num ${className} ${negativeClass}`} aria-label={formatter.format(value)}>
      {showCoinFlip && (
        <span
          className="inline-block"
          style={{
            animation: "coin-flip 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            display: "inline-block",
            transformOrigin: "center bottom",
          } as React.CSSProperties}
        >
          {currencySymbol}
        </span>
      )}
      {!showCoinFlip && <span className="currency-symbol" aria-hidden="true">{currencySymbol}</span>}
      <span style={{ fontFamily: "var(--font-mono)" } as React.CSSProperties}>
        {numberString}
      </span>
    </span>
  );
}