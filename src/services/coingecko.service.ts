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
  symbols: string[]
): Promise<Map<string, number>> => {
  const prices = new Map<string, number>();
  const symbolsToFetch: string[] = [];

  // Check cache for each symbol
  symbols.forEach((symbol) => {
    const normalizedSymbol = symbol.toLowerCase();
    const cached = priceCache.get(normalizedSymbol);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      prices.set(normalizedSymbol, cached.price);
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
      `${COINGECKO_API_BASE}/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }

    const data = await response.json();

    symbolsToFetch.forEach((symbol) => {
      const price = data[symbol]?.usd;
      if (price) {
        prices.set(symbol, price);
        priceCache.set(symbol, { price, timestamp: Date.now() });
      }
    });
  } catch (error) {
    console.error('Error fetching multiple crypto prices:', error);
  }

  return prices;
};

export const getCryptoDetails = async (id: string): Promise<CoinGeckoResponse | null> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${id}&order=market_cap_desc&per_page=1&page=1`
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
