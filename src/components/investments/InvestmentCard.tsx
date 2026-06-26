import { Trash2, TrendingUp, TrendingDown, User, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { Investment } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency, formatCryptoPrice, formatPercentage, formatDate, getColorClass, getBgColorClass } from '../../utils/formatters';
import { calculateProfit } from '../../utils/calculations';
import { useAuth } from '../../context/AuthContext';
import { deleteInvestment } from '../../services/investment.service';
import { EditInvestmentModal } from './EditInvestmentModal';
import { useToast } from '../../context/ToastContext';

interface InvestmentCardProps {
  investment: Investment;
  currentPrice?: number;
}

export const InvestmentCard = ({ investment, currentPrice }: InvestmentCardProps) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isOwner = currentUser?.uid === investment.userId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const price = currentPrice || investment.buyPrice;
  const profit = calculateProfit(investment.buyPrice, price, investment.quantity);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this investment?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteInvestment(investment.id);
      toast.success('Investment deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting investment:', error);
      const errorMessage = (error as { message?: string })?.message || 'Failed to delete investment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card hover className="p-6 relative">
      {/* User Info */}
      <div className="flex items-center gap-2 mb-4">
        <div className="grid place-items-center w-6 h-6 rounded-full bg-surface2 border border-line">
          <User size={12} className="text-muted" />
        </div>
        <span className="text-sm text-muted">{investment.userName}</span>
      </div>

      {/* Asset Name */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold tracking-tight">{investment.assetName}</h3>
            {investment.name && (
              <span className="text-[11px] text-accent px-2 py-0.5 rounded-md bg-accent/10 border border-accent/25">
                {investment.name}
              </span>
            )}
          </div>
          <p className="text-xs text-muted uppercase tracking-widest font-mono mt-0.5">{investment.assetSymbol}</p>
        </div>
        {isOwner && (
          <div className="flex gap-1 -mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-muted hover:text-accent hover:bg-accent/10"
              disabled={isDeleting}
              aria-label="Edit investment"
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-muted hover:text-loss hover:bg-loss/10"
              isLoading={isDeleting}
              disabled={isDeleting}
              aria-label="Delete investment"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Purchase Info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Buy Price</div>
          <div className="tnum text-sm text-content">{formatCryptoPrice(investment.buyPrice, investment.currency)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Current Price</div>
          <div className="tnum text-sm text-content">{formatCryptoPrice(price, investment.currency)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Quantity</div>
          <div className="tnum text-sm text-content">
            {investment.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Invested</div>
          <div className="tnum text-sm text-content">{formatCurrency(investment.buyPrice * investment.quantity, investment.currency)}</div>
        </div>
      </div>

      {/* Profit/Loss */}
      <div className={`p-4 rounded-lg border border-line ${getBgColorClass(profit.absolute)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {profit.absolute >= 0 ? (
              <TrendingUp size={20} className="text-profit" />
            ) : (
              <TrendingDown size={20} className="text-loss" />
            )}
            <div>
              <div className="text-[11px] text-muted uppercase tracking-wider">Profit/Loss</div>
              <div className={`tnum text-2xl font-semibold ${getColorClass(profit.absolute)}`}>
                {formatCurrency(profit.absolute, investment.currency)}
              </div>
            </div>
          </div>
          <div className={`tnum text-lg font-semibold ${getColorClass(profit.percentage)}`}>
            {formatPercentage(profit.percentage)}
          </div>
        </div>
      </div>

      {/* Purchase Date */}
      <div className="mt-3 text-[11px] text-muted text-right">
        Purchased {formatDate(investment.purchaseDate)}
      </div>

      {/* Live Update Indicator */}
      {currentPrice && currentPrice !== investment.buyPrice && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-profit/10 border border-profit/30">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-profit opacity-60 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-profit" />
            </span>
            <span className="text-[10px] text-profit font-medium tracking-wider">LIVE</span>
          </div>
        </div>
      )}

      {/* Edit Investment Modal */}
      {isOwner && (
        <EditInvestmentModal
          investment={investment}
          currentPrice={price}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </Card>
  );
};
