import type { Investment, Portfolio } from '../types';

export const calculateProfit = (
  buyPrice: number,
  currentPrice: number,
  quantity: number
): { absolute: number; percentage: number } => {
  const currentValue = currentPrice * quantity;
  const investedAmount = buyPrice * quantity;
  const absolute = currentValue - investedAmount;
  const percentage = ((absolute / investedAmount) * 100);

  return {
    absolute: Number(absolute.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
  };
};

export const calculatePortfolioStats = (
  investments: Investment[],
  prices: Map<string, Map<string, number>>
): Portfolio => {
  let totalValue = 0;
  let totalInvested = 0;

  investments.forEach((investment) => {
    const symbolPrices = prices.get(investment.assetSymbol.toLowerCase());
    const currentPrice = symbolPrices?.get(investment.currency.toLowerCase()) || investment.buyPrice;
    const currentValue = currentPrice * investment.quantity;
    const investedAmount = investment.buyPrice * investment.quantity;

    totalValue += currentValue;
    totalInvested += investedAmount;
  });

  const totalProfit = totalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0
    ? (totalProfit / totalInvested) * 100
    : 0;

  return {
    totalValue: Number(totalValue.toFixed(2)),
    totalInvested: Number(totalInvested.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    totalProfitPercentage: Number(totalProfitPercentage.toFixed(2)),
    investments,
  };
};

export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
