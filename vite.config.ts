/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  // NOTE: intentionally no custom manualChunks. A previous bundle-size pass
  // split react/react-dom apart from scheduler, use-sync-external-store, and
  // react-dependent libs (framer-motion, recharts, dexie-react-hooks, etc.)
  // across vendor-react / vendor-framer / vendor / vendor-dexie chunks. That
  // created circular chunk imports, so the React namespace evaluated to null
  // in production (dev server was unaffected) and the first hook call crashed
  // with "Cannot read properties of null (reading 'useCallback')".
  // Letting Vite/Rolldown own code-splitting keeps a single React copy in one
  // chunk with correct evaluation order.
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
  },
});