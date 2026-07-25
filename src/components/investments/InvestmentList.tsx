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
  displayCurrency: string;
}

export const InvestmentList = ({ investments, prices, loading, displayCurrency }: InvestmentListProps) => {
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
          Start tracking your crypto investments by adding your first one using the form on the left.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {investments.map((investment) => {
        const symbolPrices = prices.get(getPriceKey(investment));

        return (
          <InvestmentCard
            key={investment.id}
            investment={investment}
            display={toDisplayValues(investment, prices, displayCurrency)}
            nativeCurrentPrice={symbolPrices?.get(investment.currency.toLowerCase())}
            prices={prices}
          />
        );
      })}
    </div>
  );
};
