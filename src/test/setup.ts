import { vi, expect, beforeAll } from "vitest";
import { createElement, forwardRef, Fragment, type ReactNode } from "react";

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("@testing-library/jest-dom");
});

// Motion-only props must not leak onto plain DOM elements in tests.
const MOTION_PROPS = new Set([
  "whileTap",
  "whileHover",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "layout",
  "layoutId",
  "drag",
  "dragConstraints",
  "dragElastic",
  "viewport",
]);

function stripMotionProps(props: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_PROPS.has(key)) clean[key] = props[key];
  }
  return clean;
}

function passthrough(tag: string) {
  return forwardRef<unknown, { children?: ReactNode; [key: string]: unknown }>(
    function MotionPassthrough(props, ref) {
      const { children, ...rest } = props;
      return createElement(tag, { ...stripMotionProps(rest), ref }, children as ReactNode);
    },
  );
}

vi.mock("framer-motion", () => ({
  useReducedMotion: () => false,
  useSpring: (_initial: number) => ({
    set: vi.fn(),
    on: vi.fn(() => vi.fn()),
  }),
  // Render motion elements as plain DOM tags so component tests (which cover
  // Button/Card/Input/WaxSeal trees) don't need a real animation engine.
  motion: {
    div: passthrough("div"),
    span: passthrough("span"),
    button: passthrough("button"),
    label: passthrough("label"),
    tr: passthrough("tr"),
    td: passthrough("td"),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children),
}));

(globalThis as Record<string, unknown>).expect = expect;

// TEMP-DIAG (remove together with the Create Entry alert() trace): jsdom
// does not implement window.alert, so stub it to keep submit-click tests
// quiet instead of logging "not implemented" noise.
window.alert = vi.fn();