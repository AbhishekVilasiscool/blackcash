# blackcash

Open-source, local-first finance toolkit for accountants, CPAs, and investment
bankers. **(working name)**

blackcash is a privacy-first financial toolbox that runs entirely on your own
device. No backend, no login, no account — your statements, models and ratios
never leave your machine. The same codebase runs as a web app (also hostable on
GitHub Pages) and, via Capacitor, as native Android and iOS apps.

## Vision

- **Local-first.** All data lives in IndexedDB (Dexie) on your device. Export
  and back up your data any time; nothing is gated behind a service.
- **Accountant-grade math.** Every financial formula (`npv`, `irr`, `pmt`,
  amortization schedules, future value, …) is pure TypeScript and locked down by
  unit tests — because precision matters.
- **Free and open.** MIT licensed, published on GitHub, built in public for the
  community.

## Planned tools

- **DCF Valuation** — discounted cash flow, NPV and IRR from projected cash flows
- **Loan Analyzer** — payments and full amortization schedules
- **Ratio Analysis** — liquidity, profitability and leverage ratios
- **Growth Projections** — future value, CAGR and compounding scenarios

## Tech stack

| Purpose         | Choice                                             |
| --------------- | -------------------------------------------------- |
| UI              | React 19 + Vite 8 + TypeScript (strict)             |
| Styling         | Tailwind CSS 4 + design tokens in `styles/tokens.css` |
| Motion          | Framer Motion (respects `prefers-reduced-motion`)   |
| Charts          | Recharts                                           |
| Local storage   | Dexie (IndexedDB)                                  |
| Command palette | cmdk                                               |
| Tests           | Vitest                                             |
| Mobile shell    | Capacitor (web-first, no platform added yet)       |

## Project structure

```
src/
  app/            Router, layout, command palette, providers
  components/ui/  Shared UI primitives (Card, Button, StatCard, AnimatedNumber, Input)
  features/       One folder per tool: dcf, loans, ratios, growth
  lib/finance/    Pure math functions + unit tests (no React)
  lib/db.ts       Dexie schema setup
  styles/         Design tokens (tokens.css) and global styles
```

## Requirements

- Node.js 20+ (developed against Node 24)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open the printed URL (default http://localhost:5173)
```

Typecheck and lint-like checks are wired into the toolchain:

```bash
npm run typecheck   # strict TypeScript, no `any`
npm test            # run the finance math test suite
npm test:watch      # watch mode for tests
npm run build       # typecheck + production build to dist/
npm run preview     # preview the production build
```

## Testing the math

The financial core must stay pure and fully unit tested:

```bash
npm test
```

Each function in `src/lib/finance` is covered including edge cases (zero-rate
loans, negative cash flows, missing IRR roots).

## Mobile (Capacitor)

Capacitor is initialized (`capacitor.config.ts`, `webDir: "dist"`). Platforms
are intentionally **not** added yet.

```bash
npm run build          # build the web app into dist/
npx cap add android    # later: add a platform
npx cap add ios
npx cap sync           # copy the web build into the native project
```

## Design Language — Readability Rules

The BlackCash design system enforces the following readability rules to ensure
content remains legible across all modes and devices:

1. **Solid `--bg-2` panels behind tables, forms, and figures.**
   Any data-dense surface (tables, grids, form sections, charts, code blocks)
   must sit on a `bg-[var(--bg-2)]` background with a `border-[var(--border)]`
   stroke. This provides a minimum 4.5:1 contrast ratio against `--text` and
   `--muted` tokens in every mode.

2. **No transparent overlays on interactive text.**
   Buttons, links, and form labels must never rely on backdrop-filter or
   semi-transparent backgrounds for legibility. Use opaque `--surface` or
   `--bg-2` with explicit borders.

3. **Tabular numerals for all numeric reads.**
   The `.num` utility (font-variant-numeric: tabular-nums) is mandatory on
   `AnimatedNumber`, `StatCard`, and any inline currency/percentage values.

4. **Accounting currency sign for negatives.**
   Negative currency values render as `($1,250.00)` in `--danger` via
   `currencySign: "accounting"` — never as `-$1,250.00`.

5. **Percent values are fractions.**
   Input `0.1235` → output `12.35%`. The `AnimatedNumber` percent formatter
   handles this automatically.

6. **Reduced motion respected everywhere.**
   All CSS animations (`.flicker`, `.fog-blob`, `coin-flip`, `seal-in`,
   `wordmark-in`, `flame-sway`, `flame-glow`) disable under
   `@media (prefers-reduced-motion: reduce)`. Framer Motion springs also
   respect `useReducedMotion()`.

7. **Focus visible with accent outline.**
   All interactive elements use `focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`
   for keyboard navigation clarity.

## License

MIT — see [LICENSE](LICENSE). By contributing you agree your contributions are
licensed under the same terms. See [CONTRIBUTING.md](CONTRIBUTING.md).