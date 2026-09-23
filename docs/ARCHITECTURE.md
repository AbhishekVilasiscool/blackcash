# Architecture Overview

This document explains BlackCash's architecture in plain language so new contributors can understand the system without reinventing it or breaking visual consistency.

## Module Registry Pattern

BlackCash uses a **module registry** to define all features. Each module is a self-contained unit with:

- `id` — unique identifier (e.g., `"journal"`, `"dcf"`)
- `title` — human-readable name
- `icon` — Lucide React icon component
- `path` — URL route
- `modes` — which personas see this module (`"accountant"`, `"cpa"`, `"banker"`, `"investor"`, or `"all"`)
- `status` — `"ready"` (working), `"soon"` (placeholder), or `"in progress"`
- `component` — lazy-loaded React component

The registry lives in `src/app/registry/modules.ts`. Modes are defined in `src/app/registry/modes.ts` with their accent colors and taglines.

**Why this pattern?** It decouples feature discovery from implementation. Adding a new tool means adding one entry to the registry — no router edits, no sidebar edits. The layout reads the registry at render time.

## Why Dexie / Local-First Instead of a Backend

BlackCash is **local-first by design**:

- **Privacy:** Financial data never leaves the device. No backend means no server to compromise, no analytics, no telemetry.
- **Offline:** Works on a plane, in a secure facility, or anywhere without internet.
- **Sovereignty:** Users own their data. Export/backup is a first-class feature, not a privilege.
- **Simplicity:** No auth, no sessions, no API contracts, no deployment pipeline for a backend.

Dexie (a wrapper around IndexedDB) provides:
- Type-safe schema with TypeScript interfaces
- Reactive queries via `dexie-react-hooks` (`useLiveQuery`)
- Transactions for multi-table writes (e.g., journal entry + lines)
- Indexes for common query patterns

**Trade-offs acknowledged:** No multi-device sync (yet), no server-side validation, no collaborative editing. These are explicit non-goals for v1.

## Repo/Lib Separation

```
src/lib/           # Pure logic, no React
  finance/         # Financial math (NPV, IRR, amortization, ledger invariants)
  repos/           # Data access layer (contactsRepo, journalRepo)
  crypto.ts        # Web Crypto API encryption (AES-GCM, PBKDF2)
  db.ts            # Dexie schema definition

src/features/      # React components, one folder per tool
  accounting/      # Journal, ChartOfAccounts, reports
  dcf/             # DCF Valuation
  ratios/          # Ratio Analysis
  ...
```

**Rule:** Components never import `db` directly. They call repo functions (`listJournalEntries`, `createContact`, etc.). This keeps components testable and enforces a single place for query logic.

## Ledger Invariants & Tests

Double-entry accounting requires two invariants that **must never be weakened**:

1. **Trial Balance nets to zero:** Sum of all debit balances = sum of all credit balances across all accounts.
2. **Balance Sheet balances:** Total Assets = Total Liabilities + Total Equity.

These are enforced in `src/lib/finance/ledger.ts`:
- `validateEntry()` — checks that every journal entry has equal debits and credits, at least two lines, valid accounts.
- `postEntry()` — only allows posting if validation passes.
- `accountBalance()`, `trialBalance()`, `balanceSheet()`, `incomeStatement()` — pure functions that compute reports from raw data.

**Tests live in:**
- `src/lib/finance/__tests__/finance.test.ts` — math functions, edge cases
- `src/lib/repos/__tests__/contactsRepo.test.ts` — repo functions with fake IndexedDB
- `src/test/encryption.test.ts` — encryption round-trips, wrong-passphrase rejection

Any change to ledger logic **must** include new tests proving the invariants still hold.

## Design System

BlackCash has a cohesive design system. **Do not invent new visual patterns.** Use what's here:

### Tokens (`src/styles/tokens.css`)

CSS custom properties for:
- Colors: `--bg`, `--bg-2`, `--surface`, `--text`, `--muted`, `--accent`, `--danger`, `--border`
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- Shadows, transitions, font families

**Always use tokens.** Never hardcode `#5FB8A5` or `rounded-xl` in components — use `bg-accent`, `rounded-xl` utilities that reference tokens.

### Ornament Kit (`src/components/ornament/`)

Reusable styled components:
- `WaxSeal` — the signature seal logo, supports `size`, `tone` ("accent" | "oxblood"), `accent` color override
- `Section` — numbered section header with Roman numeral (`n={1}`)
- `Card` — elevated panel with `bg-[var(--bg-2)]` and border
- `Divider` — horizontal rule with optional label

### Atmosphere Levels

Three visual density settings controlled in Settings → Appearance:
- `full` — fog, dust particles, lantern glow, film grain
- `lite` — fog, vignette, warm light
- `off` — vignette and grain only

Respects `prefers-reduced-motion` — all CSS animations and Framer Motion springs disable automatically.

### Readability Rules (Non-Negotiable)

1. Data-dense surfaces (tables, forms, charts) sit on `bg-[var(--bg-2)]` with `border-[var(--border)]`.
2. No transparent overlays on interactive text — use opaque `--surface` or `--bg-2`.
3. Tabular numerals (`.num` utility) on all numeric reads.
4. Negative currency as `($1,250.00)` in `--danger` via `currencySign: "accounting"`.
5. Percent values are fractions (input `0.1235` → output `12.35%`).
6. Reduced motion respected everywhere.
7. Focus visible with accent outline: `focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`.

## Encryption at Rest

Implemented in `src/lib/crypto.ts` and `src/hooks/useVault.ts`:

- **Key derivation:** PBKDF2 (200,000 iterations, SHA-256) → AES-GCM 256-bit key
- **Storage:** Only salt + verification hash stored in IndexedDB (settings table). Passphrase never persisted.
- **Field-level encryption:** Sensitive fields in `accounts`, `journalEntries`, `journalLines`, `contacts`, `interactions`, `contactLinks` encrypted before write, decrypted on read via `useEncryptedDb` hook.
- **Unencrypted:** `settings` table (theme, atmosphere level, vault metadata).
- **Session:** Key held in memory only, cleared on lock/tab close.
- **Auto-lock:** Configurable idle timeout (default 15 min), manual lock button in header.

## Adding a New Module

1. Create component in `src/features/<category>/<ModuleName>.tsx`
2. Add entry to `MODULES` in `src/app/registry/modules.ts`
3. If new mode needed, add to `src/app/registry/modes.ts`
4. Write repo functions in `src/lib/repos/` if new tables
5. Add tests in `src/lib/finance/__tests__/` or `src/lib/repos/__tests__/`
6. Run `npm run typecheck && npm test && npm run build`

## File List for Quick Reference

```
src/
├── app/
│   ├── registry/
│   │   ├── modules.ts       # Module definitions
│   │   ├── modes.ts         # Mode definitions
│   │   └── types.ts         # ModuleDef, ModeDef types
│   ├── layout.tsx           # Shell, sidebar, vault unlock gate
│   └── router.tsx           # Routes from registry
├── components/
│   ├── ui/                  # Primitives (Button, Input, Card, etc.)
│   └── ornament/            # Design system (WaxSeal, Section, Card)
├── features/
│   ├── accounting/          # Journal, ChartOfAccounts, reports
│   ├── contacts/            # Contacts, interactions
│   ├── dashboard/           # Mode-specific dashboards
│   ├── dcf/                 # DCF Valuation
│   ├── growth/              # Growth Projections
│   ├── ratios/              # Ratio Analysis
│   ├── settings/            # Vault, appearance, data
│   └── soon/                # Placeholder for not-started modules
├── hooks/
│   ├── useVault.ts          # Encryption key management
│   ├── useEncryptedDb.ts    # Transparent encrypt/decrypt wrapper
│   └── useClientId.ts       # Client workspace selector
├── lib/
│   ├── finance/
│   │   ├── ledger.ts        # Double-entry validation, reports
│   │   ├── tvm.ts           # Time value of money (NPV, IRR, PMT)
│   │   └── __tests__/
│   ├── repos/
│   │   ├── contactsRepo.ts
│   │   ├── journalRepo.ts
│   │   └── __tests__/
│   ├── crypto.ts            # Web Crypto API (AES-GCM, PBKDF2)
│   └── db.ts                # Dexie schema
└── styles/
    └── tokens.css           # Design tokens
```

## Key Conventions Summary

| Area | Convention |
|------|------------|
| Money | Integer cents (`number`), never `float` |
| Data access | Via `src/lib/repos/`, never `db` in components |
| Encryption | Field-level AES-GCM via `useEncryptedDb` |
| Tests | Pure math in `lib/finance/__tests__`, repos in `lib/repos/__tests__` |
| Styling | Tokens only, ornament kit for compound components |
| Motion | `useReducedMotion()` + `@media (prefers-reduced-motion: reduce)` |
| Commits | Conventional commits (`feat:`, `fix:`, `docs:`, etc.) |
| PRs | Typecheck + test + build must pass |