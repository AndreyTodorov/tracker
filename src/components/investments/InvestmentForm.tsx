import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Combobox, type ComboboxOption } from '../ui/Combobox';
import { searchCrypto, getCryptoDetails } from '../../services/coingecko.service';
import { addInvestment } from '../../services/investment.service';
import { toDateInputValue, fromDateInputValue } from '../../utils/formatters';
import { CurrencySelect, CurrentPriceBox, PriceFields } from './InvestmentFields';
import { EMPTY_PRICE_FIELDS, type InvestmentFormValues } from './investmentFormValues';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import type { SelectedCryptoAsset, CoinGeckoSearchResult } from '../../types';

interface InvestmentFormProps {
  /** Called after an investment has been saved. */
  onAdded?: () => void;
  /** Render just the form, for use inside a dialog that supplies its own title. */
  embedded?: boolean;
}

export const InvestmentForm = ({ onAdded, embedded = false }: InvestmentFormProps) => {
  const { currentUser, userData } = useAuth();
  const toast = useToast();
  const { displayCurrency } = useCurrency();
  // Default for the purchase date. Future dates are rejected when saving.
  const [today] = useState(() => toDateInputValue(Date.now()));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ComboboxOption[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SelectedCryptoAsset | null>(null);
  const [selectedValue, setSelectedValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [assetError, setAssetError] = useState('');

  const form = useForm<InvestmentFormValues>({
    defaultValues: {
      currency: displayCurrency,
      purchaseDate: today,
    },
  });

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = form;
  const currency = useWatch({ control, name: 'currency' });

  // Search for cryptocurrencies
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      // Clearing results in response to the query input changing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    }, 500); // Increased from 300ms to reduce API requests

    return () => clearTimeout(delaySearch);
  }, [searchQuery, toast]);

  // Refetch price when currency changes
  useEffect(() => {
    if (selectedAsset && selectedValue) {
      const fetchPriceInNewCurrency = async () => {
        try {
          const selectedCurrency = currency || displayCurrency;
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
  }, [currency, displayCurrency, selectedAsset, selectedValue, toast]);

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
      const selectedCurrency = currency || displayCurrency;
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

  const onSubmit = async (data: InvestmentFormValues) => {
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
        selectedAsset.symbol.toUpperCase(),
        selectedAsset.id,
        data.buyPrice,
        data.investmentAmount,
        data.quantity,
        data.currency,
        data.name,
        fromDateInputValue(data.purchaseDate)
      );

      // Reset form
      reset({
        name: '',
        currency: displayCurrency,
        purchaseDate: today,
        ...EMPTY_PRICE_FIELDS,
      });
      setSelectedAsset(null);
      setSelectedValue('');
      setCurrentPrice(null);
      setSearchQuery('');
      setSearchResults([]);

      toast.success('Investment added successfully!');
      onAdded?.();
    } catch (error: unknown) {
      console.error('Error adding investment:', error);
      const errorMessage = (error as { message?: string })?.message || 'Failed to add investment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = (
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
      {currentPrice !== null && selectedAsset && (
        <CurrentPriceBox
          price={currentPrice}
          currency={currency || displayCurrency}
          onUse={() => setValue('buyPrice', currentPrice)}
        />
      )}

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
      <CurrencySelect id="currency" registration={register('currency', { required: 'Currency is required' })} />

      {/* Buy Price, Quantity and Amount */}
      <PriceFields form={form} currency={currency || displayCurrency} />

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full rounded-full"
        isLoading={isSubmitting}
        disabled={!selectedAsset}
      >
        Add investment
      </Button>
    </form>
  );

  if (embedded) {
    return fields;
  }

  return (
    <Card className="p-6 rounded-[22px]">
      <h2 className="text-lg font-semibold tracking-tight mb-5">Add investment</h2>
      {fields}
    </Card>
  );
};
