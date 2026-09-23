# Contributing to BlackCash

Thanks for helping build a privacy-first finance toolkit. This project is open source, MIT licensed, and free to use forever.

## How to Contribute

1. **Open an issue first** for anything nontrivial (new features, refactors, bug fixes beyond typos). This lets us discuss scope and approach before you invest time.
2. **Fork** the repository and create a branch:
   `git checkout -b feature/your-change` or `fix/your-fix`
3. **Make small, focused changes.** One concern per pull request.
4. **Keep the math pure and tested.** All formulas live in `src/lib/finance` as plain TypeScript with no React imports. If you touch a formula, you must add or update its unit tests in `src/lib/finance/__tests__`.
5. **Run the checks before opening a PR:**
   ```bash
   npm run typecheck   # strict TypeScript — no `any` allowed
   npm test            # all tests must pass
   npm run build       # production build must succeed
   ```
6. **Describe your change** in the PR description and reference any related issues.

## Branch Naming

- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `docs/<short-description>` — documentation only
- `refactor/<short-description>` — code restructuring without behavior change
- `chore/<short-description>` — maintenance, tooling, dependencies

## Commit Message Style

Follow conventional commits:
- `feat: add DCF terminal value calculator`
- `fix: correct IRR convergence for negative cash flows`
- `docs: update README with module status table`
- `refactor: extract ledger validation to separate module`
- `test: add encryption round-trip tests for journal lines`

Keep the subject line under 72 characters. Use the body to explain *why*, not *what*.

## Non-Negotiables

These rules are not up for debate. PRs that violate them will be closed without merge.

- **No network calls except to the user's own configured connectors.** This is a local-first, zero-tracking app by design. No analytics, no telemetry, no "phone home" of any kind.
- **All money stored as integer cents/paise, never floats.** Use `number` representing minor units (e.g., `$12.34` → `1234`). Floating-point arithmetic is forbidden for monetary values.
- **Financial invariants must never be weakened without new tests proving correctness.** Trial balance must net to zero. Balance sheet must balance (Assets = Liabilities + Equity). Any change to ledger logic requires new tests that demonstrate the invariant holds.
- **New Dexie tables/fields go through `src/lib/repos/`, never accessed directly from components.** Components call repo functions; they never import `db` directly.
- **Respect `prefers-reduced-motion` on all new animation.** Use `useReducedMotion()` from Framer Motion. CSS animations must disable under `@media (prefers-reduced-motion: reduce)`.
- **Design tokens only.** Colors, radii, surfaces come from `src/styles/tokens.css`. Don't hardcode brand values in component classes.
- **Keep dependencies lean.** Before adding a package, ask whether the small standard library or an existing dependency already covers it.

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- The math involved (attach the inputs and expected output)

Financial correctness bugs are the highest priority.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). We follow the Contributor Covenant.

## License

By contributing, you agree that your contributions are licensed under the project's [MIT license](LICENSE).