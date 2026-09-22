/**
 * Periodic payment for a loan or annuity (Excel `PMT` convention).
 *
 * Positive `pv` means money received today (the loan amount); the returned
 * payment is negative, representing the outflow. When `rate` is zero the
 * payment is simply `-(pv + fv) / nper`.
 */
export function pmt(rate: number, nper: number, pv: number, fv: number = 0): number {
  if (nper === 0) {
    return 0;
  }
  if (rate === 0) {
    return -(pv + fv) / nper;
  }
  const factor = Math.pow(1 + rate, nper);
  return -(rate * pv + (rate * fv) / factor) / (1 - 1 / factor);
}

export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

/**
 * Full amortization schedule for a loan of `principal` at a fixed per-period
 * `rate` over `nper` periods.
 *
 * Payments are reported as positive amounts (money paid out), the balance
 * decreases towards zero, and the final payment is adjusted so the balance
 * settles exactly to zero. A zero `rate` yields equal principal splits.
 */
export function amortizationSchedule(
  principal: number,
  rate: number,
  nper: number,
): AmortizationRow[] {
  const payment = Math.abs(pmt(rate, nper, principal));
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let period = 1; period <= nper; period++) {
    const isFinalPeriod = period === nper;
    const interest = balance * rate;
    const principalPaid = isFinalPeriod ? balance : payment - interest;
    const finalPayment = interest + principalPaid;

    balance = isFinalPeriod ? 0 : balance - principalPaid;

    rows.push({
      period,
      payment: finalPayment,
      interest,
      principal: principalPaid,
      balance: Math.abs(balance) < 1e-9 ? 0 : balance,
    });
  }

  return rows;
}