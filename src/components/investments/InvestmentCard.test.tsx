import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { InvestmentCard } from './InvestmentCard';
import { mockInvestment } from '../../test/test-utils';
import * as AuthContext from '../../context/AuthContext';

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

    render(<InvestmentCard investment={investment} />);

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display buy price and current price', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
      currency: 'USD',
    });

    render(<InvestmentCard investment={investment} currentPrice={60000} />);

    expect(screen.getByText('Buy Price')).toBeInTheDocument();
    expect(screen.getByText('Current Price')).toBeInTheDocument();
  });

  it('should use buy price as current price when currentPrice not provided', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
    });

    render(<InvestmentCard investment={investment} />);

    // Should not show LIVE indicator when using buy price
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('should show LIVE indicator when current price is different from buy price', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
    });

    render(<InvestmentCard investment={investment} currentPrice={60000} />);

    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('should not show LIVE indicator when current price equals buy price', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
    });

    render(<InvestmentCard investment={investment} currentPrice={50000} />);

    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('should display quantity', () => {
    const investment = mockInvestment({
      quantity: 0.5,
    });

    render(<InvestmentCard investment={investment} />);

    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('0.5')).toBeInTheDocument();
  });

  it('should display investment amount', () => {
    const investment = mockInvestment({
      investmentAmount: 1000,
    });

    render(<InvestmentCard investment={investment} />);

    expect(screen.getByText('Invested')).toBeInTheDocument();
  });

  it('should show profit with positive value', () => {
    const investment = mockInvestment({
      buyPrice: 50000,
      quantity: 0.02,
    });

    render(<InvestmentCard investment={investment} currentPrice={60000} />);

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

    render(<InvestmentCard investment={investment} currentPrice={40000} />);

    expect(screen.getByText('Profit/Loss')).toBeInTheDocument();
    // Loss should be negative - check for text containing minus sign and amount
    expect(screen.getByText(/-\$200\.00/)).toBeInTheDocument();
  });

  it('should display optional name badge when present', () => {
    const investment = mockInvestment({
      name: 'Main Portfolio',
    });

    render(<InvestmentCard investment={investment} />);

    expect(screen.getByText(/Main Portfolio/)).toBeInTheDocument();
  });

  it('should not display name badge when not present', () => {
    const investment = mockInvestment({
      name: undefined,
    });

    render(<InvestmentCard investment={investment} />);

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

    render(<InvestmentCard investment={investment} />);

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

    render(<InvestmentCard investment={investment} />);

    // Should not have edit/delete buttons
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('should display formatted purchase date', () => {
    const purchaseDate = new Date('2024-01-15').getTime();
    const investment = mockInvestment({
      purchaseDate,
    });

    render(<InvestmentCard investment={investment} />);

    expect(screen.getByText(/Purchased/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('should handle different currencies', () => {
    const eurInvestment = mockInvestment({
      currency: 'EUR',
      buyPrice: 45000,
    });

    const { rerender, container } = render(<InvestmentCard investment={eurInvestment} />);
    expect(container.textContent).toContain('€');

    const gbpInvestment = mockInvestment({
      currency: 'GBP',
      buyPrice: 40000,
    });

    rerender(<InvestmentCard investment={gbpInvestment} />);
    expect(container.textContent).toContain('£');
  });
});
