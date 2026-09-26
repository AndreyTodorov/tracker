import { useState } from 'react';
import { LogOut, TrendingUp, Share2 } from 'lucide-react';
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

  // "Mobile Tester" -> "MT"
  const initials =
    (userData?.displayName ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('') || '?';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className="bg-ink/85 backdrop-blur-lg border-b border-line-soft sticky top-0 z-40">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="flex items-center justify-between gap-2 h-16 lg:h-[76px]">
            {/* Mobile: who's signed in. Desktop: the logo. */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="lg:hidden flex items-center gap-2.5 min-w-0 rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Edit your display name"
            >
              <span className="grid place-items-center w-10 h-10 flex-shrink-0 rounded-full bg-accent text-ink text-[13px] font-bold">
                {initials}
              </span>
              <span className="min-w-0 flex flex-col">
                <span className="text-xs text-muted">Portfolio</span>
                <span className="text-[15px] font-semibold truncate">{userData?.displayName}</span>
              </span>
            </button>
            {/* The heading stays for screen readers on mobile, where the logo is hidden. */}
            <div className="lg:flex items-center gap-2.5">
              <span className="hidden lg:grid place-items-center w-7 h-7 rounded-lg bg-accent text-ink">
                <TrendingUp size={15} strokeWidth={2.6} />
              </span>
              <h1 className="sr-only lg:not-sr-only text-[17px] font-bold tracking-[-0.03em]">tracker</h1>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={displayCurrency}
                onChange={(event) => setDisplayCurrency(event.target.value)}
                aria-label="Currency for portfolio totals"
                title="Portfolio totals are shown in this currency. Investments keep the currency they were bought in."
                className="h-10 px-3 bg-surface border border-line rounded-full text-[13px] font-semibold text-content focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
              >
                {SUPPORTED_CURRENCIES.map(({ code }) => (
                  <option key={code} value={code} className="bg-surface">
                    {code}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="h-10 min-w-10 px-2.5 lg:px-4 flex items-center justify-center gap-2 rounded-full bg-surface border border-line text-[13px] font-semibold transition-colors hover:border-faint"
                aria-label="Share portfolio"
              >
                <Share2 size={16} />
                <span className="hidden lg:inline">Share</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="hidden lg:grid place-items-center w-10 h-10 rounded-full bg-accent text-ink text-[13px] font-bold transition-colors hover:bg-accent-hover"
                aria-label="Edit your display name"
                title={userData?.displayName}
              >
                {initials}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="grid place-items-center w-10 h-10 rounded-full text-muted transition-colors hover:text-loss hover:bg-loss/10"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
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
