/**
 * Export Service
 * Export transactions and data to CSV/Excel/JSON formats
 */

import * as FileSystemModule from 'expo-file-system';

// Cast to any to handle API differences across expo-file-system versions
const FileSystem = FileSystemModule as any;
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';
import type {
  TransactionWithCategory,
  Subscription,
  BudgetWithCategory,
  ExportType,
  ExportDataType,
  ExportHistoryInsert,
  TransactionListParams,
} from '@/types';

// CSV delimiter and line ending
const CSV_DELIMITER = ',';
const LINE_ENDING = '\n';

/**
 * Escape CSV field value
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains delimiter, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(CSV_DELIMITER) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert transactions to CSV string
 */
function transactionsToCSV(transactions: TransactionWithCategory[]): string {
  const headers = [
    'Date',
    'Time',
    'Merchant',
    'Category',
    'Amount',
    'Currency',
    'Type',
    'Source',
    'Card Last 4',
    'Bank',
    'Notes',
    'Is Recurring',
  ];

  const rows = transactions.map((tx) => [
    tx.transaction_date,
    tx.transaction_time || '',
    tx.merchant_name,
    tx.category?.name || 'Uncategorized',
    tx.amount.toFixed(2),
    tx.currency,
    tx.transaction_type,
    tx.source,
    tx.card_last_four || '',
    tx.bank_name || '',
    tx.notes || '',
    tx.is_recurring ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(CSV_DELIMITER),
    ...rows.map((row) => row.map(escapeCSV).join(CSV_DELIMITER)),
  ].join(LINE_ENDING);

  return csvContent;
}

/**
 * Convert subscriptions to CSV string
 */
function subscriptionsToCSV(subscriptions: Subscription[]): string {
  const headers = [
    'Name',
    'Merchant',
    'Amount',
    'Currency',
    'Frequency',
    'Status',
    'Next Billing Date',
    'Last Billing Date',
    'Auto Detected',
    'Notes',
  ];

  const rows = subscriptions.map((sub) => [
    sub.display_name || sub.merchant_name,
    sub.merchant_name,
    sub.amount.toFixed(2),
    sub.currency,
    sub.frequency,
    sub.status,
    sub.next_billing_date || '',
    sub.last_billing_date || '',
    sub.auto_detected ? 'Yes' : 'No',
    sub.notes || '',
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(CSV_DELIMITER),
    ...rows.map((row) => row.map(escapeCSV).join(CSV_DELIMITER)),
  ].join(LINE_ENDING);

  return csvContent;
}

/**
 * Convert budgets to CSV string
 */
function budgetsToCSV(budgets: BudgetWithCategory[]): string {
  const headers = [
    'Category',
    'Budget Amount',
    'Spent Amount',
    'Remaining',
    'Percentage Used',
    'Currency',
    'Period',
    'Is Active',
  ];

  const rows = budgets.map((budget) => [
    budget.category?.name || budget.name || 'Overall',
    budget.amount.toFixed(2),
    budget.spent.toFixed(2),
    budget.remaining.toFixed(2),
    `${budget.percentage}%`,
    budget.currency,
    budget.period,
    budget.is_active ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(CSV_DELIMITER),
    ...rows.map((row) => row.map(escapeCSV).join(CSV_DELIMITER)),
  ].join(LINE_ENDING);

  return csvContent;
}

/**
 * Fetch transactions for export
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
async function fetchTransactionsForExport(
  params: TransactionListParams = {}
): Promise<TransactionWithCategory[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id) // Explicit user_id filter for defense-in-depth
    .eq('is_deleted', false);

  if (params.startDate) {
    query = query.gte('transaction_date', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('transaction_date', params.endDate);
  }
  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }
  if (params.source) {
    query = query.eq('source', params.source);
  }

  query = query.order('transaction_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Fetch subscriptions for export
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
async function fetchSubscriptionsForExport(): Promise<Subscription[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id) // Explicit user_id filter for defense-in-depth
    .order('status', { ascending: true })
    .order('amount', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch budgets for export
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
async function fetchBudgetsForExport(): Promise<BudgetWithCategory[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id) // Explicit user_id filter for defense-in-depth
    .eq('is_active', true);

  if (error) throw error;

  // Calculate spent and remaining for each budget
  const budgetsWithProgress = await Promise.all(
    (data || []).map(async (budget) => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (budget.period) {
        case 'weekly':
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'monthly':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
      }

      let spentQuery = supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id) // Explicit user_id filter for defense-in-depth
        .eq('is_deleted', false)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (budget.category_id) {
        spentQuery = spentQuery.eq('category_id', budget.category_id);
      }

      const { data: txData } = await spentQuery;
      const spent = txData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage,
      };
    })
  );

  return budgetsWithProgress;
}

/**
 * Save export history to database
 */
async function saveExportHistory(
  exportType: ExportType,
  dataType: ExportDataType,
  rowCount: number,
  filters?: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const historyEntry: ExportHistoryInsert = {
    user_id: user.id,
    export_type: exportType,
    data_type: dataType,
    row_count: rowCount,
    filters: filters || null,
    file_url: null,
    file_size_bytes: null,
    expires_at: null,
  };

  await supabase.from('export_history').insert(historyEntry);
}

/**
 * Export transactions to CSV and share
 */
export async function exportTransactionsCSV(
  params: TransactionListParams = {}
): Promise<void> {
  const transactions = await fetchTransactionsForExport(params);

  if (transactions.length === 0) {
    throw new Error('No transactions to export');
  }

  const csvContent = transactionsToCSV(transactions);
  const fileName = `spendtrak_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Transactions',
      UTI: 'public.comma-separated-values-text',
    });
  }

  await saveExportHistory('csv', 'transactions', transactions.length, params as unknown as Record<string, unknown>);
}

/**
 * Export subscriptions to CSV and share
 */
export async function exportSubscriptionsCSV(): Promise<void> {
  const subscriptions = await fetchSubscriptionsForExport();

  if (subscriptions.length === 0) {
    throw new Error('No subscriptions to export');
  }

  const csvContent = subscriptionsToCSV(subscriptions);
  const fileName = `spendtrak_subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Subscriptions',
      UTI: 'public.comma-separated-values-text',
    });
  }

  await saveExportHistory('csv', 'subscriptions', subscriptions.length);
}

/**
 * Export budgets to CSV and share
 */
export async function exportBudgetsCSV(): Promise<void> {
  const budgets = await fetchBudgetsForExport();

  if (budgets.length === 0) {
    throw new Error('No budgets to export');
  }

  const csvContent = budgetsToCSV(budgets);
  const fileName = `spendtrak_budgets_${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Budgets',
      UTI: 'public.comma-separated-values-text',
    });
  }

  await saveExportHistory('csv', 'budgets', budgets.length);
}

/**
 * Export transactions to JSON and share
 */
export async function exportTransactionsJSON(
  params: TransactionListParams = {}
): Promise<void> {
  const transactions = await fetchTransactionsForExport(params);

  if (transactions.length === 0) {
    throw new Error('No transactions to export');
  }

  const jsonContent = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      dataType: 'transactions',
      count: transactions.length,
      data: transactions,
    },
    null,
    2
  );

  const fileName = `spendtrak_transactions_${new Date().toISOString().split('T')[0]}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Transactions',
      UTI: 'public.json',
    });
  }

  await saveExportHistory('json', 'transactions', transactions.length, params as unknown as Record<string, unknown>);
}

/**
 * Export all data to JSON
 */
export async function exportAllDataJSON(): Promise<void> {
  const [transactions, subscriptions, budgets] = await Promise.all([
    fetchTransactionsForExport(),
    fetchSubscriptionsForExport(),
    fetchBudgetsForExport(),
  ]);

  const totalCount = transactions.length + subscriptions.length + budgets.length;

  if (totalCount === 0) {
    throw new Error('No data to export');
  }

  const jsonContent = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      dataType: 'all',
      transactions: {
        count: transactions.length,
        data: transactions,
      },
      subscriptions: {
        count: subscriptions.length,
        data: subscriptions,
      },
      budgets: {
        count: budgets.length,
        data: budgets,
      },
    },
    null,
    2
  );

  const fileName = `spendtrak_all_data_${new Date().toISOString().split('T')[0]}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export All Data',
      UTI: 'public.json',
    });
  }

  await saveExportHistory('json', 'all', totalCount);
}

/**
 * Get export history
 * SECURITY: Explicit user_id filter for defense-in-depth (in addition to RLS)
 */
export async function getExportHistory(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('export_history')
    .select('*')
    .eq('user_id', user.id) // Explicit user_id filter for defense-in-depth
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export default {
  exportTransactionsCSV,
  exportSubscriptionsCSV,
  exportBudgetsCSV,
  exportTransactionsJSON,
  exportAllDataJSON,
  getExportHistory,
};
