/**
 * Alert Service
 * Smart alert generation and management
 */

import { supabase } from './supabase';
import type {
  Alert,
  AlertInsert,
  AlertListParams,
  AlertType,
  AlertSeverity,
  PaginatedResponse,
  TransactionWithCategory,
  Budget,
} from '@/types';

/**
 * Get all alerts for current user
 */
export async function getAlerts(
  params: AlertListParams = {}
): Promise<PaginatedResponse<Alert>> {
  const {
    page = 1,
    pageSize = 20,
    type,
    severity,
    isRead,
  } = params;

  let query = supabase
    .from('alerts')
    .select('*', { count: 'exact' })
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('alert_type', type);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }
  if (isRead !== undefined) {
    query = query.eq('is_read', isRead);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > page * pageSize,
  };
}

/**
 * Get unread alert count
 */
export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .eq('is_dismissed', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Get critical alerts
 */
export async function getCriticalAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('severity', 'critical')
    .eq('is_dismissed', false)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

/**
 * Mark alert as read
 */
export async function markAsRead(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);  // SECURITY: Add user_id verification

  if (error) throw error;
}

/**
 * Mark all alerts as read
 */
export async function markAllAsRead(): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Dismiss alert
 */
export async function dismissAlert(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('alerts')
    .update({ is_dismissed: true })
    .eq('id', id)
    .eq('user_id', user.id);  // SECURITY: Add user_id verification

  if (error) throw error;
}

/**
 * Mark alert as actioned
 */
export async function markAsActioned(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('alerts')
    .update({ is_actioned: true })
    .eq('id', id)
    .eq('user_id', user.id);  // SECURITY: Add user_id verification

  if (error) throw error;
}

/**
 * Create alert (internal use)
 */
export async function createAlert(
  alert: Omit<AlertInsert, 'user_id'>
): Promise<Alert> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('alerts')
    .insert({ ...alert, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Generate unusual spending alert
 */
export async function checkUnusualSpending(): Promise<Alert | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get current week spending by category
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: currentWeek } = await supabase
    .from('transactions')
    .select(`
      amount,
      category:categories(id, name)
    `)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .gte('transaction_date', oneWeekAgo.toISOString().split('T')[0]);

  if (!currentWeek || currentWeek.length === 0) return null;

  // Get 3-month average by category
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: historical } = await supabase
    .from('transactions')
    .select(`
      amount,
      category:categories(id, name)
    `)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])
    .lt('transaction_date', oneWeekAgo.toISOString().split('T')[0]);

  if (!historical || historical.length === 0) return null;

  // Calculate averages
  const weeklyAvgByCategory = new Map<string, number>();
  historical.forEach((t: any) => {
    if (t.category?.id) {
      const current = weeklyAvgByCategory.get(t.category.id) || 0;
      weeklyAvgByCategory.set(t.category.id, current + Number(t.amount));
    }
  });

  // Convert to weekly average (12 weeks in 3 months)
  weeklyAvgByCategory.forEach((total, catId) => {
    weeklyAvgByCategory.set(catId, total / 12);
  });

  // Compare current week
  const currentByCategory = new Map<string, { amount: number; name: string }>();
  currentWeek.forEach((t: any) => {
    if (t.category?.id) {
      const current = currentByCategory.get(t.category.id) || { amount: 0, name: t.category.name };
      current.amount += Number(t.amount);
      currentByCategory.set(t.category.id, current);
    }
  });

  // Find unusual spending (>150% of average)
  for (const [catId, current] of currentByCategory) {
    const average = weeklyAvgByCategory.get(catId) || 0;
    if (average > 0 && current.amount > average * 1.5) {
      const percentageOver = Math.round((current.amount / average - 1) * 100);

      return await createAlert({
        alert_type: 'unusual_spending',
        severity: percentageOver > 200 ? 'critical' : 'warning',
        title: `High ${current.name} spending`,
        message: `You spent $${current.amount.toFixed(0)} on ${current.name} this week — ${percentageOver}% more than your usual $${average.toFixed(0)}`,
        data: {
          category_id: catId,
          category_name: current.name,
          current_amount: current.amount,
          average_amount: average,
          percentage_over: percentageOver,
        },
      } as any);
    }
  }

  return null;
}

/**
 * Check for duplicate charges
 */
export async function checkDuplicateCharges(): Promise<Alert | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .gte('transaction_date', oneWeekAgo.toISOString().split('T')[0])
    .order('merchant_name');

  if (!transactions) return null;

  // Group by merchant + amount
  const groups = new Map<string, typeof transactions>();
  transactions.forEach((t) => {
    const key = `${t.merchant_name_clean || t.merchant_name.toLowerCase()}_${t.amount}`;
    const group = groups.get(key) || [];
    group.push(t);
    groups.set(key, group);
  });

  // Find duplicates
  for (const [key, txns] of groups) {
    if (txns.length >= 2) {
      const [first] = txns;

      return await createAlert({
        alert_type: 'duplicate_charge',
        severity: 'warning',
        title: 'Possible duplicate charge',
        message: `${first.merchant_name} charged you $${first.amount} twice in the past week`,
        action_label: 'Review transactions',
        data: {
          transaction_ids: txns.map((t) => t.id),
          merchant: first.merchant_name,
          amount: first.amount,
        },
      } as any);
    }
  }

  return null;
}

/**
 * Check budget status and create alerts
 */
export async function checkBudgetStatus(): Promise<Alert[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const alerts: Alert[] = [];

  const { data: budgets } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(id, name, icon)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!budgets) return alerts;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);

  for (const budget of budgets) {
    // Get spending for this category this month
    const { data: spending } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('category_id', budget.category_id)
      .eq('is_deleted', false)
      .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);

    const totalSpent = spending?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const percentage = Math.round((totalSpent / budget.amount) * 100);

    if (percentage >= 100) {
      // Budget exceeded
      const alert = await createAlert({
        alert_type: 'budget_exceeded',
        severity: 'critical',
        title: `${(budget as Budget & { category?: { name: string } }).category?.name || 'Category'} budget exceeded`,
        message: `You've spent $${totalSpent.toFixed(0)} of your $${budget.amount} budget (${percentage}%)`,
        data: { budget_id: budget.id, percentage, spent: totalSpent },
      } as any);
      alerts.push(alert);
    } else if (percentage >= budget.alert_threshold) {
      // Budget warning
      const remaining = budget.amount - totalSpent;
      const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

      const alert = await createAlert({
        alert_type: 'budget_warning',
        severity: 'warning',
        title: `${(budget as Budget & { category?: { name: string } }).category?.name || 'Category'} budget alert`,
        message: `You've used ${percentage}% of your budget. $${remaining.toFixed(0)} remaining for ${daysLeft} days`,
        data: { budget_id: budget.id, percentage, remaining, days_left: daysLeft },
      } as any);
      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Generate subscription renewal alerts
 */
export async function checkUpcomingRenewals(): Promise<Alert[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const alerts: Alert[] = [];

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('next_billing_date', threeDaysFromNow.toISOString().split('T')[0])
    .gte('next_billing_date', new Date().toISOString().split('T')[0]);

  if (!subscriptions) return alerts;

  for (const sub of subscriptions) {
    const daysUntil = Math.ceil(
      (new Date(sub.next_billing_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const alert = await createAlert({
      alert_type: 'subscription_renewal',
      severity: 'info',
      title: `${sub.display_name || sub.merchant_name} renews soon`,
      message: `Your ${sub.display_name || sub.merchant_name} subscription ($${sub.amount}) renews in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
      action_label: 'Manage subscription',
      related_entity_type: 'subscription',
      related_entity_id: sub.id,
      data: { subscription_id: sub.id, amount: sub.amount, days_until: daysUntil },
    } as any);
    alerts.push(alert);
  }

  return alerts;
}

export default {
  getAlerts,
  getUnreadCount,
  getCriticalAlerts,
  markAsRead,
  markAllAsRead,
  dismissAlert,
  markAsActioned,
  createAlert,
  checkUnusualSpending,
  checkDuplicateCharges,
  checkBudgetStatus,
  checkUpcomingRenewals,
};
