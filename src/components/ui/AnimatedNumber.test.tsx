import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedNumber } from "./AnimatedNumber";

vi.mock("framer-motion", () => ({
  useReducedMotion: () => false,
  useSpring: (_initial: number) => ({
    set: vi.fn(),
    on: vi.fn(() => vi.fn()),
  }),
}));

describe("AnimatedNumber", () => {
  it("formats currency with accounting sign for negatives", () => {
    render(<AnimatedNumber value={-1250} formatOptions={{ style: "currency", currency: "USD" }} />);
    const element = screen.getByLabelText(/\(\$1,250\.00\)/);
    expect(element).toBeTruthy();
  });

  it("formats percent values as fractions (0.1235 => 12.35%)", () => {
    render(<AnimatedNumber value={0.1235} formatOptions={{ style: "percent" }} />);
    const element = screen.getByLabelText(/12\.35%/);
    expect(element).toBeTruthy();
  });

  it("formats positive currency without parentheses", () => {
    render(<AnimatedNumber value={1250} formatOptions={{ style: "currency", currency: "USD" }} />);
    const element = screen.getByLabelText(/\$1,250\.00/);
    expect(element).toBeTruthy();
    const negativeElement = screen.queryByLabelText(/\(\$1,250\.00\)/);
    expect(negativeElement).toBeFalsy();
  });

  it("applies text-danger class for negative values", () => {
    const { container } = render(<AnimatedNumber value={-100} formatOptions={{ style: "currency", currency: "USD" }} />);
    expect((container.firstChild as HTMLElement)?.className).toContain("text-danger");
  });

  it("does not apply text-danger class for positive values", () => {
    const { container } = render(<AnimatedNumber value={100} formatOptions={{ style: "currency", currency: "USD" }} />);
    expect((container.firstChild as HTMLElement)?.className).not.toContain("text-danger");
  });

  it("renders exactly one currency symbol for currency format", () => {
    const { container } = render(<AnimatedNumber value={48250} formatOptions={{ style: "currency", currency: "USD" }} />);
    const currencySymbols = container.querySelectorAll('.currency-symbol');
    expect(currencySymbols).toHaveLength(1);
    // Also verify the coin-flip span doesn't duplicate it when not animating
    const allDollarSigns = container.textContent?.match(/\$/g) || [];
    expect(allDollarSigns).toHaveLength(1);
  });

  it("renders exactly one currency symbol for INR with lakh grouping", () => {
    const { container } = render(<AnimatedNumber value={1234567} formatOptions={{ style: "currency", currency: "INR" }} locale="en-IN" />);
    const currencySymbols = container.querySelectorAll('.currency-symbol');
    expect(currencySymbols).toHaveLength(1);
    const allCurrencySymbols = container.textContent?.match(/₹/g) || [];
    expect(allCurrencySymbols).toHaveLength(1);
  });
});