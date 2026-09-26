import { Trash2, TrendingUp, TrendingDown, User, Pencil, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Investment } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatCryptoPrice, formatPercentage, formatDate, getColorClass, getBgColorClass } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { deleteInvestment } from '../../services/investment.service';
import { EditInvestmentModal } from './EditInvestmentModal';
import { useToast } from '../../context/ToastContext';
import type { DisplayValues } from '../../utils/currency';

interface InvestmentCardProps {
  investment: Investment;
  /** Figures already expressed in the portfolio's display currency. */
  display: DisplayValues;
  /** Live price in the holding's own currency. Editing operates on stored,
   *  native values, so the converted price must not be used there. */
  nativeCurrentPrice?: number;
  /** Passed to the edit modal so changing a currency can convert the amounts. */
  prices: Map<string, Map<string, number>>;
  /** Render as a compact row that expands to the full details (used on mobile). */
  collapsible?: boolean;
}

export const InvestmentCard = ({ investment, display, nativeCurrentPrice, prices, collapsible = false }: InvestmentCardProps) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isOwner = currentUser?.uid === investment.userId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const nativePrice = nativeCurrentPrice ?? investment.buyPrice;
  const profit = display.profit;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvestment(investment.userId, investment.id);
      setIsDeleteConfirmOpen(false);
      toast.success('Investment deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting investment:', error);
      const errorMessage = (error as { message?: string })?.message || 'Failed to delete investment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const nameBadge = investment.name && (
    <span className="text-[11px] text-accent px-2 py-0.5 rounded-md bg-accent/10 border border-accent/25">
      {investment.name}
    </span>
  );

  const details = (
    <>
      {/* Purchase Info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Buy Price</div>
          <div className="tnum text-sm text-content">{formatCryptoPrice(display.buyPrice, display.currency)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Current Price</div>
          <div className="tnum text-sm text-content">{formatCryptoPrice(display.currentPrice, display.currency)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Quantity</div>
          <div className="tnum text-sm text-content">
            {investment.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Invested</div>
          <div className="tnum text-sm text-content">{formatCurrency(display.invested, display.currency)}</div>
        </div>
      </div>

      {/* Current Value (what the holding is worth now) */}
      <div className="flex items-center justify-between mb-4 pt-3 border-t border-line">
        <span className="text-[11px] text-muted uppercase tracking-wider">Current Value</span>
        <span className="tnum text-base font-semibold text-content">
          {formatCurrency(display.currentValue, display.currency)}
        </span>
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
                {formatCurrency(profit.absolute, display.currency)}
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
    </>
  );

  const modals = isOwner && (
    <>
      <EditInvestmentModal
        investment={investment}
        currentPrice={nativePrice}
        prices={prices}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete investment?"
        size="sm"
      >
        <p className="text-sm text-muted mb-6">
          Delete this {investment.assetName} investment? This can't be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setIsDeleteConfirmOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );

  if (collapsible) {
    return (
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          className="w-full flex items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-bold tracking-tight truncate">{investment.assetName}</h3>
              {nameBadge}
            </div>
            <p className="text-xs text-muted mt-0.5 truncate">
              <span className="uppercase tracking-widest font-mono">{investment.assetSymbol}</span>
              {!isOwner && <> · {investment.userName}</>}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="tnum font-semibold">{formatCurrency(display.currentValue, display.currency)}</div>
            <div className={`tnum text-xs mt-0.5 ${getColorClass(profit.percentage)}`}>
              {formatPercentage(profit.percentage)}
            </div>
          </div>
          <ChevronDown
            size={18}
            className={`flex-shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 pt-4 border-t border-line">
            {details}
            {isOwner && (
              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setIsEditModalOpen(true)}
                  aria-label="Edit investment"
                >
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 gap-2 text-loss hover:border-loss/40"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  aria-label="Delete investment"
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            )}
          </div>
        )}

        {modals}
      </Card>
    );
  }

  return (
    <Card hover className="p-4 sm:p-6">
      {/* Owner, shown only on other people's investments */}
      {!isOwner && (
        <div className="flex items-center gap-2 mb-4">
          <div className="grid place-items-center w-6 h-6 rounded-full bg-surface2 border border-line">
            <User size={12} className="text-muted" />
          </div>
          <span className="text-sm text-muted">{investment.userName}</span>
        </div>
      )}

      {/* Asset Name */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold tracking-tight">{investment.assetName}</h3>
            {nameBadge}
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
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="text-muted hover:text-loss hover:bg-loss/10"
              disabled={isDeleting}
              aria-label="Delete investment"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>

      {details}

      {modals}
    </Card>
  );
};
