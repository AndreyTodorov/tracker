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

describe('InvestmentCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render investment details', () => {
    const investment = mockInvestment({
      assetName: 'Bitcoin',
      assetSymbol: 'BTC',
    });

    render(cardElement(investment));

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('shows the owner name on someone else\'s investment', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      currentUser: { uid: 'different-user' } as any,
      userData: null,
      loading: false,
    });

    render(cardElement(mockInvestment({ userId: 'test-user', userName: 'John Doe' })));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('hides the owner name on your own investment', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      currentUser: { uid: 'test-user' } as any,
      userData: null,
      loading: false,
    });

    render(cardElement(mockInvestment({ userId: 'test-user', userName: 'John Doe' })));

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should display buy price and current price', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
      currency: 'USD',
    });

    render(cardElement(investment, 60000));

    expect(screen.getByText('Buy Price')).toBeInTheDocument();
    expect(screen.getByText('Current Price')).toBeInTheDocument();
  });

  it('leaves the live indicator to the portfolio summary', () => {
    render(cardElement(mockInvestment({ buyPrice: 50000 }), 60000));

    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('should display quantity', () => {
    const investment = mockInvestment({
      quantity: 0.5,
    });

    render(cardElement(investment));

    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('0.5')).toBeInTheDocument();
  });

  it('should display investment amount', () => {
    const investment = mockInvestment({
      investmentAmount: 1000,
    });

    render(cardElement(investment));

    expect(screen.getByText('Invested')).toBeInTheDocument();
  });

  it('should display current value (current price x quantity) in the investment currency', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
      quantity: 0.02,
      currency: 'USD',
    });

    render(cardElement(investment, 60000));

    expect(screen.getByText('Current Value')).toBeInTheDocument();
    // 60000 * 0.02 = 1200
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
  });

  it('should show profit with positive value', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
      quantity: 0.02,
    });

    render(cardElement(investment, 60000));

    expect(screen.getByText('Profit/Loss')).toBeInTheDocument();
    // Profit should be positive
    const profitElement = screen.getByText(/\+/);
    expect(profitElement).toBeInTheDocument();
  });

  it('should show loss with negative value', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
      quantity: 0.02,
    });

    render(cardElement(investment, 40000));

    expect(screen.getByText('Profit/Loss')).toBeInTheDocument();
    // Loss should be negative - check for text containing minus sign and amount
    expect(screen.getByText(/-\$200\.00/)).toBeInTheDocument();
  });

  it('should display optional name badge when present', () => {
    const investment = mockInvestment({
      name: 'Main Portfolio',
    });

    render(cardElement(investment));

    expect(screen.getByText(/Main Portfolio/)).toBeInTheDocument();
  });

  it('should not display name badge when not present', () => {
    const investment = mockInvestment({
      name: undefined,
    });

    render(cardElement(investment));

    expect(screen.queryByText(/📝/)).not.toBeInTheDocument();
  });

  it('should show edit and delete buttons for owner', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      currentUser: { uid: 'test-user' } as any,
      userData: null,
      loading: false,
    });

    const investment = mockInvestment({
      userId: 'test-user',
    });

    render(cardElement(investment));

    // Look for buttons (they have icons, so check by role)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // Edit and Delete buttons
  });

  it('should not show edit and delete buttons for non-owner', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      currentUser: { uid: 'different-user' } as any,
      userData: null,
      loading: false,
    });

    const investment = mockInvestment({
      userId: 'test-user',
    });

    render(cardElement(investment));

    // Should not have edit/delete buttons
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('should display formatted purchase date', () => {
    const purchaseDate = new Date('2024-01-15').getTime();
    const investment = mockInvestment({
      purchaseDate,
    });

    render(cardElement(investment));

    expect(screen.getByText(/Purchased/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('should handle different currencies', () => {
    const eurInvestment = mockInvestment({
      currency: 'EUR',
      buyPrice: 45000,
    });

    const { rerender, container } = render(cardElement(eurInvestment));
    expect(container.textContent).toContain('€');

    const gbpInvestment = mockInvestment({
      currency: 'GBP',
      buyPrice: 40000,
    });

    rerender(cardElement(gbpInvestment));
    expect(container.textContent).toContain('£');
  });

  describe('deleting', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        currentUser: { uid: 'test-user' } as any,
        userData: null,
        loading: false,
      });
    });

    it('asks for confirmation in the app instead of deleting straight away', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user', assetName: 'Bitcoin' })));

      await user.click(screen.getByLabelText('Delete investment'));

      expect(screen.getByRole('dialog')).toHaveTextContent(/delete this Bitcoin investment/i);
      expect(deleteInvestment).not.toHaveBeenCalled();
    });

    it('deletes once confirmed', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user', id: 'inv-1' })));

      await user.click(screen.getByLabelText('Delete investment'));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

      expect(deleteInvestment).toHaveBeenCalledWith('test-user', 'inv-1');
    });

    it('keeps the investment when cancelled', async () => {
      const user = userEvent.setup();
      render(cardElement(mockInvestment({ userId: 'test-user' })));

      await user.click(screen.getByLabelText('Delete investment'));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

      expect(deleteInvestment).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('collapsible row', () => {
    const rowElement = () => {
      const investment = mockInvestment({
        assetName: 'Bitcoin',
        buyPrice: 50000,
        quantity: 0.02,
        currency: 'USD',
      }) as Investment;
      const prices = new Map([[getPriceKey(investment), new Map([['usd', 60000]])]]);
      return (
        <InvestmentCard
          investment={investment}
          display={toDisplayValues(investment, prices, 'USD')}
          nativeCurrentPrice={60000}
          prices={prices}
          collapsible
        />
      );
    };

    it('shows the asset, its value and its return while collapsed', () => {
      render(rowElement());

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('$1,200.00')).toBeInTheDocument();
      expect(screen.getByText('+20.00%')).toBeInTheDocument();
      expect(screen.queryByText('Buy Price')).not.toBeInTheDocument();
    });

    it('expands to the full details when tapped', async () => {
      const user = userEvent.setup();
      render(rowElement());

      const toggle = screen.getByRole('button', { name: /Bitcoin/ });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Buy Price')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit investment')).toBeInTheDocument();
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
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        currentUser: { uid: 'test-user' } as any,
        userData: null,
        loading: false,
      });

      render(convertedCard());
      await user.click(screen.getByLabelText('Edit investment'));

      // "Use as Buy Price" writes this value straight into the stored,
      // native-currency buyPrice field, so it must never be a converted price.
      expect(screen.getByText(/Current Price \(EUR\)/)).toBeInTheDocument();
      expect(screen.getByText('€50,000.00')).toBeInTheDocument();
    });
  });
});
