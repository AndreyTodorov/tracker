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

interface InvestmentFormData {
  name?: string;
  buyPrice: number;
  investmentAmount: number;
  quantity: number;
  currency: string;
}

export const InvestmentForm = () => {
  const { currentUser, userData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ComboboxOption[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [selectedValue, setSelectedValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [assetError, setAssetError] = useState('');

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
        const options: ComboboxOption[] = results.map((result: any) => ({
          value: result.id,
          label: `${result.name} (${result.symbol?.toUpperCase()})`,
          icon: result.thumb,
        }));
        setSearchResults(options);
      } catch (error) {
        console.error('Error searching crypto:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

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
        }
      };
      fetchPriceInNewCurrency();
    }
  }, [currency, selectedAsset, selectedValue]);

  // Update investment amount when quantity or buy price changes
  useEffect(() => {
    if (buyPrice && quantity) {
      const calculatedAmount = buyPrice * quantity;
      setValue('investmentAmount', calculatedAmount);
    }
  }, [quantity, buyPrice, setValue]);

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
    }
  };

  const onSubmit = async (data: InvestmentFormData) => {
    if (!currentUser || !userData || !selectedAsset) {
      setAssetError('Please select a cryptocurrency');
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);

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
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding investment:', error);
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
            })}
            error={errors.quantity?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              Investment Amount ({currency || 'EUR'})
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              {...register('investmentAmount', {
                required: 'Investment amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              })}
              onChange={(e) => {
                const amount = parseFloat(e.target.value);
                if (!isNaN(amount) && buyPrice) {
                  const calculatedQuantity = amount / buyPrice;
                  setValue('quantity', calculatedQuantity);
                }
              }}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.investmentAmount && (
              <p className="mt-1.5 text-sm text-red-400">{errors.investmentAmount.message}</p>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/50">
            <p className="text-green-400 text-sm font-medium">Investment added successfully!</p>
          </div>
        )}

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
