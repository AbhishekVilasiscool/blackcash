import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ModeSwitcher } from "../app/modes/ModeSwitcher";
import { ModeProvider } from "../app/modes/ModeProvider";

vi.mock("framer-motion", () => ({
  useReducedMotion: () => false,
  useSpring: (_initial: number) => ({
    set: vi.fn(),
    on: vi.fn(() => vi.fn()),
  }),
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../lib/db", () => ({
  db: {
    settings: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

function renderModeSwitcher() {
  return render(
    <ModeProvider>
      <div style={{ width: "272px" }}>
        <ModeSwitcher />
      </div>
    </ModeProvider>
  );
}

describe("ModeSwitcher - no overflow regression", () => {
  it("fits all 4 seals + labels in sidebar when accountant is active (default)", () => {
    const { container } = renderModeSwitcher();
    const switcherContainer = container.querySelector('[role="tablist"]') as HTMLElement;

    expect(switcherContainer).toBeInTheDocument();

    const containerWidth = switcherContainer.clientWidth;
    const scrollWidth = switcherContainer.scrollWidth;

    expect(scrollWidth).toBeLessThanOrEqual(containerWidth + 1);
  });

  it("active mode name and tagline render below seals without overflow", () => {
    const { container } = renderModeSwitcher();
    const switcherContainer = container.querySelector('[role="tablist"]') as HTMLElement;
    const infoContainer = switcherContainer.parentElement?.querySelector(".px-2") as HTMLElement;

    expect(infoContainer).toBeInTheDocument();

    const containerWidth = infoContainer.clientWidth;
    const scrollWidth = infoContainer.scrollWidth;

    expect(scrollWidth).toBeLessThanOrEqual(containerWidth + 1);
  });
});