import { Trash2, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { Investment } from '../../types';
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
}

// A holding as a tile. Tapping it opens the full details, where the owner can
// edit or delete it.
export const InvestmentCard = ({ investment, display, nativeCurrentPrice, prices }: InvestmentCardProps) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isOwner = currentUser?.uid === investment.userId;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const nativePrice = nativeCurrentPrice ?? investment.buyPrice;
  const profit = display.profit;
  const quantity = investment.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 });

  // Only one dialog is open at a time, so the details make way for the next step.
  const startEdit = () => {
    setIsDetailsOpen(false);
    setIsEditModalOpen(true);
  };

  const startDelete = () => {
    setIsDetailsOpen(false);
    setIsDeleteConfirmOpen(true);
  };

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

  const subtitle = [investment.assetSymbol.toUpperCase(), investment.name, !isOwner && investment.userName]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDetailsOpen(true)}
        className="w-full flex flex-col gap-5 lg:gap-7 p-4 lg:p-5 rounded-[20px] bg-surface border border-line text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {/* Narrow tiles stack the badge under the name; wide ones sit it beside. */}
        <span className="w-full flex flex-col items-start gap-1.5 lg:flex-row lg:justify-between lg:gap-2">
          <span className="min-w-0 max-w-full flex flex-col gap-0.5">
            <span className="text-[15px] lg:text-base font-semibold break-words">{investment.assetName}</span>
            <span className="font-mono text-xs text-muted truncate">{subtitle}</span>
          </span>
          <span
            className={`flex-shrink-0 px-2 py-0.5 rounded-full font-mono text-[11px] lg:text-xs font-semibold ${getBgColorClass(profit.percentage)} ${getColorClass(profit.percentage)}`}
          >
            {formatPercentage(profit.percentage)}
          </span>
        </span>
        <span className="flex flex-col gap-1 min-w-0">
          <span className="text-xl lg:text-[28px] font-semibold tracking-[-0.03em] tabular-nums truncate">
            {formatCurrency(display.currentValue, display.currency)}
          </span>
          {/* Narrow tiles only fit the quantity; wide ones add the prices. */}
          <span className="lg:hidden font-mono text-[11px] text-muted truncate">
            {quantity} {investment.assetSymbol.toUpperCase()}
          </span>
          <span className="hidden lg:block font-mono text-xs text-muted truncate">
            {quantity} @ {formatCryptoPrice(display.buyPrice, display.currency)} → {formatCryptoPrice(display.currentPrice, display.currency)}
          </span>
        </span>
      </button>

      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={investment.assetName}
        size="sm"
      >
        <p className="-mt-2 mb-5 font-mono text-xs text-muted">{subtitle}</p>

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
            <div className="tnum text-sm text-content">{quantity}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Invested</div>
            <div className="tnum text-sm text-content">{formatCurrency(display.invested, display.currency)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 pt-3 border-t border-line">
          <span className="text-[11px] text-muted uppercase tracking-wider">Current Value</span>
          <span className="tnum text-base font-semibold text-content">
            {formatCurrency(display.currentValue, display.currency)}
          </span>
        </div>

        <div className={`p-4 rounded-2xl ${getBgColorClass(profit.absolute)}`}>
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

        <div className="mt-3 text-[11px] text-muted text-right">
          Purchased {formatDate(investment.purchaseDate)}
        </div>

        {isOwner && (
          <div className="flex gap-3 mt-5">
            <Button variant="secondary" className="flex-1 gap-2 rounded-full" onClick={startEdit} aria-label="Edit investment">
              <Pencil size={15} /> Edit
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2 rounded-full text-loss hover:border-loss/40"
              onClick={startDelete}
              aria-label="Delete investment"
            >
              <Trash2 size={15} /> Delete
            </Button>
          </div>
        )}
      </Modal>

      {isOwner && (
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
                className="flex-1 rounded-full"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="danger" className="flex-1 rounded-full" onClick={handleDelete} isLoading={isDeleting}>
                Delete
              </Button>
            </div>
          </Modal>
        </>
      )}
    </>
  );
};
