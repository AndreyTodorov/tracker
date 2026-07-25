/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { isSupportedCurrency } from '../utils/currencies';

export const DISPLAY_CURRENCY_KEY = 'displayCurrency';
const DEFAULT_CURRENCY = 'USD';

interface CurrencyContextType {
  /** The currency the whole portfolio is presented in. */
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

// Reading localStorage can throw in private browsing modes, and the stored
// value is user-editable, so an unusable value falls back to the default
// rather than propagating an unsupported currency into price requests.
const readStoredCurrency = (): string => {
  try {
    const stored = localStorage.getItem(DISPLAY_CURRENCY_KEY);
    return isSupportedCurrency(stored) ? stored!.toUpperCase() : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [displayCurrency, setDisplayCurrencyState] = useState(readStoredCurrency);

  const setDisplayCurrency = useCallback((currency: string) => {
    if (!isSupportedCurrency(currency)) {
      return;
    }
    const normalized = currency.toUpperCase();
    setDisplayCurrencyState(normalized);
    try {
      localStorage.setItem(DISPLAY_CURRENCY_KEY, normalized);
    } catch {
      // Selection still applies for this session if it cannot be persisted.
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
