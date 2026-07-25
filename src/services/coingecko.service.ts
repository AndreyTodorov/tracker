import { SUPPORTED_CURRENCY_CODES } from '../utils/currencies';
import type { CoinGeckoResponse, CoinGeckoSearchResult } from '../types';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

const VALID_CURRENCIES = SUPPORTED_CURRENCY_CODES.map((code) => code.toLowerCase());

// Cached per symbol *and* currency. Keying by symbol alone meant a request for
// two currencies could never be served from cache, so every poll, tab switch
// and currency change hit the network.
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds

// Identical requests issued while one is already in flight share its promise.
// React StrictMode runs effects twice in development, which would otherwise
// double every request.
const inFlightRequests = new Map<string, Promise<void>>();

// Hammering a tripped rate limit only extends it, so requests pause and the
// pause doubles while the limit keeps being hit.
export const RATE_LIMIT_BASE_BACKOFF = 120000; // 2 minutes
const RATE_LIMIT_MAX_BACKOFF = 480000; // 8 minutes
let rateLimitedUntil = 0;
let consecutiveRateLimits = 0;

const cacheKey = (symbol: string, currency: string) => `${symbol}:${currency}`;

const readCached = (symbol: string, currency: string): number | undefined => {
  const entry = priceCache.get(cacheKey(symbol, currency));
  if (!entry || Date.now() - entry.timestamp >= CACHE_DURATION) {
    return undefined;
  }
  return entry.price;
};

const fetchIntoCache = async (symbols: string[], currencies: string[]): Promise<void> => {
  if (Date.now() < rateLimitedUntil) {
    return;
  }

  const url =
    `${COINGECKO_API_BASE}/simple/price` +
    `?ids=${symbols.join(',')}&vs_currencies=${currencies.join(',')}`;

  const existing = inFlightRequests.get(url);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          consecutiveRateLimits += 1;
          const backoff = Math.min(
            RATE_LIMIT_BASE_BACKOFF * 2 ** (consecutiveRateLimits - 1),
            RATE_LIMIT_MAX_BACKOFF
          );
          rateLimitedUntil = Date.now() + backoff;
          console.warn(
            `CoinGecko rate limit hit; pausing price requests for ${Math.round(backoff / 1000)}s`
          );
          return;
        }
        throw new Error('Failed to fetch crypto prices');
      }

      consecutiveRateLimits = 0;
      rateLimitedUntil = 0;

      const data = await response.json();
      const now = Date.now();
      Object.entries(data ?? {}).forEach(([symbol, quotes]) => {
        currencies.forEach((currency) => {
          const price = (quotes as Record<string, number> | null)?.[currency];
          // A price of 0 is a real price (a worthless coin), so check the type
          // rather than truthiness.
          if (typeof price === 'number') {
            priceCache.set(cacheKey(symbol, currency), { price, timestamp: now });
          }
        });
      });
    } catch (error) {
      console.error('Error fetching multiple crypto prices:', error);
    }
  })();

  inFlightRequests.set(url, request);
  try {
    await request;
  } finally {
    inFlightRequests.delete(url);
  }
};

export const searchCrypto = async (query: string): Promise<CoinGeckoSearchResult[]> => {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query must be a non-empty string');
  }
  if (query.length < 2) return [];

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait a moment before searching again.');
      }
      throw new Error('Failed to search cryptocurrencies');
    }

    const data = await response.json();
    return data.coins?.slice(0, 10) || [];
  } catch (error) {
    console.error('Error searching crypto:', error);
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw error; // Re-throw rate limit errors so they can be shown to user
    }
    return [];
  }
};

export const getMultipleCryptoPrices = async (
  symbols: string[],
  currencies: string[] = ['usd']
): Promise<Map<string, Map<string, number>>> => {
  // Validate inputs
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error('Symbols must be a non-empty array');
  }
  if (!Array.isArray(currencies) || currencies.length === 0) {
    throw new Error('Currencies must be a non-empty array');
  }

  // Validate all currencies are supported
  const invalidCurrencies = currencies.filter(
    c => !VALID_CURRENCIES.includes(c.toLowerCase())
  );
  if (invalidCurrencies.length > 0) {
    throw new Error(
      `Invalid currencies: ${invalidCurrencies.join(', ')}. Supported currencies: ${VALID_CURRENCIES.join(', ')}`
    );
  }

  const normalizedCurrencies = currencies.map((c) => c.toLowerCase());
  const normalizedSymbols = symbols.map((s) => s.toLowerCase());

  // Request only what is actually missing. The endpoint takes one list of ids
  // and one list of currencies, so a symbol missing any currency pulls in the
  // whole missing set — still one request, and far less than refetching
  // everything on every poll.
  const missingSymbols = new Set<string>();
  const missingCurrencies = new Set<string>();
  normalizedSymbols.forEach((symbol) => {
    normalizedCurrencies.forEach((currency) => {
      if (readCached(symbol, currency) === undefined) {
        missingSymbols.add(symbol);
        missingCurrencies.add(currency);
      }
    });
  });

  if (missingSymbols.size > 0) {
    await fetchIntoCache([...missingSymbols], [...missingCurrencies]);
  }

  const prices = new Map<string, Map<string, number>>();
  normalizedSymbols.forEach((symbol) => {
    const currencyPrices = new Map<string, number>();
    normalizedCurrencies.forEach((currency) => {
      const price = readCached(symbol, currency);
      if (price !== undefined) {
        currencyPrices.set(currency, price);
      }
    });
    if (currencyPrices.size > 0) {
      prices.set(symbol, currencyPrices);
    }
  });

  return prices;
};

export const getCryptoDetails = async (id: string, currency: string = 'usd'): Promise<CoinGeckoResponse | null> => {
  // Validate inputs
  if (!id || typeof id !== 'string') {
    throw new Error('Cryptocurrency ID must be a non-empty string');
  }
  if (!VALID_CURRENCIES.includes(currency.toLowerCase())) {
    throw new Error(
      `Invalid currency: ${currency}. Supported currencies: ${VALID_CURRENCIES.join(', ')}`
    );
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=${currency.toLowerCase()}&ids=${id}&order=market_cap_desc&per_page=1&page=1`
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error('Failed to fetch crypto details');
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching crypto details:', error);
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw error; // Re-throw rate limit errors so they can be shown to user
    }
    return null;
  }
};

// Clear cache manually if needed
export const clearPriceCache = () => {
  priceCache.clear();
  inFlightRequests.clear();
  rateLimitedUntil = 0;
  consecutiveRateLimits = 0;
};
