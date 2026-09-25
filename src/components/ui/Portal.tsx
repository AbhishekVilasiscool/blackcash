import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * Body-level portal for fixed overlays (drawers, sheets, modals).
 *
 * Root cause guard: the route content in app/layout.tsx renders inside a
 * framer-motion wrapper with a permanent perspective transform
 * (transformPerspective: 1000). Per CSS, any non-none transform on an
 * ancestor hijacks the containing block for ALL position:fixed
 * descendants — a drawer rendered inline sizes and positions itself against
 * the page-content box instead of the viewport, so most of the panel ends
 * up clipped off-screen. Portaling to document.body keeps fixed overlays
 * in the viewport no matter what transforms wrap the page.
 */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
