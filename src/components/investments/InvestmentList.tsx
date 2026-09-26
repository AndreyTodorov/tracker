import type { Investment } from '../../types';
import { InvestmentCard } from './InvestmentCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getPriceKey } from '../../utils/calculations';
import { toDisplayValues } from '../../utils/currency';
import { Plus, TrendingUp } from 'lucide-react';

interface InvestmentListProps {
  investments: Investment[];
  prices: Map<string, Map<string, number>>;
  loading: boolean;
  /** When given, the grid ends with a tile that starts adding an investment. */
  onAdd?: () => void;
}

export const InvestmentList = ({ investments, prices, loading, onAdd }: InvestmentListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const addTile = onAdd && (
    <button
      type="button"
      onClick={onAdd}
      className="min-h-[132px] flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] border border-dashed border-faint text-accent text-sm font-semibold transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="grid place-items-center w-9 h-9 rounded-full bg-accent text-ink">
        <Plus size={18} strokeWidth={2.6} />
      </span>
      Add investment
    </button>
  );

  if (investments.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid place-items-center w-16 h-16 rounded-full bg-surface border border-line mb-4">
            <TrendingUp size={28} className="text-muted" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight mb-2">No investments yet</h3>
          <p className="text-muted max-w-md">
            Start tracking your crypto investments by adding your first one.
          </p>
        </div>
        {addTile && <div className="grid grid-cols-2 gap-2.5">{addTile}</div>}
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 lg:gap-3.5">
      {investments.map((investment) => {
        const symbolPrices = prices.get(getPriceKey(investment));

        return (
          <InvestmentCard
            key={investment.id}
            investment={investment}
            // Holdings stay in their purchase currency; the display currency
            // selected in the header applies to the portfolio totals only.
            display={toDisplayValues(investment, prices, investment.currency)}
            nativeCurrentPrice={symbolPrices?.get(investment.currency.toLowerCase())}
            prices={prices}
          />
        );
      })}
      {addTile}
    </div>
  );
};
