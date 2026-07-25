import { TrendingUp, TrendingDown, Wallet, PieChart, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercentage, getColorClass, getBgColorClass } from '../../utils/formatters';
import type { Portfolio } from '../../types';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export const PortfolioSummary = ({ portfolio }: PortfolioSummaryProps) => {
  // Count unique assets by symbol
  const uniqueAssets = new Set(portfolio.investments.map(inv => inv.assetSymbol)).size;
  const totalInvestments = portfolio.investments.length;

  // Mixed currencies are normally converted into the selected display
  // currency, so they need no warning. The only remaining problem case is
  // conversion being impossible, which leaves the totals summed unconverted.
  const displayCurrency = portfolio.totalsCurrency;

  return (
    <>
      {portfolio.conversionFailed && (
        <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-400 mb-1">
                Live rates unavailable
              </p>
              <p className="text-xs text-content/80">
                Totals are shown in {displayCurrency} without currency conversion, so
                they may be inaccurate. They will convert automatically once prices
                can be fetched again.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Value */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-accent/10 border border-accent/25">
            <Wallet size={18} className="text-accent" />
          </div>
          <div className="text-[11px] text-muted uppercase tracking-wider">Total Value</div>
        </div>
        <div className="tnum text-3xl font-semibold tracking-tight">{formatCurrency(portfolio.totalValue, displayCurrency)}</div>
        <div className="text-xs text-muted mt-1.5">
          Invested: <span className="tnum text-content/80">{formatCurrency(portfolio.totalInvested, displayCurrency)}</span>
        </div>
      </Card>

      {/* Total Profit/Loss */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`grid place-items-center w-9 h-9 rounded-lg border border-line ${getBgColorClass(portfolio.totalProfit)}`}>
            {portfolio.totalProfit >= 0
              ? <TrendingUp size={18} className="text-profit" />
              : <TrendingDown size={18} className="text-loss" />}
          </div>
          <div className="text-[11px] text-muted uppercase tracking-wider">Total Profit/Loss</div>
        </div>
        <div className={`tnum text-3xl font-semibold tracking-tight ${getColorClass(portfolio.totalProfit)}`}>
          {formatCurrency(portfolio.totalProfit, displayCurrency)}
        </div>
        <div className={`tnum text-xs mt-1.5 ${getColorClass(portfolio.totalProfitPercentage)}`}>
          {formatPercentage(portfolio.totalProfitPercentage)}
        </div>
      </Card>

      {/* Number of Assets */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-surface2 border border-line">
            <PieChart size={18} className="text-muted" />
          </div>
          <div className="text-[11px] text-muted uppercase tracking-wider">Assets</div>
        </div>
        <div className="tnum text-3xl font-semibold tracking-tight">{uniqueAssets}</div>
        <div className="text-xs text-muted mt-1.5">
          {totalInvestments} {totalInvestments === 1 ? 'investment' : 'investments'}
        </div>
      </Card>
    </div>
    </>
  );
};
