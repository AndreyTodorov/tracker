/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchCrypto,
  getCryptoPrice,
  getMultipleCryptoPrices,
  getCryptoDetails,
  clearPriceCache,
} from './coingecko.service';

// Mock fetch globally
globalThis.fetch = vi.fn() as typeof fetch;

describe('CoinGecko Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPriceCache(); // Clear cache before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchCrypto', () => {
    it('should throw error for non-string query', async () => {
      await expect(searchCrypto(123 as any)).rejects.toThrow(
        'Search query must be a non-empty string'
      );
    });

    it('should throw error for empty query', async () => {
      await expect(searchCrypto('')).rejects.toThrow(
        'Search query must be a non-empty string'
      );
    });

    it('should return empty array for query shorter than 2 characters', async () => {
      const result = await searchCrypto('a');
      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should successfully search for cryptocurrencies', async () => {
      const mockResponse = {
        coins: [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        ],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchCrypto('bit');
      expect(result).toEqual(mockResponse.coins);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?query=bit')
      );
    });

    it('should limit results to 10 items', async () => {
      const mockCoins = Array.from({ length: 20 }, (_, i) => ({
        id: `coin-${i}`,
        name: `Coin ${i}`,
        symbol: `C${i}`,
      }));

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ coins: mockCoins }),
      });

      const result = await searchCrypto('coin');
      expect(result).toHaveLength(10);
    });

    it('should handle 429 rate limit error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(searchCrypto('bitcoin')).rejects.toThrow(
        'API rate limit exceeded'
      );
    });

    it('should handle other API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await searchCrypto('bitcoin');
      expect(result).toEqual([]);
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await searchCrypto('bitcoin');
      expect(result).toEqual([]);
    });
  });

  describe('getCryptoPrice', () => {
    it('should throw error for non-string symbol', async () => {
      await expect(getCryptoPrice(123 as any)).rejects.toThrow(
        'Symbol must be a non-empty string'
      );
    });

    it('should throw error for empty symbol', async () => {
      await expect(getCryptoPrice('')).rejects.toThrow(
        'Symbol must be a non-empty string'
      );
    });

    it('should successfully fetch crypto price', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      const result = await getCryptoPrice('bitcoin');
      expect(result).toBe(50000);
    });

    it('should normalize symbol to lowercase', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      await getCryptoPrice('BITCOIN');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('ids=bitcoin')
      );
    });

    it('should return cached price within cache duration', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      // First call - should fetch
      const result1 = await getCryptoPrice('bitcoin');
      expect(result1).toBe(50000);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await getCryptoPrice('bitcoin');
      expect(result2).toBe(50000);
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should handle 429 rate limit by returning null', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const result = await getCryptoPrice('bitcoin');
      expect(result).toBeNull();
    });

    it('should return null for non-existent symbol', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await getCryptoPrice('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle network errors by returning null', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getCryptoPrice('bitcoin');
      expect(result).toBeNull();
    });
  });

  describe('getMultipleCryptoPrices', () => {
    it('should throw error for empty symbols array', async () => {
      await expect(getMultipleCryptoPrices([])).rejects.toThrow(
        'Symbols must be a non-empty array'
      );
    });

    it('should throw error for non-array symbols', async () => {
      await expect(getMultipleCryptoPrices('bitcoin' as any)).rejects.toThrow(
        'Symbols must be a non-empty array'
      );
    });

    it('should throw error for empty currencies array', async () => {
      await expect(
        getMultipleCryptoPrices(['bitcoin'], [])
      ).rejects.toThrow('Currencies must be a non-empty array');
    });

    it('should throw error for invalid currency', async () => {
      await expect(
        getMultipleCryptoPrices(['bitcoin'], ['INVALID'])
      ).rejects.toThrow('Invalid currencies: INVALID');
    });

    it('should accept all valid currencies', async () => {
      const validCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'chf', 'cad', 'aud'];

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          bitcoin: {
            usd: 50000,
            eur: 45000,
            gbp: 40000,
            jpy: 5000000,
            chf: 48000,
            cad: 65000,
            aud: 70000,
          },
        }),
      });

      const result = await getMultipleCryptoPrices(['bitcoin'], validCurrencies);
      expect(result.has('bitcoin')).toBe(true);
    });

    it('should successfully fetch multiple crypto prices', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { usd: 50000 },
          ethereum: { usd: 3000 },
        }),
      });

      const result = await getMultipleCryptoPrices(['bitcoin', 'ethereum']);
      expect(result.get('bitcoin')?.get('usd')).toBe(50000);
      expect(result.get('ethereum')?.get('usd')).toBe(3000);
    });

    it('should normalize currencies to lowercase', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { eur: 45000 },
        }),
      });

      await getMultipleCryptoPrices(['bitcoin'], ['EUR']);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('vs_currencies=eur')
      );
    });

    it('should fetch multiple currencies for multiple symbols', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { usd: 50000, eur: 45000 },
          ethereum: { usd: 3000, eur: 2700 },
        }),
      });

      const result = await getMultipleCryptoPrices(
        ['bitcoin', 'ethereum'],
        ['usd', 'eur']
      );

      expect(result.get('bitcoin')?.get('usd')).toBe(50000);
      expect(result.get('bitcoin')?.get('eur')).toBe(45000);
      expect(result.get('ethereum')?.get('usd')).toBe(3000);
      expect(result.get('ethereum')?.get('eur')).toBe(2700);
    });

    it('should use cache for USD prices', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { usd: 50000 },
        }),
      });

      // First call
      await getMultipleCryptoPrices(['bitcoin'], ['usd']);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await getMultipleCryptoPrices(['bitcoin'], ['usd']);
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1
      expect(result.get('bitcoin')?.get('usd')).toBe(50000);
    });

    it('should handle 429 rate limit by returning cached prices only', async () => {
      // First, populate cache
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { usd: 50000 },
        }),
      });
      await getMultipleCryptoPrices(['bitcoin'], ['usd']);

      // Clear mock call count
      vi.clearAllMocks();

      // Now try to fetch with rate limit
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const result = await getMultipleCryptoPrices(
        ['bitcoin', 'ethereum'],
        ['usd']
      );

      // Should return cached bitcoin price but not ethereum
      expect(result.get('bitcoin')?.get('usd')).toBe(50000);
      expect(result.has('ethereum')).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getMultipleCryptoPrices(['bitcoin']);
      expect(result.size).toBe(0);
    });
  });

  describe('getCryptoDetails', () => {
    it('should throw error for non-string id', async () => {
      await expect(getCryptoDetails(123 as any)).rejects.toThrow(
        'Cryptocurrency ID must be a non-empty string'
      );
    });

    it('should throw error for empty id', async () => {
      await expect(getCryptoDetails('')).rejects.toThrow(
        'Cryptocurrency ID must be a non-empty string'
      );
    });

    it('should throw error for invalid currency', async () => {
      await expect(getCryptoDetails('bitcoin', 'INVALID')).rejects.toThrow(
        'Invalid currency: INVALID'
      );
    });

    it('should successfully fetch crypto details', async () => {
      const mockDetails = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        market_cap: 1000000000,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockDetails],
      });

      const result = await getCryptoDetails('bitcoin');
      expect(result).toEqual(mockDetails);
    });

    it('should default to USD currency', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'bitcoin' }],
      });

      await getCryptoDetails('bitcoin');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('vs_currency=usd')
      );
    });

    it('should accept valid currencies', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'bitcoin' }],
      });

      await getCryptoDetails('bitcoin', 'eur');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('vs_currency=eur')
      );
    });

    it('should normalize currency to lowercase', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'bitcoin' }],
      });

      await getCryptoDetails('bitcoin', 'EUR');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('vs_currency=eur')
      );
    });

    it('should handle 429 rate limit error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(getCryptoDetails('bitcoin')).rejects.toThrow(
        'API rate limit exceeded'
      );
    });

    it('should return null for non-existent cryptocurrency', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getCryptoDetails('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle network errors by returning null', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getCryptoDetails('bitcoin');
      expect(result).toBeNull();
    });
  });

  describe('clearPriceCache', () => {
    it('should clear the price cache', async () => {
      // Populate cache
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      await getCryptoPrice('bitcoin');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Verify cache is used
      await getCryptoPrice('bitcoin');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      clearPriceCache();

      // Should fetch again
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 51000 } }),
      });

      const result = await getCryptoPrice('bitcoin');
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe(51000);
    });
  });
});
