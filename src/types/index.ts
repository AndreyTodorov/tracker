export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  shareCode?: string;
  sharedPortfolios?: Record<string, string>; // Map of ownerUid -> share code the user has joined
}

export interface Investment {
  id: string;
  userId: string;
  userName: string;
  assetName: string;
  assetSymbol: string;
  coinId?: string; // CoinGecko id used for price lookups (assetSymbol holds the display ticker)
  buyPrice: number;
  investmentAmount: number;
  quantity: number;
  purchaseDate: number;
  createdAt: number;
  name?: string; // Optional name for the investment (e.g., "testing", "main", etc.)
  currency: string; // Currency code (e.g., "USD", "EUR", "GBP")
}

export interface Portfolio {
  totalValue: number;
  totalInvested: number;
  totalProfit: number;
  totalProfitPercentage: number;
  /** The currency the totals are expressed in. Differs from the user's
   *  selected display currency when conversion was unavailable. */
  totalsCurrency: string;
  /** True when at least one holding could not be converted into the selected
   *  display currency, so the totals mix currencies and are approximate. */
  conversionFailed: boolean;
  investments: Investment[];
}

export interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h?: number;
  thumb?: string; // Icon URL for search results
}

export interface CoinGeckoSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb?: string;
}

export interface SelectedCryptoAsset {
  id: string;
  name: string;
  symbol: string;
}

export type TabType = 'my' | 'shared' | 'all';
