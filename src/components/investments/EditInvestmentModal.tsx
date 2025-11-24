import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { updateInvestment } from '../../services/investment.service';
import type { Investment } from '../../types';
import { useToast } from '../../context/ToastContext';

interface EditInvestmentFormData {
  name?: string;
  buyPrice: number;
  investmentAmount: number;
  quantity: number;
  currency: string;
}

interface EditInvestmentModalProps {
  investment: Investment;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

export const EditInvestmentModal = ({ investment, currentPrice, isOpen, onClose }: EditInvestmentModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'quantity' | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EditInvestmentFormData>({
    defaultValues: {
      name: investment.name || '',
      buyPrice: investment.buyPrice,
      investmentAmount: investment.investmentAmount,
      quantity: investment.quantity,
      currency: investment.currency,
    },
  });

  const buyPrice = watch('buyPrice');
  const quantity = watch('quantity');
  const currency = watch('currency');

  // Get currency symbol
  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      JPY: '¥',
      CHF: 'Fr',
      CAD: 'C$',
      AUD: 'A$',
    };
    return symbols[curr] || curr;
  };

  // Update investment amount when quantity or buy price changes
  // But only if the user is NOT currently editing the amount field
  useEffect(() => {
    if (buyPrice && quantity && lastEditedField !== 'amount') {
      const calculatedAmount = buyPrice * quantity;
      // Round to avoid floating point precision issues
      const roundedAmount = Math.round(calculatedAmount * 100) / 100;
      setValue('investmentAmount', roundedAmount);
    }
  }, [quantity, buyPrice, setValue, lastEditedField]);


  const onSubmit = async (data: EditInvestmentFormData) => {
    setIsSubmitting(true);

    try {
      await updateInvestment(investment.id, {
        ...(data.name && { name: data.name }),
        buyPrice: data.buyPrice,
        investmentAmount: data.investmentAmount,
        quantity: data.quantity,
        currency: data.currency,
      });

      toast.success('Investment updated successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: unknown) {
      console.error('Error updating investment:', error);
      const errorMessage = (error as { message?: string })?.message || 'Failed to update investment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens with new investment data
  useEffect(() => {
    if (isOpen) {
      reset({
        name: investment.name || '',
        buyPrice: investment.buyPrice,
        investmentAmount: investment.investmentAmount,
        quantity: investment.quantity,
        currency: investment.currency,
      });
    }
  }, [isOpen, investment, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit Investment</DialogTitle>
          <DialogDescription>
            Update your investment details including buy price, quantity, and currency.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Asset Info (Read-only) */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
            <div className="text-sm text-gray-400 mb-1">Asset</div>
            <div className="text-lg font-bold">{investment.assetName}</div>
            <div className="text-sm text-gray-400 uppercase">{investment.assetSymbol}</div>
          </div>

          {/* Current Price Display */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-400">Current Price ({currency || investment.currency})</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue('buyPrice', currentPrice)}
              >
                Use as Buy Price
              </Button>
            </div>
            <div className="text-xl font-bold text-green-400">
              {getCurrencySymbol(currency || investment.currency)}{currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>

          {/* Investment Name (Optional) */}
          <Input
            label="Investment Name (Optional)"
            type="text"
            placeholder="e.g., Main Portfolio, Testing, Long-term..."
            {...register('name')}
          />

          {/* Currency Selection */}
          <div>
            <label htmlFor="edit-currency" className="block text-sm font-medium text-gray-200 mb-1.5">
              Currency
            </label>
            <select
              id="edit-currency"
              {...register('currency', { required: 'Currency is required' })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="EUR" className="bg-slate-800">EUR (€)</option>
              <option value="USD" className="bg-slate-800">USD ($)</option>
              <option value="GBP" className="bg-slate-800">GBP (£)</option>
              <option value="JPY" className="bg-slate-800">JPY (¥)</option>
              <option value="CHF" className="bg-slate-800">CHF (Fr)</option>
              <option value="CAD" className="bg-slate-800">CAD ($)</option>
              <option value="AUD" className="bg-slate-800">AUD ($)</option>
            </select>
          </div>

          {/* Buy Price */}
          <Input
            label={`Buy Price (${currency || investment.currency})`}
            type="number"
            step="any"
            placeholder="0.00"
            {...register('buyPrice', {
              required: 'Buy price is required',
              min: { value: 0.000001, message: 'Price must be greater than 0' },
            })}
            error={errors.buyPrice?.message}
          />

          {/* Quantity and Investment Amount Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              step="any"
              placeholder="0.00"
              {...register('quantity', {
                required: 'Quantity is required',
                min: { value: 0.00000001, message: 'Quantity must be greater than 0' },
                onChange: () => {
                  setLastEditedField('quantity');
                  // Let the useEffect handle the amount calculation
                },
              })}
              error={errors.quantity?.message}
            />

            <Input
              label={`Amount (${currency || investment.currency})`}
              type="number"
              step="any"
              placeholder="0.00"
              {...register('investmentAmount', {
                required: 'Investment amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
                onChange: (e) => {
                  setLastEditedField('amount');
                  const amount = parseFloat(e.target.value);
                  if (!isNaN(amount) && buyPrice && amount > 0) {
                    const calculatedQuantity = amount / buyPrice;
                    // Round to 8 decimal places for crypto precision
                    const roundedQuantity = Math.round(calculatedQuantity * 100000000) / 100000000;
                    setValue('quantity', roundedQuantity);
                  }
                },
              })}
              error={errors.investmentAmount?.message}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
