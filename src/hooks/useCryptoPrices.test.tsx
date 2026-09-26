import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('ignores a holding whose stored currency is not supported', async () => {
    // Older records predate the currency whitelist. getMultipleCryptoPrices
    // rejects an unsupported currency outright, so without filtering here one
    // bad record would leave every holding with no live price at all.
    const investments = [
      mockInvestment({ id: '1', currency: 'USD' }) as Investment,
      mockInvestment({ id: '2', currency: 'BTC' }) as Investment,
    ];

    render(<Probe investments={investments} displayCurrency="USD" />);

    await waitFor(() => {
      expect(getMultipleCryptoPrices).toHaveBeenCalledWith(['bitcoin'], ['USD']);
    });
  });

  it('is loading again while prices for a new set of holdings are fetched', async () => {
    const LoadingProbe = ({ investments }: { investments: Investment[] }) => (
      <span data-testid="loading">{String(useCryptoPrices(investments, 'USD').loading)}</span>
    );
    const bitcoin = [mockInvestment({ id: '1', coinId: 'bitcoin', currency: 'USD' }) as Investment];
    const ethereum = [mockInvestment({ id: '2', coinId: 'ethereum', assetSymbol: 'ETH', currency: 'USD' }) as Investment];

    const { rerender } = render(<LoadingProbe investments={bitcoin} />);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    vi.mocked(getMultipleCryptoPrices).mockReturnValue(new Promise(() => {}));
    rerender(<LoadingProbe investments={ethereum} />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('true'));
  });
});
