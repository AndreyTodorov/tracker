/* eslint-disable react-refresh/only-export-components */
import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';

// Mock AuthProvider for testing
export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-auth-provider">{children}</div>;
};

interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders = ({ children }: AllProvidersProps) => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <MockAuthProvider>{children}</MockAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data helpers
export const mockInvestment = (overrides = {}) => ({
  id: 'test-id',
  userId: 'test-user',
  userName: 'Test User',
  assetName: 'Bitcoin',
  assetSymbol: 'bitcoin',
  buyPrice: 50000,
  investmentAmount: 1000,
  quantity: 0.02,
  purchaseDate: Date.now(),
  createdAt: Date.now(),
  currency: 'USD',
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: Date.now(),
  shareCode: 'TEST1234',
  sharedPortfolios: [],
  ...overrides,
});

export const mockPortfolio = (overrides = {}) => ({
  totalValue: 10000,
  totalInvested: 8000,
  totalProfit: 2000,
  totalProfitPercentage: 25,
  investments: [mockInvestment()],
  ...overrides,
});
