/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { InvestmentCard } from './InvestmentCard';
import { mockInvestment } from '../../test/test-utils';
import * as AuthContext from '../../context/AuthContext';
import { toDisplayValues } from '../../utils/currency';
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
      userName: 'John Doe',
    });

    render(cardElement(investment));

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
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

  it('should use buy price as current price when currentPrice not provided', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
    });

    render(cardElement(investment));

    // Should not show LIVE indicator when using buy price
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('should show LIVE indicator when current price is different from buy price', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
    });

    render(cardElement(investment, 60000));

    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('should not show LIVE indicator when current price equals buy price', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
    });

    render(cardElement(investment, 50000));

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

  describe('display currency conversion', () => {
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

    it('renders the holding in the display currency', () => {
      const { container } = render(convertedCard());

      // 50000 EUR buy price at 1.2 becomes $60,000
      expect(container.textContent).toContain('$60,000.00');
      expect(container.textContent).not.toContain('€');
    });

    it('shows the native currency so the original is not hidden', () => {
      render(convertedCard());

      expect(screen.getByTitle(/held in EUR/i)).toBeInTheDocument();
    });

    it('does not show a native currency badge when nothing was converted', () => {
      const investment = mockInvestment({ currency: 'USD' }) as Investment;

      render(cardElement(investment, 60000));

      expect(screen.queryByTitle(/held in/i)).not.toBeInTheDocument();
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
