import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
};

export const formatDate = (timestamp: Timestamp): string => {
  return format(timestamp.toDate(), 'MMM dd, yyyy');
};

export const formatDateTime = (timestamp: Timestamp): string => {
  return format(timestamp.toDate(), 'MMM dd, yyyy HH:mm');
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
