import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Combobox, type ComboboxOption } from '../ui/Combobox';
import { searchCrypto, getCryptoDetails } from '../../services/coingecko.service';
import { addInvestment } from '../../services/investment.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { SelectedCryptoAsset, CoinGeckoSearchResult } from '../../types';

interface InvestmentFormData {
  name?: string;
  buyPrice: number;
  investmentAmount: number;
  quantity: number;
  currency: string;
}

export const InvestmentForm = () => {
  const { currentUser, userData } = useAuth();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ComboboxOption[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SelectedCryptoAsset | null>(null);
  const [selectedValue, setSelectedValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [assetError, setAssetError] = useState('');
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'quantity' | null>(null);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<InvestmentFormData>({
    defaultValues: {
      currency: 'EUR',
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

  // Search for cryptocurrencies
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCrypto(searchQuery);
        const options: ComboboxOption[] = results.map((result: CoinGeckoSearchResult) => ({
          value: result.id,
          label: `${result.name} (${result.symbol?.toUpperCase()})`,
          icon: result.thumb,
        }));
        setSearchResults(options);
      } catch (error) {
        console.error('Error searching crypto:', error);
        toast.error('Failed to search cryptocurrencies. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, toast]);

  // Refetch price when currency changes
  useEffect(() => {
    if (selectedAsset && selectedValue) {
      const fetchPriceInNewCurrency = async () => {
        try {
          const selectedCurrency = currency || 'EUR';
          const details = await getCryptoDetails(selectedValue, selectedCurrency);
          if (details) {
            setCurrentPrice(details.current_price);
          }
        } catch (error) {
          console.error('Error fetching price in new currency:', error);
          toast.error('Failed to fetch current price. Please try again.');
        }
      };
      fetchPriceInNewCurrency();
    }
  }, [currency, selectedAsset, selectedValue, toast]);

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

  const handleSelectAsset = async (value: string) => {
    setSelectedValue(value);
    setAssetError('');

    if (!value) {
      setSelectedAsset(null);
      setCurrentPrice(null);
      return;
    }

    // Fetch full asset details and current price in selected currency
    try {
      const selectedCurrency = currency || 'EUR';
      const details = await getCryptoDetails(value, selectedCurrency);
      if (details) {
        setSelectedAsset({
          id: details.id,
          name: details.name,
          symbol: details.symbol,
        });
        setCurrentPrice(details.current_price);
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
      toast.error('Failed to fetch cryptocurrency details. Please try selecting again.');
      setSelectedAsset(null);
      setCurrentPrice(null);
    }
  };

  const onSubmit = async (data: InvestmentFormData) => {
    if (!currentUser || !userData || !selectedAsset) {
      setAssetError('Please select a cryptocurrency');
      toast.error('Please select a cryptocurrency before adding an investment');
      return;
    }

    setIsSubmitting(true);

    try {
      await addInvestment(
        currentUser.uid,
        userData.displayName,
        selectedAsset.name,
        selectedAsset.id,
        data.buyPrice,
        data.investmentAmount,
        data.quantity,
        data.currency,
        data.name
      );

      // Reset form
      reset({
        currency: 'EUR',
      });
      setSelectedAsset(null);
      setSelectedValue('');
      setCurrentPrice(null);
      setSearchQuery('');
      setSearchResults([]);

      toast.success('Investment added successfully!');
    } catch (error: any) {
      console.error('Error adding investment:', error);
      const errorMessage = error?.message || 'Failed to add investment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="strong" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
          <PlusCircle size={24} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold">Add Investment</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Cryptocurrency Search with Combobox */}
        <Combobox
          options={searchResults}
          value={selectedValue}
          onSelect={handleSelectAsset}
          onSearchChange={setSearchQuery}
          placeholder="Select cryptocurrency..."
          searchPlaceholder="Type to search Bitcoin, Ethereum, Dogecoin..."
          emptyText={searchQuery.length < 2 ? 'Type at least 2 characters...' : 'No cryptocurrencies found.'}
          label="Select Cryptocurrency"
          error={assetError}
          isLoading={isSearching}
        />

        {/* Current Price Display */}
        {currentPrice && selectedAsset && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-400">Current Price ({currency || 'EUR'})</div>
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
              {getCurrencySymbol(currency || 'EUR')}{currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>
        )}

        {/* Investment Name (Optional) */}
        <Input
          label="Investment Name (Optional)"
          type="text"
          placeholder="e.g., Main Portfolio, Testing, Long-term..."
          {...register('name')}
        />

        {/* Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">
            Currency
          </label>
          <select
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
          label={`Buy Price (${currency || 'EUR'})`}
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
            label={`Amount (${currency || 'EUR'})`}
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={!selectedAsset}
        >
          Add Investment
        </Button>
      </form>
    </Card>
  );
};
