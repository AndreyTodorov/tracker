import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addInvestment, updateInvestment, deleteInvestment, setPortfolioVisibility } from './investment.service';

// Mock Firebase
vi.mock('../config/firebase', () => ({
  db: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  push: vi.fn(() => ({ key: 'mock-investment-id' })),
  set: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
  get: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
}));

describe('Investment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addInvestment', () => {
    const validParams = {
      userId: 'user123',
      userName: 'Test User',
      assetName: 'Bitcoin',
      assetSymbol: 'BTC',
      coinId: 'bitcoin',
      buyPrice: 50000,
      investmentAmount: 1000,
      quantity: 0.02,
      currency: 'USD',
    };

    it('should successfully add a valid investment', async () => {
      const result = await addInvestment(
        validParams.userId,
        validParams.userName,
        validParams.assetName,
        validParams.assetSymbol,
        validParams.coinId,
        validParams.buyPrice,
        validParams.investmentAmount,
        validParams.quantity,
        validParams.currency
      );

      expect(result).toBe('mock-investment-id');
    });

    it('should normalize currency to uppercase', async () => {
      const { set } = await import('firebase/database');

      await addInvestment(
        validParams.userId,
        validParams.userName,
        validParams.assetName,
        validParams.assetSymbol,
        validParams.coinId,
        validParams.buyPrice,
        validParams.investmentAmount,
        validParams.quantity,
        'eur' // lowercase
      );

      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ currency: 'EUR' })
      );
    });

    it('should throw error for missing userId', async () => {
      await expect(
        addInvestment(
          '',
          validParams.userName,
          validParams.assetName,
          validParams.assetSymbol,
          validParams.coinId,
          validParams.buyPrice,
          validParams.investmentAmount,
          validParams.quantity,
          validParams.currency
        )
      ).rejects.toThrow('Missing required fields');
    });

    it('should throw error for missing userName', async () => {
      await expect(
        addInvestment(
          validParams.userId,
          '',
          validParams.assetName,
          validParams.assetSymbol,
          validParams.coinId,
          validParams.buyPrice,
          validParams.investmentAmount,
          validParams.quantity,
          validParams.currency
        )
      ).rejects.toThrow('Missing required fields');
    });

    it('should throw error for negative buy price', async () => {
      await expect(
        addInvestment(
          validParams.userId,
          validParams.userName,
          validParams.assetName,
          validParams.assetSymbol,
          validParams.coinId,
          -100,
          validParams.investmentAmount,
          validParams.quantity,
          validParams.currency
        )
      ).rejects.toThrow('Buy price must be greater than 0');
    });

    it('should throw error for zero buy price', async () => {
      await expect(
        addInvestment(
          validParams.userId,
          validParams.userName,
          validParams.assetName,
          validParams.assetSymbol,
          validParams.coinId,
          0,
          validParams.investmentAmount,
          validParams.quantity,
          validParams.currency
        )
      ).rejects.toThrow('Buy price must be greater than 0');
    });

    it('should throw error for negative investment amount', async () => {
      await expect(
        addInvestment(
          validParams.userId,
          validParams.userName,
          validParams.assetName,
          validParams.assetSymbol,
          validParams.coinId,
          validParams.buyPrice,
          -500,
          validParams.quantity,
          validParams.currency
        )
      ).rejects.toThrow('Investment amount must be greater than 0');
    });

    it('should throw error for negative quantity', async () => {
      await expect(
        addInvestment(
          validParams.userId,
          validParams.userName,
          validParams.assetName,
          validParams.assetSymbol,
          validParams.coinId,
          validParams.buyPrice,
          validParams.investmentAmount,
          -0.5,
          validParams.currency
        )
      ).rejects.toThrow('Quantity must be greater than 0');
    });

    it('should throw error for invalid currency', async () => {
      await expect(
        addInvestment(
          validParams.userId,
          validParams.userName,
          validParams.assetName,
          validParams.assetSymbol,
          validParams.coinId,
          validParams.buyPrice,
          validParams.investmentAmount,
          validParams.quantity,
          'INVALID'
        )
      ).rejects.toThrow('Invalid currency');
    });

    it('should accept all valid currencies', async () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

      for (const currency of validCurrencies) {
        await expect(
          addInvestment(
            validParams.userId,
            validParams.userName,
            validParams.assetName,
            validParams.assetSymbol,
          validParams.coinId,
            validParams.buyPrice,
            validParams.investmentAmount,
            validParams.quantity,
            currency
          )
        ).resolves.toBe('mock-investment-id');
      }
    });

    it('should include optional name when provided', async () => {
      const { set } = await import('firebase/database');
      const optionalName = 'Long-term Holdings';

      await addInvestment(
        validParams.userId,
        validParams.userName,
        validParams.assetName,
        validParams.assetSymbol,
        validParams.coinId,
        validParams.buyPrice,
        validParams.investmentAmount,
        validParams.quantity,
        validParams.currency,
        optionalName
      );

      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: optionalName })
      );
    });
  });

  describe('updateInvestment', () => {
    it('should throw error for empty user ID', async () => {
      await expect(
        updateInvestment('', 'inv123', { buyPrice: 60000 })
      ).rejects.toThrow('User ID is required');
    });

    it('should throw error for empty investment ID', async () => {
      await expect(
        updateInvestment('user123', '', { buyPrice: 60000 })
      ).rejects.toThrow('Investment ID is required');
    });

    it('should throw error for negative buy price in update', async () => {
      await expect(
        updateInvestment('user123', 'inv123', { buyPrice: -100 })
      ).rejects.toThrow('Buy price must be greater than 0');
    });

    it('should throw error for zero investment amount in update', async () => {
      await expect(
        updateInvestment('user123', 'inv123', { investmentAmount: 0 })
      ).rejects.toThrow('Investment amount must be greater than 0');
    });

    it('should delete the name when it is cleared', async () => {
      const { update } = await import('firebase/database');

      await updateInvestment('user123', 'inv123', { name: '' });

      // Firebase update() ignores omitted keys, so an empty name has to be
      // sent as null or the old name survives and cannot be removed.
      expect(update).toHaveBeenCalledWith(undefined, expect.objectContaining({ name: null }));
    });

    it('should trim and keep a non-empty name', async () => {
      const { update } = await import('firebase/database');

      await updateInvestment('user123', 'inv123', { name: '  Main  ' });

      expect(update).toHaveBeenCalledWith(undefined, expect.objectContaining({ name: 'Main' }));
    });

    it('should leave the name untouched when it is not part of the update', async () => {
      const { update } = await import('firebase/database');

      await updateInvestment('user123', 'inv123', { buyPrice: 60000 });

      expect(update).toHaveBeenCalledWith(
        undefined,
        expect.not.objectContaining({ name: expect.anything() })
      );
    });

    it('should throw error for negative quantity in update', async () => {
      await expect(
        updateInvestment('user123', 'inv123', { quantity: -0.5 })
      ).rejects.toThrow('Quantity must be greater than 0');
    });

    it('should throw error for invalid currency in update', async () => {
      await expect(
        updateInvestment('user123', 'inv123', { currency: 'FAKE' })
      ).rejects.toThrow('Invalid currency');
    });

    it('should normalize currency to uppercase in updates', async () => {
      const { update } = await import('firebase/database');

      await updateInvestment('user123', 'inv123', { currency: 'gbp' });

      expect(update).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ currency: 'GBP' })
      );
    });

    it('should allow valid partial updates', async () => {
      const { update } = await import('firebase/database');

      await updateInvestment('user123', 'inv123', {
        buyPrice: 55000,
        quantity: 0.025,
      });

      expect(update).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          buyPrice: 55000,
          quantity: 0.025,
        })
      );
    });

    it('should write to the per-user investment path', async () => {
      const { ref } = await import('firebase/database');

      await updateInvestment('user123', 'inv123', { buyPrice: 55000 });

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'investments/user123/inv123');
    });
  });

  describe('deleteInvestment', () => {
    it('should throw error for empty user ID', async () => {
      await expect(
        deleteInvestment('', 'inv123')
      ).rejects.toThrow('User ID is required');
    });

    it('should throw error for empty investment ID', async () => {
      await expect(
        deleteInvestment('user123', '')
      ).rejects.toThrow('Investment ID is required');
    });

    it('should call remove for valid investment ID', async () => {
      const { remove, ref } = await import('firebase/database');

      await deleteInvestment('user123', 'inv123');

      expect(remove).toHaveBeenCalled();
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'investments/user123/inv123');
    });
  });

  describe('setPortfolioVisibility', () => {
    it('lists the portfolio under the name stored on the account', async () => {
      const { set, get, ref } = await import('firebase/database');
      vi.mocked(ref).mockImplementation((_db: unknown, path?: string) => path as never);
      vi.mocked(get).mockResolvedValue({ val: () => 'Ada', exists: () => true } as never);

      await setPortfolioVisibility('u1', true);

      // Taking the name from the caller let a stale or empty value overwrite
      // the real one, so it is read from the account instead.
      expect(set).toHaveBeenCalledWith('publicProfiles/u1', { displayName: 'Ada' });
    });

    it('falls back to Anonymous when the account has no name', async () => {
      const { set, get, ref } = await import('firebase/database');
      vi.mocked(ref).mockImplementation((_db: unknown, path?: string) => path as never);
      vi.mocked(get).mockResolvedValue({ val: () => null, exists: () => false } as never);

      await setPortfolioVisibility('u1', true);

      expect(set).toHaveBeenCalledWith('publicProfiles/u1', { displayName: 'Anonymous' });
    });

    it('removes the listing without reading the name', async () => {
      const { remove, ref } = await import('firebase/database');
      vi.mocked(ref).mockImplementation((_db: unknown, path?: string) => path as never);

      await setPortfolioVisibility('u1', false);

      expect(remove).toHaveBeenCalledWith('publicProfiles/u1');
    });
  });
});
