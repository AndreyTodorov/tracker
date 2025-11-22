import { describe, it, expect } from 'vitest';
import {
  calculateProfit,
  calculatePortfolioStats,
  generateShareCode,
} from './calculations';
import type { Investment } from '../types';

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
});

describe('calculatePortfolioStats', () => {
  const createMockInvestment = (overrides: Partial<Investment> = {}): Investment => ({
    id: 'test-1',
    userId: 'user-1',
    userName: 'Test User',
    assetName: 'Bitcoin',
    assetSymbol: 'bitcoin',
    buyPrice: 50000,
    investmentAmount: 1000,
    quantity: 0.02,
    purchaseDate: Date.now(),
    createdAt: Date.now(),
    currency: 'USD',
    ...overrides,
  });

  it('should calculate portfolio stats with single investment', () => {
    const investments = [createMockInvestment()];
    const prices = new Map([
      ['bitcoin', new Map([['usd', 60000]])],
    ]);

    const result = calculatePortfolioStats(investments, prices);

    expect(result.totalInvested).toBe(1000); // 50000 * 0.02
    expect(result.totalValue).toBe(1200); // 60000 * 0.02
    expect(result.totalProfit).toBe(200); // 1200 - 1000
    expect(result.totalProfitPercentage).toBe(20); // (200 / 1000) * 100
    expect(result.investments).toEqual(investments);
  });

  it('should calculate portfolio stats with multiple investments', () => {
    const investments = [
      createMockInvestment({
        id: 'inv-1',
        assetSymbol: 'bitcoin',
        buyPrice: 50000,
        quantity: 0.02,
        currency: 'usd',
      }),
      createMockInvestment({
        id: 'inv-2',
        assetSymbol: 'ethereum',
        buyPrice: 3000,
        quantity: 1,
        currency: 'usd',
      }),
    ];

    const prices = new Map([
      ['bitcoin', new Map([['usd', 60000]])],
      ['ethereum', new Map([['usd', 3500]])],
    ]);

    const result = calculatePortfolioStats(investments, prices);

    expect(result.totalInvested).toBe(4000); // (50000 * 0.02) + (3000 * 1)
    expect(result.totalValue).toBe(4700); // (60000 * 0.02) + (3500 * 1)
    expect(result.totalProfit).toBe(700);
    expect(result.totalProfitPercentage).toBe(17.5);
  });

  it('should handle missing prices by using buy price', () => {
    const investments = [createMockInvestment()];
    const prices = new Map(); // No prices available

    const result = calculatePortfolioStats(investments, prices);

    expect(result.totalValue).toBe(1000); // Uses buyPrice: 50000 * 0.02
    expect(result.totalProfit).toBe(0); // No change
    expect(result.totalProfitPercentage).toBe(0);
  });

  it('should handle mixed currencies correctly', () => {
    const investments = [
      createMockInvestment({
        id: 'inv-1',
        assetSymbol: 'bitcoin',
        buyPrice: 50000,
        quantity: 0.02,
        currency: 'usd',
      }),
      createMockInvestment({
        id: 'inv-2',
        assetSymbol: 'bitcoin',
        buyPrice: 45000,
        quantity: 0.02,
        currency: 'eur',
      }),
    ];

    const prices = new Map([
      ['bitcoin', new Map([
        ['usd', 60000],
        ['eur', 55000],
      ])],
    ]);

    const result = calculatePortfolioStats(investments, prices);

    expect(result.totalInvested).toBe(1900); // (50000 * 0.02) + (45000 * 0.02)
    expect(result.totalValue).toBe(2300); // (60000 * 0.02) + (55000 * 0.02)
    expect(result.totalProfit).toBe(400);
  });

  it('should handle empty investment list', () => {
    const result = calculatePortfolioStats([], new Map());

    expect(result.totalInvested).toBe(0);
    expect(result.totalValue).toBe(0);
    expect(result.totalProfit).toBe(0);
    expect(result.totalProfitPercentage).toBe(0);
    expect(result.investments).toEqual([]);
  });

  it('should handle loss scenarios', () => {
    const investments = [createMockInvestment()];
    const prices = new Map([
      ['bitcoin', new Map([['usd', 40000]])], // Price dropped
    ]);

    const result = calculatePortfolioStats(investments, prices);

    expect(result.totalValue).toBe(800); // 40000 * 0.02
    expect(result.totalProfit).toBe(-200); // 800 - 1000
    expect(result.totalProfitPercentage).toBe(-20);
  });

  it('should round results to 2 decimal places', () => {
    const investments = [
      createMockInvestment({
        buyPrice: 100.123,
        quantity: 1.234567,
      }),
    ];
    const prices = new Map([
      ['bitcoin', new Map([['usd', 150.789]])],
    ]);

    const result = calculatePortfolioStats(investments, prices);

    expect(result.totalValue.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    expect(result.totalInvested.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    expect(result.totalProfit.toString()).toMatch(/^-?\d+(\.\d{1,2})?$/);
    expect(result.totalProfitPercentage.toString()).toMatch(/^-?\d+(\.\d{1,2})?$/);
  });

  it('should handle price for different currency than investment', () => {
    const investments = [
      createMockInvestment({
        assetSymbol: 'bitcoin',
        currency: 'eur',
        buyPrice: 45000,
        quantity: 0.02,
      }),
    ];

    const prices = new Map([
      ['bitcoin', new Map([['eur', 55000]])],
    ]);

    const result = calculatePortfolioStats(investments, prices);

    expect(result.totalInvested).toBe(900); // 45000 * 0.02
    expect(result.totalValue).toBe(1100); // 55000 * 0.02
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
