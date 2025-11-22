import type { CoinGeckoResponse } from '../types';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Cache to prevent excessive API calls
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const searchCrypto = async (query: string): Promise<CoinGeckoResponse[]> => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to search cryptocurrencies');
    }

    const data = await response.json();
    return data.coins?.slice(0, 10) || [];
  } catch (error) {
    console.error('Error searching crypto:', error);
    return [];
  }
};

export const getCryptoPrice = async (symbol: string): Promise<number | null> => {
  const normalizedSymbol = symbol.toLowerCase();

  // Check cache first
  const cached = priceCache.get(normalizedSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${normalizedSymbol}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto price');
    }

    const data = await response.json();
    const price = data[normalizedSymbol]?.usd;

    if (price) {
      priceCache.set(normalizedSymbol, { price, timestamp: Date.now() });
      return price;
    }

    return null;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return null;
  }
};

export const getMultipleCryptoPrices = async (
  symbols: string[],
  currencies: string[] = ['usd']
): Promise<Map<string, Map<string, number>>> => {
  const prices = new Map<string, Map<string, number>>();
  const symbolsToFetch: string[] = [];

  // Normalize currencies to lowercase
  const normalizedCurrencies = currencies.map(c => c.toLowerCase());
  const currenciesString = normalizedCurrencies.join(',');

  // Check cache for each symbol (for now, simplified - cache only USD)
  symbols.forEach((symbol) => {
    const normalizedSymbol = symbol.toLowerCase();
    const cached = priceCache.get(normalizedSymbol);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && currencies.length === 1 && currencies[0].toLowerCase() === 'usd') {
      const currencyPrices = new Map<string, number>();
      currencyPrices.set('usd', cached.price);
      prices.set(normalizedSymbol, currencyPrices);
    } else {
      symbolsToFetch.push(normalizedSymbol);
    }
  });

  // Fetch uncached prices
  if (symbolsToFetch.length === 0) {
    return prices;
  }

  try {
    const idsString = symbolsToFetch.join(',');
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${idsString}&vs_currencies=${currenciesString}&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }

    const data = await response.json();

    symbolsToFetch.forEach((symbol) => {
      const symbolData = data[symbol];
      if (symbolData) {
        const currencyPrices = new Map<string, number>();
        normalizedCurrencies.forEach((currency) => {
          const price = symbolData[currency];
          if (price !== undefined) {
            currencyPrices.set(currency, price);
          }
        });

        if (currencyPrices.size > 0) {
          prices.set(symbol, currencyPrices);
          // Cache USD price if available
          const usdPrice = symbolData.usd;
          if (usdPrice) {
            priceCache.set(symbol, { price: usdPrice, timestamp: Date.now() });
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching multiple crypto prices:', error);
  }

  return prices;
};

export const getCryptoDetails = async (id: string, currency: string = 'usd'): Promise<CoinGeckoResponse | null> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=${currency.toLowerCase()}&ids=${id}&order=market_cap_desc&per_page=1&page=1`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto details');
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching crypto details:', error);
    return null;
  }
};

// Clear cache manually if needed
export const clearPriceCache = () => {
  priceCache.clear();
};
