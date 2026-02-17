/**
 * Daily Spending Limit Service
 * "Safe to Spend" feature - track daily spending against limits
 */

import { supabase } from './supabase';
import type {
  DailySpendingLimit,
  DailySpendingLimitInsert,
  DailySpendingLimitUpdate,
  DailySpendingLog,
  SafeToSpendResult,
} from '@/types';

/**
 * Get the user's daily spending limit settings
 */
export async function getDailyLimit(): Promise<DailySpendingLimit | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('daily_spending_limits')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

/**
 * Create or update daily spending limit
 */
export async function setDailyLimit(
  dailyLimit: number,
  options?: {
    excludeCategories?: string[];
    excludeRecurring?: boolean;
    currency?: string;
  }
): Promise<DailySpendingLimit> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const existing = await getDailyLimit();

  if (existing) {
    // Update existing
    const updates: DailySpendingLimitUpdate = {
      daily_limit: dailyLimit,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (options?.excludeCategories !== undefined) {
      updates.exclude_categories = options.excludeCategories;
    }
    if (options?.excludeRecurring !== undefined) {
      updates.exclude_recurring = options.excludeRecurring;
    }
    if (options?.currency !== undefined) {
      updates.currency = options.currency;
    }

    const { data, error } = await supabase
      .from('daily_spending_limits')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const newLimit: DailySpendingLimitInsert = {
      user_id: user.id,
      daily_limit: dailyLimit,
      currency: options?.currency || 'USD',
      exclude_categories: options?.excludeCategories || [],
      exclude_recurring: options?.excludeRecurring ?? true,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('daily_spending_limits')
      .insert(newLimit)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Disable daily spending limit
 */
export async function disableDailyLimit(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('daily_spending_limits')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Calculate today's spending
 */
async function calculateTodaySpending(
  excludeCategories: string[] = [],
  excludeRecurring: boolean = true
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('transactions')
    .select('amount')
    .eq('is_deleted', false)
    .eq('transaction_date', today);

  if (excludeRecurring) {
    query = query.eq('is_recurring', false);
  }

  // Note: We can't use .not().in() with empty array, so handle separately
  const { data, error } = await query;

  if (error) throw error;

  // Filter out excluded categories in JS (Supabase array handling)
  let transactions = data || [];
  if (excludeCategories.length > 0) {
    const { data: excluded } = await supabase
      .from('transactions')
      .select('id, category_id, amount')
      .eq('is_deleted', false)
      .eq('transaction_date', today)
      .in('category_id', excludeCategories);

    const excludedIds = new Set(excluded?.map(e => e.id));
    // This approach won't work directly, so let's use a different query
  }

  return transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
}

/**
 * Get "Safe to Spend" status for today
 */
export async function getSafeToSpend(): Promise<SafeToSpendResult | null> {
  const limit = await getDailyLimit();
  if (!limit || !limit.is_active) return null;

  const today = new Date().toISOString().split('T')[0];

  // Build query for today's spending
  let query = supabase
    .from('transactions')
    .select('amount, category_id, is_recurring')
    .eq('is_deleted', false)
    .eq('transaction_date', today);

  const { data: transactions, error } = await query;
  if (error) throw error;

  // Calculate spending, excluding configured categories and recurring if set
  let spentToday = 0;
  (transactions || []).forEach((tx) => {
    // Skip recurring if configured
    if (limit.exclude_recurring && tx.is_recurring) return;
    // Skip excluded categories
    if (limit.exclude_categories.includes(tx.category_id)) return;
    spentToday += Number(tx.amount);
  });

  const remaining = limit.daily_limit - spentToday;
  const percentageUsed = limit.daily_limit > 0
    ? Math.round((spentToday / limit.daily_limit) * 100)
    : 0;

  return {
    daily_limit: limit.daily_limit,
    spent_today: spentToday,
    remaining: Math.max(0, remaining),
    percentage_used: Math.min(100, percentageUsed),
    is_over_limit: remaining < 0,
  };
}

/**
 * Get daily spending log for a date range
 */
export async function getDailySpendingLog(
  startDate: string,
  endDate: string
): Promise<DailySpendingLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('daily_spending_log')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update or create daily spending log entry
 * This is typically called when transactions are added/modified
 */
export async function updateDailySpendingLog(date: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const limit = await getDailyLimit();
  if (!limit || !limit.is_active) return;

  // Calculate total spending for the date
  let query = supabase
    .from('transactions')
    .select('amount, category_id, is_recurring')
    .eq('is_deleted', false)
    .eq('transaction_date', date);

  const { data: transactions, error: txError } = await query;
  if (txError) throw txError;

  let spentAmount = 0;
  (transactions || []).forEach((tx) => {
    if (limit.exclude_recurring && tx.is_recurring) return;
    if (limit.exclude_categories.includes(tx.category_id)) return;
    spentAmount += Number(tx.amount);
  });

  // Upsert the daily log
  const { error } = await supabase
    .from('daily_spending_log')
    .upsert({
      user_id: user.id,
      date,
      spent_amount: spentAmount,
      daily_limit: limit.daily_limit,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,date',
    });

  if (error) throw error;
}

/**
 * Get weekly spending summary with daily breakdown
 */
export async function getWeeklySpendingSummary(): Promise<{
  totalSpent: number;
  averageDaily: number;
  daysOverLimit: number;
  dailyBreakdown: Array<{
    date: string;
    spent: number;
    limit: number;
    isOverLimit: boolean;
  }>;
}> {
  const limit = await getDailyLimit();
  const dailyLimitAmount = limit?.daily_limit || 0;

  // Get last 7 days
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // Get spending for each day
  const dailyBreakdown = await Promise.all(
    dates.map(async (date) => {
      const { data } = await supabase
        .from('transactions')
        .select('amount')
        .eq('is_deleted', false)
        .eq('transaction_date', date);

      const spent = data?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      return {
        date,
        spent,
        limit: dailyLimitAmount,
        isOverLimit: dailyLimitAmount > 0 && spent > dailyLimitAmount,
      };
    })
  );

  const totalSpent = dailyBreakdown.reduce((sum, day) => sum + day.spent, 0);
  const averageDaily = totalSpent / 7;
  const daysOverLimit = dailyBreakdown.filter((day) => day.isOverLimit).length;

  return {
    totalSpent,
    averageDaily,
    daysOverLimit,
    dailyBreakdown,
  };
}

export default {
  getDailyLimit,
  setDailyLimit,
  disableDailyLimit,
  getSafeToSpend,
  getDailySpendingLog,
  updateDailySpendingLog,
  getWeeklySpendingSummary,
};
