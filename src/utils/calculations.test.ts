import { describe, it, expect } from 'vitest';
import {
  calculateProfit,
  generateShareCode,
  getPriceKey,
} from './calculations';

describe('calculateProfit', () => {
  it('should calculate profit for profitable investment', () => {
    const result = calculateProfit(100, 150, 2);
    expect(result.absolute).toBe(100); // (150 - 100) * 2 = 100
    expect(result.percentage).toBe(50); // (100 / 200) * 100 = 50%
  });

  it('should calculate loss for unprofitable investment', () => {
    const result = calculateProfit(100, 75, 2);
    expect(result.absolute).toBe(-50); // (75 - 100) * 2 = -50
    expect(result.percentage).toBe(-25); // (-50 / 200) * 100 = -25%
  });

  it('should handle zero profit/loss', () => {
    const result = calculateProfit(100, 100, 5);
    expect(result.absolute).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should handle fractional quantities', () => {
    const result = calculateProfit(50000, 60000, 0.5);
    expect(result.absolute).toBe(5000); // (60000 - 50000) * 0.5 = 5000
    expect(result.percentage).toBe(20); // (5000 / 25000) * 100 = 20%
  });

  it('should round to 2 decimal places', () => {
    const result = calculateProfit(100.123, 150.789, 1.5);
    expect(result.absolute.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    expect(result.percentage.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
  });

  it('should handle very small quantities', () => {
    const result = calculateProfit(50000, 60000, 0.00001);
    expect(result.absolute).toBeCloseTo(0.1, 2);
  });

  it('should handle large price differences', () => {
    const result = calculateProfit(1, 1000000, 1);
    expect(result.absolute).toBe(999999);
    expect(result.percentage).toBeCloseTo(99999900, 0);
  });

  it('should not return NaN/Infinity when invested amount is zero', () => {
    const zeroQuantity = calculateProfit(100, 150, 0);
    expect(zeroQuantity.absolute).toBe(0);
    expect(zeroQuantity.percentage).toBe(0);

    const zeroBuyPrice = calculateProfit(0, 150, 2);
    expect(Number.isFinite(zeroBuyPrice.percentage)).toBe(true);
    expect(zeroBuyPrice.percentage).toBe(0);
  });
});

describe('getPriceKey', () => {
  it('should prefer coinId when present', () => {
    expect(getPriceKey({ coinId: 'Bitcoin', assetSymbol: 'BTC' })).toBe('bitcoin');
  });

  it('should fall back to assetSymbol for legacy records without coinId', () => {
    expect(getPriceKey({ assetSymbol: 'Ethereum' })).toBe('ethereum');
    expect(getPriceKey({ coinId: '', assetSymbol: 'Solana' })).toBe('solana');
  });
});


describe('generateShareCode', () => {
  it('should generate 8-character code', () => {
    const code = generateShareCode();
    expect(code).toHaveLength(8);
  });

  it('should only contain uppercase letters and numbers', () => {
    const code = generateShareCode();
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('should generate different codes on consecutive calls', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShareCode());
    }
    // Should have generated mostly unique codes (allowing for rare collisions)
    expect(codes.size).toBeGreaterThan(95);
  });

  it('should not contain lowercase letters', () => {
    const code = generateShareCode();
    expect(code).not.toMatch(/[a-z]/);
  });

  it('should not contain special characters', () => {
    const code = generateShareCode();
    expect(code).not.toMatch(/[^A-Z0-9]/);
  });
});
