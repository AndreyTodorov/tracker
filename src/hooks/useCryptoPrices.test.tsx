import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useCryptoPrices } from './useCryptoPrices';
import { getMultipleCryptoPrices } from '../services/coingecko.service';
import { mockInvestment } from '../test/test-utils';
import type { Investment } from '../types';

vi.mock('../services/coingecko.service', () => ({
  getMultipleCryptoPrices: vi.fn(),
}));

const Probe = ({
  investments,
  displayCurrency,
}: {
  investments: Investment[];
  displayCurrency: string;
}) => {
  useCryptoPrices(investments, displayCurrency);
  return null;
};

describe('useCryptoPrices', () => {
  beforeEach(() => {
    vi.mocked(getMultipleCryptoPrices).mockReset();
    vi.mocked(getMultipleCryptoPrices).mockResolvedValue(new Map());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests the display currency alongside the holding currencies', async () => {
    // Without the display currency in the request, no coin would be quoted in
    // both currencies and no cross-rate could be derived.
    const investments = [mockInvestment({ currency: 'EUR' }) as Investment];

    render(<Probe investments={investments} displayCurrency="GBP" />);

    await waitFor(() => {
      expect(getMultipleCryptoPrices).toHaveBeenCalledWith(
        ['bitcoin'],
        expect.arrayContaining(['EUR', 'GBP'])
      );
    });
  });

  it('does not request the same currency twice', async () => {
    const investments = [mockInvestment({ currency: 'USD' }) as Investment];

    render(<Probe investments={investments} displayCurrency="USD" />);

    await waitFor(() => {
      expect(getMultipleCryptoPrices).toHaveBeenCalledWith(['bitcoin'], ['USD']);
    });
  });

  it('refetches when the display currency changes', async () => {
    const investments = [mockInvestment({ currency: 'EUR' }) as Investment];

    const { rerender } = render(
      <Probe investments={investments} displayCurrency="GBP" />
    );
    await waitFor(() => expect(getMultipleCryptoPrices).toHaveBeenCalledTimes(1));

    rerender(<Probe investments={investments} displayCurrency="JPY" />);

    await waitFor(() => {
      expect(getMultipleCryptoPrices).toHaveBeenLastCalledWith(
        ['bitcoin'],
        expect.arrayContaining(['EUR', 'JPY'])
      );
    });
  });
});
