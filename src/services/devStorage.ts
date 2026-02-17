/**
 * Dev Mode Local Storage
 * Persists transactions locally using AsyncStorage when in dev mode
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import { getCurrentLocale } from '../utils/locale';
import type {
  Transaction,
  TransactionWithCategory,
  CategorySpending,
  Subscription,
  SubscriptionWithCategory,
  SubscriptionSummary,
  SubscriptionStatus,
  SubscriptionFrequency,
} from '@/types';
import { DEFAULT_CATEGORIES, getCategoryById } from '@/config/categories';
import { convertCurrency } from './currencyConverter';
import { useSettingsStore } from '@/stores/settingsStore';

const STORAGE_KEYS = {
  TRANSACTIONS: '@dev_transactions',
  SUBSCRIPTIONS: '@dev_subscriptions',
  BUDGETS: '@dev_budgets',
  GOALS: '@dev_goals',
  DEBTS: '@dev_debts',
  ASSETS: '@dev_assets',
  LIABILITIES: '@dev_liabilities',
  BILLS: '@dev_bills',
  HOUSEHOLDS: '@dev_households',
  HOUSEHOLD_MEMBERS: '@dev_household_members',
  NET_WORTH_SNAPSHOTS: '@dev_net_worth_snapshots',
};

/**
 * Get all dev transactions from local storage
 * Auto-fixes missing 'type' field for backwards compatibility
 */
export async function getDevTransactions(): Promise<TransactionWithCategory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];

    const transactions: Transaction[] = JSON.parse(data);

    // Auto-fix missing 'type' field (backwards compatibility)
    // Dev storage may have legacy data without the 'type' field
    let needsSave = false;
    const fixedTransactions = transactions.map((t: any) => {
      if (!t.type) {
        needsSave = true;
        return { ...t, type: 'expense' as const };
      }
      return t;
    }) as Transaction[];

    // Save fixed transactions back to storage
    if (needsSave) {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(fixedTransactions));
    }

    // Add category info to each transaction
    return fixedTransactions
      .filter(t => !t.is_deleted)
      .map(t => {
        const categoryConfig = t.category_id ? getCategoryById(t.category_id) : null;
        return {
          ...t,
          category: categoryConfig ? {
            id: categoryConfig.id,
            name: categoryConfig.name,
            icon: categoryConfig.icon,
            color: categoryConfig.color,
            is_default: categoryConfig.isDefault,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } : null,
        } as TransactionWithCategory;
      })
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  } catch (error) {
    logger.storage.error('Error reading dev transactions:', error);
    return [];
  }
}

/**
 * Get a single dev transaction by ID
 */
export async function getDevTransaction(id: string): Promise<TransactionWithCategory | null> {
  const transactions = await getDevTransactions();
  return transactions.find(t => t.id === id) || null;
}

/**
 * Save a new dev transaction
 */
export async function saveDevTransaction(transaction: Transaction): Promise<Transaction> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = data ? JSON.parse(data) : [];

    transactions.push(transaction);

    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

    return transaction;
  } catch (error) {
    logger.storage.error('Error saving dev transaction:', error);
    throw error;
  }
}

/**
 * Update a dev transaction
 */
export async function updateDevTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = data ? JSON.parse(data) : [];

    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    transactions[index] = {
      ...transactions[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

    return transactions[index];
  } catch (error) {
    logger.storage.error('Error updating dev transaction:', error);
    throw error;
  }
}

/**
 * Delete a dev transaction (soft delete)
 */
export async function deleteDevTransaction(id: string): Promise<void> {
  try {
    await updateDevTransaction(id, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.storage.error('Error deleting dev transaction:', error);
    throw error;
  }
}

/**
 * Get monthly summary for dev transactions
 * Converts all amounts to user's main currency before summing
 */
export async function getDevMonthlySummary(month: Date = new Date()): Promise<{
  total: number;
  transactionCount: number;
  byCategory: CategorySpending[];
  bySource: { email: number; receipt: number; manual: number; import: number };
}> {
  const transactions = await getDevTransactions();
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date >= startOfMonth && date <= endOfMonth;
  });

  // Convert all amounts to user's currency
  let total = 0;
  const convertedAmounts: number[] = [];

  for (const t of monthTransactions) {
    const txCurrency = t.currency || 'AED';
    let convertedAmount = Number(t.amount);

    if (txCurrency !== userCurrency) {
      try {
        convertedAmount = await convertCurrency(Number(t.amount), txCurrency, userCurrency);
      } catch (error) {
        logger.storage.warn(`Failed to convert ${txCurrency} to ${userCurrency}, using original amount`);
      }
    }

    convertedAmounts.push(convertedAmount);
    total += convertedAmount;
  }

  const transactionCount = monthTransactions.length;

  // Group by category with converted amounts
  const categoryMap = new Map<string, { name: string; icon: string; color: string; amount: number; count: number }>();

  for (let i = 0; i < monthTransactions.length; i++) {
    const t = monthTransactions[i];
    const convertedAmount = convertedAmounts[i];

    if (t.category) {
      const catId = t.category.id;
      const existing = categoryMap.get(catId) || {
        name: t.category.name,
        icon: t.category.icon,
        color: t.category.color,
        amount: 0,
        count: 0,
      };
      existing.amount += convertedAmount;
      existing.count += 1;
      categoryMap.set(catId, existing);
    }
  }

  const byCategory: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      category_id: id,
      category_name: data.name,
      category_icon: data.icon,
      category_color: data.color,
      amount: data.amount,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      transaction_count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group by source with converted amounts
  const bySource = { email: 0, receipt: 0, manual: 0, import: 0 };
  for (let i = 0; i < monthTransactions.length; i++) {
    const t = monthTransactions[i];
    const convertedAmount = convertedAmounts[i];

    if (t.source && t.source in bySource) {
      bySource[t.source as keyof typeof bySource] += convertedAmount;
    }
  }

  return { total, transactionCount, byCategory, bySource };
}

/**
 * Get spending trend for dev transactions (last 6 months)
 * Converts all amounts to user's main currency
 */
export async function getDevSpendingTrend(): Promise<{ month: string; amount: number; transactionCount: number }[]> {
  const transactions = await getDevTransactions();
  const userCurrency = useSettingsStore.getState().currency || 'AED';
  const result: { month: string; amount: number; transactionCount: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= startOfMonth && tDate <= endOfMonth;
    });

    // Convert all amounts to user's currency
    let total = 0;
    for (const t of monthTransactions) {
      const txCurrency = t.currency || 'AED';
      let amount = Number(t.amount);

      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {
          // Use original amount if conversion fails
        }
      }
      total += amount;
    }

    result.push({
      month: date.toLocaleDateString(getCurrentLocale(), { month: 'short' }),
      amount: total,
      transactionCount: monthTransactions.length,
    });
  }

  return result;
}

/**
 * Search dev transactions
 */
export async function searchDevTransactions(query: string, limit: number = 10): Promise<TransactionWithCategory[]> {
  const transactions = await getDevTransactions();
  const lowerQuery = query.toLowerCase();

  return transactions
    .filter(t => t.merchant_name.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}

/**
 * Get top merchants from dev transactions
 * Converts all amounts to user's main currency
 */
export async function getDevTopMerchants(
  limit: number = 5,
  month?: Date
): Promise<{ merchant: string; amount: number; count: number }[]> {
  let transactions = await getDevTransactions();
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  if (month) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    transactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= startOfMonth && date <= endOfMonth;
    });
  }

  const merchantMap = new Map<string, { amount: number; count: number }>();

  for (const t of transactions) {
    const txCurrency = t.currency || 'AED';
    let amount = Number(t.amount);

    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {
        // Use original amount if conversion fails
      }
    }

    const existing = merchantMap.get(t.merchant_name) || { amount: 0, count: 0 };
    existing.amount += amount;
    existing.count += 1;
    merchantMap.set(t.merchant_name, existing);
  }

  return Array.from(merchantMap.entries())
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Clear all dev transactions (for testing)
 */
export async function clearDevTransactions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
}

/**
 * Migrate dev transactions to fix missing 'type' field
 * This fixes transactions that were created before the type field was added
 */
export async function migrateDevTransactionsType(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return 0;

    const transactions: Transaction[] = JSON.parse(data);
    let fixedCount = 0;

    const migratedTransactions = transactions.map((t: any) => {
      // Dev storage may have legacy data without the 'type' field
      if (!t.type) {
        fixedCount++;
        return { ...t, type: 'expense' as const };
      }
      return t;
    }) as Transaction[];

    if (fixedCount > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(migratedTransactions));
    }

    return fixedCount;
  } catch (error) {
    logger.storage.error('Error migrating dev transactions:', error);
    return 0;
  }
}

// ============================================
// SUBSCRIPTION STORAGE FUNCTIONS
// ============================================

/**
 * Get all dev subscriptions from local storage
 */
export async function getDevSubscriptions(status?: SubscriptionStatus): Promise<SubscriptionWithCategory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!data) return [];

    let subscriptions: Subscription[] = JSON.parse(data);

    if (status) {
      subscriptions = subscriptions.filter(s => s.status === status);
    }

    // Add category info to each subscription
    return subscriptions
      .map(s => {
        const categoryConfig = s.category_id ? getCategoryById(s.category_id) : null;
        return {
          ...s,
          category: categoryConfig ? {
            id: categoryConfig.id,
            name: categoryConfig.name,
            icon: categoryConfig.icon,
            color: categoryConfig.color,
            is_default: categoryConfig.isDefault,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } : null,
        } as SubscriptionWithCategory;
      })
      .sort((a, b) => {
        if (!a.next_billing_date) return 1;
        if (!b.next_billing_date) return -1;
        return new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
      });
  } catch (error) {
    logger.storage.error('Error reading dev subscriptions:', error);
    return [];
  }
}

/**
 * Get a single dev subscription by ID
 */
export async function getDevSubscription(id: string): Promise<SubscriptionWithCategory | null> {
  const subscriptions = await getDevSubscriptions();
  return subscriptions.find(s => s.id === id) || null;
}

/**
 * Save a new dev subscription
 */
export async function saveDevSubscription(subscription: Subscription): Promise<Subscription> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    const subscriptions: Subscription[] = data ? JSON.parse(data) : [];

    subscriptions.push(subscription);

    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));

    return subscription;
  } catch (error) {
    logger.storage.error('Error saving dev subscription:', error);
    throw error;
  }
}

/**
 * Update a dev subscription
 */
export async function updateDevSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    const subscriptions: Subscription[] = data ? JSON.parse(data) : [];

    const index = subscriptions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }

    subscriptions[index] = {
      ...subscriptions[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));

    return subscriptions[index];
  } catch (error) {
    logger.storage.error('Error updating dev subscription:', error);
    throw error;
  }
}

/**
 * Cancel a dev subscription
 */
export async function cancelDevSubscription(id: string, reason?: string): Promise<Subscription> {
  const updates: Partial<Subscription> = {
    status: 'cancelled' as SubscriptionStatus,
  };

  if (reason) {
    updates.metadata = { cancellation_reason: reason };
  }

  return updateDevSubscription(id, updates);
}

/**
 * Mark subscription as used
 */
export async function markDevSubscriptionAsUsed(id: string): Promise<void> {
  const subscription = await getDevSubscription(id);
  if (subscription) {
    await updateDevSubscription(id, {
      last_used_at: new Date().toISOString(),
      usage_count: subscription.usage_count + 1,
    });
  }
}

/**
 * Helper function to normalize amount to monthly
 */
function normalizeToMonthly(amount: number, frequency: SubscriptionFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

/**
 * Get dev subscription summary
 */
export async function getDevSubscriptionSummary(): Promise<SubscriptionSummary> {
  const subscriptions = await getDevSubscriptions();

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled');

  // Calculate totals
  let totalMonthly = 0;
  activeSubscriptions.forEach(s => {
    totalMonthly += normalizeToMonthly(s.amount, s.frequency);
  });

  // Find unused subscriptions (no activity in 30+ days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const unusedSubscriptions = activeSubscriptions.filter(
    s => s.last_used_at && new Date(s.last_used_at) < thirtyDaysAgo
  );

  // Upcoming renewals (next 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingRenewals = activeSubscriptions.filter(
    s => s.next_billing_date && new Date(s.next_billing_date) <= sevenDaysFromNow
  );

  // Potential savings from unused subscriptions
  const potentialSavings = unusedSubscriptions.reduce(
    (sum, s) => sum + normalizeToMonthly(s.amount, s.frequency),
    0
  );

  return {
    total_monthly: totalMonthly,
    total_yearly: totalMonthly * 12,
    active_count: activeSubscriptions.length,
    cancelled_count: cancelledSubscriptions.length,
    upcoming_renewals: upcomingRenewals.length,
    potential_savings: potentialSavings,
    unused_subscriptions: unusedSubscriptions,
  };
}

/**
 * Get upcoming renewals for dev subscriptions
 */
export async function getDevUpcomingRenewals(days: number = 7): Promise<Subscription[]> {
  const subscriptions = await getDevSubscriptions('active');
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  const today = new Date();

  return subscriptions.filter(s => {
    if (!s.next_billing_date) return false;
    const billingDate = new Date(s.next_billing_date);
    return billingDate >= today && billingDate <= endDate;
  });
}

/**
 * Clear all dev subscriptions (for testing)
 */
export async function clearDevSubscriptions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
}

// ============================================
// BUDGET STORAGE FUNCTIONS
// ============================================

export interface DevBudget {
  id: string;
  user_id: string;
  category_id: string;
  category: { name: string; icon: string } | null;
  amount: number;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all dev budgets from local storage
 */
export async function getDevBudgets(): Promise<DevBudget[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!data) return [];

    const budgets: DevBudget[] = JSON.parse(data);

    // Add category info to each budget
    return budgets.map(budget => {
      const categoryConfig = budget.category_id ? getCategoryById(budget.category_id) : null;
      return {
        ...budget,
        category: categoryConfig ? {
          name: categoryConfig.name,
          icon: categoryConfig.icon,
        } : null,
      };
    });
  } catch (error) {
    logger.storage.error('Error reading dev budgets:', error);
    return [];
  }
}

/**
 * Get a single dev budget by ID
 */
export async function getDevBudget(id: string): Promise<DevBudget | null> {
  const budgets = await getDevBudgets();
  return budgets.find(b => b.id === id) || null;
}

/**
 * Save a new dev budget
 */
export async function saveDevBudget(budget: Omit<DevBudget, 'category'>): Promise<DevBudget> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    const budgets: DevBudget[] = data ? JSON.parse(data) : [];

    // Check if budget for this category already exists
    const existingIndex = budgets.findIndex(b => b.category_id === budget.category_id);
    if (existingIndex !== -1) {
      // Update existing budget
      budgets[existingIndex] = {
        ...budgets[existingIndex],
        ...budget,
        updated_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));

      const categoryConfig = budget.category_id ? getCategoryById(budget.category_id) : null;
      return {
        ...budgets[existingIndex],
        category: categoryConfig ? { name: categoryConfig.name, icon: categoryConfig.icon } : null,
      };
    }

    // Add category info
    const categoryConfig = budget.category_id ? getCategoryById(budget.category_id) : null;
    const budgetWithCategory: DevBudget = {
      ...budget,
      category: categoryConfig ? { name: categoryConfig.name, icon: categoryConfig.icon } : null,
    };

    budgets.push(budgetWithCategory);

    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));

    return budgetWithCategory;
  } catch (error) {
    logger.storage.error('Error saving dev budget:', error);
    throw error;
  }
}

/**
 * Update a dev budget
 */
export async function updateDevBudget(id: string, updates: Partial<DevBudget>): Promise<DevBudget> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    const budgets: DevBudget[] = data ? JSON.parse(data) : [];

    const index = budgets.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Budget not found');
    }

    budgets[index] = {
      ...budgets[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));

    return budgets[index];
  } catch (error) {
    logger.storage.error('Error updating dev budget:', error);
    throw error;
  }
}

/**
 * Delete a dev budget
 */
export async function deleteDevBudget(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    const budgets: DevBudget[] = data ? JSON.parse(data) : [];

    const filtered = budgets.filter(b => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filtered));
  } catch (error) {
    logger.storage.error('Error deleting dev budget:', error);
    throw error;
  }
}

/**
 * Clear all dev budgets (for testing)
 */
export async function clearDevBudgets(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.BUDGETS);
}

// ============================================
// GOAL STORAGE FUNCTIONS
// ============================================

export interface DevGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  icon: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

/**
 * Get all dev goals from local storage
 */
export async function getDevGoals(): Promise<DevGoal[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) return [];

    const goals: DevGoal[] = JSON.parse(data);
    return goals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    logger.storage.error('Error reading dev goals:', error);
    return [];
  }
}

/**
 * Get a single dev goal by ID
 */
export async function getDevGoal(id: string): Promise<DevGoal | null> {
  const goals = await getDevGoals();
  return goals.find(g => g.id === id) || null;
}

/**
 * Save a new dev goal
 */
export async function saveDevGoal(goal: DevGoal): Promise<DevGoal> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: DevGoal[] = data ? JSON.parse(data) : [];

    goals.push(goal);

    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));

    return goal;
  } catch (error) {
    logger.storage.error('Error saving dev goal:', error);
    throw error;
  }
}

/**
 * Update a dev goal
 */
export async function updateDevGoal(id: string, updates: Partial<DevGoal>): Promise<DevGoal> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: DevGoal[] = data ? JSON.parse(data) : [];

    const index = goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Goal not found');
    }

    goals[index] = {
      ...goals[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));

    return goals[index];
  } catch (error) {
    logger.storage.error('Error updating dev goal:', error);
    throw error;
  }
}

/**
 * Delete a dev goal
 */
export async function deleteDevGoal(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: DevGoal[] = data ? JSON.parse(data) : [];

    const filtered = goals.filter(g => g.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
  } catch (error) {
    logger.storage.error('Error deleting dev goal:', error);
    throw error;
  }
}

/**
 * Add amount to a goal's current_amount
 */
export async function addToDevGoal(id: string, amount: number): Promise<DevGoal> {
  const goal = await getDevGoal(id);
  if (!goal) throw new Error('Goal not found');

  const newAmount = goal.current_amount + amount;
  const newStatus = newAmount >= goal.target_amount ? 'completed' : goal.status;

  return updateDevGoal(id, {
    current_amount: newAmount,
    status: newStatus,
  });
}

/**
 * Clear all dev goals (for testing)
 */
export async function clearDevGoals(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.GOALS);
}

// ============================================
// DEBT STORAGE FUNCTIONS
// ============================================

export interface DevDebt {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  original_balance: number; // Balance at time of creation, used for progress tracking
  interest_rate: number;
  minimum_payment: number;
  icon: string;
  status: 'active' | 'paid_off';
  created_at: string;
  updated_at: string;
}

/**
 * Get all dev debts from local storage
 * Auto-fills original_balance for backward compatibility with older debts
 */
export async function getDevDebts(): Promise<DevDebt[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
    if (!data) return [];

    const debts: DevDebt[] = JSON.parse(data);

    // Auto-fill original_balance for backward compatibility
    const debtsWithOriginalBalance = debts.map(d => ({
      ...d,
      original_balance: d.original_balance ?? d.balance, // Use balance as fallback
    }));

    return debtsWithOriginalBalance.filter(d => d.status === 'active').sort((a, b) => b.balance - a.balance);
  } catch (error) {
    logger.storage.error('Error reading dev debts:', error);
    return [];
  }
}

/**
 * Get a single dev debt by ID
 */
export async function getDevDebt(id: string): Promise<DevDebt | null> {
  const debts = await getDevDebts();
  return debts.find(d => d.id === id) || null;
}

/**
 * Save a new dev debt
 */
export async function saveDevDebt(debt: DevDebt): Promise<DevDebt> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
    const debts: DevDebt[] = data ? JSON.parse(data) : [];

    debts.push(debt);

    await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));

    return debt;
  } catch (error) {
    logger.storage.error('Error saving dev debt:', error);
    throw error;
  }
}

/**
 * Update a dev debt
 */
export async function updateDevDebt(id: string, updates: Partial<DevDebt>): Promise<DevDebt> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
    const debts: DevDebt[] = data ? JSON.parse(data) : [];

    const index = debts.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Debt not found');
    }

    debts[index] = {
      ...debts[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));

    return debts[index];
  } catch (error) {
    logger.storage.error('Error updating dev debt:', error);
    throw error;
  }
}

/**
 * Delete a dev debt
 */
export async function deleteDevDebt(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
    const debts: DevDebt[] = data ? JSON.parse(data) : [];

    const filtered = debts.filter(d => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(filtered));
  } catch (error) {
    logger.storage.error('Error deleting dev debt:', error);
    throw error;
  }
}

/**
 * Clear all dev debts (for testing)
 */
export async function clearDevDebts(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.DEBTS);
}

// ============================================
// ASSET STORAGE FUNCTIONS
// ============================================

export interface DevAsset {
  id: string;
  user_id: string;
  name: string;
  category: string;
  value: number;
  icon: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all dev assets from local storage
 */
export async function getDevAssets(): Promise<DevAsset[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
    if (!data) return [];

    const assets: DevAsset[] = JSON.parse(data);
    return assets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    logger.storage.error('Error reading dev assets:', error);
    return [];
  }
}

/**
 * Save a new dev asset
 */
export async function saveDevAsset(asset: DevAsset): Promise<DevAsset> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
    const assets: DevAsset[] = data ? JSON.parse(data) : [];

    assets.push(asset);

    await AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));

    return asset;
  } catch (error) {
    logger.storage.error('Error saving dev asset:', error);
    throw error;
  }
}

/**
 * Delete a dev asset
 */
export async function deleteDevAsset(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
    const assets: DevAsset[] = data ? JSON.parse(data) : [];

    const filtered = assets.filter(a => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(filtered));
  } catch (error) {
    logger.storage.error('Error deleting dev asset:', error);
    throw error;
  }
}

/**
 * Clear all dev assets (for testing)
 */
export async function clearDevAssets(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ASSETS);
}

// ============================================
// LIABILITY STORAGE FUNCTIONS
// ============================================

export interface DevLiability {
  id: string;
  user_id: string;
  name: string;
  category: string;
  value: number;
  icon: string;
  interest_rate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all dev liabilities from local storage
 */
export async function getDevLiabilities(): Promise<DevLiability[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIABILITIES);
    if (!data) return [];

    const liabilities: DevLiability[] = JSON.parse(data);
    return liabilities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    logger.storage.error('Error reading dev liabilities:', error);
    return [];
  }
}

/**
 * Save a new dev liability
 */
export async function saveDevLiability(liability: DevLiability): Promise<DevLiability> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIABILITIES);
    const liabilities: DevLiability[] = data ? JSON.parse(data) : [];

    liabilities.push(liability);

    await AsyncStorage.setItem(STORAGE_KEYS.LIABILITIES, JSON.stringify(liabilities));

    return liability;
  } catch (error) {
    logger.storage.error('Error saving dev liability:', error);
    throw error;
  }
}

/**
 * Delete a dev liability
 */
export async function deleteDevLiability(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIABILITIES);
    const liabilities: DevLiability[] = data ? JSON.parse(data) : [];

    const filtered = liabilities.filter(l => l.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.LIABILITIES, JSON.stringify(filtered));
  } catch (error) {
    logger.storage.error('Error deleting dev liability:', error);
    throw error;
  }
}

/**
 * Clear all dev liabilities (for testing)
 */
export async function clearDevLiabilities(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.LIABILITIES);
}

// ============================================
// NET WORTH SNAPSHOT FUNCTIONS
// ============================================

export interface DevNetWorthSnapshot {
  id: string;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD format for monthly snapshots)
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  created_at: string;
}

/**
 * Get all net worth snapshots from local storage
 */
export async function getDevNetWorthSnapshots(): Promise<DevNetWorthSnapshot[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS);
    if (!data) return [];

    const snapshots: DevNetWorthSnapshot[] = JSON.parse(data);
    return snapshots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    logger.storage.error('Error reading net worth snapshots:', error);
    return [];
  }
}

/**
 * Save a net worth snapshot
 * Only one snapshot per month - updates if exists, creates if not
 */
export async function saveDevNetWorthSnapshot(snapshot: Omit<DevNetWorthSnapshot, 'id' | 'created_at'>): Promise<DevNetWorthSnapshot> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS);
    const snapshots: DevNetWorthSnapshot[] = data ? JSON.parse(data) : [];

    // Get year-month from the date for deduplication
    const snapshotMonth = snapshot.date.substring(0, 7); // YYYY-MM

    // Check if snapshot for this month already exists
    const existingIndex = snapshots.findIndex(s => s.date.startsWith(snapshotMonth));

    const newSnapshot: DevNetWorthSnapshot = {
      ...snapshot,
      id: existingIndex >= 0 ? snapshots[existingIndex].id : `nw_snapshot_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing snapshot
      snapshots[existingIndex] = newSnapshot;
    } else {
      // Add new snapshot
      snapshots.push(newSnapshot);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, JSON.stringify(snapshots));
    return newSnapshot;
  } catch (error) {
    logger.storage.error('Error saving net worth snapshot:', error);
    throw error;
  }
}

/**
 * Get net worth snapshot for a specific date (or closest previous)
 */
export async function getDevNetWorthSnapshotForDate(targetDate: Date): Promise<DevNetWorthSnapshot | null> {
  const snapshots = await getDevNetWorthSnapshots();
  if (snapshots.length === 0) return null;

  const targetTime = targetDate.getTime();

  // Find the closest snapshot on or before the target date
  let closestSnapshot: DevNetWorthSnapshot | null = null;
  for (const snapshot of snapshots) {
    const snapshotTime = new Date(snapshot.date).getTime();
    if (snapshotTime <= targetTime) {
      closestSnapshot = snapshot;
    } else {
      break; // Snapshots are sorted, so we can stop here
    }
  }

  return closestSnapshot;
}

/**
 * Get net worth snapshot for start of year
 */
export async function getDevStartOfYearNetWorthSnapshot(year: number = new Date().getFullYear()): Promise<DevNetWorthSnapshot | null> {
  const startOfYear = new Date(year, 0, 1);
  return getDevNetWorthSnapshotForDate(startOfYear);
}

/**
 * Auto-save current net worth as a snapshot (call this when assets/liabilities change)
 */
export async function autoSaveNetWorthSnapshot(): Promise<DevNetWorthSnapshot> {
  const [assets, liabilities] = await Promise.all([
    getDevAssets(),
    getDevLiabilities(),
  ]);

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  return saveDevNetWorthSnapshot({
    user_id: 'dev_user',
    date: dateStr,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    net_worth: netWorth,
  });
}

/**
 * Clear all net worth snapshots (for testing)
 */
export async function clearDevNetWorthSnapshots(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS);
}

// ============================================
// BILL STORAGE FUNCTIONS
// ============================================

export interface DevBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: number; // day of month
  category: string;
  icon: string;
  is_paid: boolean;
  frequency: 'monthly' | 'weekly' | 'yearly' | 'one_time';
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all dev bills from local storage
 */
export async function getDevBills(): Promise<DevBill[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    if (!data) return [];

    const bills: DevBill[] = JSON.parse(data);
    return bills.sort((a, b) => a.due_date - b.due_date);
  } catch (error) {
    logger.storage.error('Error reading dev bills:', error);
    return [];
  }
}

/**
 * Get a single dev bill by ID
 */
export async function getDevBill(id: string): Promise<DevBill | null> {
  const bills = await getDevBills();
  return bills.find(b => b.id === id) || null;
}

/**
 * Save a new dev bill
 */
export async function saveDevBill(bill: DevBill): Promise<DevBill> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    const bills: DevBill[] = data ? JSON.parse(data) : [];

    bills.push(bill);

    await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));

    return bill;
  } catch (error) {
    logger.storage.error('Error saving dev bill:', error);
    throw error;
  }
}

/**
 * Update a dev bill
 */
export async function updateDevBill(id: string, updates: Partial<DevBill>): Promise<DevBill> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    const bills: DevBill[] = data ? JSON.parse(data) : [];

    const index = bills.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Bill not found');
    }

    bills[index] = {
      ...bills[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));

    return bills[index];
  } catch (error) {
    logger.storage.error('Error updating dev bill:', error);
    throw error;
  }
}

/**
 * Delete a dev bill
 */
export async function deleteDevBill(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    const bills: DevBill[] = data ? JSON.parse(data) : [];

    const filtered = bills.filter(b => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(filtered));
  } catch (error) {
    logger.storage.error('Error deleting dev bill:', error);
    throw error;
  }
}

/**
 * Clear all dev bills (for testing)
 */
export async function clearDevBills(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.BILLS);
}

// ============================================
// HOUSEHOLD STORAGE FUNCTIONS
// ============================================

export interface DevHousehold {
  id: string;
  name: string;
  currency: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DevHouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  can_view_transactions: boolean;
  can_add_transactions: boolean;
  can_edit_budgets: boolean;
  can_manage_members: boolean;
  joined_at: string;
  user?: {
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

/**
 * Get all dev households from local storage
 */
export async function getDevHouseholds(): Promise<DevHousehold[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLDS);
    if (!data) return [];

    const households: DevHousehold[] = JSON.parse(data);
    return households.filter(h => h.is_active).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    logger.storage.error('Error reading dev households:', error);
    return [];
  }
}

/**
 * Get a single dev household by ID
 */
export async function getDevHousehold(id: string): Promise<DevHousehold | null> {
  const households = await getDevHouseholds();
  return households.find(h => h.id === id) || null;
}

/**
 * Save a new dev household
 */
export async function saveDevHousehold(household: Omit<DevHousehold, 'id' | 'created_at' | 'updated_at'>): Promise<DevHousehold> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLDS);
    const households: DevHousehold[] = data ? JSON.parse(data) : [];

    const now = new Date().toISOString();
    const newHousehold: DevHousehold = {
      ...household,
      id: `household_${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    households.push(newHousehold);
    await AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(households));

    // Also create the owner member record
    await saveDevHouseholdMember({
      household_id: newHousehold.id,
      user_id: household.created_by,
      role: 'owner',
      can_view_transactions: true,
      can_add_transactions: true,
      can_edit_budgets: true,
      can_manage_members: true,
      user: {
        display_name: 'You',
        email: 'dev@spendtrak.app',
      },
    });

    return newHousehold;
  } catch (error) {
    logger.storage.error('Error saving dev household:', error);
    throw error;
  }
}

/**
 * Update a dev household
 */
export async function updateDevHousehold(id: string, updates: Partial<DevHousehold>): Promise<DevHousehold> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLDS);
    const households: DevHousehold[] = data ? JSON.parse(data) : [];

    const index = households.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error('Household not found');
    }

    households[index] = {
      ...households[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(households));
    return households[index];
  } catch (error) {
    logger.storage.error('Error updating dev household:', error);
    throw error;
  }
}

/**
 * Delete a dev household (soft delete)
 */
export async function deleteDevHousehold(id: string): Promise<void> {
  try {
    await updateDevHousehold(id, { is_active: false });
  } catch (error) {
    logger.storage.error('Error deleting dev household:', error);
    throw error;
  }
}

/**
 * Get all members of a household
 */
export async function getDevHouseholdMembers(householdId: string): Promise<DevHouseholdMember[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLD_MEMBERS);
    if (!data) return [];

    const members: DevHouseholdMember[] = JSON.parse(data);
    return members.filter(m => m.household_id === householdId);
  } catch (error) {
    logger.storage.error('Error reading dev household members:', error);
    return [];
  }
}

/**
 * Save a new household member
 */
export async function saveDevHouseholdMember(member: Omit<DevHouseholdMember, 'id' | 'joined_at'>): Promise<DevHouseholdMember> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLD_MEMBERS);
    const members: DevHouseholdMember[] = data ? JSON.parse(data) : [];

    const newMember: DevHouseholdMember = {
      ...member,
      id: `member_${Date.now()}`,
      joined_at: new Date().toISOString(),
    };

    members.push(newMember);
    await AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLD_MEMBERS, JSON.stringify(members));

    return newMember;
  } catch (error) {
    logger.storage.error('Error saving dev household member:', error);
    throw error;
  }
}

/**
 * Remove a household member
 */
export async function deleteDevHouseholdMember(memberId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLD_MEMBERS);
    const members: DevHouseholdMember[] = data ? JSON.parse(data) : [];

    const filtered = members.filter(m => m.id !== memberId);
    await AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLD_MEMBERS, JSON.stringify(filtered));
  } catch (error) {
    logger.storage.error('Error deleting dev household member:', error);
    throw error;
  }
}

/**
 * Get current user's membership in a household
 */
export async function getDevMyMembership(householdId: string, userId: string = 'dev_user'): Promise<DevHouseholdMember | null> {
  const members = await getDevHouseholdMembers(householdId);
  return members.find(m => m.user_id === userId) || null;
}

/**
 * Clear all dev households (for testing)
 */
export async function clearDevHouseholds(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.HOUSEHOLDS);
  await AsyncStorage.removeItem(STORAGE_KEYS.HOUSEHOLD_MEMBERS);
}

/**
 * Clear ALL dev data (for debugging/reset)
 * Use with caution - this removes all local data
 */
export async function clearAllDevData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.BUDGETS),
    AsyncStorage.removeItem(STORAGE_KEYS.GOALS),
    AsyncStorage.removeItem(STORAGE_KEYS.DEBTS),
    AsyncStorage.removeItem(STORAGE_KEYS.ASSETS),
    AsyncStorage.removeItem(STORAGE_KEYS.LIABILITIES),
    AsyncStorage.removeItem(STORAGE_KEYS.BILLS),
    AsyncStorage.removeItem(STORAGE_KEYS.HOUSEHOLDS),
    AsyncStorage.removeItem(STORAGE_KEYS.HOUSEHOLD_MEMBERS),
    AsyncStorage.removeItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS),
  ]);
  logger.storage.info('All dev data cleared');
}

/**
 * Get debug info about all stored dev data
 * Useful for debugging data sync issues
 */
export async function getDevDataDebugInfo(): Promise<{
  transactions: number;
  subscriptions: number;
  budgets: number;
  goals: number;
  debts: number;
  assets: number;
  liabilities: number;
  bills: number;
  households: number;
  netWorthSnapshots: number;
}> {
  const [transactions, subscriptions, budgets, goals, debts, assets, liabilities, bills, households, netWorthSnapshots] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
    AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS),
    AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
    AsyncStorage.getItem(STORAGE_KEYS.GOALS),
    AsyncStorage.getItem(STORAGE_KEYS.DEBTS),
    AsyncStorage.getItem(STORAGE_KEYS.ASSETS),
    AsyncStorage.getItem(STORAGE_KEYS.LIABILITIES),
    AsyncStorage.getItem(STORAGE_KEYS.BILLS),
    AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLDS),
    AsyncStorage.getItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS),
  ]);

  return {
    transactions: transactions ? JSON.parse(transactions).length : 0,
    subscriptions: subscriptions ? JSON.parse(subscriptions).length : 0,
    budgets: budgets ? JSON.parse(budgets).length : 0,
    goals: goals ? JSON.parse(goals).length : 0,
    debts: debts ? JSON.parse(debts).length : 0,
    assets: assets ? JSON.parse(assets).length : 0,
    liabilities: liabilities ? JSON.parse(liabilities).length : 0,
    bills: bills ? JSON.parse(bills).length : 0,
    households: households ? JSON.parse(households).length : 0,
    netWorthSnapshots: netWorthSnapshots ? JSON.parse(netWorthSnapshots).length : 0,
  };
}

export default {
  // Transaction functions
  getDevTransactions,
  getDevTransaction,
  saveDevTransaction,
  updateDevTransaction,
  deleteDevTransaction,
  getDevMonthlySummary,
  getDevSpendingTrend,
  searchDevTransactions,
  getDevTopMerchants,
  clearDevTransactions,
  migrateDevTransactionsType,
  // Subscription functions
  getDevSubscriptions,
  getDevSubscription,
  saveDevSubscription,
  updateDevSubscription,
  cancelDevSubscription,
  markDevSubscriptionAsUsed,
  getDevSubscriptionSummary,
  getDevUpcomingRenewals,
  clearDevSubscriptions,
  // Budget functions
  getDevBudgets,
  getDevBudget,
  saveDevBudget,
  updateDevBudget,
  deleteDevBudget,
  clearDevBudgets,
  // Goal functions
  getDevGoals,
  getDevGoal,
  saveDevGoal,
  updateDevGoal,
  deleteDevGoal,
  addToDevGoal,
  clearDevGoals,
  // Debt functions
  getDevDebts,
  getDevDebt,
  saveDevDebt,
  updateDevDebt,
  deleteDevDebt,
  clearDevDebts,
  // Asset functions
  getDevAssets,
  saveDevAsset,
  deleteDevAsset,
  clearDevAssets,
  // Liability functions
  getDevLiabilities,
  saveDevLiability,
  deleteDevLiability,
  clearDevLiabilities,
  // Net Worth Snapshot functions
  getDevNetWorthSnapshots,
  saveDevNetWorthSnapshot,
  getDevNetWorthSnapshotForDate,
  getDevStartOfYearNetWorthSnapshot,
  autoSaveNetWorthSnapshot,
  clearDevNetWorthSnapshots,
  // Bill functions
  getDevBills,
  getDevBill,
  saveDevBill,
  updateDevBill,
  deleteDevBill,
  clearDevBills,
  // Household functions
  getDevHouseholds,
  getDevHousehold,
  saveDevHousehold,
  updateDevHousehold,
  deleteDevHousehold,
  getDevHouseholdMembers,
  saveDevHouseholdMember,
  deleteDevHouseholdMember,
  getDevMyMembership,
  clearDevHouseholds,
  // Debug functions
  clearAllDevData,
  getDevDataDebugInfo,
};
