// The values shared by the add form and the edit dialog.

export interface InvestmentFormValues {
  name?: string;
  buyPrice: number;
  investmentAmount: number;
  quantity: number;
  currency: string;
  /** 'yyyy-MM-dd', as used by the date input. */
  purchaseDate: string;
}

// Resetting a form without these leaves the number inputs showing their old
// values. An empty string is what a blank number input holds; the fields are
// typed as numbers because `valueAsNumber` reads them back that way (NaN when
// blank), hence the cast. NaN itself would clear them too, but browsers warn
// when an input's value is set to "NaN".
export const EMPTY_PRICE_FIELDS = { buyPrice: '', quantity: '', investmentAmount: '' } as unknown as Pick<
  InvestmentFormValues,
  'buyPrice' | 'quantity' | 'investmentAmount'
>;
