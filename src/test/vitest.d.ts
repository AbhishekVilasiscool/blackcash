import "@testing-library/jest-dom";
import { expect } from "vitest";

declare module "vitest" {
  interface Assertion<T> {
    toBeInTheDocument(): T;
    toBeVisible(): T;
    toHaveClass(className: string): T;
    toHaveTextContent(text: string | RegExp): T;
  }
}