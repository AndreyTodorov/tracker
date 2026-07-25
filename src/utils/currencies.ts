/**
 * The currencies an investment can be held in and the portfolio can be shown
 * in. Single source of truth: the investment service validates against it, the
 * CoinGecko service requests quotes in it, and both the investment form and
 * the header picker render it.
 *
 * Ordered as the investment form has always listed them, EUR first.
 */
export interface SupportedCurrency {
  code: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CHF', symbol: 'Fr' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
];

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(({ code }) => code);

export const isSupportedCurrency = (code: string | null | undefined): boolean =>
  typeof code === 'string' && SUPPORTED_CURRENCY_CODES.includes(code.toUpperCase());
