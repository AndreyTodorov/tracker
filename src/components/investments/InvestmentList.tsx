import type { Investment } from '../../types';
import { InvestmentCard } from './InvestmentCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TrendingUp } from 'lucide-react';

interface InvestmentListProps {
  investments: Investment[];
  prices: Map<string, number>;
  loading: boolean;
}

export const InvestmentList = ({ investments, prices, loading }: InvestmentListProps) => {
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
        <div className="p-4 rounded-full bg-slate-800 mb-4">
          <TrendingUp size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Investments Yet</h3>
        <p className="text-gray-400 max-w-md">
          Start tracking your crypto investments by adding your first one using the form on the left.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {investments.map((investment) => (
        <InvestmentCard
          key={investment.id}
          investment={investment}
          currentPrice={prices.get(investment.assetSymbol.toLowerCase())}
        />
      ))}
    </div>
  );
};
