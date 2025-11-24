import { useState } from 'react';
import { LogOut, TrendingUp, Share2, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth.service';
import { ShareCodeModal } from '../investments/ShareCodeModal';

export const Header = () => {
  const { userData } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className="glass-strong border-b border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Investment Tracker</h1>
                <p className="text-xs text-gray-400">Real-time portfolio monitoring</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="hidden sm:flex items-center gap-2"
              >
                <Share2 size={16} />
                Share Portfolio
              </Button>

              <div className="glass rounded-lg px-3 py-2 flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-sm font-medium hidden sm:inline">
                  {userData?.displayName}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300"
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
    </>
  );
};
