import { useState, useEffect, useMemo } from 'react';
import { getMultipleCryptoPrices } from '../services/coingecko.service';
import { getPriceKey } from '../utils/calculations';
import type { Investment } from '../types';

export const UPDATE_INTERVAL = 60000; // 60 seconds (reduced from 30s to avoid rate limiting)

export const useCryptoPrices = (investments: Investment[]) => {
  const [prices, setPrices] = useState<Map<string, Map<string, number>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Derive the unique symbols/currencies to fetch, plus a stable key that only
  // changes when that set changes (so the polling interval isn't reset on every
  // re-render that hands us a new-but-equivalent investments array).
  const { symbols, currencies, investmentsKey } = useMemo(() => {
    const symbols = [...new Set(investments.map(getPriceKey))];
    const currencies = [...new Set(investments.map((inv) => inv.currency))];
    const investmentsKey = investments
      .map((inv) => `${getPriceKey(inv)}-${inv.currency}`)
      .sort()
      .join(',');
    return { symbols, currencies, investmentsKey };
  }, [investments]);

  useEffect(() => {
    if (symbols.length === 0) {
      // Intentionally syncing state to the (empty) investments prop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrices(new Map());
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
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
    // symbols/currencies are derived from investmentsKey, so it alone is sufficient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investmentsKey]);

  return { prices, loading, lastUpdate };
};
