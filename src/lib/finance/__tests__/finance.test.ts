import { describe, expect, it } from "vitest";
import { amortizationSchedule, futureValue, irr, npv, pmt } from "../index";

describe("npv", () => {
  it("is the simple sum of cash flows at a zero rate", () => {
    expect(npv(0, [-1000, 1100])).toBe(100);
  });

  it("discounts future flows at a positive rate", () => {
    expect(npv(0.1, [-1000, 1100])).toBeCloseTo(0, 5);
  });

  it("handles negative cash flows", () => {
    expect(npv(0.1, [-1000, -1100])).toBeCloseTo(-2000, 5);
  });

  it("matches a hand-computed multi-period example", () => {
    // 1000 at t0 + 1000/(1.05) + 1000/(1.05)^2 + 1000/(1.05)^3
    expect(npv(0.05, [1000, 1000, 1000, 1000])).toBeCloseTo(3723.25, 2);
  });
});

describe("irr", () => {
  it("finds the rate that zeroes the NPV for a simple outlay", () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 3);
  });

  it("handles a standard 3-year project", () => {
    const rate = irr([-1000, 500, 500, 500]);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(0.2331, 2);
  });

  it("returns a negative rate for a loss-making cash flow series", () => {
    expect(irr([-100, 90])).toBeCloseTo(-0.1, 2);
  });

  it("returns null when all cash flows are negative", () => {
    expect(irr([-100, -200, -300])).toBeNull();
  });

  it("returns null when all cash flows are positive", () => {
    expect(irr([100, 200, 300])).toBeNull();
  });

  it("returns null for an empty cash flow series", () => {
    expect(irr([])).toBeNull();
  });

  it("still produces a valid root for multiple-sign-change series", () => {
    const rate = irr([-1000, 2300, -1320]);
    expect(rate).not.toBeNull();
    expect(npv(rate!, [-1000, 2300, -1320])).toBeCloseTo(0, 3);
  });
});

describe("pmt", () => {
  it("divides evenly at zero rate", () => {
    expect(pmt(0, 12, 1200)).toBe(-100);
  });

  it("matches a standard 30-year mortgage", () => {
    // $200,000 at 5% APR, monthly, 360 periods
    expect(pmt(0.05 / 12, 360, 200000)).toBeCloseTo(-1073.64, 2);
  });

  it("finds the payment required to reach a target future value", () => {
    expect(pmt(0.05, 10, 0, 5000)).toBeCloseTo(-397.53, 1);
  });

  it("returns zero for a zero-period loan", () => {
    expect(pmt(0.05, 0, 1000)).toBe(0);
  });
});

describe("amortizationSchedule", () => {
  it("splits principal evenly at zero rate", () => {
    const schedule = amortizationSchedule(1200, 0, 12);
    expect(schedule).toHaveLength(12);
    for (const row of schedule) {
      expect(row.payment).toBeCloseTo(100, 5);
      expect(row.interest).toBe(0);
      expect(row.principal).toBeCloseTo(100, 5);
    }
    expect(schedule[schedule.length - 1]!.balance).toBe(0);
  });

  it("amortizes a loan to a zero ending balance", () => {
    const schedule = amortizationSchedule(1000, 0.1, 12);
    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);
    const lastRow = schedule[schedule.length - 1]!;

    expect(schedule).toHaveLength(12);
    expect(lastRow.balance).toBe(0);
    expect(totalPrincipal).toBeCloseTo(1000, 5);
    expect(schedule[0]!.interest).toBeCloseTo(100, 3);
  });

  it("always reports positive payments that cover interest first", () => {
    const schedule = amortizationSchedule(250000, 0.06 / 12, 30 * 12);
    for (const row of schedule) {
      expect(row.payment).toBeGreaterThan(0);
      expect(row.interest).toBeGreaterThan(0);
    }
    expect(schedule[0]!.interest).toBeCloseTo(1250, 2);
  });
});

describe("futureValue", () => {
  it("grows a lump sum at a positive rate", () => {
    expect(futureValue(0.05 / 12, 60, 0, 10000)).toBeCloseTo(-12833.59, 1);
  });

  it("accumulates a series of deposits at a positive rate", () => {
    // ~1257.79 after 10 years of $100/yr minus deposits at 5%
    expect(futureValue(0.05, 10, -100, 0)).toBeCloseTo(1257.79, 1);
  });

  it("linearly accumulates at zero rate", () => {
    expect(futureValue(0, 12, -50, 1000)).toBe(-400);
  });

  it("handles a starting loan balance (borrowed pv)", () => {
    expect(futureValue(0.1, 5, -50, -200)).toBeCloseTo(627.36, 1);
  });
});