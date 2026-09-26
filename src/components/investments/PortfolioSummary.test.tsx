import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { PortfolioSummary } from './PortfolioSummary';
import { mockPortfolio, mockInvestment } from '../../test/test-utils';

describe('PortfolioSummary Component', () => {
  it('should render total value', () => {
    render(<PortfolioSummary portfolio={mockPortfolio({ totalValue: 10000 })} />);

    expect(screen.getByText('Portfolio value')).toBeInTheDocument();
    expect(screen.getByTestId('portfolio-value')).toHaveTextContent('$10,000.00');
  });

  it('should render total invested amount', () => {
    render(<PortfolioSummary portfolio={mockPortfolio({ totalInvested: 8000 })} />);

    expect(screen.getByText(/on \$8,000\.00/)).toBeInTheDocument();
  });

  it('should render a positive profit with its sign and percentage', () => {
    render(
      <PortfolioSummary portfolio={mockPortfolio({ totalProfit: 2000, totalProfitPercentage: 25.5 })} />
    );

    expect(screen.getByText('+$2,000.00')).toBeInTheDocument();
    expect(screen.getByText('+25.50%')).toBeInTheDocument();
  });

  it('should render a loss with its percentage', () => {
    render(
      <PortfolioSummary portfolio={mockPortfolio({ totalProfit: -500, totalProfitPercentage: -10.5 })} />
    );

    expect(screen.getByText('-$500.00')).toBeInTheDocument();
    expect(screen.getByText('-10.50%')).toBeInTheDocument();
  });

  describe('return panel', () => {
    const panel = () => screen.getByTestId('portfolio-value').parentElement!;

    it('is tinted green when the portfolio is up', () => {
      render(<PortfolioSummary portfolio={mockPortfolio({ totalProfit: 2000, totalProfitPercentage: 25 })} />);
      expect(panel()).toHaveClass('bg-profit/[0.06]', 'border-profit/20');
    });

    it('is tinted red when the portfolio is down', () => {
      render(<PortfolioSummary portfolio={mockPortfolio({ totalProfit: -500, totalProfitPercentage: -10 })} />);
      expect(panel()).toHaveClass('bg-loss/[0.06]', 'border-loss/20');
    });

    it('stays neutral at break-even', () => {
      render(<PortfolioSummary portfolio={mockPortfolio({ totalProfit: 0, totalProfitPercentage: 0 })} />);
      expect(panel()).toHaveClass('bg-surface', 'border-line');
    });
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

    expect(screen.getByText(/2 assets/)).toBeInTheDocument();
  });

  it('should use singular form for a single asset', () => {
    render(<PortfolioSummary portfolio={mockPortfolio({ investments: [mockInvestment()] })} />);

    expect(screen.getByText(/1 asset$/)).toBeInTheDocument();
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

    expect(screen.getByTestId('portfolio-value')).toHaveTextContent('$0.00');
    expect(screen.queryByRole('img', { name: /Allocation/ })).not.toBeInTheDocument();
  });

  it('should format large numbers with thousand separators', () => {
    render(<PortfolioSummary portfolio={mockPortfolio({ totalValue: 1234567.89 })} />);

    expect(screen.getByTestId('portfolio-value')).toHaveTextContent('$1,234,567.89');
  });

  describe('allocation', () => {
    it('shows each asset\'s share', () => {
      const portfolio = mockPortfolio({
        allocation: [
          { symbol: 'BTC', name: 'Bitcoin', share: 60 },
          { symbol: 'ETH', name: 'Ethereum', share: 40 },
        ],
      });

      render(<PortfolioSummary portfolio={portfolio} />);

      expect(screen.getByRole('img', { name: 'Allocation: BTC 60.0% · ETH 40.0%' })).toBeInTheDocument();
    });

    it('groups the smallest assets into "Other" when there are many', () => {
      const portfolio = mockPortfolio({
        allocation: [
          { symbol: 'BTC', name: 'Bitcoin', share: 50 },
          { symbol: 'ETH', name: 'Ethereum', share: 20 },
          { symbol: 'SOL', name: 'Solana', share: 15 },
          { symbol: 'ADA', name: 'Cardano', share: 10 },
          { symbol: 'DOT', name: 'Polkadot', share: 5 },
        ],
      });

      render(<PortfolioSummary portfolio={portfolio} />);

      expect(
        screen.getByRole('img', { name: 'Allocation: BTC 50.0% · ETH 20.0% · SOL 15.0% · Other 15.0%' })
      ).toBeInTheDocument();
    });
  });

  it('hides the allocation when totals could not be converted', () => {
    const portfolio = mockPortfolio({
      conversionFailed: true,
      allocation: [{ symbol: 'BTC', name: 'Bitcoin', share: 100 }],
    });

    render(<PortfolioSummary portfolio={portfolio} />);

    expect(screen.queryByRole('img', { name: /Allocation/ })).not.toBeInTheDocument();
  });

  describe('currency conversion', () => {
    it('shows no warning when every holding converted', () => {
      const portfolio = mockPortfolio({
        conversionFailed: false,
        investments: [
          mockInvestment({ id: '1', currency: 'USD' }),
          mockInvestment({ id: '2', currency: 'EUR' }),
        ],
      });

      render(<PortfolioSummary portfolio={portfolio} />);

      // Mixed currencies are no longer a problem worth warning about.
      expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mixed Currency/i)).not.toBeInTheDocument();
    });

    it('warns that totals are unconverted when rates were unavailable', () => {
      const portfolio = mockPortfolio({
        conversionFailed: true,
        totalsCurrency: 'EUR',
      });

      render(<PortfolioSummary portfolio={portfolio} />);

      expect(screen.getByText(/rates unavailable/i)).toBeInTheDocument();
    });

    it('labels totals with the portfolio totals currency', () => {
      const portfolio = mockPortfolio({
        totalValue: 1500,
        totalsCurrency: 'GBP',
      });

      render(<PortfolioSummary portfolio={portfolio} />);

      expect(screen.getByTestId('portfolio-value')).toHaveTextContent('£1,500.00');
    });
  });

  it('shows when prices were last updated', () => {
    render(<PortfolioSummary portfolio={mockPortfolio()} lastUpdate={new Date(2026, 8, 26, 10, 59)} />);

    expect(screen.getByText(/Live/)).toHaveTextContent('Live · 10:59');
  });
});
