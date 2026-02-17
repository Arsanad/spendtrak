/**
 * Income Tracking Service
 * Handles income recording, cash flow analysis, and reporting
 */

import { supabase } from './supabase';
import type {
  Income,
  IncomeWithCategory,
  IncomeInsert,
  IncomeUpdate,
  CashFlowPeriod,
  CashFlowSummary,
  IncomeBySource,
  IncomeSource,
} from '@/types';

// ============================================
// INCOME CRUD OPERATIONS
// ============================================

/**
 * Get all income entries for the current user
 */
export async function getIncome(
  startDate?: string,
  endDate?: string
): Promise<IncomeWithCategory[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('income')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id)
    .order('income_date', { ascending: false });

  if (startDate) {
    query = query.gte('income_date', startDate);
  }
  if (endDate) {
    query = query.lte('income_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get a single income entry by ID
 */
export async function getIncomeById(incomeId: string): Promise<IncomeWithCategory | null> {
  const { data, error } = await supabase
    .from('income')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', incomeId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Create a new income entry
 */
export async function createIncome(income: Omit<IncomeInsert, 'user_id'>): Promise<Income> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const newIncome: IncomeInsert = {
    ...income,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('income')
    .insert(newIncome)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an income entry
 */
export async function updateIncome(incomeId: string, updates: IncomeUpdate): Promise<Income> {
  const { data, error } = await supabase
    .from('income')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', incomeId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an income entry
 */
export async function deleteIncome(incomeId: string): Promise<void> {
  const { error } = await supabase
    .from('income')
    .delete()
    .eq('id', incomeId);

  if (error) throw error;
}

// ============================================
// RECURRING INCOME
// ============================================

/**
 * Get recurring income entries
 */
export async function getRecurringIncome(): Promise<Income[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_recurring', true)
    .order('amount', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Calculate total recurring income (monthly equivalent)
 */
export async function getTotalRecurringMonthlyIncome(): Promise<number> {
  const recurring = await getRecurringIncome();

  return recurring.reduce((total, income) => {
    const amount = Number(income.amount);
    switch (income.frequency) {
      case 'weekly':
        return total + (amount * 52 / 12);
      case 'biweekly':
        return total + (amount * 26 / 12);
      case 'monthly':
        return total + amount;
      case 'quarterly':
        return total + (amount / 3);
      case 'yearly':
        return total + (amount / 12);
      default:
        return total;
    }
  }, 0);
}

// ============================================
// CASH FLOW ANALYSIS
// ============================================

/**
 * Get cash flow for a specific period
 */
export async function getCashFlowForPeriod(
  startDate: string,
  endDate: string
): Promise<CashFlowPeriod> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get total income for period
  const { data: incomeData, error: incomeError } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', user.id)
    .gte('income_date', startDate)
    .lte('income_date', endDate);

  if (incomeError) throw incomeError;

  const totalIncome = (incomeData || []).reduce(
    (sum, i) => sum + Number(i.amount),
    0
  );

  // Get total expenses for period
  const { data: expenseData, error: expenseError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (expenseError) throw expenseError;

  const totalExpenses = (expenseData || []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? Math.round((netCashFlow / totalIncome) * 100 * 100) / 100
    : 0;

  return {
    period_start: startDate,
    period_end: endDate,
    total_income: Math.round(totalIncome * 100) / 100,
    total_expenses: Math.round(totalExpenses * 100) / 100,
    net_cash_flow: Math.round(netCashFlow * 100) / 100,
    savings_rate: savingsRate,
  };
}

/**
 * Get comprehensive cash flow summary
 */
export async function getCashFlowSummary(): Promise<CashFlowSummary> {
  const today = new Date();

  // Current month
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0];
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString().split('T')[0];

  // Previous month
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString().split('T')[0];
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    .toISOString().split('T')[0];

  // Year to date
  const yearStart = new Date(today.getFullYear(), 0, 1)
    .toISOString().split('T')[0];

  const [currentMonth, previousMonth, yearToDate] = await Promise.all([
    getCashFlowForPeriod(currentMonthStart, currentMonthEnd),
    getCashFlowForPeriod(prevMonthStart, prevMonthEnd),
    getCashFlowForPeriod(yearStart, currentMonthEnd),
  ]);

  // Calculate monthly averages
  const monthsElapsed = today.getMonth() + 1;
  const monthlyAverageIncome = yearToDate.total_income / monthsElapsed;
  const monthlyAverageExpenses = yearToDate.total_expenses / monthsElapsed;

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining';
  const currentSavingsRate = currentMonth.savings_rate;
  const previousSavingsRate = previousMonth.savings_rate;

  if (currentSavingsRate > previousSavingsRate + 5) {
    trend = 'improving';
  } else if (currentSavingsRate < previousSavingsRate - 5) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return {
    current_month: currentMonth,
    previous_month: previousMonth,
    year_to_date: yearToDate,
    monthly_average_income: Math.round(monthlyAverageIncome * 100) / 100,
    monthly_average_expenses: Math.round(monthlyAverageExpenses * 100) / 100,
    trend,
  };
}

// ============================================
// INCOME ANALYTICS
// ============================================

/**
 * Get income breakdown by source
 */
export async function getIncomeBySource(
  startDate?: string,
  endDate?: string
): Promise<IncomeBySource[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('income')
    .select('source, amount')
    .eq('user_id', user.id);

  if (startDate) {
    query = query.gte('income_date', startDate);
  }
  if (endDate) {
    query = query.lte('income_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Aggregate by source
  const sourceMap = new Map<IncomeSource, { total: number; count: number }>();
  let grandTotal = 0;

  (data || []).forEach(item => {
    const amount = Number(item.amount);
    grandTotal += amount;

    const existing = sourceMap.get(item.source) || { total: 0, count: 0 };
    sourceMap.set(item.source, {
      total: existing.total + amount,
      count: existing.count + 1,
    });
  });

  // Convert to array with percentages
  const result: IncomeBySource[] = [];
  sourceMap.forEach((value, source) => {
    result.push({
      source,
      total_amount: Math.round(value.total * 100) / 100,
      percentage: grandTotal > 0
        ? Math.round((value.total / grandTotal) * 100 * 100) / 100
        : 0,
      transaction_count: value.count,
    });
  });

  // Sort by total amount descending
  return result.sort((a, b) => b.total_amount - a.total_amount);
}

/**
 * Get monthly income totals for the last N months
 */
export async function getMonthlyIncomeTotals(months: number = 12): Promise<Array<{
  month: string;
  total: number;
}>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const results: Array<{ month: string; total: number }> = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const startDate = monthDate.toISOString().split('T')[0];
    const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('income')
      .select('amount')
      .eq('user_id', user.id)
      .gte('income_date', startDate)
      .lte('income_date', endDate);

    if (error) throw error;

    const total = (data || []).reduce((sum, i) => sum + Number(i.amount), 0);

    results.push({
      month: startDate.slice(0, 7), // YYYY-MM format
      total: Math.round(total * 100) / 100,
    });
  }

  return results.reverse();
}

/**
 * Get total income for current year
 */
export async function getYearToDateIncome(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const yearStart = new Date(new Date().getFullYear(), 0, 1)
    .toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', user.id)
    .gte('income_date', yearStart);

  if (error) throw error;

  return (data || []).reduce((sum, i) => sum + Number(i.amount), 0);
}

// ============================================
// INCOME PREDICTIONS
// ============================================

/**
 * Predict next month's income based on recurring income and historical data
 */
export async function predictNextMonthIncome(): Promise<{
  predicted_total: number;
  recurring_portion: number;
  variable_portion: number;
  confidence: 'high' | 'medium' | 'low';
}> {
  // Get recurring monthly income
  const recurringMonthly = await getTotalRecurringMonthlyIncome();

  // Get last 3 months of non-recurring income for average
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1)
    .toISOString().split('T')[0];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: nonRecurring, error } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', user.id)
    .eq('is_recurring', false)
    .gte('income_date', threeMonthsAgo);

  if (error) throw error;

  const nonRecurringTotal = (nonRecurring || []).reduce(
    (sum, i) => sum + Number(i.amount),
    0
  );
  const variablePortion = nonRecurringTotal / 3; // Average over 3 months

  // Determine confidence based on data availability
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (recurringMonthly > 0 && (nonRecurring?.length || 0) >= 5) {
    confidence = 'high';
  } else if (recurringMonthly > 0 || (nonRecurring?.length || 0) >= 3) {
    confidence = 'medium';
  }

  return {
    predicted_total: Math.round((recurringMonthly + variablePortion) * 100) / 100,
    recurring_portion: Math.round(recurringMonthly * 100) / 100,
    variable_portion: Math.round(variablePortion * 100) / 100,
    confidence,
  };
}

export default {
  getIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  getRecurringIncome,
  getTotalRecurringMonthlyIncome,
  getCashFlowForPeriod,
  getCashFlowSummary,
  getIncomeBySource,
  getMonthlyIncomeTotals,
  getYearToDateIncome,
  predictNextMonthIncome,
};
