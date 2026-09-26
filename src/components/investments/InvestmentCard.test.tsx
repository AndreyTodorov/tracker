/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { InvestmentCard } from './InvestmentCard';
import { mockInvestment } from '../../test/test-utils';
import * as AuthContext from '../../context/AuthContext';
import { toDisplayValues } from '../../utils/currency';
import { deleteInvestment } from '../../services/investment.service';
import { getPriceKey } from '../../utils/calculations';
import type { Investment } from '../../types';

// Mock the auth context
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user' },
    userData: null,
    loading: false,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock investment service
vi.mock('../../services/investment.service', () => ({
  deleteInvestment: vi.fn(),
}));

const signedInAs = (uid: string) =>
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    currentUser: { uid } as any,
    userData: null,
    loading: false,
  });

// Builds the card with display values derived natively, i.e. exactly what the
// list passes when the display currency matches the holding's own currency.
const cardElement = (
  investment: Investment,
  currentPrice?: number,
  displayCurrency?: string
) => {
  const prices =
    currentPrice === undefined
      ? new Map<string, Map<string, number>>()
      : new Map([
          [
            getPriceKey(investment),
            new Map([[investment.currency.toLowerCase(), currentPrice]]),
          ],
        ]);

  return (
    <InvestmentCard
      investment={investment}
      display={toDisplayValues(investment, prices, displayCurrency ?? investment.currency)}
      nativeCurrentPrice={currentPrice}
      prices={prices}
    />
  );
};

const openDetails = async (user: ReturnType<typeof userEvent.setup>, assetName = 'Bitcoin') => {
  await user.click(screen.getByRole('button', { name: new RegExp(assetName) }));
  return screen.getByRole('dialog');
};

describe('InvestmentCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signedInAs('test-user');
  });

  describe('tile', () => {
    it('shows the asset name and symbol', () => {
      render(cardElement(mockInvestment({ assetName: 'Bitcoin', assetSymbol: 'BTC' })));

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    it('shows the current value (current price x quantity) in the investment currency', () => {
      render(cardElement(mockInvestment({ buyPrice: 50000, quantity: 0.02, currency: 'USD' }), 60000));

      // 60000 * 0.02 = 1200
      expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    });

    it('shows a positive return with a plus sign', () => {
      render(cardElement(mockInvestment({ buyPrice: 50000, quantity: 0.02 }), 60000));

      expect(screen.getByText('+20.00%')).toBeInTheDocument();
    });

    it('shows a loss as a negative return', () => {
      render(cardElement(mockInvestment({ buyPrice: 50000, quantity: 0.02 }), 40000));

      expect(screen.getByText('-20.00%')).toBeInTheDocument();
    });

    it('summarises quantity, buy price and current price', () => {
      render(cardElement(mockInvestment({ buyPrice: 50000, quantity: 0.5, currency: 'USD' }), 60000));

      expect(screen.getByText('0.5 @ $50,000.00 → $60,000.00')).toBeInTheDocument();
    });

    it('shows the optional name badge when present', () => {
      render(cardElement(mockInvestment({ name: 'Main Portfolio' })));

      expect(screen.getByText(/Main Portfolio/)).toBeInTheDocument();
    });

    it('shows the owner name on someone else\'s investment', () => {
      signedInAs('different-user');

      render(cardElement(mockInvestment({ userId: 'test-user', userName: 'John Doe' })));

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it('hides the owner name on your own investment', () => {
      render(cardElement(mockInvestment({ userId: 'test-user', userName: 'John Doe' })));

      expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
    });

    it('leaves the live indicator to the portfolio summary', () => {
      render(cardElement(mockInvestment({ buyPrice: 50000 }), 60000));

      expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    });

    it('handles different currencies', () => {
      const { rerender, container } = render(
        cardElement(mockInvestment({ currency: 'EUR', buyPrice: 45000 }))
      );
      expect(container.textContent).toContain('€');

      rerender(cardElement(mockInvestment({ currency: 'GBP', buyPrice: 40000 })));
      expect(container.textContent).toContain('£');
    });
  });

  describe('details', () => {
    it('opens the full details when the tile is tapped', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ buyPrice: 50000, quantity: 0.02, currency: 'USD' }), 60000));

      const dialog = await openDetails(user);

      for (const label of ['Buy Price', 'Current Price', 'Quantity', 'Invested', 'Current Value', 'Profit/Loss']) {
        expect(within(dialog).getByText(label)).toBeInTheDocument();
      }
      expect(within(dialog).getByText('$200.00')).toBeInTheDocument();
    });

    it('shows the formatted purchase date', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ purchaseDate: new Date('2024-01-15').getTime() })));

      const dialog = await openDetails(user);

      expect(within(dialog).getByText(/Purchased Jan 15, 2024/)).toBeInTheDocument();
    });

    it('offers edit and delete to the owner', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user' })));

      const dialog = await openDetails(user);

      expect(within(dialog).getByRole('button', { name: 'Edit investment' })).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Delete investment' })).toBeInTheDocument();
    });

    it('does not offer edit or delete to anyone else', async () => {
      signedInAs('different-user');
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user' })));

      const dialog = await openDetails(user);

      expect(within(dialog).queryByRole('button', { name: 'Edit investment' })).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('button', { name: 'Delete investment' })).not.toBeInTheDocument();
    });
  });

  describe('deleting', () => {
    const startDelete = async (user: ReturnType<typeof userEvent.setup>) => {
      const details = await openDetails(user);
      await user.click(within(details).getByRole('button', { name: 'Delete investment' }));
      return screen.getByRole('dialog');
    };

    it('asks for confirmation in the app instead of deleting straight away', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user', assetName: 'Bitcoin' })));

      const confirm = await startDelete(user);

      expect(confirm).toHaveTextContent(/delete this Bitcoin investment/i);
      expect(deleteInvestment).not.toHaveBeenCalled();
    });

    it('deletes once confirmed', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user', id: 'inv-1' })));

      const confirm = await startDelete(user);
      await user.click(within(confirm).getByRole('button', { name: 'Delete' }));

      expect(deleteInvestment).toHaveBeenCalledWith('test-user', 'inv-1');
    });

    it('keeps the investment when cancelled', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user' })));

      const confirm = await startDelete(user);
      await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));

      expect(deleteInvestment).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('rendering the values it is given', () => {
    // A EUR holding shown in USD. bitcoin is quoted in both, implying a rate
    // of 60000 / 50000 = 1.2.
    const convertedCard = () => {
      const investment = mockInvestment({
        currency: 'EUR',
        buyPrice: 50000,
        quantity: 1,
      }) as Investment;

      const prices = new Map([
        ['bitcoin', new Map([['usd', 60000], ['eur', 50000]])],
      ]);

      return (
        <InvestmentCard
          investment={investment}
          display={toDisplayValues(investment, prices, 'USD')}
          nativeCurrentPrice={50000}
          prices={prices}
        />
      );
    };

    it('renders whatever currency the supplied values are in', () => {
      const { container } = render(convertedCard());

      // 50000 EUR buy price at 1.2 becomes $60,000
      expect(container.textContent).toContain('$60,000.00');
      expect(container.textContent).not.toContain('€');
    });

    it('offers the native price, not the converted one, as a new buy price', async () => {
      const user = userEvent.setup();
      render(convertedCard());

      const details = await openDetails(user);
      await user.click(within(details).getByRole('button', { name: 'Edit investment' }));

      // "Use as Buy Price" writes this value straight into the stored,
      // native-currency buyPrice field, so it must never be a converted price.
      expect(screen.getByText(/Current Price \(EUR\)/)).toBeInTheDocument();
      expect(screen.getByText('€50,000.00')).toBeInTheDocument();
    });
  });
});
