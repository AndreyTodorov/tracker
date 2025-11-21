import { TrendingUp, Wallet, PieChart } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercentage, getColorClass } from '../../utils/formatters';
import type { Portfolio } from '../../types';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export const PortfolioSummary = ({ portfolio }: PortfolioSummaryProps) => {
  // Count unique assets by symbol
  const uniqueAssets = new Set(portfolio.investments.map(inv => inv.assetSymbol)).size;
  const totalInvestments = portfolio.investments.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Value */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Wallet size={20} className="text-blue-400" />
          </div>
          <div className="text-sm text-gray-400">Total Value</div>
        </div>
        <div className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</div>
        <div className="text-xs text-gray-500 mt-1">
          Invested: {formatCurrency(portfolio.totalInvested)}
        </div>
      </Card>

      {/* Total Profit/Loss */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <TrendingUp size={20} className="text-purple-400" />
          </div>
          <div className="text-sm text-gray-400">Total Profit/Loss</div>
        </div>
        <div className={`text-2xl font-bold ${getColorClass(portfolio.totalProfit)}`}>
          {formatCurrency(portfolio.totalProfit)}
        </div>
        <div className={`text-xs mt-1 ${getColorClass(portfolio.totalProfitPercentage)}`}>
          {formatPercentage(portfolio.totalProfitPercentage)}
        </div>
      </Card>

      {/* Number of Assets */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-500/20">
            <PieChart size={20} className="text-green-400" />
          </div>
          <div className="text-sm text-gray-400">Assets</div>
        </div>
        <div className="text-2xl font-bold">{uniqueAssets}</div>
        <div className="text-xs text-gray-500 mt-1">
          {totalInvestments} {totalInvestments === 1 ? 'investment' : 'investments'}
        </div>
      </Card>
    </div>
  );
};
