import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { updateInvestment } from '../../services/investment.service';
import { toDateInputValue, fromDateInputValue } from '../../utils/formatters';
import type { Investment } from '../../types';
import { deriveRate } from '../../utils/currency';
import { CurrencySelect, CurrentPriceBox, PriceFields } from './InvestmentFields';
import type { InvestmentFormValues } from './investmentFormValues';
import { useToast } from '../../context/ToastContext';

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


  const form = useForm<InvestmentFormValues>({
    defaultValues: {
      name: investment.name || '',
      buyPrice: investment.buyPrice,
      investmentAmount: investment.investmentAmount,
      quantity: investment.quantity,
      currency: investment.currency,
      purchaseDate: toDateInputValue(investment.purchaseDate),
    },
  });

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = form;
  const currency = useWatch({ control, name: 'currency' });




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
    // investmentAmount is optional on a record, so fall back to the figure the
    // rest of the app computes rather than multiplying undefined into NaN.
    const baseAmount = investment.investmentAmount ?? investment.buyPrice * investment.quantity;
    setValue('investmentAmount', round(baseAmount * rate, 2));
  };

  const onSubmit = async (data: InvestmentFormValues) => {
    setIsSubmitting(true);

    try {
      await updateInvestment(investment.userId, investment.id, {
        // Always sent, so clearing it actually removes it.
        name: data.name ?? '',
        buyPrice: data.buyPrice,
        investmentAmount: data.investmentAmount,
        quantity: data.quantity,
        currency: data.currency,
        purchaseDate: fromDateInputValue(data.purchaseDate),
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
        purchaseDate: toDateInputValue(investment.purchaseDate),
      });
    }
  }, [isOpen, investment, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit investment</DialogTitle>
          <DialogDescription>
            Update your investment details including buy price, quantity, and currency.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Asset Info (Read-only) */}
          <div className="p-3 rounded-xl bg-ink border border-line">
            <div className="text-[11px] text-muted uppercase tracking-wider mb-1">Asset</div>
            <div className="text-lg font-semibold tracking-tight">{investment.assetName}</div>
            <div className="text-xs text-muted uppercase tracking-widest font-mono">{investment.assetSymbol}</div>
          </div>

          {/* Current Price Display */}
          <CurrentPriceBox
            price={livePrice}
            currency={liveCurrency}
            onUse={() => setValue('buyPrice', livePrice)}
          />

          {/* Investment Name (Optional) */}
          <Input
            label="Investment Name (Optional)"
            type="text"
            placeholder="e.g., Main Portfolio, Testing, Long-term..."
            {...register('name')}
          />

          {/* Purchase Date */}
          <Input
            label="Purchase Date"
            type="date"
            {...register('purchaseDate', { required: 'Purchase date is required' })}
            error={errors.purchaseDate?.message}
          />

          {/* Currency Selection */}
          <CurrencySelect
            id="edit-currency"
            registration={register('currency', {
              required: 'Currency is required',
              onChange: (event) => handleCurrencyChange(event.target.value),
            })}
          >
            {isRelabelled && (
              <p
                className={`text-xs mt-1.5 ${conversionRate === null ? 'text-warning' : 'text-muted'}`}
              >
                {conversionRate === null
                  ? `Live rate unavailable, so the amounts were left as they were and only relabelled from ${investment.currency} to ${selectedCurrency}. Check them before saving.`
                  : `Converted from ${investment.currency} at ${conversionRate.toFixed(4)}.`}
              </p>
            )}
          </CurrencySelect>

          {/* Buy Price, Quantity and Amount */}
          <PriceFields form={form} currency={currency || investment.currency} />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-full"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full"
              isLoading={isSubmitting}
            >
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
