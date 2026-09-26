# Code Cleanup Report

_Generated 2026-09-26 · scope: whole repo (branch `feat/carbon-ui`) · stack: React 19 + TypeScript + Vite + Tailwind 3.4 + Firebase Realtime Database, tests with Vitest_

## Summary

| Category | High | Medium | Low |
|----------|-----:|-------:|----:|
| Unused dependencies | 1 (2 packages) | 0 | 0 |
| Dead code | 3 | 0 | 1 |
| Unused styles / theme tokens | 2 | 0 | 1 |
| Unused imports | 0 | 0 | 0 |
| Unused files | 0 | 1 | 0 |
| Dead routes / endpoints | 0 | 0 | 0 |
| Duplicate logic | 0 | 0 | 2 |
| Over-complex implementations | 0 | 0 | 0 |
| Legacy code | 0 | 1 | 2 |

Tools used: **knip** (run once via `npx`, not added to the project), the TypeScript compiler (`noUnusedLocals` / `noUnusedParameters` are already on, so unused locals and imports are already enforced), ESLint, and a targeted search for every candidate. Styles, theme tokens and duplicated logic were covered by manual search, so those categories are best-effort.

Estimated reclaimable: 2 dependencies, ~90 lines of code and CSS, 0 whole files (the only unused file should stay for now; see Medium).

**Applied** (one commit per batch; tests, type check, lint and build passed after each):
- `cc79f28` removed the two unused dependencies. The lockfile lost only those and the 7 Radix sub-packages they pulled in; no other versions changed.
- `c4e249c` removed the dead code.
- `475fbe2` removed the unused CSS utilities (plus `.panel`, found unused while applying) and the unused theme tokens.

Not applied: the test-only code (left for later), the Medium items, and the remaining Low items. The two duplication items were fixed afterwards (see below).

The codebase is small (~93 tracked files, ~8,400 lines) and already fairly clean: no unused imports, no commented-out code, no dead routes.

## Findings

Ordered by confidence, then impact.

### [HIGH · applied] Unused dependencies: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`
- **What & where:** declared in `package.json:20` and `package.json:22`.
- **Why it's unnecessary:** no component imports either package. Dropdowns use a native `<select>`; the only Radix pieces in use are dialog, popover and slot.
- **Evidence:** knip reports both unused. A search for `react-dropdown-menu` and `react-select` outside `node_modules` and the lockfile finds only the two `package.json` lines. They aren't referenced in Vite, Tailwind or ESLint config, or in CI.
- **Impact of removing:** smaller install and two fewer packages to keep updated. Low risk.
- **Risks / false-positive check:** no dynamic `import()` anywhere in `src`, and this is an app, not a published library.
- **Cleanup plan:** `pnpm remove @radix-ui/react-dropdown-menu @radix-ui/react-select`, then run `pnpm build` and `pnpm test`.

### [HIGH · applied] Dead function: `getUserData()` in `src/services/auth.service.ts:174`
- **What & where:** an exported async function (10 lines) that reads `users/<uid>` once.
- **Why it's unnecessary:** superseded by `subscribeToUserData()` directly below it, which `AuthContext` uses for live updates.
- **Evidence:** knip reports the export unused. The only occurrence of `getUserData` in the repo is its definition; there's no caller in `src/`, no test, and no reference in scripts or config.
- **Impact of removing:** less surface in the auth service. Low risk.
- **Risks / false-positive check:** no string-based or dynamic lookups of service functions exist.
- **Cleanup plan:** delete the function; run the type check and tests.

### [HIGH · applied] Dead UI-kit exports: `CommandSeparator`, `DialogClose`, `DialogTrigger`
- **What & where:** `src/components/ui/Command.tsx:78` (`CommandSeparator` plus its `displayName` line), and `src/components/ui/Modal.tsx:9` and `:13` (`DialogTrigger`, `DialogClose`, both also in the export list at the bottom).
- **Why it's unnecessary:** components copied in with the shadcn-style kit and never used. Dialogs are opened through state (`isOpen`), not triggers, and are closed by the built-in close button.
- **Evidence:** knip reports them unused. Each name appears only in its definition, its `displayName` and the export list, with 0 imports.
- **Impact of removing:** ~15 lines. Low risk.
- **Risks / false-positive check:** these are ordinary named exports with no framework convention involved. They'd be trivial to re-add from the shadcn source if ever needed.
- **Cleanup plan:** remove the definitions and export-list entries; run the type check.

### [HIGH · applied] Unused default export: `export default app` in `src/config/firebase.ts:54`
- **What & where:** the Firebase app instance is exported as the default export.
- **Evidence:** knip reports it unused. Every import of this module uses named imports (`auth`, `db`); none uses the default.
- **Cleanup plan:** remove the line (`app` itself stays, because `auth` and `db` are created from it).

### [HIGH · applied] Unused CSS utilities: `.panel`, `.glass`, `.card-surface`, `.card-surface-hover`, `.input-surface`
- **What & where:** `src/index.css`, about lines 24–55.
- **Why it's unnecessary:** aliases left over from the pre-Carbon "one surface system". Nothing uses them any more.
- **Evidence:** a whole-word search for each class name across `src/` (TSX, TS and CSS) finds only the definitions. (`.panel` was first miscounted because of the word "panel" in comments. Its last users, the two "Last updated" boxes, were removed earlier in this PR.) Class names aren't built dynamically: there are no template strings combining `glass`, `card-` or `input-`. Their siblings `.panel-strong` and `.glass-strong` **are** used (6 places) and must stay.
- **Impact of removing:** ~20 lines of CSS. Tailwind already drops them from the build output, so this only tidies the source.
- **Cleanup plan:** delete the four rule blocks and update the comment above them; run the build and compare a page visually.

### [HIGH · applied] Unused theme tokens in `tailwind.config.js`: legacy `primary` scale, `glow` / `glow-sm` shadows, `gradient-accent`
- **What & where:** `tailwind.config.js`, around lines 28–40 (`primary` 50–900, kept "so nothing references a missing token"), `boxShadow.glow` and `glow-sm`, and `backgroundImage.gradient-accent`.
- **Evidence:** searches for `primary-[0-9]`, `shadow-glow` and `bg-gradient-accent` across `src/` and `index.html` find 0 uses. The comment's premise no longer holds: nothing references the old scale.
- **Impact of removing:** ~20 lines of config, and a theme that lists only what the Carbon design uses.
- **Cleanup plan:** delete those entries; run the build and scan the main screens.

### [HIGH] Test-only code: `Card`'s `hover` variant, and the `mockUser` test helper
- **What & where:** the `hover` variant in `src/components/ui/Card.tsx` (only exercised by `Card.test.tsx:25`), and `mockUser` in `src/test/test-utils.tsx:50`.
- **Why it's unnecessary:** holdings are now tile buttons, so no `<Card hover>` remains in the app. `mockUser` is never imported by any test.
- **Evidence:** a search for `<Card ... hover` finds only the test. knip reports `mockUser` as an unused export, and a search confirms its only occurrence is the definition.
- **Cleanup plan:** remove the variant and its test case, and remove `mockUser`; run the tests.

### [MEDIUM] One-off migration script: `scripts/migrate-sharing-model.mjs`
- **What & where:** a standalone Node script; nothing in the app imports it.
- **Evidence:** knip reports it as an unused file, **but** `FIREBASE_SETUP.md:196` documents it as the step to migrate an existing database to the new sharing model.
- **Risks:** deleting it would strand any environment that hasn't been migrated yet.
- **Verify first:** confirm every Firebase database you run (production and any staging) has been migrated. Then delete the script and the section in `FIREBASE_SETUP.md` together.

### [MEDIUM] Legacy price-lookup fallback: `src/utils/calculations.ts:4`
- **What & where:** `getPriceKey` falls back to `assetSymbol` for old records that stored the CoinGecko ID there instead of in `coinId`.
- **Risks:** removing it breaks live prices for any holding saved before `coinId` existed.
- **Verify first:** query the database for investments without `coinId`. If there are none, or after backfilling them, the fallback can go.

### [LOW · fixed] Duplicate logic: the add and edit forms share about 80 lines
- **Where:** `src/components/investments/InvestmentForm.tsx` and `src/components/investments/EditInvestmentModal.tsx`.
- **What's duplicated:**
  - the `lastEditedField` state and the effect that recalculates the amount from price × quantity (same rounding);
  - the amount field's `onChange`, which recalculates quantity (same 8-decimal rounding);
  - the "Current price … Use as Buy Price" box;
  - the buy price / quantity / amount field registrations and validation messages.
- **Simpler form:** a `useAmountQuantitySync(control, setValue)` hook and a `<CurrentPriceBox>` component used by both. This needs judgment because the edit form's currency conversion interacts with the same fields.
- **Resolution:** both forms now use `PriceFields`, `CurrentPriceBox` and `CurrencySelect` from `InvestmentFields.tsx`, plus the shared `InvestmentFormValues` type. Tests covering the amount/quantity maths were added first and pass before and after. Along the way this turned up and fixed an existing bug: the add form didn't clear its price, quantity, amount or name after a successful add.

### [LOW · fixed] Duplicate currency list in the add form
- **Where:** `InvestmentForm.tsx:257–265` hard-codes seven `<option>`s, while `utils/currencies.ts` already exports `SUPPORTED_CURRENCIES`, which the header and edit dialog use.
- **Risk of leaving it:** adding a currency means remembering this third place.
- **Simpler form:** `{SUPPORTED_CURRENCIES.map(({ code, symbol }) => <option …>{code} ({symbol})</option>)}`, as the edit dialog does.
- **Resolution:** both forms render the shared `CurrencySelect`, which lists `SUPPORTED_CURRENCIES`.

### [LOW] Exports that don't need to be exported
- `DialogPortal`, `DialogOverlay` (`Modal.tsx`), `UPDATE_INTERVAL` (`useCryptoPrices.ts`), `ensureUserRecord` (`auth.service.ts`) and `MockAuthProvider` (`test-utils.tsx`) are only used inside their own files (knip, confirmed by search).
- Dropping `export` makes the public surface smaller, but gains nothing functionally. Optional.

### [LOW] Leftover pre-Carbon styling and a stale comment
- `panel-strong rounded-lg` / `glass-strong` are still used in the login and register forms, `ShareCodeModal`, `Command` and `Popover`. They work, but look slightly boxier than the Carbon components (`rounded-xl` / `rounded-2xl`).
- `getColorClass` / `getBgColorClass` (`utils/formatters.ts`) use Tailwind's `gray-400` for zero values instead of the theme's `muted` token.
- `Modal.tsx:115` calls `Modal` a "Legacy Modal component for backwards compatibility", but it's the main dialog API used everywhere. The comment misleads.

## Out of scope / needs runtime analysis

- **Duplicate API calls:** nothing obviously redundant was found. Price polling runs once per page (the dashboard or the public page), every 60s, and coin search is debounced. Whether CoinGecko rate limits are hit in practice needs monitoring, not static review.
- **Database reads:** listeners are per owner and unsubscribe on cleanup. No query-in-a-loop pattern was found, but the "Everyone" tab subscribes to one node per public profile. With many users, that's worth measuring.
