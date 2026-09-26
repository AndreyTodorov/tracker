import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { Dashboard } from './Dashboard';
import { mockInvestment } from '../../test/test-utils';

vi.mock('./Header', () => ({ Header: () => <header /> }));
vi.mock('../investments/InvestmentForm', () => ({
  InvestmentForm: () => <form aria-label="Add investment form" />,
}));
vi.mock('../investments/InvestmentList', () => ({
  InvestmentList: ({ onAdd }: { onAdd?: () => void }) => (
    <div data-testid="investment-list">
      {onAdd && <button type="button" onClick={onAdd}>Add investment</button>}
    </div>
  ),
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

  it('on mobile shows the portfolio value before the holdings', () => {
    render(<Dashboard />);

    expect(precedes(screen.getByText('Portfolio value'), screen.getByTestId('investment-list'))).toBe(true);
  });

  it('on mobile opens the form in a dialog from the add tile', () => {
    render(<Dashboard />);

    expect(screen.queryByRole('form', { name: 'Add investment form' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add investment' }));

    expect(screen.getByRole('dialog')).toContainElement(
      screen.getByRole('form', { name: 'Add investment form' })
    );
  });

  it('on desktop always shows the form, without an add tile', () => {
    setViewport(true);
    render(<Dashboard />);

    expect(screen.getByRole('form', { name: 'Add investment form' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add investment' })).not.toBeInTheDocument();
  });
});
