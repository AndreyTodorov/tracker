import type { Investment, Portfolio } from '../types';
import { calculateProfit, getPriceKey } from './calculations';

export interface DisplayValues {
  /** The currency these numbers are actually expressed in. */
  currency: string;
  buyPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  profit: { absolute: number; percentage: number };
  /** True when the values were converted away from the holding's own currency. */
  converted: boolean;
}

/**
 * The exchange rate between two currencies, implied by coin prices.
 *
 * CoinGecko quotes every coin in every requested currency, so if a coin is
 * priced in both, the ratio of those prices is the exchange rate. That makes
 * conversion possible without a separate FX API.
 *
 * The median across coins is used rather than the first match, so a single
 * stale or nonsensical quote cannot skew the result. Non-positive quotes are
 * skipped: a delisted coin carries no rate information, and skipping also
 * removes the division-by-zero path.
 *
 * Returns null when no coin is quoted in both currencies.
 */
export const deriveRate = (
  prices: Map<string, Map<string, number>>,
  from: string,
  to: string
): number | null => {
  const fromKey = from.toLowerCase();
  const toKey = to.toLowerCase();
  if (fromKey === toKey) {
    return 1;
  }

  const ratios: number[] = [];
  prices.forEach((byCurrency) => {
    const fromPrice = byCurrency.get(fromKey);
    const toPrice = byCurrency.get(toKey);
    if (fromPrice !== undefined && toPrice !== undefined && fromPrice > 0 && toPrice > 0) {
      ratios.push(toPrice / fromPrice);
    }
  });

  if (ratios.length === 0) {
    return null;
  }

  ratios.sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length / 2)];
};

const build = (
  currency: string,
  buyPrice: number,
  currentPrice: number,
  quantity: number,
  converted: boolean
): DisplayValues => ({
  currency,
  buyPrice,
  currentPrice,
  invested: buyPrice * quantity,
  currentValue: currentPrice * quantity,
  profit: calculateProfit(buyPrice, currentPrice, quantity),
  converted,
});

/**
 * A holding's figures expressed in the requested display currency.
 *
 * The stored investment is never modified: buyPrice and currency on disk stay
 * in whatever the user actually paid, and only this derived view is converted.
 *
 * When no rate is available the holding is reported in its own currency rather
 * than being labelled with a currency it was never converted into. Callers
 * detect that by comparing `currency` against the currency they asked for.
 */
export const toDisplayValues = (
  investment: Investment,
  prices: Map<string, Map<string, number>>,
  displayCurrency: string
): DisplayValues => {
  const native = investment.currency;
  const display = displayCurrency.toUpperCase();
  const coinPrices = prices.get(getPriceKey(investment));
  const nativeQuote = coinPrices?.get(native.toLowerCase());

  const rate = deriveRate(prices, native, display);
  if (rate === null) {
    return build(
      native,
      investment.buyPrice,
      nativeQuote ?? investment.buyPrice,
      investment.quantity,
      false
    );
  }

  const buyPrice = investment.buyPrice * rate;

  // The direct quote is exact and involves no exchange rate, so it wins over
  // converting the native price. Note `??` rather than `||`: a quote of 0 is a
  // real price (a worthless coin), not a missing one.
  const directQuote = coinPrices?.get(display.toLowerCase());
  const currentPrice =
    directQuote ?? (nativeQuote !== undefined ? nativeQuote * rate : buyPrice);

  return build(
    display,
    buyPrice,
    currentPrice,
    investment.quantity,
    native.toUpperCase() !== display
  );
};

// The currency of the holding with the largest invested amount. Used to label
// totals when conversion is unavailable, so the figure shown belongs to the
// holding that dominates it rather than to whichever one happens to be first.
const largestHoldingCurrency = (rows: DisplayValues[], fallback: string): string =>
  rows.reduce(
    (largest, row) => (row.invested > largest.invested ? row : largest),
    rows[0]
  )?.currency ?? fallback;

export const calculatePortfolioStats = (
  investments: Investment[],
  prices: Map<string, Map<string, number>>,
  displayCurrency: string
): Portfolio => {
  const display = displayCurrency.toUpperCase();
  const rows = investments.map((investment) =>
    toDisplayValues(investment, prices, display)
  );

  let totalValue = 0;
  let totalInvested = 0;
  rows.forEach((row) => {
    totalValue += row.currentValue;
    totalInvested += row.invested;
  });

  // Measured against the requested currency, not against agreement between
  // rows. If every holding is EUR and USD was requested with no rate
  // available, the rows agree with each other yet none reached USD, and the
  // totals must not claim to be USD.
  const conversionFailed = rows.some((row) => row.currency !== display);

  const totalProfit = totalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0
    ? (totalProfit / totalInvested) * 100
    : 0;

  return {
    totalValue: Number(totalValue.toFixed(2)),
    totalInvested: Number(totalInvested.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    totalProfitPercentage: Number(totalProfitPercentage.toFixed(2)),
    totalsCurrency: conversionFailed ? largestHoldingCurrency(rows, display) : display,
    conversionFailed,
    investments,
  };
};
