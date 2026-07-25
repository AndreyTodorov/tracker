import type { Investment } from '../types';

// The key used to look up live prices for an investment. New records store the
// CoinGecko id in `coinId`; legacy records kept it in `assetSymbol`.
export const getPriceKey = (investment: Pick<Investment, 'coinId' | 'assetSymbol'>): string =>
  (investment.coinId || investment.assetSymbol).toLowerCase();

export const calculateProfit = (
  buyPrice: number,
  currentPrice: number,
  quantity: number
): { absolute: number; percentage: number } => {
  const currentValue = currentPrice * quantity;
  const investedAmount = buyPrice * quantity;
  const absolute = currentValue - investedAmount;
  const percentage = investedAmount > 0 ? (absolute / investedAmount) * 100 : 0;

  return {
    absolute: Number(absolute.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
  };
};

// calculatePortfolioStats lives in ./currency: portfolio totals are currency
// aware, and keeping it there avoids an import cycle with this module.

export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
