import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InvestmentList } from '../investments/InvestmentList';
import { PortfolioSummary } from '../investments/PortfolioSummary';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Share2, Lock, Eye } from 'lucide-react';
import { getPublicPortfolio } from '../../services/investment.service';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { calculatePortfolioStats } from '../../utils/calculations';
import type { Investment } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const PublicPortfolio = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shareCode, setShareCode] = useState(searchParams.get('code') || '');
  const [inputCode, setInputCode] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolioOwner, setPortfolioOwner] = useState('');

  const { prices, lastUpdate } = useCryptoPrices(investments);

  // Calculate portfolio stats
  const portfolio = useMemo(() => {
    return calculatePortfolioStats(investments, prices);
  }, [investments, prices]);

  useEffect(() => {
    if (shareCode) {
      loadPortfolio(shareCode);
    }
  }, [shareCode]);

  const loadPortfolio = async (code: string) => {
    if (!code || code.length !== 8) {
      setError('Share code must be 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getPublicPortfolio(code.toUpperCase());
      if (result) {
        setInvestments(result.investments);
        setPortfolioOwner(result.ownerName);
      } else {
        setError('Invalid share code or portfolio not found');
        setInvestments([]);
        setPortfolioOwner('');
      }
    } catch (err) {
      setError('Failed to load portfolio. Please try again.');
      setInvestments([]);
      setPortfolioOwner('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setShareCode(inputCode.trim().toUpperCase());
      setSearchParams({ code: inputCode.trim().toUpperCase() });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-strong border-b border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-accent">
                <Eye size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Public Portfolio Viewer</h1>
                <p className="text-sm text-gray-400">View shared crypto portfolios</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Share Code Input */}
        {!shareCode && (
          <div className="max-w-2xl mx-auto mt-20">
            <Card variant="strong" className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-gradient-accent">
                  <Share2 size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Enter Share Code</h2>
                  <p className="text-gray-400">View someone's portfolio by entering their share code</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Share Code"
                  placeholder="Enter 8-character code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  error={error}
                />
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  disabled={inputCode.trim().length !== 8}
                >
                  View Portfolio
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <Lock size={20} className="text-blue-400 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-400 mb-1">Privacy Note</p>
                    <p>You can only view portfolios that have been shared with you. Share codes are 8-character unique identifiers.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Portfolio Display */}
        {shareCode && (
          <div className="space-y-6">
            {/* Portfolio Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold">{portfolioOwner ? `${portfolioOwner}'s Portfolio` : 'Portfolio'}</h2>
                <p className="text-gray-400">Share Code: <span className="font-mono text-blue-400">{shareCode}</span></p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setShareCode('');
                  setInputCode('');
                  setSearchParams({});
                  setInvestments([]);
                  setPortfolioOwner('');
                }}
              >
                View Different Portfolio
              </Button>
            </div>

            {/* Last Update Info */}
            {investments.length > 0 && (
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
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                <p className="text-red-400">{error}</p>
              </div>
            )}

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
        )}
      </main>
    </div>
  );
};
