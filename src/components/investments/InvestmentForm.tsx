import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { searchCrypto, getCryptoDetails } from '../../services/coingecko.service';
import { addInvestment } from '../../services/investment.service';
import { useAuth } from '../../context/AuthContext';

interface InvestmentFormData {
  assetSearch: string;
  buyPrice: number;
  investmentAmount: number;
}

export const InvestmentForm = () => {
  const { currentUser, userData } = useAuth();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<InvestmentFormData>();

  const searchQuery = watch('assetSearch');
  const buyPrice = watch('buyPrice');
  const investmentAmount = watch('investmentAmount');

  const quantity = buyPrice && investmentAmount ? investmentAmount / buyPrice : 0;

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchCrypto(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSelectAsset = async (asset: any) => {
    setSelectedAsset(asset);
    setValue('assetSearch', asset.name);
    setSearchResults([]);

    // Fetch current price
    const details = await getCryptoDetails(asset.id);
    if (details) {
      setCurrentPrice(details.current_price);
    }
  };

  const onSubmit = async (data: InvestmentFormData) => {
    if (!currentUser || !userData || !selectedAsset) return;

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
      setCurrentPrice(null);
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
        {/* Asset Search */}
        <div className="relative">
          <div className="relative">
            <Input
              label="Search Cryptocurrency"
              placeholder="e.g., Bitcoin, Dogecoin, Ethereum"
              {...register('assetSearch', { required: 'Please select a cryptocurrency' })}
              error={errors.assetSearch?.message}
            />
            <Search size={20} className="absolute right-3 top-9 text-gray-400" />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <Card className="absolute z-10 w-full mt-2 p-2 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectAsset(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  {result.thumb && (
                    <img src={result.thumb} alt={result.name} className="w-6 h-6 rounded-full" />
                  )}
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-gray-400 uppercase">{result.symbol}</div>
                  </div>
                </button>
              ))}
            </Card>
          )}

          {isSearching && (
            <div className="absolute right-3 top-9">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Current Price Display */}
        {currentPrice && (
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
        {quantity > 0 && (
          <div className="p-3 rounded-lg glass">
            <div className="text-sm text-gray-400">Quantity</div>
            <div className="text-xl font-bold">
              {quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })} {selectedAsset?.symbol.toUpperCase()}
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
