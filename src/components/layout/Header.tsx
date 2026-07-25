import { useState } from 'react';
import { LogOut, TrendingUp, Share2, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';
import { signOut } from '../../services/auth.service';
import { ShareCodeModal } from '../investments/ShareCodeModal';
import { ProfileModal } from './ProfileModal';

export const Header = () => {
  const { userData } = useAuth();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className="glass-strong border-b border-line sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-lg bg-accent/10 border border-accent/30">
                <TrendingUp size={20} className="text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight leading-none">Investment Tracker</h1>
                <p className="text-xs text-muted mt-1">Real-time portfolio monitoring</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <select
                value={displayCurrency}
                onChange={(event) => setDisplayCurrency(event.target.value)}
                aria-label="Currency for portfolio totals"
                title="Portfolio totals are shown in this currency. Investments keep the currency they were bought in."
                className="px-3 py-2 bg-surface2 border border-line rounded-lg text-sm text-content focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
              >
                {SUPPORTED_CURRENCIES.map(({ code, symbol }) => (
                  <option key={code} value={code} className="bg-surface2">
                    {code} ({symbol})
                  </option>
                ))}
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2"
                aria-label="Share portfolio"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share Portfolio</span>
              </Button>

              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="panel-strong rounded-lg px-3 py-2 flex items-center gap-2 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="Edit your display name"
              >
                <User size={16} className="text-muted" />
                <span className="text-sm font-medium hidden sm:inline">
                  {userData?.displayName}
                </span>
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-loss hover:text-loss hover:bg-loss/10"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ShareCodeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};
