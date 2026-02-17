/**
 * SPENDTRAK CINEMATIC EDITION - Analytics Service
 * Comprehensive analytics calculations for the Analytics dashboard
 */

import { getCurrentLocale } from '../utils/locale';
import {
  getDevTransactions,
  getDevMonthlySummary,
  getDevTopMerchants,
  getDevBudgets,
  getDevSubscriptions,
  getDevSubscriptionSummary,
  getDevGoals,
  getDevDebts,
  getDevAssets,
  getDevLiabilities,
  getDevStartOfYearNetWorthSnapshot,
  autoSaveNetWorthSnapshot,
  DevBudget,
  DevGoal,
  DevDebt,
} from './devStorage';
import { useSettingsStore } from '@/stores/settingsStore';
import { convertCurrency } from './currencyConverter';
import type { TransactionWithCategory, CategorySpending } from '@/types';

// Dev transactions have a 'type' field added by devStorage that doesn't exist on the base Transaction type.
// Use this type for all analytics functions that work with dev data.
type DevTransaction = TransactionWithCategory & { type?: string };

// ============================================
// TYPES
// ============================================

export interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface HeatmapData {
  grid: number[][]; // 4 weeks x 7 days
  maxValue: number;
  insight: string;
}

export interface MerchantData {
  rank: number;
  merchant: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface BurnRateData {
  dailyRate: number;
  projectedMonthEnd: number;
  daysElapsed: number;
  daysRemaining: number;
  vsLastMonth: number; // percentage change
  vsBudget: number; // difference from total budget
}

export interface MonthlyKPIs {
  income: number;
  expenses: number;
  net: number;
  incomeChange: number;
  expensesChange: number;
  netChange: number;
}

export interface BudgetPerformance {
  budgetId: string;
  category: string;
  categoryIcon: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
}

export interface SpendingVelocity {
  currentRate: number; // daily spending rate
  projectedTotal: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
  trendPercentage: number;
}

// ============================================
// TYPES - Period
// ============================================

export type AnalyticsPeriod = 'week' | 'month' | 'year';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDay.getDay();
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
}

/**
 * Get date range based on period type
 */
function getPeriodDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (period) {
    case 'week':
      // Last 7 days
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      // Current calendar month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      // Current calendar year
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = getStartOfMonth(now);
  }

  return { start, end };
}

/**
 * Get previous period date range for comparison
 */
function getPreviousPeriodDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
  const now = new Date();

  switch (period) {
    case 'week': {
      // Previous 7 days (7-13 days ago)
      const end = new Date(now);
      end.setDate(now.getDate() - 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'month': {
      // Previous calendar month
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'year': {
      // Previous calendar year
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    default:
      return getPeriodDateRange('month');
  }
}

// ============================================
// CASH FLOW TREND
// ============================================

/**
 * Get cash flow trend data for the specified number of months
 */
export async function getCashFlowTrend(months: number = 12): Promise<CashFlowData[]> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';
  const result: CashFlowData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const startOfMonth = getStartOfMonth(date);
    const endOfMonth = getEndOfMonth(date);

    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= startOfMonth && tDate <= endOfMonth;
    });

    let income = 0;
    let expenses = 0;

    for (const t of monthTransactions) {
      const txCurrency = t.currency || 'AED';
      let amount = Math.abs(Number(t.amount));

      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {
          // Use original amount if conversion fails
        }
      }

      // Determine if income or expense based on transaction type or amount sign
      const isIncome = t.type === 'income' || (t.type !== 'expense' && Number(t.amount) > 0);

      if (isIncome) {
        income += amount;
      } else {
        expenses += amount;
      }
    }

    result.push({
      month: date.toLocaleDateString(getCurrentLocale(), { month: 'short' }),
      income,
      expenses,
      net: income - expenses,
    });
  }

  return result;
}

// ============================================
// SPENDING HEATMAP
// ============================================

/**
 * Get spending heatmap data for the specified period
 * Returns a 4x7 grid (weeks x days) with spending intensity
 */
export async function getSpendingHeatmap(period: AnalyticsPeriod = 'month'): Promise<HeatmapData> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const { start, end } = getPeriodDateRange(period);

  // Filter to period expenses only
  const periodExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= start && tDate <= end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  // For week view, we only have 1 week of data
  // For month view, up to 4-5 weeks
  // For year view, we'll show last 4 weeks
  const monthExpenses = periodExpenses;

  // Initialize 4x7 grid (4 weeks, 7 days)
  const grid: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
  const dayCounts: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));

  for (const t of monthExpenses) {
    const tDate = new Date(t.transaction_date);
    const weekIndex = Math.min(getWeekOfMonth(tDate) - 1, 3); // Cap at 4 weeks
    const dayIndex = tDate.getDay(); // 0 = Sunday, 6 = Saturday

    let amount = Math.abs(Number(t.amount));
    const txCurrency = t.currency || 'AED';

    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {
        // Use original amount
      }
    }

    grid[weekIndex][dayIndex] += amount;
    dayCounts[weekIndex][dayIndex] += 1;
  }

  // Find max value for normalization
  let maxValue = 0;
  for (const row of grid) {
    for (const val of row) {
      maxValue = Math.max(maxValue, val);
    }
  }

  // Calculate day totals for insight
  const dayTotals = Array(7).fill(0);
  for (let day = 0; day < 7; day++) {
    for (let week = 0; week < 4; week++) {
      dayTotals[day] += grid[week][day];
    }
  }

  // Find highest spending day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let maxDayIndex = 0;
  let maxDayAmount = 0;
  dayTotals.forEach((total, index) => {
    if (total > maxDayAmount) {
      maxDayAmount = total;
      maxDayIndex = index;
    }
  });

  const insight = maxDayAmount > 0
    ? `You spend most on ${dayNames[maxDayIndex]}s`
    : 'No spending data yet this month';

  return { grid, maxValue, insight };
}

// ============================================
// TOP MERCHANTS
// ============================================

/**
 * Get top merchants with rankings for a specific period
 */
export async function getTopMerchants(limit: number = 5, period: AnalyticsPeriod = 'month'): Promise<MerchantData[]> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const { start, end } = getPeriodDateRange(period);

  // Filter to period expenses only
  const periodExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= start && tDate <= end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  // Group by merchant
  const merchantMap = new Map<string, { amount: number; count: number }>();

  for (const t of periodExpenses) {
    const merchantName = t.merchant_name_clean || t.merchant_name || 'Unknown';
    const txCurrency = t.currency || 'AED';
    let amount = Math.abs(Number(t.amount));

    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {}
    }

    const existing = merchantMap.get(merchantName) || { amount: 0, count: 0 };
    merchantMap.set(merchantName, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  }

  // Sort by amount and take top N
  const sorted = Array.from(merchantMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, limit);

  // Calculate total for percentages
  const total = sorted.reduce((sum, [_, data]) => sum + data.amount, 0);

  return sorted.map(([merchant, data], index) => ({
    rank: index + 1,
    merchant,
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
  }));
}

// ============================================
// BURN RATE
// ============================================

/**
 * Calculate daily burn rate and projections for a specific period
 */
export async function getBurnRate(period: AnalyticsPeriod = 'month'): Promise<BurnRateData> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const { start, end } = getPeriodDateRange(period);
  const previousRange = getPreviousPeriodDateRange(period);

  // Calculate days elapsed and total days in period
  const now = new Date();
  const totalDaysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysElapsed = Math.min(
    Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    totalDaysInPeriod
  );
  const daysRemaining = Math.max(0, totalDaysInPeriod - daysElapsed);

  // Filter to period expenses only
  const periodExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= start && tDate <= end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  // Calculate total expenses for current period
  let currentExpenses = 0;
  for (const t of periodExpenses) {
    const txCurrency = t.currency || 'AED';
    let amount = Math.abs(Number(t.amount));
    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {}
    }
    currentExpenses += amount;
  }

  // Filter to previous period expenses
  const prevExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= previousRange.start && tDate <= previousRange.end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  let prevTotal = 0;
  for (const t of prevExpenses) {
    const txCurrency = t.currency || 'AED';
    let amount = Math.abs(Number(t.amount));
    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {}
    }
    prevTotal += amount;
  }

  // Calculate rates
  const dailyRate = daysElapsed > 0 ? currentExpenses / daysElapsed : 0;
  const projectedPeriodEnd = dailyRate * totalDaysInPeriod;

  // Calculate change from previous period
  const prevDaysInPeriod = Math.ceil((previousRange.end.getTime() - previousRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const prevDailyRate = prevTotal / prevDaysInPeriod;
  const vsLastMonth = prevDailyRate > 0
    ? ((dailyRate - prevDailyRate) / prevDailyRate) * 100
    : 0;

  // Get total budget to compare
  const budgets = await getDevBudgets();
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const vsBudget = projectedPeriodEnd - totalBudget;

  return {
    dailyRate,
    projectedMonthEnd: projectedPeriodEnd,
    daysElapsed,
    daysRemaining,
    vsLastMonth,
    vsBudget,
  };
}

// ============================================
// PERIOD KPIs
// ============================================

/**
 * Get KPIs for a specific period with percentage changes vs previous period
 */
export async function getMonthlyKPIs(period: AnalyticsPeriod = 'month'): Promise<MonthlyKPIs> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const currentRange = getPeriodDateRange(period);
  const previousRange = getPreviousPeriodDateRange(period);

  // Filter transactions for current period
  const currentTxs = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= currentRange.start && tDate <= currentRange.end;
  });

  // Filter transactions for previous period
  const previousTxs = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= previousRange.start && tDate <= previousRange.end;
  });

  // Calculate totals for a set of transactions
  const calculateTotals = async (txs: DevTransaction[]) => {
    let income = 0;
    let expenses = 0;

    for (const t of txs) {
      const txCurrency = t.currency || 'AED';
      let amount = Math.abs(Number(t.amount));

      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {}
      }

      const isIncome = t.type === 'income' || (t.type !== 'expense' && Number(t.amount) > 0);
      if (isIncome) {
        income += amount;
      } else {
        expenses += amount;
      }
    }

    return { income, expenses, net: income - expenses };
  };

  const current = await calculateTotals(currentTxs);
  const previous = await calculateTotals(previousTxs);

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    income: current.income,
    expenses: current.expenses,
    net: current.net,
    incomeChange: calculateChange(current.income, previous.income),
    expensesChange: calculateChange(current.expenses, previous.expenses),
    netChange: calculateChange(current.net, previous.net),
  };
}

// ============================================
// BUDGET PERFORMANCE
// ============================================

/**
 * Get budget performance for all budgets
 */
export async function getBudgetPerformance(): Promise<BudgetPerformance[]> {
  const budgets = await getDevBudgets();
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const now = new Date();
  const startOfMonth = getStartOfMonth(now);
  const endOfMonth = getEndOfMonth(now);

  const result: BudgetPerformance[] = [];

  for (const budget of budgets) {
    if (!budget.is_active) continue;

    // Calculate spent for this category
    const categoryTransactions = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= startOfMonth &&
             tDate <= endOfMonth &&
             t.category_id === budget.category_id &&
             (t.type === 'expense' || Number(t.amount) < 0);
    });

    let spent = 0;
    for (const t of categoryTransactions) {
      const txCurrency = t.currency || 'AED';
      let amount = Math.abs(Number(t.amount));

      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {
          // Use original amount
        }
      }
      spent += amount;
    }

    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const status: 'safe' | 'warning' | 'danger' =
      percentage >= 100 ? 'danger' :
      percentage >= 80 ? 'warning' : 'safe';

    result.push({
      budgetId: budget.id,
      category: budget.category?.name || 'Unknown',
      categoryIcon: budget.category?.icon || 'ellipsis-horizontal-outline',
      spent,
      limit: budget.amount,
      percentage,
      status,
    });
  }

  // Sort by percentage descending (highest usage first)
  return result.sort((a, b) => b.percentage - a.percentage);
}

// ============================================
// SPENDING VELOCITY
// ============================================

/**
 * Calculate spending velocity and trend
 */
export async function getSpendingVelocity(): Promise<SpendingVelocity> {
  const burnRate = await getBurnRate();

  // Get daily spending for the last 7 days to determine trend
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  // Calculate spending for last 7 days
  const last7DaysExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= sevenDaysAgo && tDate <= now &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  // Calculate spending for previous 7 days
  const prev7DaysExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= fourteenDaysAgo && tDate < sevenDaysAgo &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  const sumExpenses = async (txs: DevTransaction[]) => {
    let total = 0;
    for (const t of txs) {
      let amount = Math.abs(Number(t.amount));
      const txCurrency = t.currency || 'AED';
      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {}
      }
      total += amount;
    }
    return total;
  };

  const last7Total = await sumExpenses(last7DaysExpenses);
  const prev7Total = await sumExpenses(prev7DaysExpenses);

  const last7Rate = last7Total / 7;
  const prev7Rate = prev7Total / 7;

  let trend: 'accelerating' | 'stable' | 'decelerating' = 'stable';
  let trendPercentage = 0;

  if (prev7Rate > 0) {
    trendPercentage = ((last7Rate - prev7Rate) / prev7Rate) * 100;
    if (trendPercentage > 10) trend = 'accelerating';
    else if (trendPercentage < -10) trend = 'decelerating';
  }

  return {
    currentRate: burnRate.dailyRate,
    projectedTotal: burnRate.projectedMonthEnd,
    trend,
    trendPercentage,
  };
}

// ============================================
// CATEGORY SPENDING
// ============================================

/**
 * Get spending breakdown by category for a specific period
 */
export async function getCategorySpending(period: AnalyticsPeriod = 'month'): Promise<CategorySpending[]> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const { start, end } = getPeriodDateRange(period);

  // Filter to period expenses only
  const periodExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= start && tDate <= end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  // Group by category
  const categoryMap = new Map<string, {
    category_id: string;
    category_name: string;
    category_icon: string;
    category_color: string;
    amount: number;
  }>();

  for (const t of periodExpenses) {
    const categoryId = t.category_id || 'uncategorized';
    const categoryName = t.category?.name || 'Uncategorized';
    const categoryIcon = t.category?.icon || 'ellipsis-horizontal-outline';
    const categoryColor = t.category?.color || '#888888';

    const txCurrency = t.currency || 'AED';
    let amount = Math.abs(Number(t.amount));

    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {}
    }

    const existing = categoryMap.get(categoryId);
    if (existing) {
      existing.amount += amount;
    } else {
      categoryMap.set(categoryId, {
        category_id: categoryId,
        category_name: categoryName,
        category_icon: categoryIcon,
        category_color: categoryColor,
        amount,
      });
    }
  }

  // Convert to array and sort by amount
  const result = Array.from(categoryMap.values())
    .sort((a, b) => b.amount - a.amount);

  // Calculate percentages
  const total = result.reduce((sum, cat) => sum + cat.amount, 0);

  return result.map(cat => ({
    ...cat,
    percentage: total > 0 ? (cat.amount / total) * 100 : 0,
    transaction_count: 0, // Not tracked in analytics aggregation
  }));
}

// ============================================
// GOALS PROGRESS
// ============================================

export interface GoalProgress {
  id: string;
  name: string;
  icon: string;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  estimatedDate: string | null;
  status: 'active' | 'completed' | 'paused';
}

/**
 * Get progress for all goals
 */
export async function getGoalsProgress(): Promise<GoalProgress[]> {
  const goals = await getDevGoals();

  return goals.map(goal => {
    const percentage = goal.target_amount > 0
      ? (goal.current_amount / goal.target_amount) * 100
      : 0;

    return {
      id: goal.id,
      name: goal.name,
      icon: goal.icon,
      currentAmount: goal.current_amount,
      targetAmount: goal.target_amount,
      percentage: Math.min(percentage, 100),
      estimatedDate: goal.target_date,
      status: goal.status,
    };
  });
}

// ============================================
// DEBT OVERVIEW
// ============================================

export interface DebtOverview {
  totalDebt: number;
  monthlyInterest: number;
  payoffProgress: number;
  debts: DevDebt[];
}

/**
 * Get debt overview
 */
export async function getDebtOverview(): Promise<DebtOverview> {
  const debts = await getDevDebts();

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

  // Calculate monthly interest (simple approximation)
  const monthlyInterest = debts.reduce((sum, d) => {
    const monthlyRate = d.interest_rate / 100 / 12;
    return sum + (d.balance * monthlyRate);
  }, 0);

  // For payoff progress, we'd need historical data
  // For now, use a placeholder
  const payoffProgress = 0;

  return {
    totalDebt,
    monthlyInterest,
    payoffProgress,
    debts,
  };
}

// ============================================
// NET WORTH
// ============================================

export interface NetWorthData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  change: number;
  changePercentage: number;
}

/**
 * Get net worth summary
 */
export async function getNetWorthSummary(): Promise<NetWorthData> {
  const [assets, liabilities] = await Promise.all([
    getDevAssets(),
    getDevLiabilities(),
  ]);

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  // For change tracking, we'd need historical data
  // For now, use placeholder
  const change = 0;
  const changePercentage = 0;

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    change,
    changePercentage,
  };
}

// ============================================
// SUBSCRIPTION ANALYTICS
// ============================================

export interface SubscriptionAnalytics {
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
  unusedSubscriptions: Array<{
    id: string;
    name: string;
    amount: number;
    lastUsedDays: number;
  }>;
  upcomingRenewals: Array<{
    id: string;
    name: string;
    amount: number;
    date: string;
  }>;
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
  const summary = await getDevSubscriptionSummary();
  const subscriptions = await getDevSubscriptions('active');

  // Find unused subscriptions (not used in 30+ days)
  const now = new Date();
  const unusedSubscriptions = summary.unused_subscriptions.map(sub => {
    const lastUsed = sub.last_used_at ? new Date(sub.last_used_at) : null;
    const lastUsedDays = lastUsed
      ? Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      id: sub.id,
      name: sub.display_name || sub.merchant_name,
      amount: sub.amount,
      lastUsedDays,
    };
  });

  // Upcoming renewals (next 14 days)
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(now.getDate() + 14);

  const upcomingRenewals = subscriptions
    .filter(sub => {
      if (!sub.next_billing_date) return false;
      const billingDate = new Date(sub.next_billing_date);
      return billingDate >= now && billingDate <= twoWeeksFromNow;
    })
    .map(sub => ({
      id: sub.id,
      name: sub.display_name || sub.merchant_name,
      amount: sub.amount,
      date: sub.next_billing_date!,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    monthlyTotal: summary.total_monthly,
    yearlyTotal: summary.total_yearly,
    activeCount: summary.active_count,
    unusedSubscriptions,
    upcomingRenewals,
  };
}

// ============================================
// BUDGET EFFICIENCY
// ============================================

/**
 * Calculate overall budget efficiency score
 */
export async function getBudgetEfficiency(): Promise<number> {
  const performance = await getBudgetPerformance();

  if (performance.length === 0) return 100;

  // Average of (100 - overspend percentage), capped at 0-100
  const scores = performance.map(p => {
    if (p.percentage <= 100) return 100;
    return Math.max(0, 200 - p.percentage); // Over 200% = 0 score
  });

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avgScore);
}

// ============================================
// WEEKLY ANALYTICS - DAILY BREAKDOWN
// ============================================

export interface DailyBreakdown {
  day: string;       // Day name (Mon, Tue, etc.)
  shortDay: string;  // Short name (M, T, W...)
  date: string;      // Full date string
  amount: number;    // Total spending
  count: number;     // Transaction count
}

export interface WeeklySummary {
  dailyBreakdown: DailyBreakdown[];
  highestDay: { day: string; amount: number };
  lowestDay: { day: string; amount: number };
  totalSpent: number;
  dailyAverage: number;
  transactionCount: number;
}

/**
 * Get daily spending breakdown for the current week
 */
export async function getDailyBreakdown(): Promise<WeeklySummary> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const { start, end } = getPeriodDateRange('week');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Initialize daily data for 7 days
  const dailyData: Map<string, { amount: number; count: number; date: Date }> = new Map();

  // Create entries for each day of the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyData.set(dateKey, { amount: 0, count: 0, date });
  }

  // Filter to week expenses only
  const weekExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= start && tDate <= end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  // Aggregate by day
  for (const t of weekExpenses) {
    const tDate = new Date(t.transaction_date);
    const dateKey = tDate.toISOString().split('T')[0];

    const txCurrency = t.currency || 'AED';
    let amount = Math.abs(Number(t.amount));

    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {}
    }

    const existing = dailyData.get(dateKey);
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    }
  }

  // Convert to array
  const breakdown: DailyBreakdown[] = [];
  let totalSpent = 0;
  let totalCount = 0;

  dailyData.forEach((data, dateKey) => {
    const dayOfWeek = data.date.getDay();
    breakdown.push({
      day: dayNames[dayOfWeek],
      shortDay: shortDays[dayOfWeek],
      date: dateKey,
      amount: data.amount,
      count: data.count,
    });
    totalSpent += data.amount;
    totalCount += data.count;
  });

  // Sort by date
  breakdown.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Find highest and lowest spending days (excluding days with no spending)
  const daysWithSpending = breakdown.filter(d => d.amount > 0);
  const highestDay = daysWithSpending.length > 0
    ? daysWithSpending.reduce((max, d) => d.amount > max.amount ? d : max)
    : { day: '-', amount: 0 };
  const lowestDay = daysWithSpending.length > 0
    ? daysWithSpending.reduce((min, d) => d.amount < min.amount ? d : min)
    : { day: '-', amount: 0 };

  return {
    dailyBreakdown: breakdown,
    highestDay: { day: highestDay.day, amount: highestDay.amount },
    lowestDay: { day: lowestDay.day, amount: lowestDay.amount },
    totalSpent,
    dailyAverage: breakdown.length > 0 ? totalSpent / 7 : 0,
    transactionCount: totalCount,
  };
}

// ============================================
// WEEKLY ANALYTICS - WEEK COMPARISON
// ============================================

export interface WeekComparison {
  thisWeek: {
    total: number;
    dailyAvg: number;
    transactionCount: number;
  };
  lastWeek: {
    total: number;
    dailyAvg: number;
    transactionCount: number;
  };
  change: {
    totalPercent: number;
    dailyAvgPercent: number;
    transactionPercent: number;
  };
  insight: string;
}

/**
 * Get comparison between this week and last week
 */
export async function getWeekComparison(): Promise<WeekComparison> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const currentRange = getPeriodDateRange('week');
  const previousRange = getPreviousPeriodDateRange('week');

  // Helper to calculate week totals
  const calculateWeekTotals = async (start: Date, end: Date) => {
    const weekExpenses = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= start && tDate <= end &&
             (t.type === 'expense' || Number(t.amount) < 0);
    });

    let total = 0;
    for (const t of weekExpenses) {
      const txCurrency = t.currency || 'AED';
      let amount = Math.abs(Number(t.amount));
      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {}
      }
      total += amount;
    }

    return {
      total,
      dailyAvg: total / 7,
      transactionCount: weekExpenses.length,
    };
  };

  const thisWeek = await calculateWeekTotals(currentRange.start, currentRange.end);
  const lastWeek = await calculateWeekTotals(previousRange.start, previousRange.end);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const totalChange = calculateChange(thisWeek.total, lastWeek.total);

  // Generate insight
  let insight = '';
  if (totalChange < -10) {
    insight = 'Great job! You\'re spending less than last week.';
  } else if (totalChange > 10) {
    insight = 'Heads up: You\'re spending more than last week.';
  } else {
    insight = 'Your spending is consistent with last week.';
  }

  return {
    thisWeek,
    lastWeek,
    change: {
      totalPercent: totalChange,
      dailyAvgPercent: calculateChange(thisWeek.dailyAvg, lastWeek.dailyAvg),
      transactionPercent: calculateChange(thisWeek.transactionCount, lastWeek.transactionCount),
    },
    insight,
  };
}

// ============================================
// WEEKLY ANALYTICS - WEEK PROJECTION
// ============================================

export interface WeekProjection {
  daysElapsed: number;
  daysRemaining: number;
  currentSpend: number;
  dailyAverage: number;
  projectedWeekTotal: number;
  vsLastWeek: number; // Percentage compared to last week's total
}

/**
 * Get week projection based on current spending pace
 */
export async function getWeekProjection(): Promise<WeekProjection> {
  const { start, end } = getPeriodDateRange('week');
  const previousRange = getPreviousPeriodDateRange('week');
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const now = new Date();
  const daysElapsed = Math.min(
    Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    7
  );
  const daysRemaining = 7 - daysElapsed;

  // Calculate current week spending
  const weekExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= start && tDate <= end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  let currentSpend = 0;
  for (const t of weekExpenses) {
    const txCurrency = t.currency || 'AED';
    let amount = Math.abs(Number(t.amount));
    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {}
    }
    currentSpend += amount;
  }

  const dailyAverage = daysElapsed > 0 ? currentSpend / daysElapsed : 0;
  const projectedWeekTotal = dailyAverage * 7;

  // Get last week's total for comparison
  const lastWeekExpenses = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= previousRange.start && tDate <= previousRange.end &&
           (t.type === 'expense' || Number(t.amount) < 0);
  });

  let lastWeekTotal = 0;
  for (const t of lastWeekExpenses) {
    const txCurrency = t.currency || 'AED';
    let amount = Math.abs(Number(t.amount));
    if (txCurrency !== userCurrency) {
      try {
        amount = await convertCurrency(amount, txCurrency, userCurrency);
      } catch (error) {}
    }
    lastWeekTotal += amount;
  }

  const vsLastWeek = lastWeekTotal > 0
    ? ((projectedWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
    : 0;

  return {
    daysElapsed,
    daysRemaining,
    currentSpend,
    dailyAverage,
    projectedWeekTotal,
    vsLastWeek,
  };
}

// ============================================
// YEARLY ANALYTICS - MONTH BY MONTH
// ============================================

export interface MonthlyTrend {
  month: string;      // Short month name (Jan, Feb, etc.)
  fullMonth: string;  // Full month name
  amount: number;     // Total spending
  income: number;     // Total income
  net: number;        // Net (income - expenses)
}

export interface YearlyTrend {
  months: MonthlyTrend[];
  highestMonth: { month: string; amount: number };
  lowestMonth: { month: string; amount: number };
  averageMonthly: number;
  totalSpent: number;
  totalIncome: number;
  totalSaved: number;
  savingsRate: number;
}

/**
 * Get month-by-month spending trend for the year
 */
export async function getMonthByMonthTrend(): Promise<YearlyTrend> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const months: MonthlyTrend[] = [];

  // Process each month of the year (up to current month)
  for (let m = 0; m <= currentMonth; m++) {
    const start = new Date(currentYear, m, 1);
    const end = new Date(currentYear, m + 1, 0);
    end.setHours(23, 59, 59, 999);

    const monthTxs = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= start && tDate <= end;
    });

    let income = 0;
    let expenses = 0;

    for (const t of monthTxs) {
      const txCurrency = t.currency || 'AED';
      let amount = Math.abs(Number(t.amount));

      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {}
      }

      const isIncome = t.type === 'income' || (t.type !== 'expense' && Number(t.amount) > 0);
      if (isIncome) {
        income += amount;
      } else {
        expenses += amount;
      }
    }

    months.push({
      month: monthNames[m],
      fullMonth: fullMonthNames[m],
      amount: expenses,
      income,
      net: income - expenses,
    });
  }

  // Calculate totals
  const totalSpent = months.reduce((sum, m) => sum + m.amount, 0);
  const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
  const totalSaved = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
  const averageMonthly = months.length > 0 ? totalSpent / months.length : 0;

  // Find highest and lowest spending months
  const monthsWithSpending = months.filter(m => m.amount > 0);
  const highestMonth = monthsWithSpending.length > 0
    ? monthsWithSpending.reduce((max, m) => m.amount > max.amount ? m : max)
    : { month: '-', amount: 0 };
  const lowestMonth = monthsWithSpending.length > 0
    ? monthsWithSpending.reduce((min, m) => m.amount < min.amount ? m : min)
    : { month: '-', amount: 0 };

  return {
    months,
    highestMonth: { month: highestMonth.month, amount: highestMonth.amount },
    lowestMonth: { month: lowestMonth.month, amount: lowestMonth.amount },
    averageMonthly,
    totalSpent,
    totalIncome,
    totalSaved,
    savingsRate,
  };
}

// ============================================
// YEARLY ANALYTICS - YEAR OVER YEAR
// ============================================

export interface YearOverYear {
  currentYear: {
    year: number;
    income: number;
    expenses: number;
    saved: number;
    savingsRate: number;
  };
  previousYear: {
    year: number;
    income: number;
    expenses: number;
    saved: number;
    savingsRate: number;
  };
  change: {
    incomePercent: number;
    expensesPercent: number;
    savedPercent: number;
    savingsRateChange: number; // Percentage point change
  };
  insight: string;
}

/**
 * Get year-over-year comparison
 */
export async function getYearOverYearComparison(): Promise<YearOverYear> {
  const transactions = await getDevTransactions() as DevTransaction[];
  const userCurrency = useSettingsStore.getState().currency || 'AED';

  const now = new Date();
  const currentYear = now.getFullYear();

  // Calculate year totals
  const calculateYearTotals = async (year: number) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    end.setHours(23, 59, 59, 999);

    // For current year, only count up to today
    const effectiveEnd = year === currentYear ? now : end;

    const yearTxs = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= start && tDate <= effectiveEnd;
    });

    let income = 0;
    let expenses = 0;

    for (const t of yearTxs) {
      const txCurrency = t.currency || 'AED';
      let amount = Math.abs(Number(t.amount));

      if (txCurrency !== userCurrency) {
        try {
          amount = await convertCurrency(amount, txCurrency, userCurrency);
        } catch (error) {}
      }

      const isIncome = t.type === 'income' || (t.type !== 'expense' && Number(t.amount) > 0);
      if (isIncome) {
        income += amount;
      } else {
        expenses += amount;
      }
    }

    const saved = income - expenses;
    const savingsRate = income > 0 ? (saved / income) * 100 : 0;

    return { year, income, expenses, saved, savingsRate };
  };

  const currentYearData = await calculateYearTotals(currentYear);
  const previousYearData = await calculateYearTotals(currentYear - 1);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const change = {
    incomePercent: calculateChange(currentYearData.income, previousYearData.income),
    expensesPercent: calculateChange(currentYearData.expenses, previousYearData.expenses),
    savedPercent: calculateChange(currentYearData.saved, previousYearData.saved),
    savingsRateChange: currentYearData.savingsRate - previousYearData.savingsRate,
  };

  // Generate insight
  let insight = '';
  if (change.savedPercent > 20) {
    insight = 'Excellent! Major improvement in savings this year!';
  } else if (change.expensesPercent < -10) {
    insight = 'Great job reducing your expenses compared to last year.';
  } else if (change.incomePercent > 10) {
    insight = 'Your income has grown nicely this year.';
  } else {
    insight = 'Your finances are tracking similarly to last year.';
  }

  return {
    currentYear: currentYearData,
    previousYear: previousYearData,
    change,
    insight,
  };
}

// ============================================
// YEARLY ANALYTICS - ANNUAL SUBSCRIPTIONS
// ============================================

export interface AnnualSubscription {
  id: string;
  name: string;
  monthlyAmount: number;
  yearlyAmount: number;
  category: string;
}

export interface AnnualSubscriptionsSummary {
  totalAnnual: number;
  percentOfExpenses: number;
  subscriptions: AnnualSubscription[];
}

/**
 * Get annual subscription costs
 */
export async function getAnnualSubscriptions(): Promise<AnnualSubscriptionsSummary> {
  const subscriptions = await getDevSubscriptions('active');
  const yearlyTrend = await getMonthByMonthTrend();

  const annualSubs: AnnualSubscription[] = subscriptions.map(sub => {
    let yearlyAmount = sub.amount;
    if (sub.frequency === 'monthly') {
      yearlyAmount = sub.amount * 12;
    } else if (sub.frequency === 'weekly') {
      yearlyAmount = sub.amount * 52;
    } else if (sub.frequency === 'quarterly') {
      yearlyAmount = sub.amount * 4;
    }

    return {
      id: sub.id,
      name: sub.display_name || sub.merchant_name,
      monthlyAmount: sub.frequency === 'monthly' ? sub.amount : yearlyAmount / 12,
      yearlyAmount,
      category: sub.category?.name || 'Subscriptions',
    };
  });

  // Sort by yearly amount descending
  annualSubs.sort((a, b) => b.yearlyAmount - a.yearlyAmount);

  const totalAnnual = annualSubs.reduce((sum, s) => sum + s.yearlyAmount, 0);
  const percentOfExpenses = yearlyTrend.totalSpent > 0
    ? (totalAnnual / yearlyTrend.totalSpent) * 100
    : 0;

  return {
    totalAnnual,
    percentOfExpenses,
    subscriptions: annualSubs,
  };
}

// ============================================
// YEARLY ANALYTICS - DEBT PROGRESS
// ============================================

export interface DebtProgress {
  startOfYearTotal: number;
  currentTotal: number;
  paidOff: number;
  paidOffPercent: number;
  remainingPercent: number;
  projectedPayoffDate: string | null;
}

/**
 * Get debt payoff progress for the year
 */
export async function getDebtProgressYear(): Promise<DebtProgress> {
  const debts = await getDevDebts();

  // Calculate current total
  const currentTotal = debts.reduce((sum, d) => sum + d.balance, 0);

  // For start of year, we'd need historical data
  // For now, use original_balance as a proxy
  const startOfYearTotal = debts.reduce((sum, d) => sum + (d.original_balance || d.balance), 0);

  const paidOff = Math.max(0, startOfYearTotal - currentTotal);
  const paidOffPercent = startOfYearTotal > 0 ? (paidOff / startOfYearTotal) * 100 : 0;
  const remainingPercent = 100 - paidOffPercent;

  // Calculate projected payoff date based on current pace
  let projectedPayoffDate: string | null = null;
  if (paidOff > 0 && currentTotal > 0) {
    const now = new Date();
    const monthsElapsed = now.getMonth() + 1; // Months since Jan
    const monthlyPayoffRate = paidOff / monthsElapsed;

    if (monthlyPayoffRate > 0) {
      const monthsRemaining = currentTotal / monthlyPayoffRate;
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(monthsRemaining));
      projectedPayoffDate = payoffDate.toLocaleDateString(getCurrentLocale(), { month: 'long', year: 'numeric' });
    }
  }

  return {
    startOfYearTotal,
    currentTotal,
    paidOff,
    paidOffPercent,
    remainingPercent,
    projectedPayoffDate,
  };
}

// ============================================
// YEARLY ANALYTICS - GOALS ACHIEVED
// ============================================

export interface GoalsAchievedSummary {
  completedGoals: GoalProgress[];
  inProgressGoals: GoalProgress[];
  totalSavedTowardsGoals: number;
}

/**
 * Get goals achieved/in progress for the year
 */
export async function getGoalsAchievedYear(): Promise<GoalsAchievedSummary> {
  const goals = await getGoalsProgress();

  const completedGoals = goals.filter(g => g.status === 'completed' || g.percentage >= 100);
  const inProgressGoals = goals.filter(g => g.status === 'active' && g.percentage < 100);

  const totalSavedTowardsGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return {
    completedGoals,
    inProgressGoals,
    totalSavedTowardsGoals,
  };
}

// ============================================
// YEARLY ANALYTICS - NET WORTH YEARLY
// ============================================

export interface NetWorthYearly {
  currentNetWorth: number;
  startOfYearNetWorth: number;
  growth: number;
  growthPercent: number;
  totalAssets: number;
  totalLiabilities: number;
}

/**
 * Get net worth data with yearly perspective
 * Uses historical snapshots for accurate growth calculations
 */
export async function getNetWorthYearly(): Promise<NetWorthYearly> {
  const currentSummary = await getNetWorthSummary();

  // Try to get start of year snapshot for accurate comparison
  const startOfYearSnapshot = await getDevStartOfYearNetWorthSnapshot();

  let startOfYearNetWorth: number;
  let growth: number;
  let growthPercent: number;

  if (startOfYearSnapshot) {
    // We have historical data - use it for accurate calculations
    startOfYearNetWorth = startOfYearSnapshot.net_worth;
    growth = currentSummary.netWorth - startOfYearNetWorth;
    growthPercent = startOfYearNetWorth !== 0
      ? ((currentSummary.netWorth - startOfYearNetWorth) / Math.abs(startOfYearNetWorth)) * 100
      : (currentSummary.netWorth > 0 ? 100 : 0);
  } else {
    // No historical data yet - use current as baseline (first snapshot will be created)
    startOfYearNetWorth = currentSummary.netWorth;
    growth = 0;
    growthPercent = 0;

    // Auto-save a snapshot to start tracking
    try {
      await autoSaveNetWorthSnapshot();
    } catch (error) {
      // Silently fail - not critical for display
    }
  }

  return {
    currentNetWorth: currentSummary.netWorth,
    startOfYearNetWorth,
    growth,
    growthPercent,
    totalAssets: currentSummary.totalAssets,
    totalLiabilities: currentSummary.totalLiabilities,
  };
}

export default {
  getCashFlowTrend,
  getSpendingHeatmap,
  getTopMerchants,
  getBurnRate,
  getMonthlyKPIs,
  getBudgetPerformance,
  getSpendingVelocity,
  getCategorySpending,
  getGoalsProgress,
  getDebtOverview,
  getNetWorthSummary,
  getSubscriptionAnalytics,
  getBudgetEfficiency,
  // Weekly Analytics
  getDailyBreakdown,
  getWeekComparison,
  getWeekProjection,
  // Yearly Analytics
  getMonthByMonthTrend,
  getYearOverYearComparison,
  getAnnualSubscriptions,
  getDebtProgressYear,
  getGoalsAchievedYear,
  getNetWorthYearly,
};
