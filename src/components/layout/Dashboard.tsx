import { useState, useMemo } from 'react';
import { PlusCircle, ChevronDown } from 'lucide-react';
import { Header } from './Header';
import { InvestmentForm } from '../investments/InvestmentForm';
import { InvestmentList } from '../investments/InvestmentList';
import { PortfolioSummary } from '../investments/PortfolioSummary';
import { useInvestments } from '../../hooks/useInvestments';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { calculatePortfolioStats } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import type { TabType } from '../../types';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const { investments, loading } = useInvestments(activeTab);
  const { displayCurrency } = useCurrency();
  // Matches Tailwind's `lg` breakpoint, where the layout splits into two columns.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [showForm, setShowForm] = useState(false);

  const { prices, lastUpdate } = useCryptoPrices(investments, displayCurrency);

  // Calculate portfolio stats
  const portfolio = useMemo(() => {
    return calculatePortfolioStats(investments, prices, displayCurrency);
  }, [investments, prices, displayCurrency]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'my', label: 'My Portfolio' },
    { id: 'shared', label: 'Shared' },
    { id: 'all', label: 'Everyone' },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-4 lg:py-6">
        {/* Split View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side - Investment Form (33%), desktop only */}
          {isDesktop && (
            <div className="lg:col-span-4">
              <InvestmentForm />
            </div>
          )}

          {/* Right Side - Investment List (67%) */}
          <div className="lg:col-span-8">
            {/* Tabs */}
            <div className="flex w-full sm:inline-flex sm:w-auto gap-1 mb-4 lg:mb-6 p-1 rounded-lg bg-surface border border-line">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 sm:flex-none px-2 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'bg-surface2 text-content shadow-sm'
                        : 'text-muted hover:text-content'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Portfolio Summary */}
            {!loading && investments.length > 0 && (
              <PortfolioSummary portfolio={portfolio} lastUpdate={lastUpdate} />
            )}

            {/* Mobile: the form sits below the totals, collapsed until needed */}
            {!isDesktop && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowForm((open) => !open)}
                  aria-expanded={showForm}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface2 border border-line text-sm font-medium transition-colors hover:border-accent/40"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle size={18} className="text-accent" />
                    Add Investment
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-muted transition-transform ${showForm ? 'rotate-180' : ''}`}
                  />
                </button>
                {showForm && (
                  <div className="mt-3">
                    <InvestmentForm onAdded={() => setShowForm(false)} />
                  </div>
                )}
              </div>
            )}

            {/* Investment List */}
            <InvestmentList
              investments={investments}
              prices={prices}
              loading={loading}
              compact={!isDesktop}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
