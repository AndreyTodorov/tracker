import { useState, useEffect, useMemo } from 'react';
import { getMultipleCryptoPrices } from '../services/coingecko.service';
import type { Investment } from '../types';

const UPDATE_INTERVAL = 60000; // 60 seconds (reduced from 30s to avoid rate limiting)

export const useCryptoPrices = (investments: Investment[]) => {
  const [prices, setPrices] = useState<Map<string, Map<string, number>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Create a stable dependency key for the investments
  const investmentsKey = useMemo(
    () => investments.map(inv => `${inv.assetSymbol}-${inv.currency}`).sort().join(','),
    [investments]
  );

  useEffect(() => {
    if (investments.length === 0) {
      setPrices(new Map());
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        // Extract unique symbols and currencies
        const symbols = [...new Set(investments.map(inv => inv.assetSymbol))];
        const currencies = [...new Set(investments.map(inv => inv.currency))];

        const newPrices = await getMultipleCryptoPrices(symbols, currencies);
        setPrices(newPrices);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPrices();

    // Set up interval for updates
    const interval = setInterval(fetchPrices, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [investmentsKey, investments]);

  return { prices, loading, lastUpdate };
};
