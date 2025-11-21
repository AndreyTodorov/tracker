export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  shareCode?: string;
  sharedPortfolios?: string[]; // Array of share codes user has joined
}

export interface Investment {
  id: string;
  userId: string;
  userName: string;
  assetName: string;
  assetSymbol: string;
  buyPrice: number;
  investmentAmount: number;
  quantity: number;
  purchaseDate: number;
  createdAt: number;
}

export interface CryptoPrice {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  lastUpdated: number;
}

export interface Portfolio {
  totalValue: number;
  totalInvested: number;
  totalProfit: number;
  totalProfitPercentage: number;
  investments: Investment[];
}

export interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export type TabType = 'my' | 'shared' | 'all';
