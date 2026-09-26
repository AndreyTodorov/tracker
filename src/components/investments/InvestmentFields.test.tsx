import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/test-utils';
import { useForm, type UseFormReturn } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import { CurrencySelect, CurrentPriceBox, PriceFields } from './InvestmentFields';
import { EMPTY_PRICE_FIELDS, type InvestmentFormValues } from './investmentFormValues';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';

describe('CurrencySelect', () => {
  it('offers every supported currency, in order', () => {
    render(<CurrencySelect id="currency" registration={{ name: 'currency', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }} />);

    const options = screen.getAllByRole('option').map((option) => option.getAttribute('value'));
    expect(options).toEqual(SUPPORTED_CURRENCIES.map(({ code }) => code));
    expect(screen.getByRole('option', { name: 'CHF (Fr)' })).toBeInTheDocument();
  });

  it('is labelled', () => {
    render(<CurrencySelect id="currency" registration={{ name: 'currency', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }} />);

    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
  });
});

describe('CurrentPriceBox', () => {
  it('shows the price and offers it as the buy price', async () => {
    const user = userEvent.setup();
    const onUse = vi.fn();
    render(<CurrentPriceBox price={50000} currency="EUR" onUse={onUse} />);

    expect(screen.getByText('Current Price (EUR)')).toBeInTheDocument();
    expect(screen.getByText('€50,000.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use as Buy Price' }));
    expect(onUse).toHaveBeenCalled();
  });
});

describe('EMPTY_PRICE_FIELDS', () => {
  let api: UseFormReturn<InvestmentFormValues>;
  const Harness = () => {
    const form = useForm<InvestmentFormValues>({ defaultValues: { currency: 'USD', purchaseDate: '2026-01-01' } });
    api = form;
    return <PriceFields form={form} currency="USD" />;
  };

  it('clears the price, quantity and amount when a form is reset with it', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(/Buy Price/), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } });
    expect(screen.getByLabelText(/Amount/)).toHaveValue(200);

    act(() => api.reset({ currency: 'USD', purchaseDate: '2026-01-01', ...EMPTY_PRICE_FIELDS }));

    expect(screen.getByLabelText(/Buy Price/)).toHaveValue(null);
    expect(screen.getByLabelText('Quantity')).toHaveValue(null);
    expect(screen.getByLabelText(/Amount/)).toHaveValue(null);
  });
});
