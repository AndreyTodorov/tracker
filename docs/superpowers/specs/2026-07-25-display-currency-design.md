# Portfolio Display Currency

**Date:** 2026-07-25
**Branch:** `feat/sharing-security-model`
**Status:** Approved, ready for implementation planning

## Problem

Two independent issues, delivered together.

**1. Mixed-currency totals are meaningless.** Each investment stores its own
`currency` (`Investment.currency`, one of USD/EUR/GBP/JPY/CHF/CAD/AUD).
`calculatePortfolioStats` adds amounts across currencies without conversion, so
a EUR holding and a USD holding are summed as if 1 EUR = 1 USD.
`PortfolioSummary` papers over this with a "Mixed Currency Warning" banner and
labels the totals with an arbitrarily chosen currency
(`Array.from(currencies)[0]`). The user wants to pick one currency for the whole
portfolio and have the warning disappear.

**2. Tab content can render under the wrong tab.** `Dashboard` flips `activeTab`
and React re-renders immediately with the *previous* tab's `investments` still
in state and `loading` still `false`. The effect in `useInvestments` sets
`loading = true` only afterwards. Switching Everyone → My Portfolio therefore
paints other users' cards and totals under "My Portfolio" for one frame.

Note that the underlying data access is already correctly scoped: on this branch
`subscribeToUserInvestments` reads `investments/{uid}` directly and the database
rules enforce ownership. This is a render-timing defect, not a data leak.

## Decisions

Settled during brainstorming; recorded here because they constrain everything
below.

| Question | Decision |
| --- | --- |
| FX rate for cost basis | Today's rate, derived from CoinGecko coin prices |
| Scope of conversion | Everything — summary tiles *and* investment cards |
| Picker placement | Header, global across tabs and shared views |
| Persistence | `localStorage`, per browser. Default USD |
| When no rate is derivable | Fall back to unconverted totals plus an inline notice |

### Why CoinGecko supplies the FX rate

`getMultipleCryptoPrices(symbols, currencies)` already fetches every coin in
every requested currency and returns `Map<coinId, Map<currency, price>>`. If a
coin is quoted in both USD and EUR, then `price(coin, USD) / price(coin, EUR)`
*is* the EUR→USD rate. No new API, no key, no additional rate limit.

Consequence the user accepted: converting cost basis at today's rate means a
holding's profit percentage shifts as FX moves, even when the crypto price is
flat. The same holding shows a different percentage depending on the selected
display currency. This is inherent to the rate choice, not a defect.

### Rejected alternatives

- **Purchase-date FX rates.** True cost basis, immune to FX drift, but requires
  a historical-FX dependency plus caching and a coverage fallback.
- **Filter instead of convert.** Picker narrows the portfolio to one currency.
  Simplest, but never shows a single total for everything owned.
- **Normalizing investments inside `useInvestments`.** Smallest diff, but every
  consumer would hold an object whose `buyPrice` disagrees with the database,
  and `EditInvestmentModal` would save converted values back over the
  originals.
- **Converting inside `formatCurrency`.** Hides a numeric transform in a
  function named "format", and the summary must sum converted numbers before
  formatting anyway.

## Architecture

Conversion happens at the render boundary. `Investment` remains exactly as
stored — native `buyPrice`, native `currency`. One pure function produces
display values, and both the totals calculation and the card call it, so the
math has a single source of truth.

```
useCryptoPrices(investments, displayCurrency)
        │  requests union(holding currencies, displayCurrency)
        ▼
  prices: Map<coinId, Map<currency, price>>
        │
        ├──► deriveRate(prices, from, to)          ─┐
        │                                            │ src/utils/currency.ts
        └──► toDisplayValues(inv, prices, display)  ─┘
                    │
                    ├──► calculatePortfolioStats  ──► PortfolioSummary
                    └──► InvestmentCard
```

### `src/utils/currency.ts` (new)

```ts
deriveRate(
  prices: Map<string, Map<string, number>>,
  from: string,
  to: string
): number | null
```

Returns `1` when `from` and `to` match case-insensitively. Otherwise collects
`price(coin, to) / price(coin, from)` for every coin quoted in both currencies
and returns the **median**. Median rather than first-match so a single stale or
garbage quote cannot skew the rate. Quotes `<= 0` are skipped, which also
removes the division-by-zero path. Returns `null` when no coin carries both
currencies.

```ts
interface DisplayValues {
  currency: string;      // currency these numbers are actually expressed in
  buyPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  profit: { absolute: number; percentage: number };
  converted: boolean;    // true when converted away from investment.currency
}

toDisplayValues(
  investment: Investment,
  prices: Map<string, Map<string, number>>,
  displayCurrency: string
): DisplayValues
```

Rules, in order:

1. If `investment.currency` equals `displayCurrency`, return native values with
   `converted: false`.
2. Otherwise resolve `rate = deriveRate(prices, investment.currency,
   displayCurrency)`. If `null`, return native values with `converted: false`
   and `currency: investment.currency` — the row declines to convert.
3. `currentPrice` prefers the **direct** quote
   `prices.get(getPriceKey(investment))?.get(displayCurrency)`. This is exact
   and involves no FX. Only if that quote is absent does it fall back to
   `nativeCurrentPrice * rate`, and if there is no live price at all, to
   `investment.buyPrice * rate` (matching today's behaviour of treating the buy
   price as the fallback price).
4. `buyPrice = investment.buyPrice * rate`; `invested = buyPrice * quantity`;
   `currentValue = currentPrice * quantity`.
5. `profit = calculateProfit(buyPrice, currentPrice, quantity)`.

A live price of `0` remains a real price (a total loss), consistent with the
existing behaviour fixed in commit `37e283f`.

### `src/utils/currencies.ts` (new)

`SUPPORTED_CURRENCIES` — the seven supported codes with display symbols. The
list is currently duplicated in four places: `investment.service.ts:21`
(uppercase), `coingecko.service.ts:6` (lowercase), the `<option>` list in
`InvestmentForm.tsx:244-250` (with symbols), and now the header picker. All four
consume the shared list. This de-duplication is in scope only because the
feature adds the fourth copy.

### `src/utils/calculations.ts` (modified)

`calculatePortfolioStats(investments, prices, displayCurrency)` sums the
`toDisplayValues` rows. `Portfolio` gains two fields:

- `totalsCurrency: string` — the currency the tiles are actually labelled with.
  Named distinctly from the user's selected `displayCurrency` because the two
  differ whenever conversion fails.
- `conversionFailed: boolean` — `true` when any row failed to reach the
  requested display currency, i.e.
  `rows.some(row => row.currency !== displayCurrency)`.

Defining the flag against the requested currency rather than against row
agreement matters: if every holding is EUR and the user selects USD with no
rate available, all rows agree with each other but none reached USD. The tiles
must not silently claim to be USD.

When `conversionFailed` is `true`, `totalsCurrency` is the currency of the
largest holding by invested amount; otherwise it is the selected display
currency. Using the largest holding is a deliberate change from today's
`Array.from(currencies)[0]`, which picks whichever currency happens to come
first.

`deriveRate` is recomputed per row rather than hoisted into a rate table. The
price map holds a handful of coins, `calculatePortfolioStats` is already
memoized in `Dashboard`, and a caching layer would be speculative. Revisit only
if profiling shows otherwise.

### `src/context/CurrencyContext.tsx` (new)

Follows the existing `AuthContext` / `ToastContext` pattern. Holds
`{ displayCurrency, setDisplayCurrency }`. Seeded from
`localStorage.getItem('displayCurrency')`, validated against
`SUPPORTED_CURRENCIES`, defaulting to `USD` when absent or invalid. Writes back
on change. The provider is mounted in `App.tsx` so `PublicPortfolio` — a
separate route — receives it without extra wiring.

### `src/hooks/useCryptoPrices.ts` (modified)

Takes `displayCurrency` and includes it in both the requested `currencies` array
and `investmentsKey`. This guarantees every fetched coin is quoted in the
display currency, which makes the direct quote available for current value and
guarantees at least one coin carries both sides of any needed pair.

### `src/hooks/useInvestments.ts` (modified)

Two changes, both addressing problem 2.

Store the tab alongside its data and discard mismatches during render, so
correctness no longer depends on effect timing:

```ts
const [state, setState] = useState<{ tab: TabType; investments: Investment[] }>(
  { tab, investments: [] }
);
const isStale = state.tab !== tab;
return {
  investments: isStale ? [] : state.investments,
  loading: isStale || loading,
};
```

Narrow the effect's `userData` dependency (currently the whole object, line 50)
to a stable key derived from `sharedPortfolios`. Any unrelated `userData` change
currently re-subscribes and flashes the spinner even on the My Portfolio tab —
the same visible symptom from a different cause.

## UI changes

**`Header.tsx`** — a `<select>` placed before the Share Portfolio button,
styled to match the currency field at `InvestmentForm.tsx:239`.

**`PortfolioSummary.tsx`** — the Mixed Currency Warning block (lines 25-42) is
deleted. A notice takes its place, rendered *only* when `conversionFailed`:
"Live rates unavailable — totals shown unconverted and may be inaccurate."

**`InvestmentCard.tsx`** — buy price, current price, invested, current value and
profit/loss all come from `toDisplayValues`. A small badge showing the native
currency code appears when `converted` is `true`, so the original currency is
never hidden.

Critical detail: the `currentPrice` prop passed to `EditInvestmentModal`
(`InvestmentCard.tsx:170`) must remain the **native** price. The edit form reads
and writes native values; passing a converted price would write converted
numbers back to the database.

**`InvestmentList.tsx`** and **`PublicPortfolio.tsx`** — thread the display
currency through to cards and stats.

## Error handling

| Condition | Behaviour |
| --- | --- |
| Display currency equals holding currency | No conversion, no rate lookup |
| Rate underivable (price fetch failed) | Row stays native; portfolio sets `conversionFailed`; `totalsCurrency` becomes the largest holding's currency; notice shown; cards render native |
| Direct quote missing but rate available | Current price derived via `nativeCurrentPrice * rate` |
| No live price at all | Falls back to buy price, converted — same as today's behaviour |
| Coin quoted at `0` | Treated as a real price for value; skipped for rate derivation |
| Invalid or absent `localStorage` value | Falls back to USD |
| Empty portfolio | No tiles rendered; unchanged from today |

## Testing

New — `src/utils/currency.test.ts`:
- identity rate for matching currencies
- rate derived correctly from a single coin quoted in both currencies
- median taken across multiple coins
- coins quoted `<= 0` skipped during derivation
- `null` returned when no coin carries both currencies
- `toDisplayValues` prefers the direct quote over the derived rate
- `toDisplayValues` returns native values with `converted: false` when the rate
  is `null`

Updated — `src/utils/calculations.test.ts`:
- `'should handle mixed currencies correctly'` (line 161) currently asserts the
  unconverted sum `1900`. Rewritten to assert converted totals.
- New case asserting `conversionFailed` and largest-holding `totalsCurrency`
  when no rate is derivable.
- New case asserting `conversionFailed` is `true` when every holding shares a
  currency that is *not* the selected one and no rate is derivable.

Updated — `src/components/investments/PortfolioSummary.test.tsx`: notice absent
when conversion succeeds, present when it fails.

Updated — `src/components/investments/InvestmentCard.test.tsx`: converted
figures rendered, native badge present when converted, absent when not.

New — `useInvestments` stale-tab guard: switching tabs yields `[]` and
`loading: true` until data for the new tab arrives.

## Out of scope

- Historical FX rates and purchase-date cost basis.
- Persisting the display currency to Firebase. It would sync across devices but
  requires a `database.rules.json` change, since `users/{uid}` currently has
  `"$other": { ".validate": false }` and would reject a new field.
- Caching FX rates across sessions.
- Any change to how currency is stored on an investment.

## Delivery note

The two problems are independent. Problem 2 is roughly fifteen lines in one
file; problem 1 touches eleven. They can ship as separate commits, and the tab
fix can land first if preferred.
