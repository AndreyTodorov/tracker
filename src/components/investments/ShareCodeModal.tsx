import { useState } from 'react';
import { Copy, Check, Share2, Plus, Link } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { addSharedPortfolio, getUserByShareCode } from '../../services/investment.service';

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

  const handleCopy = () => {
    if (userData?.shareCode) {
      navigator.clipboard.writeText(userData.shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
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
        setJoinSuccess(`Successfully joined ${userName}'s portfolio!`);
        setJoinCode('');
        setTimeout(() => {
          setJoinSuccess('');
          onClose();
          window.location.reload(); // Reload to update shared portfolios
        }, 2000);
      } else {
        setJoinError('Invalid share code. Please check and try again.');
      }
    } catch (error) {
      setJoinError('Failed to join portfolio. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Portfolio" size="md">
      <div className="space-y-6">
        {/* Your Share Code */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Share2 size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold">Your Share Code</h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Share this code with friends so they can view your investments
          </p>
          <div className="flex gap-2">
            <div className="flex-1 glass rounded-lg p-4">
              <div className="text-3xl font-bold text-center tracking-wider text-blue-400">
                {userData?.shareCode || 'Loading...'}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="px-4"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </Button>
          </div>

          {/* Public Link */}
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Link size={16} className="text-blue-400" />
              <p className="text-sm font-medium text-blue-400">Public Link</p>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Share this link to let anyone view your portfolio without logging in
            </p>
            <div className="flex gap-2">
              <div className="flex-1 glass rounded-lg px-3 py-2 overflow-hidden">
                <p className="text-xs text-gray-300 truncate">{publicLink}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                className="px-3"
              >
                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Join Portfolio */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Plus size={20} className="text-purple-400" />
            <h3 className="text-lg font-semibold">Join a Portfolio</h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Enter a friend's share code to view their investments
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Enter 8-character code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            {joinError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                <p className="text-red-400 text-sm">{joinError}</p>
              </div>
            )}
            {joinSuccess && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/50">
                <p className="text-green-400 text-sm">{joinSuccess}</p>
              </div>
            )}
            <Button
              onClick={handleJoinPortfolio}
              className="w-full"
              isLoading={isJoining}
              disabled={joinCode.trim().length !== 8}
            >
              Join Portfolio
            </Button>
          </div>
        </div>

        {/* Joined Portfolios */}
        {userData?.sharedPortfolios && userData.sharedPortfolios.length > 0 && (
          <>
            <div className="border-t border-slate-700" />
            <div>
              <h3 className="text-lg font-semibold mb-3">Joined Portfolios</h3>
              <div className="space-y-2">
                {userData.sharedPortfolios.map((code) => (
                  <div key={code} className="glass rounded-lg p-3 flex items-center justify-between">
                    <span className="font-mono">{code}</span>
                    <Check size={16} className="text-green-400" />
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
