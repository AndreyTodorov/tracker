import { format } from 'date-fns';

// Intl throws a RangeError on a currency code that is not three letters, and
// a stored record can carry one. Formatting is called during render, so a
// throw here takes down the whole view — including for people merely viewing
// a shared portfolio that contains the bad record. Fall back to plain number
// formatting with the raw code appended so the value stays readable.
const formatWithCurrency = (
  amount: number,
  currency: string,
  options: Intl.NumberFormatOptions
): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      ...options,
    }).format(amount);
  } catch {
    const number = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      ...options,
    }).format(amount);
    const label = currency.trim();
    return label ? `${label} ${number}` : number;
  }
};

export const formatCurrency = (amount: number, currency = 'USD'): string =>
  // Let Intl use each currency's natural precision (e.g. JPY has no minor
  // unit, so it renders ¥1,235 rather than a bogus ¥1,234.50).
  formatWithCurrency(amount, currency, {});

export const formatCryptoPrice = (price: number, currency = 'USD'): string => {
  // Crypto prices are often sub-cent, so allow extra precision for small values.
  const isSmall = price > 0 && price < 1;
  return formatWithCurrency(price, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: isSmall ? 8 : 4,
  });
};

export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
};

export const formatDate = (timestamp: number | Date): string => {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return format(date, 'MMM dd, yyyy');
};

export const formatDateTime = (timestamp: number | Date): string => {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const getColorClass = (value: number): string => {
  if (value > 0) return 'text-profit';
  if (value < 0) return 'text-loss';
  return 'text-gray-400';
};

export const getBgColorClass = (value: number): string => {
  if (value > 0) return 'bg-profit/10';
  if (value < 0) return 'bg-loss/10';
  return 'bg-gray-400/10';
};
