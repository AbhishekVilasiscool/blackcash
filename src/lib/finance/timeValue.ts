/**
 * Future value of an investment or annuity (Excel `FV` convention).
 *
 * `pv` is money today and `pmt` a recurring payment. With the Excel sign
 * convention, deposits (negative `pmt`) grow into a positive future value,
 * and a positive `pv` (borrowed) compounds into a negative future value.
 */
export function futureValue(
  rate: number,
  nper: number,
  pmtAmount: number = 0,
  pv: number = 0,
): number {
  if (rate === 0) {
    return -(pv + pmtAmount * nper);
  }
  const factor = Math.pow(1 + rate, nper);
  return -(pv * factor + (pmtAmount * (factor - 1)) / rate);
}