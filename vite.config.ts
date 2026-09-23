/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        // Single-file bundle: correctness over code-splitting. History:
        // (1) a custom manualChunks split react/react-dom apart from
        // scheduler/use-sync-external-store and react-dependent libs across
        // vendor-react / vendor-framer / vendor / vendor-dexie chunks, causing
        // circular chunk imports and null-React hook crashes in production.
        // (2) removing manualChunks was NOT enough: Rolldown's default
        // code-splitting hoisted react/jsx-runtime (+ a copy of react core)
        // into a shared jsx-runtime-*.js chunk while ALSO inlining a second
        // copy of react core into index-*.js (verified: both chunks contain
        // react.transitional.element + __CLIENT_INTERNALS...). react-dom
        // registers its hook dispatcher (T.H) on one copy while app code
        // calls hooks via the other, whose T.H stays null -> "Cannot read
        // properties of null (reading 'useCallback')" thrown from inside
        // jsx-runtime-*.js. inlining all dynamic imports into ONE chunk makes
        // a cross-chunk React ordering bug structurally impossible. Cost:
        // larger initial download (~700KB), no lazy network chunks. Revisit
        // only with bundle-level single-React verification in a real browser.
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
  },
});