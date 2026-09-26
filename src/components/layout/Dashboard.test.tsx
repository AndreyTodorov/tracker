import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { Dashboard } from './Dashboard';
import { mockInvestment } from '../../test/test-utils';

vi.mock('./Header', () => ({ Header: () => <header /> }));
vi.mock('../investments/InvestmentForm', () => ({
  InvestmentForm: () => <form aria-label="Add investment form" />,
}));
vi.mock('../investments/InvestmentList', () => ({
  InvestmentList: () => <div data-testid="investment-list" />,
}));
vi.mock('../../hooks/useInvestments', () => ({
  useInvestments: () => ({ investments: [mockInvestment()], loading: false }),
}));
vi.mock('../../hooks/useCryptoPrices', () => ({
  useCryptoPrices: () => ({ prices: new Map(), lastUpdate: new Date() }),
}));
vi.mock('../../context/CurrencyContext', () => ({
  useCurrency: () => ({ displayCurrency: 'EUR' }),
}));

const setViewport = (isDesktop: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isDesktop,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

// True when `a` comes before `b` in document order.
const precedes = (a: Element, b: Element) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('Dashboard layout', () => {
  beforeEach(() => setViewport(false));

  it('on mobile shows the portfolio summary before the add-investment control', () => {
    render(<Dashboard />);

    const summary = screen.getByText('Total Value');
    const toggle = screen.getByRole('button', { name: /add investment/i });
    expect(precedes(summary, toggle)).toBe(true);
    expect(precedes(toggle, screen.getByTestId('investment-list'))).toBe(true);
  });

  it('on mobile keeps the form collapsed until the toggle is pressed', () => {
    render(<Dashboard />);

    expect(screen.queryByRole('form', { name: 'Add investment form' })).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /add investment/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('form', { name: 'Add investment form' })).toBeInTheDocument();
  });

  it('on desktop always shows the form, without a toggle', () => {
    setViewport(true);
    render(<Dashboard />);

    expect(screen.getByRole('form', { name: 'Add investment form' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add investment/i })).not.toBeInTheDocument();
  });
});
