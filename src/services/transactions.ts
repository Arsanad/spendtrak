/**
 * Transaction Service
 * CRUD operations for transactions
 * Uses Supabase for real accounts, local AsyncStorage for dev mode
 */

import { supabase } from './supabase';
import { logger } from '@/utils/logger';
import { getCurrentLocale } from '../utils/locale';
import { withAuthRetry, isAuthError } from '@/utils/authErrorHandler';
import type {
  Transaction,
  TransactionWithCategory,
  TransactionInsert,
  TransactionUpdate,
  TransactionListParams,
  PaginatedResponse,
  CategorySpending,
} from '@/types';
import { suggestCategory } from '@/config/categories';
import { useAuthStore, waitForAuthHydration } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import * as devStorage from './devStorage';
import { isDevMode } from '@/utils/devMode';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a category ID or slug/name to its UUID.
 * If the input is already a UUID, returns it as-is.
 * Otherwise queries the categories table by name.
 */
async function resolveCategoryId(categoryIdOrSlug: string): Promise<string | null> {
  if (UUID_REGEX.test(categoryIdOrSlug)) {
    return categoryIdOrSlug;
  }

  // Try exact name match (case-insensitive)
  const { data } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', categoryIdOrSlug)
    .maybeSingle();

  if (data) return data.id;

  // Try prefix match (e.g., "food" matches "Food & Dining")
  const { data: partial } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', `${categoryIdOrSlug}%`)
    .maybeSingle();

  if (partial) return partial.id;

  logger.transaction.warn(`Could not resolve category slug to UUID: ${categoryIdOrSlug}`);
  return null;
}

/**
 * Get the current user ID (from Supabase or dev mode)
 * For OAuth users, always verifies the Supabase session is valid
 */
async function getCurrentUserId(): Promise<string> {
  // Wait for auth store to be hydrated from AsyncStorage
  await waitForAuthHydration();

  // Check store user immediately
  let storeUser = useAuthStore.getState().user;

  // If no user, wait and retry a couple times (handles timing issues with state updates)
  if (!storeUser) {
    for (let i = 0; i < 2; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      storeUser = useAuthStore.getState().user;
      if (storeUser?.id) break;
    }
  }

  // Dev mode check - user ID starts with 'dev-user-'
  // For dev users, we don't need Supabase session
  if (storeUser?.id?.startsWith('dev-user-')) {
    logger.transaction.info('Using dev user:', storeUser.id);
    return storeUser.id;
  }

  // For OAuth users, we MUST verify the Supabase session is valid
  // Even if we have a store user, the session might have expired
  try {
    // First try to get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.transaction.warn('Session error:', sessionError);
    }

    if (sessionData?.session?.user) {
      // Session is valid, return the user ID from the session
      logger.transaction.info('Using Supabase session user:', sessionData.session.user.id);
      return sessionData.session.user.id;
    }

    // No valid session, try to refresh
    logger.transaction.info('No active session, attempting refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      logger.transaction.warn('Session refresh failed:', refreshError);
    }

    if (refreshData?.session?.user) {
      logger.transaction.info('Session refreshed successfully');
      return refreshData.session.user.id;
    }

    // Last resort: try getUser() which might trigger a refresh
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      logger.transaction.warn('getUser error:', userError);
    }

    if (user) {
      logger.transaction.info('Got user from getUser():', user.id);
      return user.id;
    }
  } catch (error) {
    logger.transaction.error('Supabase auth check failed:', error);
  }

  // Check if we're in dev mode but user just hasn't loaded yet
  if (isDevMode()) {
    // Give one more chance for dev user to be available
    storeUser = useAuthStore.getState().user;
    if (storeUser?.id) {
      logger.transaction.info('Dev user loaded after retry:', storeUser.id);
      return storeUser.id;
    }
  }

  logger.transaction.error('No authenticated user found - please sign in again');
  throw new Error('Not authenticated');
}

/**
 * Get paginated transactions
 */
export async function getTransactions(
  params: TransactionListParams = {}
): Promise<PaginatedResponse<TransactionWithCategory>> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'transaction_date',
    sortOrder = 'desc',
    startDate,
    endDate,
    categoryId,
    source,
    minAmount,
    maxAmount,
    searchQuery,
    isRecurring,
  } = params;

  // In dev mode, use local storage
  if (isDevMode()) {
    const allTransactions = await devStorage.getDevTransactions();

    // Apply filters
    let filtered = allTransactions;

    if (startDate) {
      filtered = filtered.filter(t => t.transaction_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => t.transaction_date <= endDate);
    }
    if (categoryId) {
      filtered = filtered.filter(t => t.category_id === categoryId);
    }
    if (source) {
      filtered = filtered.filter(t => t.source === source);
    }
    if (minAmount !== undefined) {
      filtered = filtered.filter(t => Number(t.amount) >= minAmount);
    }
    if (maxAmount !== undefined) {
      filtered = filtered.filter(t => Number(t.amount) <= maxAmount);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.merchant_name.toLowerCase().includes(query));
    }
    if (isRecurring !== undefined) {
      filtered = filtered.filter(t => t.is_recurring === isRecurring);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = sortBy === 'transaction_date' ? new Date(a.transaction_date).getTime() : Number(a.amount);
      const bVal = sortBy === 'transaction_date' ? new Date(b.transaction_date).getTime() : Number(b.amount);
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate
    const total = filtered.length;
    const from = (page - 1) * pageSize;
    const data = filtered.slice(from, from + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    };
  }

  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `, { count: 'exact' })
    .eq('is_deleted', false);

  // Apply filters
  if (startDate) {
    query = query.gte('transaction_date', startDate);
  }
  if (endDate) {
    query = query.lte('transaction_date', endDate);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (source) {
    query = query.eq('source', source);
  }
  if (minAmount !== undefined) {
    query = query.gte('amount', minAmount);
  }
  if (maxAmount !== undefined) {
    query = query.lte('amount', maxAmount);
  }
  if (searchQuery) {
    query = query.ilike('merchant_name', `%${searchQuery}%`);
  }
  if (isRecurring !== undefined) {
    query = query.eq('is_recurring', isRecurring);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    // Check if it's an auth error and handle appropriately
    if (isAuthError(error)) {
      logger.transaction.warn('Auth error in getTransactions, will retry via wrapper');
    }
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > page * pageSize,
  };
}

/**
 * Get single transaction by ID
 */
export async function getTransaction(id: string): Promise<TransactionWithCategory | null> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevTransaction(id);
  }

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new transaction
 */
export async function createTransaction(
  transaction: Omit<TransactionInsert, 'user_id'>
): Promise<Transaction> {
  const userId = await getCurrentUserId();

  const transactionData: TransactionInsert = {
    ...transaction,
    user_id: userId,
  };

  // Resolve category_id if it's a slug/name instead of a UUID
  if (transactionData.category_id && !isDevMode()) {
    if (!UUID_REGEX.test(transactionData.category_id)) {
      transactionData.category_id = await resolveCategoryId(transactionData.category_id);
    }
  }

  // Auto-suggest category if not provided
  if (!transactionData.category_id && transactionData.merchant_name) {
    const suggested = suggestCategory(transactionData.merchant_name);

    // In dev mode, just use the suggested category ID directly
    if (!isDevMode()) {
      // Get category ID from database
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('name', suggested.name)
        .single();

      if (category) {
        transactionData.category_id = category.id;
      }
    } else {
      // In dev mode, use the category id from config
      transactionData.category_id = suggested.id;
    }
  }

  // Clean merchant name
  transactionData.merchant_name_clean = transactionData.merchant_name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // In dev mode, save to local storage
  if (isDevMode()) {
    const mockTransaction = {
      id: 'dev-txn-' + Date.now(),
      user_id: userId,
      amount: transactionData.amount,
      currency: transactionData.currency || useSettingsStore.getState().currency || 'AED',
      transaction_type: transactionData.transaction_type || 'purchase',
      merchant_name: transactionData.merchant_name,
      merchant_name_clean: transactionData.merchant_name_clean || '',
      category_id: transactionData.category_id || null,
      transaction_date: transactionData.transaction_date || new Date().toISOString().split('T')[0],
      transaction_time: null,
      source: transactionData.source || 'manual',
      card_last_four: null,
      bank_name: null,
      receipt_image_url: null,
      notes: transactionData.notes || null,
      is_recurring: false,
      is_reviewed: false,
      is_deleted: false,
      deleted_at: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Transaction;

    // Save to local storage
    return devStorage.saveDevTransaction(mockTransaction);
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update transaction
 */
export async function updateTransaction(
  id: string,
  updates: TransactionUpdate
): Promise<Transaction> {
  // In dev mode, update in local storage
  if (isDevMode()) {
    return devStorage.updateDevTransaction(id, updates);
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft delete transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  // In dev mode, delete from local storage
  if (isDevMode()) {
    return devStorage.deleteDevTransaction(id);
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get monthly spending summary
 */
export async function getMonthlySummary(
  month: Date = new Date()
): Promise<{
  total: number;
  transactionCount: number;
  byCategory: CategorySpending[];
  bySource: { email: number; receipt: number; manual: number; import: number };
}> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevMonthlySummary(month);
  }

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];

  // Get transactions for the month
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      source,
      category:categories(id, name, icon, color)
    `)
    .eq('is_deleted', false)
    .gte('transaction_date', startOfMonth)
    .lte('transaction_date', endOfMonth);

  if (error) throw error;

  const total = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const transactionCount = transactions?.length || 0;

  // Group by category
  const categoryMap = new Map<string, { name: string; icon: string; color: string; amount: number; count: number }>();
  transactions?.forEach((t: any) => {
    const cat = Array.isArray(t.category) ? t.category[0] : t.category;
    if (cat) {
      const existing = categoryMap.get(cat.id) || { name: cat.name, icon: cat.icon, color: cat.color, amount: 0, count: 0 };
      existing.amount += Number(t.amount);
      existing.count += 1;
      categoryMap.set(cat.id, existing);
    }
  });

  const byCategory: CategorySpending[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
    category_id: id,
    category_name: data.name,
    category_icon: data.icon,
    category_color: data.color,
    amount: data.amount,
    percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
    transaction_count: data.count,
  })).sort((a, b) => b.amount - a.amount);

  // Group by source
  const bySource = { email: 0, receipt: 0, manual: 0, import: 0 };
  transactions?.forEach((t: any) => {
    if (t.source in bySource) {
      bySource[t.source as keyof typeof bySource] += Number(t.amount);
    }
  });

  return { total, transactionCount, byCategory, bySource };
}

/**
 * Get spending by category for a specific month
 */
export async function getSpendingByCategory(
  month: number,
  year: number
): Promise<CategorySpending[]> {
  const date = new Date(year, month - 1, 1);
  const summary = await getMonthlySummary(date);
  return summary.byCategory;
}

/**
 * Get spending trend (last 6 months)
 */
export async function getSpendingTrend(): Promise<{ month: string; amount: number; transactionCount: number }[]> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevSpendingTrend();
  }

  const result: { month: string; amount: number; transactionCount: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('is_deleted', false)
      .gte('transaction_date', startOfMonth)
      .lte('transaction_date', endOfMonth);

    const total = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    result.push({
      month: date.toLocaleDateString(getCurrentLocale(), { month: 'short' }),
      amount: total,
      transactionCount: data?.length || 0,
    });
  }

  return result;
}

/**
 * Search transactions
 */
export async function searchTransactions(
  query: string,
  limit: number = 10
): Promise<TransactionWithCategory[]> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.searchDevTransactions(query, limit);
  }

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('is_deleted', false)
    .ilike('merchant_name', `%${query}%`)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get top merchants by spending
 */
export async function getTopMerchants(
  limit: number = 5,
  month?: Date
): Promise<{ merchant: string; amount: number; count: number }[]> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevTopMerchants(limit, month);
  }

  let query = supabase
    .from('transactions')
    .select('merchant_name, amount')
    .eq('is_deleted', false);

  if (month) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];
    query = query.gte('transaction_date', startOfMonth).lte('transaction_date', endOfMonth);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Aggregate by merchant
  const merchantMap = new Map<string, { amount: number; count: number }>();
  data?.forEach((t) => {
    const existing = merchantMap.get(t.merchant_name) || { amount: 0, count: 0 };
    existing.amount += Number(t.amount);
    existing.count += 1;
    merchantMap.set(t.merchant_name, existing);
  });

  return Array.from(merchantMap.entries())
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export default {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getSpendingByCategory,
  getSpendingTrend,
  searchTransactions,
  getTopMerchants,
};
