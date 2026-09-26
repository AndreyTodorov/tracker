import { useState, useMemo } from 'react';
import { Header } from './Header';
import { InvestmentForm } from '../investments/InvestmentForm';
import { InvestmentList } from '../investments/InvestmentList';
import { PortfolioSummary } from '../investments/PortfolioSummary';
import { Modal } from '../ui/Modal';
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
  // Matches Tailwind's `lg` breakpoint, where the form gets its own column.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [showForm, setShowForm] = useState(false);

  const { prices, lastUpdate } = useCryptoPrices(investments, displayCurrency);

  // Calculate portfolio stats
  const portfolio = useMemo(() => {
    return calculatePortfolioStats(investments, prices, displayCurrency);
  }, [investments, prices, displayCurrency]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'my', label: 'My portfolio' },
    { id: 'shared', label: 'Shared' },
    { id: 'all', label: 'Everyone' },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 lg:px-10 py-5 lg:py-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
          <div>
            {/* Portfolio Summary */}
            {!loading && investments.length > 0 && (
              <PortfolioSummary portfolio={portfolio} lastUpdate={lastUpdate} />
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-4 lg:mb-5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={`
                    h-9 px-4 rounded-full text-[13px] transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'bg-content text-ink font-semibold'
                        : 'border border-line text-content/70 font-medium hover:text-content hover:border-faint'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Investment List */}
            <InvestmentList
              investments={investments}
              prices={prices}
              loading={loading}
              onAdd={isDesktop ? undefined : () => setShowForm(true)}
            />
          </div>

          {/* Desktop: the form keeps its own column */}
          {isDesktop && (
            <aside className="sticky top-24">
              <InvestmentForm />
            </aside>
          )}
        </div>
      </main>

      {/* Mobile: the form opens from the add tile */}
      {!isDesktop && (
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add investment">
          <InvestmentForm embedded onAdded={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
};
