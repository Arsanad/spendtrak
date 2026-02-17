/**
 * Investment Tracking Types - Phase 4B
 * Types for investment holdings, performance tracking, and crypto
 */

// ============================================
// INVESTMENT ENUMS
// ============================================

export type InvestmentType =
  | 'stock'
  | 'etf'
  | 'mutual_fund'
  | 'bond'
  | 'option'
  | 'cryptocurrency'
  | 'commodity'
  | 'real_estate'
  | 'cash'
  | 'other';

export type InvestmentAccountType =
  | 'brokerage'
  | '401k'
  | 'ira'
  | 'roth_ira'
  | '529'
  | 'hsa'
  | 'pension'
  | 'trust'
  | 'crypto_wallet'
  | 'other';

export type TransactionType =
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'interest'
  | 'transfer_in'
  | 'transfer_out'
  | 'fee'
  | 'split'
  | 'merger'
  | 'other';

// ============================================
// INVESTMENT HOLDING TYPES
// ============================================

export interface InvestmentHolding {
  id: string;
  user_id: string;
  bank_account_id: string | null;
  security_id: string | null;
  symbol: string;
  name: string;
  investment_type: InvestmentType;
  quantity: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  currency: string;
  is_manual: boolean;
  last_price_update: string | null;
  institution_name: string | null;
  account_name: string | null;
  account_type: InvestmentAccountType | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestmentHoldingWithPerformance extends InvestmentHolding {
  unrealized_gain: number;
  unrealized_gain_percentage: number;
  day_change: number;
  day_change_percentage: number;
  allocation_percentage: number;
}

export type InvestmentHoldingInsert = Omit<InvestmentHolding, 'id' | 'created_at' | 'updated_at'>;
export type InvestmentHoldingUpdate = Partial<Omit<InvestmentHolding, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// INVESTMENT PRICE TYPES
// ============================================

export interface InvestmentPrice {
  id: string;
  symbol: string;
  price: number;
  currency: string;
  price_date: string;
  source: 'plaid' | 'api' | 'manual';
  created_at: string;
}

export type InvestmentPriceInsert = Omit<InvestmentPrice, 'id' | 'created_at'>;

// ============================================
// INVESTMENT SNAPSHOT TYPES
// ============================================

export interface InvestmentSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_value: number;
  total_cost_basis: number;
  total_gain: number;
  total_gain_percentage: number;
  holdings_count: number;
  holdings_breakdown: Record<InvestmentType, {
    value: number;
    count: number;
    percentage: number;
  }>;
  top_holdings: Array<{
    symbol: string;
    name: string;
    value: number;
    percentage: number;
  }>;
  notes: string | null;
  created_at: string;
}

export type InvestmentSnapshotInsert = Omit<InvestmentSnapshot, 'id' | 'created_at'>;

// ============================================
// CRYPTO HOLDING TYPES
// ============================================

export interface CryptoHolding {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  quantity: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  currency: string;
  wallet_address: string | null;
  exchange_name: string | null;
  is_staked: boolean;
  staking_apy: number | null;
  last_price_update: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CryptoHoldingWithPerformance extends CryptoHolding {
  unrealized_gain: number;
  unrealized_gain_percentage: number;
  day_change: number;
  day_change_percentage: number;
  allocation_percentage: number;
}

export type CryptoHoldingInsert = Omit<CryptoHolding, 'id' | 'created_at' | 'updated_at'>;
export type CryptoHoldingUpdate = Partial<Omit<CryptoHolding, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// INVESTMENT TRANSACTION TYPES
// ============================================

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  holding_id: string | null;
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  amount: number;
  fees: number;
  currency: string;
  transaction_date: string;
  notes: string | null;
  is_manual: boolean;
  plaid_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransactionWithHolding extends InvestmentTransaction {
  holding: InvestmentHolding | null;
}

export type InvestmentTransactionInsert = Omit<InvestmentTransaction, 'id' | 'created_at' | 'updated_at'>;
export type InvestmentTransactionUpdate = Partial<Omit<InvestmentTransaction, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// PORTFOLIO SUMMARY TYPES
// ============================================

export interface PortfolioSummary {
  total_value: number;
  total_cost_basis: number;
  total_gain: number;
  total_gain_percentage: number;
  day_change: number;
  day_change_percentage: number;
  holdings_count: number;
  accounts_count: number;
  allocation_by_type: Record<InvestmentType, {
    value: number;
    percentage: number;
    count: number;
  }>;
  allocation_by_account: Record<string, {
    name: string;
    value: number;
    percentage: number;
    count: number;
  }>;
  top_performers: InvestmentHoldingWithPerformance[];
  worst_performers: InvestmentHoldingWithPerformance[];
  largest_holdings: InvestmentHoldingWithPerformance[];
  recent_dividends: number;
  dividend_yield: number;
}

export interface PortfolioPerformance {
  period: '1D' | '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';
  start_value: number;
  end_value: number;
  absolute_change: number;
  percentage_change: number;
  benchmark_change?: number;
  history: Array<{
    date: string;
    value: number;
    cost_basis: number;
  }>;
}

// ============================================
// DIVIDEND TRACKING TYPES
// ============================================

export interface DividendPayment {
  id: string;
  holding_id: string;
  symbol: string;
  amount: number;
  ex_dividend_date: string;
  payment_date: string;
  record_date: string | null;
  dividend_type: 'regular' | 'special' | 'qualified' | 'return_of_capital';
  reinvested: boolean;
  reinvested_shares: number | null;
  created_at: string;
}

export interface DividendSummary {
  total_dividends_ytd: number;
  total_dividends_last_year: number;
  average_monthly_dividends: number;
  dividend_growth_rate: number;
  upcoming_dividends: Array<{
    symbol: string;
    name: string;
    ex_date: string;
    estimated_amount: number;
  }>;
  dividend_by_month: Record<string, number>;
}

// ============================================
// WATCHLIST TYPES
// ============================================

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  investment_type: InvestmentType;
  target_price: number | null;
  alert_above: number | null;
  alert_below: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItemWithPrice extends WatchlistItem {
  current_price: number;
  day_change: number;
  day_change_percentage: number;
  distance_to_target: number | null;
}

export type WatchlistItemInsert = Omit<WatchlistItem, 'id' | 'created_at' | 'updated_at'>;
export type WatchlistItemUpdate = Partial<Omit<WatchlistItem, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// REBALANCING TYPES
// ============================================

export interface TargetAllocation {
  id: string;
  user_id: string;
  name: string;
  target_type: 'type' | 'sector' | 'custom';
  allocations: Record<string, number>; // key -> percentage
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RebalanceRecommendation {
  symbol: string;
  name: string;
  current_allocation: number;
  target_allocation: number;
  difference: number;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  shares: number;
}

export interface RebalancePlan {
  target_allocation: TargetAllocation;
  current_allocations: Record<string, number>;
  recommendations: RebalanceRecommendation[];
  estimated_trades: number;
  estimated_cost: number;
}

// ============================================
// API INPUT TYPES
// ============================================

export interface CreateHoldingInput {
  symbol: string;
  name: string;
  investment_type: InvestmentType;
  quantity: number;
  cost_basis: number;
  current_price?: number;
  institution_name?: string;
  account_name?: string;
  account_type?: InvestmentAccountType;
  notes?: string;
}

export interface UpdateHoldingInput {
  quantity?: number;
  cost_basis?: number;
  current_price?: number;
  institution_name?: string;
  account_name?: string;
  notes?: string;
  is_active?: boolean;
}

export interface CreateCryptoHoldingInput {
  symbol: string;
  name: string;
  quantity: number;
  cost_basis: number;
  current_price?: number;
  wallet_address?: string;
  exchange_name?: string;
  is_staked?: boolean;
  staking_apy?: number;
  notes?: string;
}

export interface RecordTransactionInput {
  holding_id?: string;
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  fees?: number;
  transaction_date: string;
  notes?: string;
}

// ============================================
// PRICE API TYPES
// ============================================

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  pe_ratio: number | null;
  dividend_yield: number | null;
  week_52_high: number;
  week_52_low: number;
  updated_at: string;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  change_24h_percent: number;
  volume_24h: number;
  market_cap: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_date: string;
  updated_at: string;
}

// ============================================
// COMMON CONSTANTS
// ============================================

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  stock: 'Stock',
  etf: 'ETF',
  mutual_fund: 'Mutual Fund',
  bond: 'Bond',
  option: 'Option',
  cryptocurrency: 'Cryptocurrency',
  commodity: 'Commodity',
  real_estate: 'Real Estate',
  cash: 'Cash',
  other: 'Other',
};

export const INVESTMENT_TYPE_ICONS: Record<InvestmentType, string> = {
  stock: 'trending-up',
  etf: 'pie-chart',
  mutual_fund: 'briefcase',
  bond: 'shield',
  option: 'git-branch',
  cryptocurrency: 'bitcoin',
  commodity: 'package',
  real_estate: 'home',
  cash: 'dollar-sign',
  other: 'help-circle',
};

export const ACCOUNT_TYPE_LABELS: Record<InvestmentAccountType, string> = {
  brokerage: 'Brokerage',
  '401k': '401(k)',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '529': '529 Plan',
  hsa: 'HSA',
  pension: 'Pension',
  trust: 'Trust',
  crypto_wallet: 'Crypto Wallet',
  other: 'Other',
};
