import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCryptoPrice,
  formatPercentage,
  formatDate,
  formatDateTime,
  getColorClass,
  getBgColorClass,
} from './formatters';

describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('should format EUR currency correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('should format GBP currency correctly', () => {
    expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
  });

  it('should default to USD when no currency provided', () => {
    const result = formatCurrency(100);
    expect(result).toContain('$');
    expect(result).toContain('100.00');
  });

  it('should handle zero values', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-100.50, 'USD')).toBe('-$100.50');
  });

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(100.12345, 'USD')).toBe('$100.12');
  });

  it('should handle large numbers with thousands separator', () => {
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00');
  });
});

describe('formatCryptoPrice', () => {
  it('should format crypto price with up to 4 decimal places', () => {
    const result = formatCryptoPrice(0.1234, 'USD');
    expect(result).toContain('0.1234');
  });

  it('should format larger prices correctly', () => {
    expect(formatCryptoPrice(50000, 'USD')).toContain('50,000');
  });

  it('should handle very small prices', () => {
    const result = formatCryptoPrice(0.000123, 'USD');
    expect(result).toContain('0.0001');
  });

  it('should use correct currency symbol', () => {
    expect(formatCryptoPrice(100, 'EUR')).toContain('€');
    expect(formatCryptoPrice(100, 'GBP')).toContain('£');
  });

  it('should default to USD', () => {
    const result = formatCryptoPrice(100);
    expect(result).toContain('$');
  });
});

describe('formatPercentage', () => {
  it('should format positive percentages with + sign', () => {
    expect(formatPercentage(25.5)).toBe('+25.50%');
  });

  it('should format negative percentages', () => {
    expect(formatPercentage(-15.75)).toBe('-15.75%');
  });

  it('should format zero percentage', () => {
    expect(formatPercentage(0)).toBe('+0.00%');
  });

  it('should round to 2 decimal places', () => {
    expect(formatPercentage(12.345)).toBe('+12.35%');
  });

  it('should handle very large percentages', () => {
    expect(formatPercentage(1000.99)).toBe('+1000.99%');
  });

  it('should handle very small percentages', () => {
    expect(formatPercentage(0.01)).toBe('+0.01%');
  });
});

describe('formatDate', () => {
  it('should format timestamp correctly', () => {
    const timestamp = new Date('2024-01-15').getTime();
    const result = formatDate(timestamp);
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should format Date object correctly', () => {
    const date = new Date('2024-06-20');
    const result = formatDate(date);
    expect(result).toMatch(/Jun 20, 2024/);
  });

  it('should handle different months', () => {
    const dec = formatDate(new Date('2024-12-25'));
    expect(dec).toMatch(/Dec 25, 2024/);
  });
});

describe('formatDateTime', () => {
  it('should format timestamp with time', () => {
    const timestamp = new Date('2024-01-15T14:30:00').getTime();
    const result = formatDateTime(timestamp);
    expect(result).toMatch(/Jan 15, 2024/);
    expect(result).toMatch(/14:30/);
  });

  it('should format Date object with time', () => {
    const date = new Date('2024-06-20T09:15:00');
    const result = formatDateTime(date);
    expect(result).toMatch(/Jun 20, 2024/);
    expect(result).toMatch(/09:15/);
  });
});

describe('getColorClass', () => {
  it('should return profit color for positive values', () => {
    expect(getColorClass(100)).toBe('text-profit');
    expect(getColorClass(0.01)).toBe('text-profit');
  });

  it('should return loss color for negative values', () => {
    expect(getColorClass(-100)).toBe('text-loss');
    expect(getColorClass(-0.01)).toBe('text-loss');
  });

  it('should return gray color for zero', () => {
    expect(getColorClass(0)).toBe('text-gray-400');
  });
});

describe('getBgColorClass', () => {
  it('should return profit background for positive values', () => {
    expect(getBgColorClass(100)).toBe('bg-profit/10');
    expect(getBgColorClass(0.01)).toBe('bg-profit/10');
  });

  it('should return loss background for negative values', () => {
    expect(getBgColorClass(-100)).toBe('bg-loss/10');
    expect(getBgColorClass(-0.01)).toBe('bg-loss/10');
  });

  it('should return gray background for zero', () => {
    expect(getBgColorClass(0)).toBe('bg-gray-400/10');
  });
});
