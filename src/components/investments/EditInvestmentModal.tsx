import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { updateInvestment } from '../../services/investment.service';
import { formatCryptoPrice } from '../../utils/formatters';
import type { Investment } from '../../types';
import { deriveRate } from '../../utils/currency';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';
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
  /** Live price in the investment's own currency. Never a converted price:
   *  "Use as Buy Price" writes it straight into the stored record. */
  currentPrice: number;
  /** Used to derive an exchange rate when the currency is changed. */
  prices: Map<string, Map<string, number>>;
  isOpen: boolean;
  onClose: () => void;
}

export const EditInvestmentModal = ({ investment, currentPrice, prices, isOpen, onClose }: EditInvestmentModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'quantity' | null>(null);


  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<EditInvestmentFormData>({
    defaultValues: {
      name: investment.name || '',
      buyPrice: investment.buyPrice,
      investmentAmount: investment.investmentAmount,
      quantity: investment.quantity,
      currency: investment.currency,
    },
  });

  const buyPrice = useWatch({ control, name: 'buyPrice' });
  const quantity = useWatch({ control, name: 'quantity' });
  const currency = useWatch({ control, name: 'currency' });


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


  // The buy price is a stored, historical figure. Relabelling it with a new
  // currency without converting would silently change what the holding is
  // worth, so the amounts move with the label.
  //
  // Conversion is always relative to the saved record rather than to the
  // previously selected currency, so switching back and forth returns the
  // exact original figures instead of accumulating rounding error.
  const selectedCurrency = (currency || investment.currency).toUpperCase();
  const isRelabelled = selectedCurrency !== investment.currency.toUpperCase();
  const conversionRate = isRelabelled
    ? deriveRate(prices, investment.currency, selectedCurrency)
    : null;

  // The live price arrives in the investment's own currency, so it has to move
  // with the label too. Without this the panel would report a EUR figure as
  // USD, and "Use as Buy Price" would write that unconverted number into the
  // stored record.
  const liveRate = isRelabelled ? conversionRate : 1;
  const liveCurrency = liveRate === null ? investment.currency : selectedCurrency;
  const livePrice = liveRate === null ? currentPrice : currentPrice * liveRate;

  const handleCurrencyChange = (next: string) => {
    const round = (value: number, places: number) => {
      const factor = 10 ** places;
      return Math.round(value * factor) / factor;
    };

    const rate =
      next.toUpperCase() === investment.currency.toUpperCase()
        ? 1
        : deriveRate(prices, investment.currency, next);

    // No rate: leave the amounts alone and let the warning below explain.
    if (rate === null) {
      return;
    }

    setValue('buyPrice', round(investment.buyPrice * rate, 8));
    setValue('investmentAmount', round(investment.investmentAmount * rate, 2));
  };

  const onSubmit = async (data: EditInvestmentFormData) => {
    setIsSubmitting(true);

    try {
      await updateInvestment(investment.userId, investment.id, {
        // Always sent, so clearing it actually removes it.
        name: data.name ?? '',
        buyPrice: data.buyPrice,
        investmentAmount: data.investmentAmount,
        quantity: data.quantity,
        currency: data.currency,
      });

      toast.success('Investment updated successfully!');
      onClose();
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
          <div className="p-3 rounded-lg bg-surface2 border border-line">
            <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Asset</div>
            <div className="text-lg font-bold tracking-tight">{investment.assetName}</div>
            <div className="text-xs text-muted uppercase tracking-widest font-mono">{investment.assetSymbol}</div>
          </div>

          {/* Current Price Display */}
          <div className="p-3 rounded-lg bg-surface2 border border-line">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] text-muted uppercase tracking-wider">Current Price ({liveCurrency})</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-accent hover:bg-accent/10 -mr-1"
                onClick={() => setValue('buyPrice', livePrice)}
              >
                Use as Buy Price
              </Button>
            </div>
            <div className="tnum text-xl font-semibold text-content">
              {formatCryptoPrice(livePrice, liveCurrency)}
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
            <label htmlFor="edit-currency" className="block text-sm font-medium text-content mb-1.5">
              Currency
            </label>
            <select
              id="edit-currency"
              {...register('currency', {
                required: 'Currency is required',
                onChange: (event) => handleCurrencyChange(event.target.value),
              })}
              className="w-full px-4 py-2.5 bg-surface2 border border-line rounded-lg text-content focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
            >
              {SUPPORTED_CURRENCIES.map(({ code, symbol }) => (
                <option key={code} value={code} className="bg-surface2">
                  {code} ({symbol})
                </option>
              ))}
            </select>
            {isRelabelled && (
              <p
                className={`text-xs mt-1.5 ${conversionRate === null ? 'text-yellow-400' : 'text-muted'}`}
              >
                {conversionRate === null
                  ? `Live rate unavailable, so the amounts were left as they were and only relabelled from ${investment.currency} to ${selectedCurrency}. Check them before saving.`
                  : `Converted from ${investment.currency} at ${conversionRate.toFixed(4)}.`}
              </p>
            )}
          </div>

          {/* Buy Price */}
          <Input
            label={`Buy Price (${currency || investment.currency})`}
            type="number"
            step="any"
            placeholder="0.00"
            {...register('buyPrice', {
              required: 'Buy price is required',
              valueAsNumber: true,
              min: { value: 0.000001, message: 'Price must be greater than 0' },
              // Editing the price re-derives the amount from price × quantity.
              onChange: () => setLastEditedField(null),
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
                valueAsNumber: true,
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
                valueAsNumber: true,
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
