/**
 * Zero-Based Budgeting Service
 * Manages zero-based budget periods, allocations, and income sources
 */

import { supabase } from './supabase';
import type {
  ZeroBasedPeriod,
  ZeroBasedPeriodInsert,
  ZeroBasedPeriodUpdate,
  ZeroBasedPeriodWithDetails,
  ZeroBasedAllocation,
  ZeroBasedAllocationInsert,
  ZeroBasedAllocationUpdate,
  ZeroBasedAllocationWithCategory,
  ZeroBasedIncomeSource,
  ZeroBasedIncomeSourceInsert,
  ZeroBasedIncomeSourceUpdate,
  ZeroBasedSummary,
  Category,
} from '@/types';

// ============================================
// BUDGET PERIOD MANAGEMENT
// ============================================

/**
 * Get all zero-based budget periods
 */
export async function getZeroBasedPeriods(
  activeOnly: boolean = true
): Promise<ZeroBasedPeriod[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('zero_based_periods')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch budget periods: ${error.message}`);
  }

  return data || [];
}

/**
 * Get current active budget period
 */
export async function getCurrentPeriod(): Promise<ZeroBasedPeriodWithDetails | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: period, error } = await supabase
    .from('zero_based_periods')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .single();

  if (error || !period) {
    return null;
  }

  return getPeriodWithDetails(period.id);
}

/**
 * Get a budget period with all its details
 */
export async function getPeriodWithDetails(
  periodId: string
): Promise<ZeroBasedPeriodWithDetails> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the period
  const { data: period, error: periodError } = await supabase
    .from('zero_based_periods')
    .select('*')
    .eq('id', periodId)
    .eq('user_id', user.id)
    .single();

  if (periodError || !period) {
    throw new Error(`Failed to fetch period: ${periodError?.message}`);
  }

  // Get allocations with categories
  const { data: allocations, error: allocError } = await supabase
    .from('zero_based_allocations')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('period_id', periodId)
    .order('priority', { ascending: true });

  if (allocError) {
    throw new Error(`Failed to fetch allocations: ${allocError.message}`);
  }

  // Get income sources
  const { data: incomeSources, error: incomeError } = await supabase
    .from('zero_based_income_sources')
    .select('*')
    .eq('period_id', periodId);

  if (incomeError) {
    throw new Error(`Failed to fetch income sources: ${incomeError.message}`);
  }

  // Calculate actual spending for each allocation
  const allocationsWithSpent = await Promise.all(
    (allocations || []).map(async (alloc: ZeroBasedAllocationWithCategory) => {
      let spent = alloc.spent_amount || 0;

      if (alloc.category_id) {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('category_id', alloc.category_id)
          .eq('is_deleted', false)
          .gte('transaction_date', period.start_date)
          .lte('transaction_date', period.end_date);

        // If transactions found, use that sum; otherwise keep stored spent_amount
        const transactionSpent = (transactions || []).reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
        if (transactionSpent > 0) {
          spent = transactionSpent;
        }
      }

      const percentageSpent = alloc.allocated_amount > 0
        ? (spent / alloc.allocated_amount) * 100
        : 0;

      return {
        ...alloc,
        spent_amount: spent,
        remaining: alloc.allocated_amount - spent,
        percentage_spent: Math.min(percentageSpent, 100), // Cap at 100
      };
    })
  );

  const totalAllocated = allocationsWithSpent.reduce((sum, a) => sum + a.allocated_amount, 0);
  const totalSpent = allocationsWithSpent.reduce((sum, a) => sum + a.spent_amount, 0);
  const totalRemaining = allocationsWithSpent.reduce((sum, a) => sum + a.remaining, 0);
  const unallocated = period.total_income - totalAllocated;

  return {
    ...period,
    allocations: allocationsWithSpent,
    income_sources: incomeSources || [],
    unallocated,
    total_spent: totalSpent,
    total_remaining: totalRemaining,
  };
}

/**
 * Create a new budget period
 */
export async function createPeriod(
  periodData: Omit<ZeroBasedPeriodInsert, 'user_id'>
): Promise<ZeroBasedPeriod> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('zero_based_periods')
    .insert({
      ...periodData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create period: ${error.message}`);
  }

  return data;
}

/**
 * Create a monthly budget period with standard setup
 */
export async function createMonthlyPeriod(
  year: number,
  month: number,
  totalIncome: number
): Promise<ZeroBasedPeriod> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return createPeriod({
    period_name: `${monthNames[month - 1]} ${year}`,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    total_income: totalIncome,
    total_allocated: 0,
    is_balanced: false,
    is_active: true,
    household_id: null,
  });
}

/**
 * Update a budget period
 */
export async function updatePeriod(
  periodId: string,
  updates: ZeroBasedPeriodUpdate
): Promise<ZeroBasedPeriod> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('zero_based_periods')
    .update(updates)
    .eq('id', periodId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update period: ${error.message}`);
  }

  return data;
}

/**
 * Delete a budget period (soft delete)
 */
export async function deletePeriod(periodId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('zero_based_periods')
    .update({ is_active: false })
    .eq('id', periodId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete period: ${error.message}`);
  }
}

// ============================================
// ALLOCATION MANAGEMENT
// ============================================

/**
 * Get allocations for a period
 */
export async function getAllocations(
  periodId: string
): Promise<ZeroBasedAllocationWithCategory[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('zero_based_allocations')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('period_id', periodId)
    .eq('user_id', user.id)
    .order('priority', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch allocations: ${error.message}`);
  }

  return (data || []).map((alloc: ZeroBasedAllocationWithCategory) => {
    const percentageSpent = alloc.allocated_amount > 0
      ? ((alloc.spent_amount || 0) / alloc.allocated_amount) * 100
      : 0;
    return {
      ...alloc,
      remaining: alloc.allocated_amount - (alloc.spent_amount || 0),
      percentage_spent: Math.min(percentageSpent, 100), // Cap at 100
    };
  });
}

/**
 * Create a new allocation
 */
export async function createAllocation(
  allocation: Omit<ZeroBasedAllocationInsert, 'user_id'>
): Promise<ZeroBasedAllocation> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('zero_based_allocations')
    .insert({
      ...allocation,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create allocation: ${error.message}`);
  }

  // Update period totals
  await recalculatePeriodTotals(allocation.period_id);

  return data;
}

/**
 * Update an allocation
 */
export async function updateAllocation(
  allocationId: string,
  updates: ZeroBasedAllocationUpdate
): Promise<ZeroBasedAllocation> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the allocation first to know the period
  const { data: existing } = await supabase
    .from('zero_based_allocations')
    .select('period_id')
    .eq('id', allocationId)
    .single();

  const { data, error } = await supabase
    .from('zero_based_allocations')
    .update(updates)
    .eq('id', allocationId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update allocation: ${error.message}`);
  }

  // Update period totals
  if (existing) {
    await recalculatePeriodTotals(existing.period_id);
  }

  return data;
}

/**
 * Delete an allocation
 */
export async function deleteAllocation(allocationId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the allocation first to know the period
  const { data: existing } = await supabase
    .from('zero_based_allocations')
    .select('period_id')
    .eq('id', allocationId)
    .single();

  const { error } = await supabase
    .from('zero_based_allocations')
    .delete()
    .eq('id', allocationId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete allocation: ${error.message}`);
  }

  // Update period totals
  if (existing) {
    await recalculatePeriodTotals(existing.period_id);
  }
}

/**
 * Create allocations from existing categories
 */
export async function createAllocationsFromCategories(
  periodId: string,
  categories: Array<{ category_id: string; allocated_amount: number; is_essential: boolean }>
): Promise<ZeroBasedAllocation[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get category details
  const categoryIds = categories.map(c => c.category_id);
  const { data: categoryDetails } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', categoryIds);

  const categoryMap = new Map((categoryDetails || []).map(c => [c.id, c.name]));

  const allocations: Omit<ZeroBasedAllocationInsert, 'user_id'>[] = categories.map((c, index) => ({
    period_id: periodId,
    category_id: c.category_id,
    name: categoryMap.get(c.category_id) || 'Unknown',
    allocated_amount: c.allocated_amount,
    spent_amount: 0,
    priority: index,
    is_essential: c.is_essential,
    notes: null,
  }));

  const { data, error } = await supabase
    .from('zero_based_allocations')
    .insert(allocations.map(a => ({ ...a, user_id: user.id })))
    .select();

  if (error) {
    throw new Error(`Failed to create allocations: ${error.message}`);
  }

  await recalculatePeriodTotals(periodId);

  return data || [];
}

// ============================================
// INCOME SOURCE MANAGEMENT
// ============================================

/**
 * Get income sources for a period
 */
export async function getIncomeSources(periodId: string): Promise<ZeroBasedIncomeSource[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('zero_based_income_sources')
    .select('*')
    .eq('period_id', periodId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to fetch income sources: ${error.message}`);
  }

  return data || [];
}

/**
 * Create an income source
 */
export async function createIncomeSource(
  incomeSource: Omit<ZeroBasedIncomeSourceInsert, 'user_id'>
): Promise<ZeroBasedIncomeSource> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('zero_based_income_sources')
    .insert({
      ...incomeSource,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create income source: ${error.message}`);
  }

  // Update period total income
  await recalculatePeriodIncome(incomeSource.period_id);

  return data;
}

/**
 * Update an income source
 */
export async function updateIncomeSource(
  incomeSourceId: string,
  updates: ZeroBasedIncomeSourceUpdate
): Promise<ZeroBasedIncomeSource> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the income source first to know the period
  const { data: existing } = await supabase
    .from('zero_based_income_sources')
    .select('period_id')
    .eq('id', incomeSourceId)
    .single();

  const { data, error } = await supabase
    .from('zero_based_income_sources')
    .update(updates)
    .eq('id', incomeSourceId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update income source: ${error.message}`);
  }

  // Update period total income
  if (existing) {
    await recalculatePeriodIncome(existing.period_id);
  }

  return data;
}

/**
 * Delete an income source
 */
export async function deleteIncomeSource(incomeSourceId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the income source first to know the period
  const { data: existing } = await supabase
    .from('zero_based_income_sources')
    .select('period_id')
    .eq('id', incomeSourceId)
    .single();

  const { error } = await supabase
    .from('zero_based_income_sources')
    .delete()
    .eq('id', incomeSourceId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete income source: ${error.message}`);
  }

  // Update period total income
  if (existing) {
    await recalculatePeriodIncome(existing.period_id);
  }
}

/**
 * Mark income as received
 */
export async function markIncomeReceived(
  incomeSourceId: string,
  receivedAmount: number,
  receivedDate?: string,
  incomeId?: string
): Promise<ZeroBasedIncomeSource> {
  return updateIncomeSource(incomeSourceId, {
    received_amount: receivedAmount,
    received_date: receivedDate || new Date().toISOString().split('T')[0],
    income_id: incomeId || null,
  });
}

// ============================================
// BUDGET BALANCE CALCULATIONS
// ============================================

/**
 * Recalculate period totals
 */
async function recalculatePeriodTotals(periodId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return;

  const { data: allocations } = await supabase
    .from('zero_based_allocations')
    .select('allocated_amount')
    .eq('period_id', periodId);

  const totalAllocated = (allocations || []).reduce((sum, a) => sum + a.allocated_amount, 0);

  const { data: period } = await supabase
    .from('zero_based_periods')
    .select('total_income')
    .eq('id', periodId)
    .single();

  const isBalanced = period && Math.abs(totalAllocated - period.total_income) < 0.01;

  await supabase
    .from('zero_based_periods')
    .update({
      total_allocated: totalAllocated,
      is_balanced: isBalanced,
    })
    .eq('id', periodId);
}

/**
 * Recalculate period income from sources
 */
async function recalculatePeriodIncome(periodId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return;

  const { data: sources } = await supabase
    .from('zero_based_income_sources')
    .select('expected_amount')
    .eq('period_id', periodId);

  const totalIncome = (sources || []).reduce((sum, s) => sum + s.expected_amount, 0);

  const { data: period } = await supabase
    .from('zero_based_periods')
    .select('total_allocated')
    .eq('id', periodId)
    .single();

  const isBalanced = period && Math.abs(totalIncome - period.total_allocated) < 0.01;

  await supabase
    .from('zero_based_periods')
    .update({
      total_income: totalIncome,
      is_balanced: isBalanced,
    })
    .eq('id', periodId);
}

/**
 * Get budget summary for a period
 */
export async function getBudgetSummary(periodId: string): Promise<ZeroBasedSummary> {
  const period = await getPeriodWithDetails(periodId);

  const essentialAllocated = period.allocations
    .filter(a => a.is_essential)
    .reduce((sum, a) => sum + a.allocated_amount, 0);

  const nonEssentialAllocated = period.allocations
    .filter(a => !a.is_essential)
    .reduce((sum, a) => sum + a.allocated_amount, 0);

  const categoriesOverBudget = period.allocations
    .filter(a => a.spent_amount > a.allocated_amount)
    .length;

  return {
    is_balanced: period.is_balanced,
    total_income: period.total_income,
    total_allocated: period.total_allocated,
    unallocated: period.unallocated,
    total_spent: period.total_spent,
    total_remaining: period.total_remaining,
    essential_allocated: essentialAllocated,
    non_essential_allocated: nonEssentialAllocated,
    categories_over_budget: categoriesOverBudget,
  };
}

/**
 * Auto-distribute remaining income across allocations
 */
export async function autoDistributeRemaining(
  periodId: string,
  prioritizeEssential: boolean = true
): Promise<void> {
  const period = await getPeriodWithDetails(periodId);

  if (period.unallocated <= 0) return;

  const allocations = prioritizeEssential
    ? [...period.allocations].sort((a, b) => {
        if (a.is_essential && !b.is_essential) return -1;
        if (!a.is_essential && b.is_essential) return 1;
        return a.priority - b.priority;
      })
    : period.allocations;

  const perAllocation = period.unallocated / allocations.length;

  for (const alloc of allocations) {
    await updateAllocation(alloc.id, {
      allocated_amount: alloc.allocated_amount + perAllocation,
    });
  }
}

/**
 * Copy allocations from a previous period
 */
export async function copyAllocationsFromPeriod(
  sourcePeriodId: string,
  targetPeriodId: string
): Promise<ZeroBasedAllocation[]> {
  const sourceAllocations = await getAllocations(sourcePeriodId);

  const newAllocations = await Promise.all(
    sourceAllocations.map(alloc =>
      createAllocation({
        period_id: targetPeriodId,
        category_id: alloc.category_id,
        name: alloc.name,
        allocated_amount: alloc.allocated_amount,
        spent_amount: 0,
        priority: alloc.priority,
        is_essential: alloc.is_essential,
        notes: alloc.notes,
      })
    )
  );

  return newAllocations;
}
