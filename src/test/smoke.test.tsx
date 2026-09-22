import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";

describe("AnimatedNumber - currency symbol (smoke)", () => {
  it("outputs exactly one currency symbol for USD", () => {
    render(<AnimatedNumber value={48250} formatOptions={{ style: "currency", currency: "USD" }} />);
    const text = screen.getByLabelText(/\$48,250\.00/).textContent || "";
    const dollarCount = (text.match(/\$/g) || []).length;
    expect(dollarCount).toBe(1);
  });

  it("outputs exactly one currency symbol for INR (lakh grouping)", () => {
    render(<AnimatedNumber value={1234567} formatOptions={{ style: "currency", currency: "INR" }} locale="en-IN" />);
    const text = screen.getByLabelText(/₹1,234,567\.00/).textContent || "";
    const rupeeCount = (text.match(/₹/g) || []).length;
    expect(rupeeCount).toBe(1);
  });
});