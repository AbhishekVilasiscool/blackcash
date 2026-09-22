import { vi, expect, beforeAll } from "vitest";

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("@testing-library/jest-dom");
});

vi.mock("framer-motion", () => ({
  useReducedMotion: () => false,
  useSpring: (_initial: number) => ({
    set: vi.fn(),
    on: vi.fn(() => vi.fn()),
  }),
}));

(globalThis as Record<string, unknown>).expect = expect;