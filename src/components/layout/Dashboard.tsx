import { useState, useMemo } from 'react';
import { Header } from './Header';
import { InvestmentForm } from '../investments/InvestmentForm';
import { InvestmentList } from '../investments/InvestmentList';
import { PortfolioSummary } from '../investments/PortfolioSummary';
import { useInvestments } from '../../hooks/useInvestments';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { calculatePortfolioStats } from '../../utils/calculations';
import type { TabType } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const { investments, loading } = useInvestments(activeTab);

  const { prices, lastUpdate } = useCryptoPrices(investments);

  // Calculate portfolio stats
  const portfolio = useMemo(() => {
    return calculatePortfolioStats(investments, prices);
  }, [investments, prices]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'my', label: 'My Portfolio' },
    { id: 'shared', label: 'Shared' },
    { id: 'all', label: 'Everyone' },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Split View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side - Investment Form (33%) */}
          <div className="lg:col-span-4 space-y-6">
            <InvestmentForm />

            {/* Last Update Info */}
            <div className="panel rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-profit opacity-60 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-profit" />
                </span>
                <span className="text-xs text-muted">
                  Last updated: <span className="tnum text-content/80">{formatDateTime(lastUpdate)}</span>
                </span>
              </div>
              <p className="text-xs text-muted/70 mt-1">
                Prices update every 60 seconds
              </p>
            </div>
          </div>

          {/* Right Side - Investment List (67%) */}
          <div className="lg:col-span-8">
            {/* Tabs */}
            <div className="inline-flex gap-1 mb-6 p-1 rounded-lg bg-surface border border-line">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap
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
              <PortfolioSummary portfolio={portfolio} />
            )}

            {/* Investment List */}
            <InvestmentList
              investments={investments}
              prices={prices}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
