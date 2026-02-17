/**
 * Investment Tracking Service
 * Handles investment holdings, performance tracking, and portfolio management
 */

import { supabase } from './supabase';
import { getCurrentLocale } from '../utils/locale';
import { useAuthStore, waitForAuthHydration } from '@/stores/authStore';
import { isDevMode } from '@/utils/devMode';
import { logger } from '@/utils/logger';
import type {
  InvestmentHolding,
  InvestmentHoldingWithPerformance,
  InvestmentTransaction,
  InvestmentSnapshot,
  CryptoHolding,
  CryptoHoldingWithPerformance,
  PortfolioSummary,
  PortfolioPerformance,
  CreateHoldingInput,
  UpdateHoldingInput,
  CreateCryptoHoldingInput,
  RecordTransactionInput,
  InvestmentType,
  StockQuote,
  CryptoQuote,
} from '@/types';

// ============================================
// AUTH HELPER
// ============================================

/**
 * Get the current user ID (from Supabase or dev mode)
 * For OAuth users, always verifies the Supabase session is valid
 */
async function getCurrentUserId(): Promise<string> {
  // Wait for auth store to be hydrated from AsyncStorage
  await waitForAuthHydration();

  // Check store user immediately
  let storeUser = useAuthStore.getState().user;

  // If no user, wait and retry a few times (handles timing issues with state updates)
  if (!storeUser) {
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      storeUser = useAuthStore.getState().user;
      if (storeUser?.id) break;
    }
  }

  // Dev mode check - user ID starts with 'dev-user-'
  // For dev users, we don't need Supabase session
  if (storeUser?.id?.startsWith('dev-user-')) {
    logger.investment.info('Using dev user:', storeUser.id);
    return storeUser.id;
  }

  // For OAuth users, we MUST verify the Supabase session is valid
  try {
    // First try to get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.investment.warn('Session error:', sessionError);
    }

    if (sessionData?.session?.user) {
      return sessionData.session.user.id;
    }

    // No valid session, try to refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      logger.investment.warn('Session refresh failed:', refreshError);
    }

    if (refreshData?.session?.user) {
      return refreshData.session.user.id;
    }

    // Last resort: try getUser()
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      logger.investment.warn('getUser error:', userError);
    }

    if (user) {
      return user.id;
    }
  } catch (error) {
    logger.investment.error('Supabase auth check failed:', error);
  }

  // Check if we're in dev mode but user just hasn't loaded yet
  if (isDevMode()) {
    await new Promise(resolve => setTimeout(resolve, 500));
    storeUser = useAuthStore.getState().user;
    if (storeUser?.id) {
      logger.investment.info('Dev user loaded after delay:', storeUser.id);
      return storeUser.id;
    }
  }

  logger.investment.error('No authenticated user found - please sign in again');
  throw new Error('Not authenticated');
}

// ============================================
// INVESTMENT HOLDINGS
// ============================================

/**
 * Get all investment holdings
 */
export async function getHoldings(options: {
  includeInactive?: boolean;
  investmentType?: InvestmentType;
  accountName?: string;
} = {}): Promise<InvestmentHoldingWithPerformance[]> {
  const userId = await getCurrentUserId();

  let query = supabase
    .from('investment_holdings')
    .select('*')
    .eq('user_id', userId);

  if (!options.includeInactive) {
    query = query.eq('is_active', true);
  }

  if (options.investmentType) {
    query = query.eq('investment_type', options.investmentType);
  }

  if (options.accountName) {
    query = query.eq('account_name', options.accountName);
  }

  const { data, error } = await query.order('current_value', { ascending: false });

  if (error) throw error;

  // Calculate performance metrics
  const totalValue = (data || []).reduce((sum, h) => sum + (h.current_value || 0), 0);

  return (data || []).map(holding => {
    const unrealizedGain = (holding.current_value || 0) - (holding.cost_basis || 0);
    const unrealizedGainPercentage = holding.cost_basis > 0
      ? (unrealizedGain / holding.cost_basis) * 100
      : 0;

    return {
      ...holding,
      unrealized_gain: unrealizedGain,
      unrealized_gain_percentage: unrealizedGainPercentage,
      day_change: 0, // Would need price history to calculate
      day_change_percentage: 0,
      allocation_percentage: totalValue > 0 ? ((holding.current_value || 0) / totalValue) * 100 : 0,
    };
  });
}

/**
 * Get a single holding by ID
 */
export async function getHolding(id: string): Promise<InvestmentHoldingWithPerformance | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('investment_holdings')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  if (!data) return null;

  const unrealizedGain = (data.current_value || 0) - (data.cost_basis || 0);
  const unrealizedGainPercentage = data.cost_basis > 0
    ? (unrealizedGain / data.cost_basis) * 100
    : 0;

  return {
    ...data,
    unrealized_gain: unrealizedGain,
    unrealized_gain_percentage: unrealizedGainPercentage,
    day_change: 0,
    day_change_percentage: 0,
    allocation_percentage: 0,
  };
}

/**
 * Create a new holding
 */
export async function createHolding(input: CreateHoldingInput): Promise<InvestmentHolding> {
  const userId = await getCurrentUserId();

  const currentValue = (input.current_price || input.cost_basis / input.quantity) * input.quantity;

  const { data, error } = await supabase
    .from('investment_holdings')
    .insert({
      user_id: userId,
      symbol: input.symbol.toUpperCase(),
      name: input.name,
      investment_type: input.investment_type,
      quantity: input.quantity,
      cost_basis: input.cost_basis,
      current_price: input.current_price || (input.cost_basis / input.quantity),
      current_value: currentValue,
      currency: 'USD',
      is_manual: true,
      institution_name: input.institution_name,
      account_name: input.account_name,
      account_type: input.account_type,
      notes: input.notes,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  // Record initial transaction
  await recordTransaction({
    holding_id: data.id,
    symbol: input.symbol,
    transaction_type: 'buy',
    quantity: input.quantity,
    price: input.cost_basis / input.quantity,
    transaction_date: new Date().toISOString().split('T')[0],
  });

  return data;
}

/**
 * Update a holding
 */
export async function updateHolding(
  id: string,
  updates: UpdateHoldingInput
): Promise<InvestmentHolding> {
  const userId = await getCurrentUserId();

  // Calculate new current value if quantity or price changed
  let currentValue = updates.current_price !== undefined && updates.quantity !== undefined
    ? updates.current_price * updates.quantity
    : undefined;

  const updateData: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (currentValue !== undefined) {
    updateData.current_value = currentValue;
  }

  const { data, error } = await supabase
    .from('investment_holdings')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete (deactivate) a holding
 */
export async function deleteHolding(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('investment_holdings')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// CRYPTO HOLDINGS
// ============================================

/**
 * Get all crypto holdings
 */
export async function getCryptoHoldings(
  includeInactive = false
): Promise<CryptoHoldingWithPerformance[]> {
  const userId = await getCurrentUserId();

  let query = supabase
    .from('crypto_holdings')
    .select('*')
    .eq('user_id', userId);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('current_value', { ascending: false });

  if (error) throw error;

  const totalValue = (data || []).reduce((sum, h) => sum + (h.current_value || 0), 0);

  return (data || []).map(holding => {
    const unrealizedGain = (holding.current_value || 0) - (holding.cost_basis || 0);
    const unrealizedGainPercentage = holding.cost_basis > 0
      ? (unrealizedGain / holding.cost_basis) * 100
      : 0;

    return {
      ...holding,
      unrealized_gain: unrealizedGain,
      unrealized_gain_percentage: unrealizedGainPercentage,
      day_change: 0,
      day_change_percentage: 0,
      allocation_percentage: totalValue > 0 ? ((holding.current_value || 0) / totalValue) * 100 : 0,
    };
  });
}

/**
 * Create a crypto holding
 */
export async function createCryptoHolding(input: CreateCryptoHoldingInput): Promise<CryptoHolding> {
  const userId = await getCurrentUserId();

  const currentPrice = input.current_price || (input.cost_basis / input.quantity);
  const currentValue = currentPrice * input.quantity;

  const { data, error } = await supabase
    .from('crypto_holdings')
    .insert({
      user_id: userId,
      symbol: input.symbol.toUpperCase(),
      name: input.name,
      quantity: input.quantity,
      cost_basis: input.cost_basis,
      current_price: currentPrice,
      current_value: currentValue,
      currency: 'USD',
      wallet_address: input.wallet_address,
      exchange_name: input.exchange_name,
      is_staked: input.is_staked || false,
      staking_apy: input.staking_apy,
      notes: input.notes,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a crypto holding
 */
export async function updateCryptoHolding(
  id: string,
  updates: Partial<CryptoHolding>
): Promise<CryptoHolding> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('crypto_holdings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a crypto holding
 */
export async function deleteCryptoHolding(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('crypto_holdings')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// INVESTMENT TRANSACTIONS
// ============================================

/**
 * Get investment transactions
 */
export async function getTransactions(options: {
  holdingId?: string;
  symbol?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}): Promise<InvestmentTransaction[]> {
  const userId = await getCurrentUserId();

  let query = supabase
    .from('investment_transactions')
    .select('*')
    .eq('user_id', userId);

  if (options.holdingId) {
    query = query.eq('holding_id', options.holdingId);
  }

  if (options.symbol) {
    query = query.eq('symbol', options.symbol.toUpperCase());
  }

  if (options.startDate) {
    query = query.gte('transaction_date', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('transaction_date', options.endDate);
  }

  query = query.order('transaction_date', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Record an investment transaction
 */
export async function recordTransaction(input: RecordTransactionInput): Promise<InvestmentTransaction> {
  const userId = await getCurrentUserId();

  const amount = input.quantity * input.price;

  const { data, error } = await supabase
    .from('investment_transactions')
    .insert({
      user_id: userId,
      holding_id: input.holding_id,
      symbol: input.symbol.toUpperCase(),
      transaction_type: input.transaction_type,
      quantity: input.quantity,
      price: input.price,
      amount: amount,
      fees: input.fees || 0,
      currency: 'USD',
      transaction_date: input.transaction_date,
      notes: input.notes,
      is_manual: true,
    })
    .select()
    .single();

  if (error) throw error;

  // Update holding if transaction affects it
  if (input.holding_id) {
    await updateHoldingFromTransaction(input.holding_id, input);
  }

  return data;
}

/**
 * Update holding quantities based on transaction
 */
async function updateHoldingFromTransaction(
  holdingId: string,
  transaction: RecordTransactionInput
): Promise<void> {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch {
    return; // Not authenticated, skip update
  }

  const { data: holding } = await supabase
    .from('investment_holdings')
    .select('quantity, cost_basis')
    .eq('id', holdingId)
    .eq('user_id', userId)
    .single();

  if (!holding) return;

  let newQuantity = holding.quantity;
  let newCostBasis = holding.cost_basis;

  if (transaction.transaction_type === 'buy') {
    newQuantity += transaction.quantity;
    newCostBasis += transaction.quantity * transaction.price;
  } else if (transaction.transaction_type === 'sell') {
    const avgCost = holding.cost_basis / holding.quantity;
    newQuantity -= transaction.quantity;
    newCostBasis -= transaction.quantity * avgCost;
  }

  await supabase
    .from('investment_holdings')
    .update({
      quantity: newQuantity,
      cost_basis: newCostBasis,
      updated_at: new Date().toISOString(),
    })
    .eq('id', holdingId)
    .eq('user_id', userId);
}

// ============================================
// PORTFOLIO SUMMARY
// ============================================

/**
 * Get portfolio summary
 */
export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const userId = await getCurrentUserId();

  const holdings = await getHoldings();
  const cryptoHoldings = await getCryptoHoldings();

  // Combine all holdings
  const allHoldings = [
    ...holdings,
    ...cryptoHoldings.map(c => ({
      ...c,
      investment_type: 'cryptocurrency' as InvestmentType,
      institution_name: c.exchange_name,
      account_name: 'Crypto Wallet',
    })),
  ];

  const totalValue = allHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalCostBasis = allHoldings.reduce((sum, h) => sum + (h.cost_basis || 0), 0);
  const totalGain = totalValue - totalCostBasis;
  const totalGainPercentage = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  // Calculate allocation by type
  const allocationByType = {} as Record<InvestmentType, { value: number; percentage: number; count: number }>;
  for (const holding of allHoldings) {
    const type = holding.investment_type;
    if (!allocationByType[type]) {
      allocationByType[type] = { value: 0, percentage: 0, count: 0 };
    }
    allocationByType[type].value += holding.current_value || 0;
    allocationByType[type].count += 1;
  }

  // Calculate percentages
  for (const type in allocationByType) {
    allocationByType[type as InvestmentType].percentage =
      totalValue > 0 ? (allocationByType[type as InvestmentType].value / totalValue) * 100 : 0;
  }

  // Calculate allocation by account
  const allocationByAccount: PortfolioSummary['allocation_by_account'] = {};
  for (const holding of allHoldings) {
    const accountKey = holding.account_name || holding.institution_name || 'Other';
    if (!allocationByAccount[accountKey]) {
      allocationByAccount[accountKey] = {
        name: accountKey,
        value: 0,
        percentage: 0,
        count: 0,
      };
    }
    allocationByAccount[accountKey].value += holding.current_value || 0;
    allocationByAccount[accountKey].count += 1;
  }

  for (const key in allocationByAccount) {
    allocationByAccount[key].percentage =
      totalValue > 0 ? (allocationByAccount[key].value / totalValue) * 100 : 0;
  }

  // Sort holdings by performance
  const sortedByPerformance = [...holdings].sort(
    (a, b) => b.unrealized_gain_percentage - a.unrealized_gain_percentage
  );

  const sortedByValue = [...holdings].sort(
    (a, b) => (b.current_value || 0) - (a.current_value || 0)
  );

  // Get unique accounts
  const uniqueAccounts = new Set(allHoldings.map(h => h.account_name || h.institution_name));

  return {
    total_value: totalValue,
    total_cost_basis: totalCostBasis,
    total_gain: totalGain,
    total_gain_percentage: totalGainPercentage,
    day_change: 0,
    day_change_percentage: 0,
    holdings_count: allHoldings.length,
    accounts_count: uniqueAccounts.size,
    allocation_by_type: allocationByType,
    allocation_by_account: allocationByAccount,
    top_performers: sortedByPerformance.slice(0, 5),
    worst_performers: sortedByPerformance.slice(-5).reverse(),
    largest_holdings: sortedByValue.slice(0, 5),
    recent_dividends: 0, // Would need to calculate from transactions
    dividend_yield: 0,
  };
}

// ============================================
// SNAPSHOTS
// ============================================

/**
 * Create a portfolio snapshot
 */
export async function createSnapshot(notes?: string): Promise<InvestmentSnapshot> {
  const userId = await getCurrentUserId();

  const summary = await getPortfolioSummary();

  const holdingsBreakdown = {} as Record<InvestmentType, { value: number; count: number; percentage: number }>;
  for (const [type, data] of Object.entries(summary.allocation_by_type)) {
    holdingsBreakdown[type as InvestmentType] = {
      value: data.value,
      count: data.count,
      percentage: data.percentage,
    };
  }

  const { data, error } = await supabase
    .from('investment_snapshots')
    .insert({
      user_id: userId,
      snapshot_date: new Date().toISOString().split('T')[0],
      total_value: summary.total_value,
      total_cost_basis: summary.total_cost_basis,
      total_gain: summary.total_gain,
      total_gain_percentage: summary.total_gain_percentage,
      holdings_count: summary.holdings_count,
      holdings_breakdown: holdingsBreakdown,
      top_holdings: summary.largest_holdings.map(h => ({
        symbol: h.symbol,
        name: h.name,
        value: h.current_value || 0,
        percentage: h.allocation_percentage,
      })),
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get portfolio history
 */
export async function getPortfolioHistory(
  startDate?: string,
  endDate?: string
): Promise<InvestmentSnapshot[]> {
  const userId = await getCurrentUserId();

  let query = supabase
    .from('investment_snapshots')
    .select('*')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('snapshot_date', startDate);
  }

  if (endDate) {
    query = query.lte('snapshot_date', endDate);
  }

  const { data, error } = await query.order('snapshot_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get performance over a period
 */
export async function getPerformance(
  period: PortfolioPerformance['period']
): Promise<PortfolioPerformance> {
  const userId = await getCurrentUserId();

  // Calculate date range based on period
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case '1D':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '1W':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1M':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case 'YTD':
      startDate = new Date(endDate.getFullYear(), 0, 1);
      break;
    case '1Y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '5Y':
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    case 'ALL':
      startDate = new Date(2000, 0, 1);
      break;
  }

  const snapshots = await getPortfolioHistory(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  const summary = await getPortfolioSummary();

  const startValue = snapshots.length > 0 ? snapshots[0].total_value : summary.total_cost_basis;
  const endValue = summary.total_value;
  const absoluteChange = endValue - startValue;
  const percentageChange = startValue > 0 ? (absoluteChange / startValue) * 100 : 0;

  return {
    period,
    start_value: startValue,
    end_value: endValue,
    absolute_change: absoluteChange,
    percentage_change: percentageChange,
    history: snapshots.map(s => ({
      date: s.snapshot_date,
      value: s.total_value,
      cost_basis: s.total_cost_basis,
    })),
  };
}

// ============================================
// PRICE UPDATES
// ============================================

/**
 * Update holding prices (would typically call external API)
 */
export async function updatePrices(): Promise<void> {
  const userId = await getCurrentUserId();

  // In a real implementation, this would:
  // 1. Get all unique symbols from holdings
  // 2. Call external price API (Yahoo Finance, Alpha Vantage, etc.)
  // 3. Update all holdings with new prices

  // For now, just update the last_price_update timestamp
  await supabase
    .from('investment_holdings')
    .update({
      last_price_update: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_active', true);
}

/**
 * Update a single holding's price
 */
export async function updateHoldingPrice(
  id: string,
  newPrice: number
): Promise<InvestmentHolding> {
  const userId = await getCurrentUserId();

  // Get current holding to calculate new value
  const { data: holding } = await supabase
    .from('investment_holdings')
    .select('quantity')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!holding) throw new Error('Holding not found');

  const newValue = holding.quantity * newPrice;

  const { data, error } = await supabase
    .from('investment_holdings')
    .update({
      current_price: newPrice,
      current_value: newValue,
      last_price_update: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  // Record price in history
  await supabase.from('investment_prices').insert({
    symbol: data.symbol,
    price: newPrice,
    currency: 'USD',
    price_date: new Date().toISOString().split('T')[0],
    source: 'manual',
  });

  return data;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat(getCurrentLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, includeSign = true): string {
  const formatted = Math.abs(value).toFixed(2);
  if (includeSign) {
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  }
  return `${formatted}%`;
}

/**
 * Get gain/loss color
 */
export function getGainColor(value: number): string {
  if (value > 0) return '#22C55E'; // Green
  if (value < 0) return '#EF4444'; // Red
  return '#6B7280'; // Gray
}

/**
 * Calculate days until ex-dividend date
 */
export function daysUntilExDividend(exDate: string): number {
  const today = new Date();
  const exDividendDate = new Date(exDate);
  const diffTime = exDividendDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
