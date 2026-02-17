/**
 * Budgets Service
 * Production-ready Supabase service for budget management
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';
import { useAuthStore } from '@/stores/authStore';

/**
 * Get authenticated user ID with session validation
 */
async function getAuthenticatedUserId(): Promise<string> {
  // Check for dev user first
  const storeUser = useAuthStore.getState().user;
  if (storeUser?.id?.startsWith('dev-user-')) {
    return storeUser.id;
  }

  // For OAuth users, verify the Supabase session
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    return sessionData.session.user.id;
  }

  // Try to refresh the session
  const { data: refreshData } = await supabase.auth.refreshSession();
  if (refreshData?.session?.user) {
    return refreshData.session.user.id;
  }

  // Last resort
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  spent?: number;
  alert_threshold: number;
  period?: 'weekly' | 'monthly' | 'yearly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

export interface CreateBudgetInput {
  category_id: string;
  amount: number;
  alert_threshold?: number;
  period?: 'weekly' | 'monthly' | 'yearly';
}

export interface UpdateBudgetInput {
  category_id?: string;
  amount?: number;
  alert_threshold?: number;
  period?: 'weekly' | 'monthly' | 'yearly';
  is_active?: boolean;
}

/**
 * Get all active budgets for the current user
 */
export async function getBudgets(): Promise<Budget[]> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    logger.general.error('Failed to fetch budgets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single budget by ID
 */
export async function getBudget(budgetId: string): Promise<Budget | null> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('id', budgetId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    logger.general.error('Failed to fetch budget:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new budget
 */
export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const userId = await getAuthenticatedUserId();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      ...input,
      user_id: userId,
      alert_threshold: input.alert_threshold ?? 80,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select('*, category:categories(*)')
    .single();

  if (error) {
    logger.general.error('Failed to create budget:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing budget
 */
export async function updateBudget(
  budgetId: string,
  updates: UpdateBudgetInput
): Promise<Budget> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('budgets')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', userId)
    .select('*, category:categories(*)')
    .single();

  if (error) {
    logger.general.error('Failed to update budget:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a budget (soft delete)
 */
export async function deleteBudget(budgetId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('budgets')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', userId);

  if (error) {
    logger.general.error('Failed to delete budget:', error);
    throw error;
  }
}

/**
 * Get budgets by category
 */
export async function getBudgetsByCategory(categoryId: string): Promise<Budget[]> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('is_active', true);

  if (error) {
    logger.general.error('Failed to fetch budgets by category:', error);
    throw error;
  }

  return data || [];
}

/**
 * Calculate budget progress (spent / amount * 100)
 */
export function getBudgetProgress(budget: Budget): number {
  if (!budget.amount || budget.amount === 0) return 0;
  const spent = budget.spent || 0;
  return Math.min((spent / budget.amount) * 100, 100);
}

/**
 * Calculate remaining budget amount
 */
export function getBudgetRemaining(budget: Budget): number {
  const spent = budget.spent || 0;
  return Math.max(budget.amount - spent, 0);
}

/**
 * Check if budget is over the limit
 */
export function isBudgetOverLimit(budget: Budget): boolean {
  const spent = budget.spent || 0;
  return spent > budget.amount;
}

/**
 * Check if budget has reached alert threshold
 */
export function isBudgetAtThreshold(budget: Budget): boolean {
  const progress = getBudgetProgress(budget);
  return progress >= budget.alert_threshold;
}

/**
 * Get budget status based on progress
 */
export function getBudgetStatus(
  budget: Budget
): 'healthy' | 'caution' | 'warning' | 'exceeded' {
  const progress = getBudgetProgress(budget);
  if (progress >= 100) return 'exceeded';
  if (progress >= budget.alert_threshold) return 'warning';
  if (progress >= 50) return 'caution';
  return 'healthy';
}

/**
 * Get total budgeted amount across all budgets
 */
export async function getTotalBudgeted(): Promise<number> {
  const budgets = await getBudgets();
  return budgets.reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Get total spent amount across all budgets
 */
export async function getTotalSpent(): Promise<number> {
  const budgets = await getBudgets();
  return budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
}

/**
 * Update spent amount for a budget based on transactions
 */
export async function recalculateBudgetSpent(budgetId: string): Promise<number> {
  const userId = await getAuthenticatedUserId();

  const budget = await getBudget(budgetId);
  if (!budget) throw new Error('Budget not found');

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;

  switch (budget.period) {
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  // Sum transactions in category for the period
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', budget.category_id)
    .eq('transaction_type', 'purchase')
    .gte('transaction_date', startDate.toISOString())
    .lte('transaction_date', now.toISOString());

  if (error) {
    logger.general.error('Failed to calculate budget spent:', error);
    throw error;
  }

  const totalSpent = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

  // Update the budget with new spent amount
  await supabase
    .from('budgets')
    .update({ spent: totalSpent, updated_at: new Date().toISOString() })
    .eq('id', budgetId)
    .eq('user_id', userId);

  return totalSpent;
}

// ============================================
// FIX #8: Budget Adherence for Behavioral Engine
// ============================================

/**
 * Calculate overall budget adherence score (0.0 - 1.0)
 * Used by the behavioral engine for end-of-month detection
 *
 * @returns adherence score where:
 * - 1.0 = all budgets under 50% spent
 * - 0.5 = all budgets at 100% spent
 * - 0.0 = all budgets at 200%+ spent (double over)
 */
export async function calculateBudgetAdherence(): Promise<{
  adherence: number;
  budgetsAtRisk: number;
  budgetsExceeded: number;
  totalBudgets: number;
}> {
  try {
    const budgets = await getBudgets();

    if (budgets.length === 0) {
      return {
        adherence: 1.0,
        budgetsAtRisk: 0,
        budgetsExceeded: 0,
        totalBudgets: 0,
      };
    }

    let totalAdherence = 0;
    let budgetsAtRisk = 0;
    let budgetsExceeded = 0;

    for (const budget of budgets) {
      const progress = getBudgetProgress(budget);

      // Calculate adherence for this budget
      // 0% spent = 1.0 adherence
      // 100% spent = 0.5 adherence
      // 200%+ spent = 0.0 adherence
      let budgetAdherence: number;
      if (progress <= 100) {
        budgetAdherence = 1.0 - (progress / 200);
      } else {
        budgetAdherence = Math.max(0, 0.5 - ((progress - 100) / 200));
      }

      totalAdherence += budgetAdherence;

      // Count risk levels
      if (progress >= 100) {
        budgetsExceeded++;
      } else if (progress >= budget.alert_threshold) {
        budgetsAtRisk++;
      }
    }

    return {
      adherence: totalAdherence / budgets.length,
      budgetsAtRisk,
      budgetsExceeded,
      totalBudgets: budgets.length,
    };
  } catch (error) {
    logger.general.error('Failed to calculate budget adherence:', error);
    return {
      adherence: 1.0,
      budgetsAtRisk: 0,
      budgetsExceeded: 0,
      totalBudgets: 0,
    };
  }
}

/**
 * Get budget adherence for early month (day 1-20)
 * Used to establish baseline for end-of-month comparison
 */
export async function getEarlyMonthAdherence(transactions: { category_id: string | null; amount: number; transaction_date: string }[]): Promise<number> {
  try {
    const budgets = await getBudgets();

    if (budgets.length === 0) {
      return 1.0;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const day20 = new Date(now.getFullYear(), now.getMonth(), 20);

    // Filter transactions to early month
    const earlyMonthTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= monthStart && date <= day20 && t.amount < 0;
    });

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {};
    earlyMonthTransactions.forEach(t => {
      const catId = t.category_id || 'uncategorized';
      spendingByCategory[catId] = (spendingByCategory[catId] || 0) + Math.abs(t.amount);
    });

    // Calculate adherence for each budget
    let totalAdherence = 0;
    let budgetsWithData = 0;

    for (const budget of budgets) {
      const spent = spendingByCategory[budget.category_id] || 0;
      // Pro-rate budget for 20 days (66% of month)
      const expectedBudget = budget.amount * 0.66;
      const progress = expectedBudget > 0 ? (spent / expectedBudget) * 100 : 0;

      let budgetAdherence: number;
      if (progress <= 100) {
        budgetAdherence = 1.0 - (progress / 200);
      } else {
        budgetAdherence = Math.max(0, 0.5 - ((progress - 100) / 200));
      }

      totalAdherence += budgetAdherence;
      budgetsWithData++;
    }

    return budgetsWithData > 0 ? totalAdherence / budgetsWithData : 1.0;
  } catch (error) {
    logger.general.error('Failed to calculate early month adherence:', error);
    return 1.0;
  }
}

/**
 * Check if any budget is near its limit (for BUDGET_NEAR_LIMIT moment type)
 */
export async function checkBudgetsNearLimit(): Promise<{
  hasNearLimitBudget: boolean;
  budgets: { categoryId: string; categoryName: string; percentUsed: number }[];
}> {
  try {
    const budgets = await getBudgets();
    const nearLimitBudgets: { categoryId: string; categoryName: string; percentUsed: number }[] = [];

    for (const budget of budgets) {
      const progress = getBudgetProgress(budget);

      // Budget is "near limit" if between 80-95%
      if (progress >= 80 && progress < 100) {
        nearLimitBudgets.push({
          categoryId: budget.category_id,
          categoryName: budget.category?.name || budget.category_id,
          percentUsed: Math.round(progress),
        });
      }
    }

    return {
      hasNearLimitBudget: nearLimitBudgets.length > 0,
      budgets: nearLimitBudgets,
    };
  } catch (error) {
    logger.general.error('Failed to check budgets near limit:', error);
    return {
      hasNearLimitBudget: false,
      budgets: [],
    };
  }
}
