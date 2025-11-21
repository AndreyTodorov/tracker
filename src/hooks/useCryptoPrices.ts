import { useState, useEffect } from 'react';
import { getMultipleCryptoPrices } from '../services/coingecko.service';

const UPDATE_INTERVAL = 30000; // 30 seconds

export const useCryptoPrices = (symbols: string[]) => {
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (symbols.length === 0) {
      setPrices(new Map());
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        const newPrices = await getMultipleCryptoPrices(symbols);
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
  }, [symbols.join(',')]);

  return { prices, loading, lastUpdate };
};
