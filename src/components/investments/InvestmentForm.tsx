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
  buyPrice: number;
  investmentAmount: number;
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

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<InvestmentFormData>();

  const buyPrice = watch('buyPrice');
  const investmentAmount = watch('investmentAmount');

  const quantity = buyPrice && investmentAmount ? investmentAmount / buyPrice : 0;

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

  const handleSelectAsset = async (value: string) => {
    setSelectedValue(value);
    setAssetError('');

    if (!value) {
      setSelectedAsset(null);
      setCurrentPrice(null);
      return;
    }

    // Fetch full asset details and current price
    try {
      const details = await getCryptoDetails(value);
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
        data.investmentAmount
      );

      // Reset form
      reset();
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
          <div className="p-3 rounded-lg glass">
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-xl font-bold text-green-400">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          </div>
        )}

        {/* Buy Price */}
        <Input
          label="Buy Price (USD)"
          type="number"
          step="any"
          placeholder="0.00"
          {...register('buyPrice', {
            required: 'Buy price is required',
            min: { value: 0.000001, message: 'Price must be greater than 0' },
          })}
          error={errors.buyPrice?.message}
        />

        {/* Investment Amount */}
        <Input
          label="Investment Amount (USD)"
          type="number"
          step="any"
          placeholder="0.00"
          {...register('investmentAmount', {
            required: 'Investment amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
          error={errors.investmentAmount?.message}
        />

        {/* Calculated Quantity */}
        {quantity > 0 && selectedAsset && (
          <div className="p-3 rounded-lg glass">
            <div className="text-sm text-gray-400">Quantity</div>
            <div className="text-xl font-bold">
              {quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })} {selectedAsset.symbol?.toUpperCase()}
            </div>
          </div>
        )}

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
