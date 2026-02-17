/**
 * Budget Rollover Service
 * Enables unused budget to roll over to the next period
 */

import { supabase } from './supabase';
import type {
  Budget,
  BudgetHistory,
  BudgetHistoryInsert,
} from '@/types';

/**
 * Extended Budget type with rollover fields
 */
export interface BudgetWithRollover extends Budget {
  rollover_enabled: boolean;
  rollover_amount: number;
  max_rollover: number | null;
}

/**
 * Get budget with rollover settings
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function getBudgetWithRollover(
  budgetId: string
): Promise<BudgetWithRollover | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .eq('user_id', user.id) // Explicit user_id filter for defense-in-depth
    .single();

  if (error) throw error;
  return data;
}

/**
 * Enable rollover for a budget
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function enableRollover(
  budgetId: string,
  maxRollover?: number
): Promise<BudgetWithRollover> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .update({
      rollover_enabled: true,
      max_rollover: maxRollover || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', user.id) // Explicit user_id filter for defense-in-depth
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Disable rollover for a budget
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function disableRollover(budgetId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('budgets')
    .update({
      rollover_enabled: false,
      rollover_amount: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', user.id); // Explicit user_id filter for defense-in-depth

  if (error) throw error;
}

/**
 * Set max rollover amount
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function setMaxRollover(
  budgetId: string,
  maxRollover: number | null
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('budgets')
    .update({
      max_rollover: maxRollover,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', user.id); // Explicit user_id filter for defense-in-depth

  if (error) throw error;
}

/**
 * Calculate the effective budget (base + rollover)
 */
export async function getEffectiveBudget(
  budgetId: string
): Promise<{
  baseBudget: number;
  rolloverAmount: number;
  effectiveTotal: number;
}> {
  const budget = await getBudgetWithRollover(budgetId);
  if (!budget) throw new Error('Budget not found');

  const rolloverAmount = budget.rollover_enabled ? budget.rollover_amount : 0;

  return {
    baseBudget: budget.amount,
    rolloverAmount,
    effectiveTotal: budget.amount + rolloverAmount,
  };
}

/**
 * Get budget period dates based on budget settings
 */
export function getBudgetPeriodDates(
  period: 'weekly' | 'monthly' | 'yearly',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (period) {
    case 'weekly':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * Get previous budget period dates
 */
export function getPreviousPeriodDates(
  period: 'weekly' | 'monthly' | 'yearly',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const prevDate = new Date(referenceDate);

  switch (period) {
    case 'weekly':
      prevDate.setDate(prevDate.getDate() - 7);
      break;
    case 'yearly':
      prevDate.setFullYear(prevDate.getFullYear() - 1);
      break;
    case 'monthly':
    default:
      prevDate.setMonth(prevDate.getMonth() - 1);
      break;
  }

  return getBudgetPeriodDates(period, prevDate);
}

/**
 * Calculate spending for a budget period
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
async function calculatePeriodSpending(
  budget: Budget,
  startDate: string,
  endDate: string,
  userId: string
): Promise<number> {
  let query = supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId) // Explicit user_id filter for defense-in-depth
    .eq('is_deleted', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (budget.category_id) {
    query = query.eq('category_id', budget.category_id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
}

/**
 * Process period end - calculate rollover and create history entry
 * This should be called at the end of each budget period
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function processRollover(budgetId: string): Promise<{
  rolledOver: number;
  newRolloverAmount: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const budget = await getBudgetWithRollover(budgetId);
  if (!budget) throw new Error('Budget not found');
  if (!budget.rollover_enabled) {
    return { rolledOver: 0, newRolloverAmount: 0 };
  }

  // Get current period
  const currentPeriod = getBudgetPeriodDates(budget.period);
  const prevPeriod = getPreviousPeriodDates(budget.period);

  // Calculate spending for the previous period
  const spentAmount = await calculatePeriodSpending(
    budget,
    prevPeriod.start.toISOString().split('T')[0],
    prevPeriod.end.toISOString().split('T')[0],
    user.id
  );

  // Calculate what could roll over
  const effectiveBudget = budget.amount + budget.rollover_amount;
  const unspent = Math.max(0, effectiveBudget - spentAmount);

  // Apply max rollover cap if set
  let rolloverToAdd = unspent;
  if (budget.max_rollover !== null) {
    rolloverToAdd = Math.min(unspent, budget.max_rollover);
  }

  // Create history entry
  const historyEntry: BudgetHistoryInsert = {
    budget_id: budgetId,
    period_start: prevPeriod.start.toISOString().split('T')[0],
    period_end: prevPeriod.end.toISOString().split('T')[0],
    budget_amount: budget.amount,
    spent_amount: spentAmount,
    rollover_in: budget.rollover_amount,
    rollover_out: rolloverToAdd,
  };

  await supabase.from('budget_history').insert(historyEntry);

  // Update budget's rollover amount
  const { error: updateError } = await supabase
    .from('budgets')
    .update({
      rollover_amount: rolloverToAdd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', user.id); // Explicit user_id filter for defense-in-depth

  if (updateError) throw updateError;

  return {
    rolledOver: rolloverToAdd,
    newRolloverAmount: rolloverToAdd,
  };
}

/**
 * Get budget history
 * SECURITY: Verifies budget ownership before returning history
 */
export async function getBudgetHistory(
  budgetId: string,
  limit: number = 12
): Promise<BudgetHistory[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First verify the budget belongs to this user
  const { data: budget } = await supabase
    .from('budgets')
    .select('id')
    .eq('id', budgetId)
    .eq('user_id', user.id)
    .single();

  if (!budget) throw new Error('Budget not found');

  const { data, error } = await supabase
    .from('budget_history')
    .select('*')
    .eq('budget_id', budgetId)
    .order('period_end', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get rollover summary for all budgets
 */
export async function getRolloverSummary(): Promise<{
  totalRollover: number;
  budgetsWithRollover: number;
  budgets: Array<{
    budgetId: string;
    categoryName: string | null;
    rolloverAmount: number;
    maxRollover: number | null;
  }>;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .select(`
      id,
      rollover_enabled,
      rollover_amount,
      max_rollover,
      category:categories(name)
    `)
    .eq('user_id', user.id)
    .eq('rollover_enabled', true)
    .eq('is_active', true);

  if (error) throw error;

  interface RolloverBudget {
    id: string;
    category?: { name: string } | null;
    rollover_amount?: number;
    max_rollover?: number | null;
  }
  const budgets = ((data || []) as unknown as RolloverBudget[]).map((b) => ({
    budgetId: b.id,
    categoryName: b.category?.name || null,
    rolloverAmount: b.rollover_amount || 0,
    maxRollover: b.max_rollover ?? null,
  }));

  const totalRollover = budgets.reduce((sum, b) => sum + b.rolloverAmount, 0);

  return {
    totalRollover,
    budgetsWithRollover: budgets.length,
    budgets,
  };
}

/**
 * Clear all rollover for a budget
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function clearRollover(budgetId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('budgets')
    .update({
      rollover_amount: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', user.id); // Explicit user_id filter for defense-in-depth

  if (error) throw error;
}

/**
 * Manually adjust rollover amount
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function adjustRollover(
  budgetId: string,
  amount: number
): Promise<void> {
  if (amount < 0) {
    throw new Error('Rollover amount cannot be negative');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const budget = await getBudgetWithRollover(budgetId);
  if (!budget) throw new Error('Budget not found');

  // Apply max rollover cap if set
  let adjustedAmount = amount;
  if (budget.max_rollover !== null) {
    adjustedAmount = Math.min(amount, budget.max_rollover);
  }

  const { error } = await supabase
    .from('budgets')
    .update({
      rollover_amount: adjustedAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', user.id); // Explicit user_id filter for defense-in-depth

  if (error) throw error;
}

export default {
  getBudgetWithRollover,
  enableRollover,
  disableRollover,
  setMaxRollover,
  getEffectiveBudget,
  getBudgetPeriodDates,
  getPreviousPeriodDates,
  processRollover,
  getBudgetHistory,
  getRolloverSummary,
  clearRollover,
  adjustRollover,
};
