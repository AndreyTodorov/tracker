import { useEffect, useState, type ReactNode } from 'react';
import { useWatch, type UseFormRegisterReturn, type UseFormReturn } from 'react-hook-form';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCryptoPrice } from '../../utils/formatters';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';
import type { InvestmentFormValues } from './investmentFormValues';

// Fields shared by the add form and the edit dialog.

const roundAmount = (value: number) => Math.round(value * 100) / 100;
// Crypto quantities go to 8 decimal places.
const roundQuantity = (value: number) => Math.round(value * 100000000) / 100000000;

interface CurrentPriceBoxProps {
  price: number;
  currency: string;
  onUse: () => void;
}

export const CurrentPriceBox = ({ price, currency, onUse }: CurrentPriceBoxProps) => (
  <div className="p-3 rounded-xl bg-ink border border-line">
    <div className="flex items-center justify-between mb-1">
      <div className="text-[13px] text-muted">Current Price ({currency})</div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-accent hover:bg-accent/10 -mr-1"
        onClick={onUse}
      >
        Use as Buy Price
      </Button>
    </div>
    <div className="tnum text-xl font-semibold text-content">
      {formatCryptoPrice(price, currency)}
    </div>
  </div>
);

interface CurrencySelectProps {
  id: string;
  registration: UseFormRegisterReturn;
  /** Shown under the select, e.g. a note about a conversion. */
  children?: ReactNode;
}

export const CurrencySelect = ({ id, registration, children }: CurrencySelectProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-content mb-1.5">
      Currency
    </label>
    <select
      id={id}
      {...registration}
      className="w-full h-11 px-4 bg-ink border border-line rounded-xl text-content focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
    >
      {SUPPORTED_CURRENCIES.map(({ code, symbol }) => (
        <option key={code} value={code} className="bg-surface">
          {code} ({symbol})
        </option>
      ))}
    </select>
    {children}
  </div>
);

interface PriceFieldsProps {
  form: UseFormReturn<InvestmentFormValues>;
  /** Labels the price and amount fields. */
  currency: string;
}

// Buy price, quantity and amount, kept consistent with each other: editing the
// quantity or the price re-derives the amount, and editing the amount
// re-derives the quantity.
export const PriceFields = ({ form, currency }: PriceFieldsProps) => {
  const { register, control, setValue, formState: { errors } } = form;
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'quantity' | null>(null);

  const buyPrice = useWatch({ control, name: 'buyPrice' });
  const quantity = useWatch({ control, name: 'quantity' });

  // Not while the user is typing an amount, or it would overwrite their input.
  useEffect(() => {
    if (buyPrice && quantity && lastEditedField !== 'amount') {
      setValue('investmentAmount', roundAmount(buyPrice * quantity));
    }
  }, [quantity, buyPrice, setValue, lastEditedField]);

  return (
    <>
      <Input
        label={`Buy Price (${currency})`}
        type="number"
        step="any"
        inputMode="decimal"
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

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantity"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="0.00"
          {...register('quantity', {
            required: 'Quantity is required',
            valueAsNumber: true,
            min: { value: 0.00000001, message: 'Quantity must be greater than 0' },
            onChange: () => setLastEditedField('quantity'),
          })}
          error={errors.quantity?.message}
        />

        <Input
          label={`Amount (${currency})`}
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="0.00"
          {...register('investmentAmount', {
            required: 'Investment amount is required',
            valueAsNumber: true,
            min: { value: 0.01, message: 'Amount must be greater than 0' },
            onChange: (e) => {
              setLastEditedField('amount');
              const amount = parseFloat(e.target.value);
              if (!isNaN(amount) && buyPrice && amount > 0) {
                setValue('quantity', roundQuantity(amount / buyPrice));
              }
            },
          })}
          error={errors.investmentAmount?.message}
        />
      </div>
    </>
  );
};
