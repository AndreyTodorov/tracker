import { useState } from 'react';
import { Copy, Check, Share2, Plus, Link, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { addSharedPortfolio, getUserByShareCode, removeSharedPortfolio } from '../../services/investment.service';

interface ShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareCodeModal = ({ isOpen, onClose }: ShareCodeModalProps) => {
  const { userData, currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const publicLink = userData?.shareCode
    ? `${window.location.origin}/tracker/public?code=${userData.shareCode}`
    : '';

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!navigator.clipboard?.writeText) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopy = async () => {
    if (userData?.shareCode && (await copyToClipboard(userData.shareCode))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (publicLink && (await copyToClipboard(publicLink))) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleJoinPortfolio = async () => {
    if (!currentUser || !joinCode.trim()) return;

    setIsJoining(true);
    setJoinError('');
    setJoinSuccess('');

    try {
      // Check if trying to join own portfolio
      if (joinCode.trim().toUpperCase() === userData?.shareCode) {
        setJoinError("You can't join your own portfolio!");
        setIsJoining(false);
        return;
      }

      // Check if already joined
      if (userData?.sharedPortfolios?.includes(joinCode.trim().toUpperCase())) {
        setJoinError("You've already joined this portfolio!");
        setIsJoining(false);
        return;
      }

      // Get the user name first
      const userName = await getUserByShareCode(joinCode.trim().toUpperCase());

      if (!userName) {
        setJoinError('Invalid share code. Please check and try again.');
        setIsJoining(false);
        return;
      }

      const success = await addSharedPortfolio(currentUser.uid, joinCode.trim().toUpperCase());

      if (success) {
        // userData is a live subscription, so the joined list updates on its own.
        setJoinSuccess(`Successfully joined ${userName}'s portfolio!`);
        setJoinCode('');
        setTimeout(() => setJoinSuccess(''), 4000);
      } else {
        setJoinError('Invalid share code. Please check and try again.');
      }
    } catch {
      setJoinError('Failed to join portfolio. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeavePortfolio = async (code: string) => {
    if (!currentUser) return;
    try {
      await removeSharedPortfolio(currentUser.uid, code);
    } catch {
      setJoinError('Failed to leave portfolio. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Portfolio" size="md">
      <div className="space-y-6">
        {/* Your Share Code */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Share2 size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Your share code</h3>
          </div>
          <p className="text-sm text-muted mb-3">
            Share this code with friends so they can view your investments
          </p>
          <div className="flex gap-2">
            <div className="flex-1 panel-strong rounded-lg p-4">
              <div className="tnum text-3xl font-bold text-center tracking-[0.3em] text-accent">
                {userData?.shareCode || 'Loading...'}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="px-4"
              aria-label="Copy share code"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </Button>
          </div>

          {/* Public Link */}
          <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/25">
            <div className="flex items-center gap-2 mb-2">
              <Link size={16} className="text-accent" />
              <p className="text-sm font-medium text-accent">Shareable link</p>
            </div>
            <p className="text-xs text-muted mb-2">
              Send this link to anyone with an account so they can view your portfolio
            </p>
            <div className="flex gap-2">
              <div className="flex-1 panel-strong rounded-lg px-3 py-2 overflow-hidden">
                <p className="text-xs text-content/80 truncate">{publicLink}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                className="px-3"
                aria-label="Copy public link"
              >
                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-line" />

        {/* Join Portfolio */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Plus size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Join a portfolio</h3>
          </div>
          <p className="text-sm text-muted mb-3">
            Enter a friend's share code to view their investments
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Enter 8-character code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="tnum tracking-[0.2em]"
            />
            {joinError && (
              <div className="p-3 rounded-lg bg-loss/10 border border-loss/40">
                <p className="text-loss text-sm">{joinError}</p>
              </div>
            )}
            {joinSuccess && (
              <div className="p-3 rounded-lg bg-profit/10 border border-profit/40">
                <p className="text-profit text-sm">{joinSuccess}</p>
              </div>
            )}
            <Button
              onClick={handleJoinPortfolio}
              className="w-full"
              isLoading={isJoining}
              disabled={joinCode.trim().length !== 8}
            >
              Join portfolio
            </Button>
          </div>
        </div>

        {/* Joined Portfolios */}
        {userData?.sharedPortfolios && userData.sharedPortfolios.length > 0 && (
          <>
            <div className="border-t border-line" />
            <div>
              <h3 className="text-lg font-semibold mb-3">Joined portfolios</h3>
              <div className="space-y-2">
                {userData.sharedPortfolios.map((code) => (
                  <div key={code} className="panel-strong rounded-lg p-3 flex items-center justify-between">
                    <span className="font-mono tracking-wider">{code}</span>
                    <div className="flex items-center gap-1">
                      <Check size={16} className="text-profit" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeavePortfolio(code)}
                        className="text-muted hover:text-loss hover:bg-loss/10"
                        aria-label={`Leave portfolio ${code}`}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
