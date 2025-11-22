import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { PortfolioSummary } from './PortfolioSummary';
import { mockPortfolio, mockInvestment } from '../../test/test-utils';

describe('PortfolioSummary Component', () => {
  it('should render total value', () => {
    const portfolio = mockPortfolio({
      totalValue: 10000,
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
  });

  it('should render total invested amount', () => {
    const portfolio = mockPortfolio({
      totalInvested: 8000,
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText(/Invested:/)).toBeInTheDocument();
    expect(screen.getByText(/8,000/)).toBeInTheDocument();
  });

  it('should render total profit/loss', () => {
    const portfolio = mockPortfolio({
      totalProfit: 2000,
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText('Total Profit/Loss')).toBeInTheDocument();
  });

  it('should display profit percentage', () => {
    const portfolio = mockPortfolio({
      totalProfitPercentage: 25.5,
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText(/\+25\.50%/)).toBeInTheDocument();
  });

  it('should display negative profit percentage', () => {
    const portfolio = mockPortfolio({
      totalProfit: -500,
      totalProfitPercentage: -10.5,
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText(/-10\.50%/)).toBeInTheDocument();
  });

  it('should count unique assets correctly', () => {
    const portfolio = mockPortfolio({
      investments: [
        mockInvestment({ id: '1', assetSymbol: 'bitcoin' }),
        mockInvestment({ id: '2', assetSymbol: 'ethereum' }),
        mockInvestment({ id: '3', assetSymbol: 'bitcoin' }), // Duplicate
      ],
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Only 2 unique assets
  });

  it('should display total investment count', () => {
    const portfolio = mockPortfolio({
      investments: [
        mockInvestment({ id: '1' }),
        mockInvestment({ id: '2' }),
        mockInvestment({ id: '3' }),
      ],
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText('3 investments')).toBeInTheDocument();
  });

  it('should use singular form for single investment', () => {
    const portfolio = mockPortfolio({
      investments: [mockInvestment()],
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText('1 investment')).toBeInTheDocument();
  });

  it('should handle empty portfolio', () => {
    const portfolio = mockPortfolio({
      totalValue: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalProfitPercentage: 0,
      investments: [],
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render all three summary cards', () => {
    const portfolio = mockPortfolio();

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Total Profit/Loss')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
  });

  it('should display icons for each card', () => {
    const portfolio = mockPortfolio();
    const { container } = render(<PortfolioSummary portfolio={portfolio} />);

    // Check for SVG icons (Wallet, TrendingUp, PieChart)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle portfolio with only losses', () => {
    const portfolio = mockPortfolio({
      totalValue: 7000,
      totalInvested: 10000,
      totalProfit: -3000,
      totalProfitPercentage: -30,
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText(/7,000/)).toBeInTheDocument();
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
    expect(screen.getByText(/-30\.00%/)).toBeInTheDocument();
  });

  it('should format large numbers with thousand separators', () => {
    const portfolio = mockPortfolio({
      totalValue: 1234567.89,
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.getByText(/1,234,567/)).toBeInTheDocument();
  });

  it('should count same asset with different purchases as one unique asset', () => {
    const portfolio = mockPortfolio({
      investments: [
        mockInvestment({ id: '1', assetSymbol: 'bitcoin', buyPrice: 50000 }),
        mockInvestment({ id: '2', assetSymbol: 'bitcoin', buyPrice: 60000 }),
        mockInvestment({ id: '3', assetSymbol: 'bitcoin', buyPrice: 55000 }),
      ],
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    // Should show 1 unique asset despite 3 investments
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3 investments')).toBeInTheDocument();
  });
});
