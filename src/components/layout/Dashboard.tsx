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

  // Extract unique crypto symbols for price fetching
  const cryptoSymbols = useMemo(() => {
    return Array.from(new Set(investments.map((inv) => inv.assetSymbol.toLowerCase())));
  }, [investments]);

  const { prices, lastUpdate } = useCryptoPrices(cryptoSymbols);

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
          {/* Left Side - Investment Form (40%) */}
          <div className="lg:col-span-5 space-y-6">
            <InvestmentForm />

            {/* Last Update Info */}
            <div className="glass rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">
                  Last updated: {formatDateTime(lastUpdate as any)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Prices update every 30 seconds
              </p>
            </div>
          </div>

          {/* Right Side - Investment List (60%) */}
          <div className="lg:col-span-7">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'glass-strong text-white'
                        : 'glass hover:bg-white/10 text-gray-400'
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
