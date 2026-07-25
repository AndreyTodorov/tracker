import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyProvider, useCurrency, DISPLAY_CURRENCY_KEY } from './CurrencyContext';

const Probe = () => {
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  return (
    <>
      <span data-testid="currency">{displayCurrency}</span>
      <button onClick={() => setDisplayCurrency('GBP')}>choose GBP</button>
    </>
  );
};

const renderProbe = () =>
  render(
    <CurrencyProvider>
      <Probe />
    </CurrencyProvider>
  );

describe('CurrencyContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to USD when nothing has been stored', () => {
    renderProbe();

    expect(screen.getByTestId('currency')).toHaveTextContent('USD');
  });

  it('restores a previously stored currency', () => {
    localStorage.setItem(DISPLAY_CURRENCY_KEY, 'JPY');

    renderProbe();

    expect(screen.getByTestId('currency')).toHaveTextContent('JPY');
  });

  it('falls back to USD when the stored currency is not supported', () => {
    localStorage.setItem(DISPLAY_CURRENCY_KEY, 'XYZ');

    renderProbe();

    expect(screen.getByTestId('currency')).toHaveTextContent('USD');
  });

  it('persists the selection so it survives a reload', () => {
    renderProbe();

    fireEvent.click(screen.getByText('choose GBP'));

    expect(screen.getByTestId('currency')).toHaveTextContent('GBP');
    expect(localStorage.getItem(DISPLAY_CURRENCY_KEY)).toBe('GBP');
  });
});
