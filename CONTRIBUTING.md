# Contributing to blackcash

Thanks for helping build a privacy-first finance toolkit. This project is open
source, MIT licensed, and free to use forever.

## How to contribute

1. **Fork** the repository and create a branch:
   `git checkout -b feature/your-change`
2. **Make small, focused changes.** One concern per pull request.
3. **Keep the math pure and tested.** All formulas live in `src/lib/finance`
   as plain TypeScript with no React imports. If you touch a formula, you must
   add or update its unit tests in `src/lib/finance/__tests__`.
4. **Run the checks before opening a PR:**

   ```bash
   npm run typecheck   # strict TypeScript — no `any` allowed
   npm test            # all finance tests must pass
   npm run build       # production build must succeed
   ```

5. **Describe your change** in the PR description and reference any related
   issues.

## Rules and conventions

- **Strict TypeScript.** `strict` is on. Never use `any`; use `unknown` plus
  narrowing when the type is genuinely open.
- **Math out of components.** Components call functions; they never re-implement
  a formula.
- **Mobile-first, responsive.** Design for the smallest screen first, then
  scale up (see the layout: bottom tab bar → desktop sidebar).
- **Respect `prefers-reduced-motion`.** Every animation in the app degrades
  gracefully. Use `useReducedMotion()` from Framer Motion in new motion work.
- **Design tokens.** Colors, radii and surfaces come from
  `src/styles/tokens.css`. Don't hardcode brand values in component classes.
- **Keep dependencies lean.** Before adding a package, ask whether the small
  standard library or an existing dependency already covers it.

## Reporting bugs

Open an issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- The math involved (attach the inputs and expected output)

Financial correctness bugs are the highest priority.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT license](LICENSE).