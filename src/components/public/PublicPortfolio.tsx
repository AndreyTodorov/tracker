import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { InvestmentList } from '../investments/InvestmentList';
import { PortfolioSummary } from '../investments/PortfolioSummary';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Share2, Lock, Eye } from 'lucide-react';
import { getPublicPortfolio } from '../../services/investment.service';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { calculatePortfolioStats } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import type { Investment } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const PublicPortfolio = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shareCode, setShareCode] = useState(searchParams.get('code') || '');
  const [inputCode, setInputCode] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolioOwner, setPortfolioOwner] = useState('');

  const { displayCurrency } = useCurrency();
  const { prices, lastUpdate } = useCryptoPrices(investments, displayCurrency);

  // Calculate portfolio stats
  const portfolio = useMemo(() => {
    return calculatePortfolioStats(investments, prices, displayCurrency);
  }, [investments, prices, displayCurrency]);

  const loadPortfolio = useCallback(async (code: string) => {
    if (!code || code.length !== 8) {
      setError('Share code must be 8 characters');
      return;
    }

    if (!currentUser) {
      setError('Please sign in to view shared portfolios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getPublicPortfolio(code.toUpperCase(), currentUser.uid);
      if (result) {
        setInvestments(result.investments);
        setPortfolioOwner(result.ownerName);
      } else {
        setError('Invalid share code or portfolio not found');
        setInvestments([]);
        setPortfolioOwner('');
      }
    } catch {
      setError('Failed to load portfolio. Please try again.');
      setInvestments([]);
      setPortfolioOwner('');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (authLoading) return;
    if (shareCode) {
      // Loading portfolio data in response to the share code / auth changing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPortfolio(shareCode);
    }
  }, [shareCode, authLoading, loadPortfolio]);

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
      <header className="glass-strong border-b border-line sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-lg bg-accent/10 border border-accent/30">
                <Eye size={20} className="text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight leading-none">Public Portfolio Viewer</h1>
                <p className="text-xs text-muted mt-1">View shared crypto portfolios</p>
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
                <div className="grid place-items-center w-12 h-12 rounded-lg bg-accent/10 border border-accent/30 flex-shrink-0">
                  <Share2 size={24} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Enter share code</h2>
                  <p className="text-muted">View someone's portfolio by entering their share code</p>
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

              <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="flex items-start gap-3">
                  <Lock size={20} className="text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-content/80">
                    <p className="font-medium text-accent mb-1">Privacy note</p>
                    <p>
                      You need a signed-in account to view a shared portfolio. Share codes are
                      8-character identifiers given to you by the portfolio owner. Viewing a
                      portfolio also adds it to the Shared tab on your dashboard.
                    </p>
                    {!authLoading && !currentUser && (
                      <p className="mt-2">
                        <Link to="/login" className="text-accent underline hover:text-accent-hover">
                          Sign in to continue
                        </Link>
                      </p>
                    )}
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
                <h2 className="text-3xl font-bold tracking-tight">{portfolioOwner ? `${portfolioOwner}'s Portfolio` : 'Portfolio'}</h2>
                <p className="text-muted">Share code: <span className="font-mono text-accent">{shareCode}</span></p>
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
                View a different portfolio
              </Button>
            </div>

            {/* Last Update Info */}
            {investments.length > 0 && (
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
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-loss/10 border border-loss/40">
                <p className="text-loss">{error}</p>
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
              displayCurrency={displayCurrency}
              loading={loading}
            />
          </div>
        )}
      </main>
    </div>
  );
};
