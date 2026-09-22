import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../components/ui/StatCard";

vi.mock("framer-motion", () => {
  const springMock = {
    set: vi.fn(),
    on: vi.fn((cb: (v: number) => void) => { if (typeof cb === 'function') cb(0); return () => {}; })
  };
  return {
    useReducedMotion: () => false,
    useSpring: () => springMock,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
    useTransform: (val: any, fn: any) => fn(val),
  };
});

describe("StatCard unit prop", () => {
  it("accepts currency unit and renders without error", () => {
    render(<StatCard label="Revenue" value={48250} unit="currency" index={1} />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
  });

  it("accepts count unit and renders without error", () => {
    render(<StatCard label="Clients" value={142} unit="count" index={1} />);
    expect(screen.getByText("Clients")).toBeInTheDocument();
  });

  it("accepts percent unit and renders without error", () => {
    render(<StatCard label="IRR" value={0.124} unit="percent" index={1} />);
    expect(screen.getByText("IRR")).toBeInTheDocument();
  });

  it("accepts ratio unit and renders without error", () => {
    render(<StatCard label="Ratio" value={8.5} unit="ratio" index={1} />);
    expect(screen.getByText("Ratio")).toBeInTheDocument();
  });

  it("renders delta indicator when provided", () => {
    render(<StatCard label="Revenue" value={48250} unit="currency" delta={3.2} index={1} />);
    expect(screen.getByText("3.20%")).toBeInTheDocument();
  });

  it("renders roman numeral index", () => {
    render(<StatCard label="Test" value={100} unit="currency" index={3} />);
    expect(screen.getByText("III.")).toBeInTheDocument();
  });
});