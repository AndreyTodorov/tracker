import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { InvestmentList } from './InvestmentList';
import { mockInvestment } from '../../test/test-utils';
import type { Investment } from '../../types';

// bitcoin quoted in both currencies, so a EUR -> USD rate of 1.2 is derivable.
const prices = new Map([
  ['bitcoin', new Map([['eur', 50000], ['usd', 60000]])],
]);

describe('InvestmentList', () => {
  it('renders each holding in the currency it was bought in', () => {
    // The display currency drives the portfolio totals only. A holding keeps
    // showing the currency it was actually purchased in.
    const investments = [
      mockInvestment({ id: '1', currency: 'EUR', buyPrice: 50000, quantity: 1 }),
      mockInvestment({ id: '2', currency: 'USD', buyPrice: 55000, quantity: 1 }),
    ] as Investment[];

    const { container } = render(
      <InvestmentList investments={investments} prices={prices} loading={false} />
    );

    // Each holding is valued at its own currency's quote, not a shared one.
    expect(container.textContent).toContain('€50,000.00');
    expect(container.textContent).toContain('$60,000.00');
  });

  it('does not convert a holding into another currency', () => {
    const investments = [
      mockInvestment({ id: '1', currency: 'EUR', buyPrice: 50000, quantity: 1 }),
    ] as Investment[];

    const { container } = render(
      <InvestmentList investments={investments} prices={prices} loading={false} />
    );

    expect(container.textContent).not.toContain('$');
  });

  it('ends with an add tile when adding is offered', async () => {
    const onAdd = vi.fn();
    const investments = [mockInvestment({ id: '1' })] as Investment[];

    render(<InvestmentList investments={investments} prices={prices} loading={false} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add investment' }));

    expect(onAdd).toHaveBeenCalled();
  });

  it('has no add tile unless adding is offered', () => {
    render(<InvestmentList investments={[mockInvestment()] as Investment[]} prices={prices} loading={false} />);

    expect(screen.queryByRole('button', { name: 'Add investment' })).not.toBeInTheDocument();
  });
});
