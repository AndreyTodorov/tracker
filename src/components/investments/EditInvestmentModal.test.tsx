import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { EditInvestmentModal } from './EditInvestmentModal';
import { updateInvestment } from '../../services/investment.service';
import { mockInvestment } from '../../test/test-utils';
import type { Investment } from '../../types';

vi.mock('../../services/investment.service', () => ({
  updateInvestment: vi.fn(),
}));

// bitcoin quoted in both currencies implies a EUR -> USD rate of 1.2
const prices = new Map([
  ['bitcoin', new Map([['eur', 50000], ['usd', 60000]])],
]);

const eurHolding = (overrides = {}): Investment =>
  mockInvestment({
    assetSymbol: 'bitcoin',
    currency: 'EUR',
    buyPrice: 50000,
    quantity: 2,
    investmentAmount: 100000,
    ...overrides,
  }) as Investment;

const renderModal = (investment: Investment) =>
  render(
    <EditInvestmentModal
      investment={investment}
      currentPrice={50000}
      prices={prices}
      isOpen
      onClose={() => {}}
    />
  );

describe('EditInvestmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateInvestment).mockResolvedValue(undefined);
  });

  describe('clearing the name', () => {
    it('submits an empty name so it can be removed', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding({ name: 'Main Portfolio' }));

      await user.clear(screen.getByLabelText(/Investment Name/i));
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => expect(updateInvestment).toHaveBeenCalled());
      expect(vi.mocked(updateInvestment).mock.calls[0][2]).toMatchObject({ name: '' });
    });
  });

  describe('changing the currency', () => {
    it('converts the buy price instead of silently relabelling it', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');

      // 50,000 EUR at 1.2 is 60,000 USD. Leaving it at 50,000 would change
      // what the holding is worth.
      expect(screen.getByLabelText(/Buy Price/i)).toHaveValue(60000);
    });

    it('converts the invested amount too', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');

      expect(screen.getByLabelText(/Amount/i)).toHaveValue(120000);
    });

    it('tells the user what it converted', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');

      expect(screen.getByText(/converted from EUR/i)).toBeInTheDocument();
    });

    it('converts back when the original currency is reselected', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
      await user.selectOptions(screen.getByLabelText('Currency'), 'EUR');

      expect(screen.getByLabelText(/Buy Price/i)).toHaveValue(50000);
    });

    it('shows the live price in the selected currency', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');

      // 50,000 EUR live price is 60,000 USD. Relabelling the panel without
      // converting the number would misreport the current price.
      expect(screen.getByText('$60,000.00')).toBeInTheDocument();
    });

    it('offers the converted live price as the new buy price', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
      await user.click(screen.getByRole('button', { name: /use as buy price/i }));

      expect(screen.getByLabelText(/Buy Price/i)).toHaveValue(60000);
    });

    it('keeps the live price labelled with its own currency when no rate exists', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      await user.selectOptions(screen.getByLabelText('Currency'), 'JPY');

      expect(screen.getByText(/Current Price \(EUR\)/)).toBeInTheDocument();
    });

    it('converts a record that has no stored amount without producing NaN', async () => {
      const user = userEvent.setup();
      // investmentAmount is not a required field, so older records can lack it.
      renderModal(eurHolding({ investmentAmount: undefined }));

      await user.selectOptions(screen.getByLabelText('Currency'), 'USD');

      expect(screen.getByLabelText(/Buy Price/i)).toHaveValue(60000);
      // buyPrice x quantity, converted: 50000 x 2 x 1.2
      expect(screen.getByLabelText(/Amount/i)).toHaveValue(120000);
    });

    it('warns rather than converting when no rate is available', async () => {
      const user = userEvent.setup();
      renderModal(eurHolding());

      // No coin is quoted in both EUR and JPY, so no rate can be derived.
      await user.selectOptions(screen.getByLabelText('Currency'), 'JPY');

      expect(screen.getByLabelText(/Buy Price/i)).toHaveValue(50000);
      expect(screen.getByText(/rate.*unavailable/i)).toBeInTheDocument();
    });
  });
});
