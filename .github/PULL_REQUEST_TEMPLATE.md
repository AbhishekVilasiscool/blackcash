## Description

Briefly describe the changes in this PR. Reference any related issues.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] Test
- [ ] Chore

## Checklist

- [ ] `npm run typecheck` passes (strict TypeScript, no `any`)
- [ ] `npm test` passes (all tests, including new ones)
- [ ] `npm run build` passes (production build succeeds)
- [ ] No new console errors or warnings in dev tools
- [ ] Screenshot/GIF attached for UI changes
- [ ] Confirms no new network requests if touching data/fonts/libraries
- [ ] Respects `prefers-reduced-motion` for any new animation
- [ ] Uses design tokens from `src/styles/tokens.css` (no hardcoded colors)
- [ ] New Dexie tables/fields go through `src/lib/repos/` (no direct `db` access in components)
- [ ] Money values stored as integer cents (no floats)
- [ ] Financial invariants preserved (trial balance nets to zero, balance sheet balances)

## Screenshots / GIF

(Attach here for UI changes)

## Additional Notes

(Anything else reviewers should know)