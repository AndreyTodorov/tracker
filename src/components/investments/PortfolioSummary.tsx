import { TrendingUp, TrendingDown, Wallet, PieChart, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercentage, formatDateTime, formatTime, getColorClass, getBgColorClass } from '../../utils/formatters';
import type { Portfolio } from '../../types';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  /** When live prices were last fetched. */
  lastUpdate?: Date;
}

export const PortfolioSummary = ({ portfolio, lastUpdate }: PortfolioSummaryProps) => {
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

      <div className="grid grid-cols-1 min-[360px]:grid-cols-[1fr_auto] md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
      {/* Total Value */}
      <Card className="min-[360px]:col-span-2 md:col-span-1 p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-accent/10 border border-accent/25">
            <Wallet size={18} className="text-accent" />
          </div>
          <div className="text-[11px] text-muted uppercase tracking-wider">Total Value</div>
        </div>
        <div className="tnum text-3xl font-semibold tracking-tight">{formatCurrency(portfolio.totalValue, displayCurrency)}</div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted mt-1.5">
          <span className="whitespace-nowrap">
            Invested: <span className="tnum text-content/80">{formatCurrency(portfolio.totalInvested, displayCurrency)}</span>
          </span>
          {lastUpdate && (
            <div
              className="flex items-center gap-1.5 whitespace-nowrap"
              title={`Prices update every 60 seconds. Last updated ${formatDateTime(lastUpdate)}.`}
            >
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-profit opacity-60 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-profit" />
              </span>
              <span className="tnum">Live · {formatTime(lastUpdate)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Total Profit/Loss */}
      <Card className="min-w-0 p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`grid place-items-center w-9 h-9 rounded-lg border border-line ${getBgColorClass(portfolio.totalProfit)}`}>
            {portfolio.totalProfit >= 0
              ? <TrendingUp size={18} className="text-profit" />
              : <TrendingDown size={18} className="text-loss" />}
          </div>
          <div className="text-[11px] text-muted uppercase tracking-wider">Total Profit/Loss</div>
        </div>
        <div className={`tnum text-2xl md:text-3xl font-semibold tracking-tight truncate ${getColorClass(portfolio.totalProfit)}`}>
          {formatCurrency(portfolio.totalProfit, displayCurrency)}
        </div>
        <div className={`tnum text-xs mt-1.5 ${getColorClass(portfolio.totalProfitPercentage)}`}>
          {formatPercentage(portfolio.totalProfitPercentage)}
        </div>
      </Card>

      {/* Number of Assets */}
      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-surface2 border border-line">
            <PieChart size={18} className="text-muted" />
          </div>
          <div className="text-[11px] text-muted uppercase tracking-wider">Assets</div>
        </div>
        <div className="tnum text-2xl md:text-3xl font-semibold tracking-tight">{uniqueAssets}</div>
        <div className="text-xs text-muted mt-1.5">
          {totalInvestments} {totalInvestments === 1 ? 'investment' : 'investments'}
        </div>
      </Card>
    </div>
    </>
  );
};
