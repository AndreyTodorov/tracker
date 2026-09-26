import type { Investment } from '../../types';
import { InvestmentCard } from './InvestmentCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getPriceKey } from '../../utils/calculations';
import { toDisplayValues } from '../../utils/currency';
import { TrendingUp } from 'lucide-react';

interface InvestmentListProps {
  investments: Investment[];
  prices: Map<string, Map<string, number>>;
  loading: boolean;
  /** Show each holding as a compact, expandable row instead of a full card. */
  compact?: boolean;
}

export const InvestmentList = ({ investments, prices, loading, compact = false }: InvestmentListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="grid place-items-center w-16 h-16 rounded-full bg-surface2 border border-line mb-4">
          <TrendingUp size={28} className="text-muted" />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-2">No investments yet</h3>
        <p className="text-muted max-w-md">
          Start tracking your crypto investments by adding your first one using the Add Investment form.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
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
            collapsible={compact}
          />
        );
      })}
    </div>
  );
};
