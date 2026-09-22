import { npv } from "./npv";

/**
 * Internal rate of return of a series of cash flows.
 *
 * Uses Newton-Raphson iteration seeded at `guess`, falling back to
 * bisection over an expanding bracket when Newton diverges or stalls.
 *
 * Returns `null` when no real root exists (e.g. all cash flows share a
 * sign, so the NPV curve never crosses zero).
 */
export interface IrrOptions {
  guess?: number;
  maxIterations?: number;
  tolerance?: number;
}

export function irr(cashFlows: readonly number[], options: IrrOptions = {}): number | null {
  const { guess = 0.1, maxIterations = 100, tolerance = 1e-7 } = options;

  if (cashFlows.length === 0) {
    return null;
  }

  const hasNegative = cashFlows.some((cashFlow) => cashFlow < 0);
  const hasPositive = cashFlows.some((cashFlow) => cashFlow > 0);
  if (!hasNegative || !hasPositive) {
    return null;
  }

  /**
   * Derivative of NPV w.r.t. rate:
   * d/dr sum(c_i / (1+r)^i) = -sum(i * c_i / (1+r)^(i+1))
   */
  const derivative = (rate: number): number => {
    let slope = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      slope += (-i * cashFlows[i]!) / Math.pow(1 + rate, i + 1);
    }
    return slope;
  };

  let rate = guess;
  let converged = false;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const value = npv(rate, cashFlows);
    if (Math.abs(value) < tolerance) {
      converged = true;
      break;
    }

    const slope = derivative(rate);
    if (Math.abs(slope) < Number.EPSILON) {
      break;
    }

    const next = rate - value / slope;
    rate = next <= -1 ? (rate - 1) / 2 : next;
  }

  if (!converged) {
    // Fallback: bisection over an expanding bracket.
    let low = -0.9999;
    let high = Math.max(1, Math.abs(guess));
    let lowValue = npv(low, cashFlows);
    let highValue = npv(high, cashFlows);

    for (let i = 0; i < 14 && lowValue * highValue > 0; i++) {
      high *= 10;
      highValue = npv(high, cashFlows);
    }

    if (lowValue * highValue > 0) {
      return null;
    }

    for (let i = 0; i < 200; i++) {
      const midpoint = (low + high) / 2;
      const midpointValue = npv(midpoint, cashFlows);
      if (Math.abs(midpointValue) < tolerance) {
        return midpoint;
      }
      if (lowValue * midpointValue <= 0) {
        high = midpoint;
        highValue = midpointValue;
      } else {
        low = midpoint;
        lowValue = midpointValue;
      }
    }

    return (low + high) / 2;
  }

  return rate;
}