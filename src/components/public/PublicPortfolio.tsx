import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { InvestmentList } from '../investments/InvestmentList';
import { PortfolioSummary } from '../investments/PortfolioSummary';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Share2, Lock, TrendingUp } from 'lucide-react';
import { getPublicPortfolio } from '../../services/investment.service';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { calculatePortfolioStats } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import type { Investment } from '../../types';

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
  const { prices, loading: pricesLoading, lastUpdate } = useCryptoPrices(investments, displayCurrency);

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
      <header className="bg-ink/85 backdrop-blur-lg border-b border-line-soft sticky top-0 z-40">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="flex items-center gap-2.5 h-16 lg:h-[76px]">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent text-ink">
              <TrendingUp size={15} strokeWidth={2.6} />
            </span>
            <h1 className="text-[17px] font-bold tracking-[-0.03em]">tracker</h1>
            <span className="text-[13px] text-muted">· Shared portfolio</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-10 py-5 lg:py-8">
        {/* Share Code Input */}
        {!shareCode && (
          <div className="max-w-2xl mx-auto mt-20">
            <Card className="p-6 sm:p-8 rounded-[22px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="grid place-items-center w-12 h-12 rounded-full bg-accent/10 flex-shrink-0">
                  <Share2 size={24} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Enter share code</h2>
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
                  className="w-full rounded-full"
                  isLoading={loading}
                  disabled={inputCode.trim().length !== 8}
                >
                  View Portfolio
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-2xl bg-surface2 border border-line">
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
                <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">{portfolioOwner ? `${portfolioOwner}'s Portfolio` : 'Portfolio'}</h2>
                <p className="text-muted">Share code: <span className="font-mono text-accent">{shareCode}</span></p>
              </div>
              <Button
                variant="secondary"
                className="rounded-full"
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

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-2xl bg-loss/10 border border-loss/40">
                <p className="text-loss">{error}</p>
              </div>
            )}

            {/* Portfolio Summary */}
            {!loading && investments.length > 0 && (
              <PortfolioSummary portfolio={portfolio} lastUpdate={lastUpdate} />
            )}

            {/* Investment List (an error already says why there is nothing to show) */}
            {!error && (
              <InvestmentList
                investments={investments}
                prices={prices}
                loading={loading}
                pricesLoading={pricesLoading}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
