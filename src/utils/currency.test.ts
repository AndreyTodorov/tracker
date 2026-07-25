import { describe, it, expect } from 'vitest';
import { deriveRate, toDisplayValues, calculatePortfolioStats } from './currency';
import { mockInvestment } from '../test/test-utils';
import type { Investment } from '../types';

const priceMap = (
  entries: Record<string, Record<string, number>>
): Map<string, Map<string, number>> =>
  new Map(
    Object.entries(entries).map(([coin, byCurrency]) => [
      coin,
      new Map(Object.entries(byCurrency)),
    ])
  );

describe('deriveRate', () => {
  it('returns 1 when the currencies match, ignoring case', () => {
    expect(deriveRate(new Map(), 'EUR', 'eur')).toBe(1);
  });

  it('derives the rate from a coin quoted in both currencies', () => {
    const prices = priceMap({ bitcoin: { usd: 64800, eur: 60000 } });

    expect(deriveRate(prices, 'EUR', 'USD')).toBeCloseTo(1.08, 10);
  });

  it('inverts cleanly when the direction is reversed', () => {
    const prices = priceMap({ bitcoin: { usd: 64800, eur: 60000 } });

    expect(deriveRate(prices, 'USD', 'EUR')).toBeCloseTo(1 / 1.08, 10);
  });

  it('takes the median across coins so one bad quote cannot skew it', () => {
    const prices = priceMap({
      sane: { usd: 100, eur: 100 },
      alsoSane: { usd: 108, eur: 100 },
      wildlyStale: { usd: 500, eur: 100 },
    });

    expect(deriveRate(prices, 'EUR', 'USD')).toBeCloseTo(1.08, 10);
  });

  it('skips coins quoted at zero rather than dividing by them', () => {
    const prices = priceMap({
      delisted: { usd: 0, eur: 0 },
      bitcoin: { usd: 64800, eur: 60000 },
    });

    expect(deriveRate(prices, 'EUR', 'USD')).toBeCloseTo(1.08, 10);
  });

  it('returns null when no coin is quoted in both currencies', () => {
    const prices = priceMap({ bitcoin: { eur: 60000 } });

    expect(deriveRate(prices, 'EUR', 'USD')).toBeNull();
  });
});

describe('toDisplayValues', () => {
  const eurHolding = (overrides = {}): Investment =>
    mockInvestment({
      assetSymbol: 'bitcoin',
      buyPrice: 50000,
      quantity: 1,
      currency: 'EUR',
      ...overrides,
    }) as Investment;

  it('leaves a holding untouched when it is already in the display currency', () => {
    const prices = priceMap({ bitcoin: { usd: 60000 } });
    const investment = eurHolding({ currency: 'USD' });

    const result = toDisplayValues(investment, prices, 'USD');

    expect(result).toMatchObject({
      currency: 'USD',
      buyPrice: 50000,
      currentPrice: 60000,
      invested: 50000,
      currentValue: 60000,
    });
  });

  it('prefers the direct quote over converting the native price', () => {
    // The rate derived across coins is 2.0, but bitcoin is quoted directly in
    // USD at 60000. The direct quote must win: it is exact, the rate is not.
    const prices = priceMap({
      coinA: { usd: 200, eur: 100 },
      coinB: { usd: 400, eur: 200 },
      bitcoin: { usd: 60000, eur: 50000 },
    });

    const result = toDisplayValues(eurHolding(), prices, 'USD');

    expect(result.currentPrice).toBe(60000);
    expect(result.buyPrice).toBe(100000);
    expect(result.invested).toBe(100000);
    expect(result.currentValue).toBe(60000);
  });

  it('converts the native price when there is no direct quote', () => {
    const prices = priceMap({
      coinA: { usd: 200, eur: 100 },
      bitcoin: { eur: 50000 },
    });

    const result = toDisplayValues(eurHolding({ buyPrice: 40000 }), prices, 'USD');

    expect(result.currentPrice).toBe(100000);
    expect(result.buyPrice).toBe(80000);
  });

  it('falls back to the converted buy price when there is no live price', () => {
    const prices = priceMap({ coinA: { usd: 200, eur: 100 } });

    const result = toDisplayValues(eurHolding({ buyPrice: 40000 }), prices, 'USD');

    expect(result.buyPrice).toBe(80000);
    expect(result.currentPrice).toBe(80000);
    expect(result.profit.absolute).toBe(0);
  });

  it('treats a live price of zero as a real total loss', () => {
    const prices = priceMap({
      coinA: { usd: 200, eur: 100 },
      bitcoin: { usd: 0, eur: 0 },
    });

    const result = toDisplayValues(eurHolding(), prices, 'USD');

    expect(result.currentValue).toBe(0);
    expect(result.profit.percentage).toBe(-100);
  });

  it('treats a record with no currency as being in the display currency', () => {
    const prices = priceMap({ bitcoin: { usd: 60000 } });
    const investment = eurHolding({ currency: undefined as unknown as string });

    expect(() => toDisplayValues(investment, prices, 'USD')).not.toThrow();
    expect(toDisplayValues(investment, prices, 'USD')).toMatchObject({
      currency: 'USD',
      currentPrice: 60000,
    });
  });

  it('returns the holding untouched when asked for its own currency', () => {
    // How the list renders every card: no conversion, whatever the portfolio
    // display currency happens to be.
    const prices = priceMap({ bitcoin: { eur: 55000, usd: 66000 } });
    const investment = eurHolding();

    const result = toDisplayValues(investment, prices, investment.currency);

    expect(result).toMatchObject({
      currency: 'EUR',
      buyPrice: 50000,
      currentPrice: 55000,
      currentValue: 55000,
    });
  });

  it('stays in the native currency when no rate can be derived', () => {
    const prices = priceMap({ bitcoin: { eur: 55000 } });

    const result = toDisplayValues(eurHolding(), prices, 'USD');

    expect(result).toMatchObject({
      currency: 'EUR',
      buyPrice: 50000,
      currentPrice: 55000,
    });
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

    const result = calculatePortfolioStats(investments, prices, 'USD');

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

    const result = calculatePortfolioStats(investments, prices, 'USD');

    expect(result.totalInvested).toBe(4000); // (50000 * 0.02) + (3000 * 1)
    expect(result.totalValue).toBe(4700); // (60000 * 0.02) + (3500 * 1)
    expect(result.totalProfit).toBe(700);
    expect(result.totalProfitPercentage).toBe(17.5);
  });

  it('should handle missing prices by using buy price', () => {
    const investments = [createMockInvestment()];
    const prices = new Map(); // No prices available

    const result = calculatePortfolioStats(investments, prices, 'USD');

    expect(result.totalValue).toBe(1000); // Uses buyPrice: 50000 * 0.02
    expect(result.totalProfit).toBe(0); // No change
    expect(result.totalProfitPercentage).toBe(0);
  });

  it('should treat a live price of 0 as a total loss, not a missing price', () => {
    const investments = [createMockInvestment()];
    const prices = new Map([
      ['bitcoin', new Map([['usd', 0]])], // delisted/worthless coin
    ]);

    const result = calculatePortfolioStats(investments, prices, 'USD');

    expect(result.totalInvested).toBe(1000);
    expect(result.totalValue).toBe(0);
    expect(result.totalProfit).toBe(-1000);
    expect(result.totalProfitPercentage).toBe(-100);
  });

  it('should convert mixed currencies into the display currency', () => {
    const investments = [
      createMockInvestment({
        id: 'inv-1',
        assetSymbol: 'bitcoin',
        buyPrice: 50000,
        quantity: 0.02,
        currency: 'USD',
      }),
      createMockInvestment({
        id: 'inv-2',
        assetSymbol: 'bitcoin',
        buyPrice: 45000,
        quantity: 0.02,
        currency: 'EUR',
      }),
    ];

    // Implies a EUR -> USD rate of 60000 / 50000 = 1.2
    const prices = new Map([
      ['bitcoin', new Map([
        ['usd', 60000],
        ['eur', 50000],
      ])],
    ]);

    const result = calculatePortfolioStats(investments, prices, 'USD');

    // (50000 * 0.02) + (45000 * 1.2 * 0.02)
    expect(result.totalInvested).toBe(2080);
    // Both holdings valued at the direct USD quote: 60000 * 0.02 each
    expect(result.totalValue).toBe(2400);
    expect(result.totalProfit).toBe(320);
    expect(result.totalsCurrency).toBe('USD');
    expect(result.conversionFailed).toBe(false);
  });

  it('should report conversion failure and label totals with the largest holding', () => {
    const investments = [
      createMockInvestment({
        id: 'small',
        assetSymbol: 'bitcoin',
        buyPrice: 1000,
        quantity: 1,
        currency: 'GBP',
      }),
      createMockInvestment({
        id: 'large',
        assetSymbol: 'ethereum',
        buyPrice: 5000,
        quantity: 1,
        currency: 'EUR',
      }),
    ];

    // No coin is quoted in two currencies, so no rate can be derived.
    const prices = new Map([
      ['bitcoin', new Map([['gbp', 1200]])],
      ['ethereum', new Map([['eur', 5500]])],
    ]);

    const result = calculatePortfolioStats(investments, prices, 'USD');

    expect(result.conversionFailed).toBe(true);
    expect(result.totalsCurrency).toBe('EUR');
  });

  it('should report conversion failure when holdings agree on a currency that is not the selected one', () => {
    const investments = [
      createMockInvestment({ currency: 'EUR', buyPrice: 50000, quantity: 0.02 }),
    ];
    const prices = new Map([['bitcoin', new Map([['eur', 55000]])]]);

    const result = calculatePortfolioStats(investments, prices, 'USD');

    // The rows agree with each other but none reached USD, so the tiles must
    // not claim to be USD.
    expect(result.conversionFailed).toBe(true);
    expect(result.totalsCurrency).toBe('EUR');
  });

  it('should label an empty portfolio with the selected currency', () => {
    const result = calculatePortfolioStats([], new Map(), 'GBP');

    expect(result.totalsCurrency).toBe('GBP');
    expect(result.conversionFailed).toBe(false);
  });

  it('should handle empty investment list', () => {
    const result = calculatePortfolioStats([], new Map(), 'USD');

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

    const result = calculatePortfolioStats(investments, prices, 'USD');

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

    const result = calculatePortfolioStats(investments, prices, 'USD');

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

    const result = calculatePortfolioStats(investments, prices, 'USD');

    expect(result.totalInvested).toBe(900); // 45000 * 0.02
    expect(result.totalValue).toBe(1100); // 55000 * 0.02
  });
});