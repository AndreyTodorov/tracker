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

interface InvestmentCardProps {
  investment: Investment;
  currentPrice?: number;
}

export const InvestmentCard = ({ investment, currentPrice }: InvestmentCardProps) => {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.uid === investment.userId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const price = currentPrice || investment.buyPrice;
  const profit = calculateProfit(investment.buyPrice, price, investment.quantity);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteInvestment(investment.id);
      } catch (error) {
        console.error('Error deleting investment:', error);
      }
    }
  };

  return (
    <Card hover className="p-6 relative">
      {/* User Info */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-full bg-white/10">
          <User size={14} className="text-gray-400" />
        </div>
        <span className="text-sm text-gray-400">{investment.userName}</span>
      </div>

      {/* Asset Name */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold">{investment.assetName}</h3>
            {investment.name && (
              <span className="text-xs text-blue-400 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                📝 {investment.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 uppercase">{investment.assetSymbol}</p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              <Pencil size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        )}
      </div>

      {/* Purchase Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Buy Price</div>
          <div className="font-medium">{formatCryptoPrice(investment.buyPrice, investment.currency)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Current Price</div>
          <div className="font-medium">{formatCryptoPrice(price, investment.currency)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Quantity</div>
          <div className="font-medium">
            {investment.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Invested</div>
          <div className="font-medium">{formatCurrency(investment.investmentAmount, investment.currency)}</div>
        </div>
      </div>

      {/* Profit/Loss */}
      <div className={`p-4 rounded-lg ${getBgColorClass(profit.absolute)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profit.absolute >= 0 ? (
              <TrendingUp size={20} className="text-profit" />
            ) : (
              <TrendingDown size={20} className="text-loss" />
            )}
            <div>
              <div className="text-xs text-gray-400">Profit/Loss</div>
              <div className={`text-2xl font-bold ${getColorClass(profit.absolute)}`}>
                {formatCurrency(profit.absolute, investment.currency)}
              </div>
            </div>
          </div>
          <div className={`text-xl font-bold ${getColorClass(profit.percentage)}`}>
            {formatPercentage(profit.percentage)}
          </div>
        </div>
      </div>

      {/* Purchase Date */}
      <div className="mt-3 text-xs text-gray-500 text-right">
        Purchased {formatDate(investment.purchaseDate)}
      </div>

      {/* Live Update Indicator */}
      {currentPrice && currentPrice !== investment.buyPrice && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/50">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">LIVE</span>
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
