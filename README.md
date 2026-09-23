# BlackCash

Open-source, local-first finance toolkit for accountants, CPAs, and investment bankers.

BlackCash is a privacy-first financial toolbox that runs entirely on your own device. No backend, no login, no account — your statements, models, and ratios never leave your machine. The same codebase runs as a web app (also hostable on GitHub Pages) and, via Capacitor, as native Android and iOS apps.

## Vision

BlackCash provides a professional-grade, local-first financial workspace that respects user privacy and data sovereignty. It combines double-entry accounting, financial modeling, and analysis tools in a single application that works offline, stores all data locally in IndexedDB, and encrypts sensitive data at rest using Web Crypto API (AES-GCM with PBKDF2-derived keys). Every financial formula is pure TypeScript with comprehensive unit tests. The app is free, open-source (MIT), and built in public for the community.

## Module Map (Odoo-inspired)

BlackCash organizes features into **modes** (personas) and **modules** (tools). Each mode surfaces a curated set of modules relevant to that role.

| Category | Modules | Status |
|----------|---------|--------|
| **Accountant** (Books, journals & statements) | Chart of Accounts, Journal, Trial Balance, P&L, Balance Sheet | ✅ Working |
| | Invoices, Expenses, Reconciliation, Loan Analyzer | ⏳ Not Started |
| **CPA** (Tax, deadlines & compliance) | Tax Estimator, Deadlines, Client Files, Audit Checklist, Depreciation | ⏳ Not Started |
| **Banker** (Valuation & deal pipeline) | DCF Valuation | ✅ Working |
| | LBO, Comps, WACC, Deal Pipeline | ⏳ Not Started |
| **Investor** (Portfolios & growth) | Ratio Analysis, Growth Projections | ✅ Working |
| | Portfolio, Watchlist | ⏳ Not Started |
| **Core** (All modes) | Contacts, Settings, Vault (encryption) | ✅ Working |
| | Documents, Notes, Tasks, Reports | ⏳ Not Started |

**Status legend:** ✅ Working — fully functional, tested, and usable · ⏳ Not Started — placeholder only, no implementation yet

## Tech Stack

| Purpose | Choice |
|---------|--------|
| UI | React 19 + Vite 8 + TypeScript (strict) |
| Styling | Tailwind CSS 4 + design tokens in `src/styles/tokens.css` |
| Motion | Framer Motion (respects `prefers-reduced-motion`) |
| Charts | Recharts |
| Local storage | Dexie (IndexedDB) |
| Encryption | Web Crypto API (AES-GCM, PBKDF2 200k iterations) |
| Command palette | cmdk |
| Tests | Vitest |
| Mobile shell | Capacitor (web-first, no platform added yet) |

## Project Structure

```
src/
  app/              Router, layout, command palette, providers
  components/ui/    Shared UI primitives (Card, Button, StatCard, AnimatedNumber, Input)
  components/ornament/  Design system components (WaxSeal, Section, Card, Divider)
  features/         One folder per tool: accounting, contacts, dashboard, dcf, growth, loans, ratios, settings, soon, styleguide
  lib/finance/      Pure math functions + unit tests (no React)
  lib/db.ts         Dexie schema setup
  lib/repos/        Data access layer (contactsRepo, journalRepo)
  lib/crypto.ts     Web Crypto API encryption (AES-GCM, PBKDF2)
  hooks/            React hooks (useVault, useEncryptedDb, useClientId)
  styles/           Design tokens (tokens.css) and global styles
```

## Requirements

- Node.js 20+ (developed against Node 24)

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/blackcash.git
cd blackcash

# 2. Install dependencies
npm install

# 3. Start the dev server (background launch)
npm run dev &

# 4. Open the printed URL (default http://localhost:5173)
```

The `npm run dev` command starts Vite's dev server. Running it with `&` (or in a separate terminal) keeps it running in the background while you work.

### Available Scripts

```bash
npm run typecheck   # strict TypeScript, no `any`
npm test            # run the full test suite
npm test:watch      # watch mode for tests
npm run build       # typecheck + production build to dist/
npm run preview     # preview the production build
```

## Testing

The financial core must stay pure and fully unit tested:

```bash
npm test
```

Each function in `src/lib/finance` is covered including edge cases (zero-rate loans, negative cash flows, missing IRR roots). Encryption tests verify round-trip encrypt/decrypt, wrong-passphrase rejection, and ciphertext uniqueness.

## Mobile (Capacitor)

Capacitor is initialized (`capacitor.config.ts`, `webDir: "dist"`). Platforms are intentionally **not** added yet.

```bash
npm run build          # build the web app into dist/
npx cap add android    # later: add a platform
npx cap add ios
npx cap sync           # copy the web build into the native project
```

## Design Language — Readability Rules

The BlackCash design system enforces the following readability rules:

1. **Solid `--bg-2` panels behind tables, forms, and figures.**
   Any data-dense surface must sit on `bg-[var(--bg-2)]` with a `border-[var(--border)]` stroke for minimum 4.5:1 contrast.

2. **No transparent overlays on interactive text.**
   Buttons, links, and form labels must never rely on backdrop-filter or semi-transparent backgrounds.

3. **Tabular numerals for all numeric reads.**
   The `.num` utility (`font-variant-numeric: tabular-nums`) is mandatory on `AnimatedNumber`, `StatCard`, and inline currency/percentage values.

4. **Accounting currency sign for negatives.**
   Negative currency values render as `($1,250.00)` in `--danger` via `currencySign: "accounting"`.

5. **Percent values are fractions.**
   Input `0.1235` → output `12.35%`. The `AnimatedNumber` percent formatter handles this automatically.

6. **Reduced motion respected everywhere.**
   All CSS animations and Framer Motion springs respect `@media (prefers-reduced-motion: reduce)` and `useReducedMotion()`.

7. **Focus visible with accent outline.**
   All interactive elements use `focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`.

## Screenshots

*(Placeholder — add screenshots of Dashboard, Journal, DCF, Settings/Vault, and mobile view here)*

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose changes, branch naming, commit style, and the project's non-negotiables.

## License

MIT — see [LICENSE](LICENSE). By contributing you agree your contributions are licensed under the same terms.