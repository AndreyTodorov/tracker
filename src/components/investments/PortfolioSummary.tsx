import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercentage, formatDateTime, formatTime, getColorClass } from '../../utils/formatters';
import type { AllocationSlice, Portfolio } from '../../types';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  /** When live prices were last fetched. */
  lastUpdate?: Date;
}

// Largest slices first: the accent marks the biggest holding, then the ramp fades.
const SLICE_COLORS = ['bg-accent', 'bg-content', 'bg-muted', 'bg-faint'];
const OTHER_COLOR = 'bg-line';

// Keeps the bar readable: anything past the named slices is grouped as "Other".
const groupSlices = (allocation: AllocationSlice[]): AllocationSlice[] => {
  if (allocation.length <= SLICE_COLORS.length) {
    return allocation;
  }
  const named = allocation.slice(0, SLICE_COLORS.length - 1);
  const otherShare = allocation.slice(SLICE_COLORS.length - 1).reduce((sum, slice) => sum + slice.share, 0);
  return [...named, { symbol: 'Other', name: 'Other', share: otherShare }];
};

// "$8,629.58" -> ["$8,629", ".58"], so the cents can be set back.
const splitFraction = (formatted: string): [string, string] => {
  const point = formatted.lastIndexOf('.');
  return point < 0 ? [formatted, ''] : [formatted.slice(0, point), formatted.slice(point)];
};

export const PortfolioSummary = ({ portfolio, lastUpdate }: PortfolioSummaryProps) => {
  const uniqueAssets = new Set(portfolio.investments.map(inv => inv.assetSymbol)).size;

  // Mixed currencies are normally converted into the selected display
  // currency, so they need no warning. The only remaining problem case is
  // conversion being impossible, which leaves the totals summed unconverted.
  const displayCurrency = portfolio.totalsCurrency;

  const [whole, fraction] = splitFraction(formatCurrency(portfolio.totalValue, displayCurrency));
  const profitSign = portfolio.totalProfit > 0 ? '+' : '';
  const slices = groupSlices(portfolio.allocation);
  const sliceColor = (index: number, slice: AllocationSlice) =>
    slice.symbol === 'Other' ? OTHER_COLOR : SLICE_COLORS[index];
  const legend = slices.map((slice) => `${slice.symbol} ${slice.share.toFixed(1)}%`).join(' · ');

  return (
    <>
      {portfolio.conversionFailed && (
        <div className="mb-4 p-4 rounded-2xl bg-warning/10 border border-warning/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning mb-1">
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

      <section className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-8">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2 text-[13px] text-muted">
            <span>Portfolio value</span>
            {lastUpdate && (
              <span
                className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px]"
                title={`Prices update every 60 seconds. Last updated ${formatDateTime(lastUpdate)}.`}
              >
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-profit opacity-60 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-profit" />
                </span>
                Live · {formatTime(lastUpdate)}
              </span>
            )}
          </div>
          <div
            className="text-[52px] lg:text-[80px] font-semibold tracking-[-0.05em] leading-[0.95] tabular-nums break-all"
            data-testid="portfolio-value"
          >
            {whole}<span className="text-muted">{fraction}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[13px] lg:text-sm">
            <span className={`font-semibold ${getColorClass(portfolio.totalProfit)}`}>
              {profitSign}{formatCurrency(portfolio.totalProfit, displayCurrency)} ({formatPercentage(portfolio.totalProfitPercentage)})
            </span>
            <span className="text-muted">
              on {formatCurrency(portfolio.totalInvested, displayCurrency)} · {uniqueAssets} {uniqueAssets === 1 ? 'asset' : 'assets'}
            </span>
          </div>
        </div>

        {slices.length > 0 && (
          <div className="lg:pb-1.5">
            <div className="flex gap-1 h-3.5 lg:h-4" role="img" aria-label={`Allocation: ${legend}`}>
              {slices.map((slice, index) => (
                <div
                  key={slice.symbol}
                  className={`rounded ${sliceColor(index, slice)}`}
                  style={{ width: `${slice.share}%` }}
                />
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] lg:text-xs text-muted">
              {slices.map((slice, index) => (
                <span key={slice.symbol} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-sm ${sliceColor(index, slice)}`} />
                  {slice.symbol} {slice.share.toFixed(1)}%
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
};
