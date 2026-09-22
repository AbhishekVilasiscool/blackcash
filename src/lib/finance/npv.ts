/**
 * Net present value of a series of cash flows discounted at `rate` per period.
 *
 * Convention: positive cash flows are inflows, negative are outflows.
 * `cashFlows[0]` occurs today (period 0) and is not discounted.
 */
export function npv(rate: number, cashFlows: readonly number[]): number {
  let result = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    result += cashFlows[i]! / Math.pow(1 + rate, i);
  }
  return result;
}