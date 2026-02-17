/**
 * Transaction Splits Service
 * Manage splitting transactions across multiple categories
 */

import { supabase } from './supabase';
import type {
  TransactionSplit,
  TransactionSplitWithCategory,
  TransactionSplitInsert,
  TransactionSplitUpdate,
  Transaction,
} from '@/types';

/**
 * Get all splits for a transaction
 */
export async function getTransactionSplits(
  transactionId: string
): Promise<TransactionSplitWithCategory[]> {
  const { data, error } = await supabase
    .from('transaction_splits')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create a split for a transaction
 */
export async function createTransactionSplit(
  split: TransactionSplitInsert
): Promise<TransactionSplit> {
  const { data, error } = await supabase
    .from('transaction_splits')
    .insert(split)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a transaction split
 */
export async function updateTransactionSplit(
  id: string,
  updates: TransactionSplitUpdate
): Promise<TransactionSplit> {
  const { data, error } = await supabase
    .from('transaction_splits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a transaction split
 */
export async function deleteTransactionSplit(id: string): Promise<void> {
  const { error } = await supabase
    .from('transaction_splits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete all splits for a transaction
 */
export async function deleteAllTransactionSplits(
  transactionId: string
): Promise<void> {
  const { error } = await supabase
    .from('transaction_splits')
    .delete()
    .eq('transaction_id', transactionId);

  if (error) throw error;
}

/**
 * Split a transaction into multiple categories
 * @param transactionId The transaction to split
 * @param splits Array of { category_id, amount, notes? } objects
 * @returns Array of created splits
 */
export async function splitTransaction(
  transactionId: string,
  splits: Array<{ category_id: string; amount: number; notes?: string }>
): Promise<TransactionSplitWithCategory[]> {
  // First, get the original transaction to validate amounts
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('id', transactionId)
    .single();

  if (txError) throw txError;
  if (!transaction) throw new Error('Transaction not found');

  // Validate that splits sum to transaction amount
  const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const tolerance = 0.01; // Allow small floating point differences

  if (Math.abs(totalSplitAmount - transaction.amount) > tolerance) {
    throw new Error(
      `Split amounts (${totalSplitAmount.toFixed(2)}) must equal transaction amount (${transaction.amount.toFixed(2)})`
    );
  }

  // Delete any existing splits
  await deleteAllTransactionSplits(transactionId);

  // Create new splits
  const splitsToInsert: TransactionSplitInsert[] = splits.map((s) => ({
    transaction_id: transactionId,
    category_id: s.category_id,
    amount: s.amount,
    notes: s.notes || null,
  }));

  const { data, error } = await supabase
    .from('transaction_splits')
    .insert(splitsToInsert)
    .select(`
      *,
      category:categories(*)
    `);

  if (error) throw error;
  return data || [];
}

/**
 * Get transaction with its splits
 */
export async function getTransactionWithSplits(
  transactionId: string
): Promise<Transaction & { splits: TransactionSplitWithCategory[] }> {
  const [txResult, splitsResult] = await Promise.all([
    supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', transactionId)
      .single(),
    getTransactionSplits(transactionId),
  ]);

  if (txResult.error) throw txResult.error;
  if (!txResult.data) throw new Error('Transaction not found');

  return {
    ...txResult.data,
    splits: splitsResult,
  };
}

/**
 * Unsplit a transaction (remove all splits and restore original category)
 */
export async function unsplitTransaction(
  transactionId: string,
  restoreCategoryId?: string
): Promise<void> {
  // Delete all splits
  await deleteAllTransactionSplits(transactionId);

  // Optionally restore a category
  if (restoreCategoryId) {
    const { error } = await supabase
      .from('transactions')
      .update({
        category_id: restoreCategoryId,
        is_split: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) throw error;
  }
}

/**
 * Get spending by category including split transactions
 * This provides accurate category spending when transactions are split
 */
export async function getSpendingByCategoryWithSplits(
  startDate: string,
  endDate: string
): Promise<Map<string, number>> {
  const categorySpending = new Map<string, number>();

  // Get regular (non-split) transactions
  const { data: regularTx, error: regularError } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('is_deleted', false)
    .eq('is_split', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (regularError) throw regularError;

  regularTx?.forEach((tx) => {
    if (tx.category_id) {
      const current = categorySpending.get(tx.category_id) || 0;
      categorySpending.set(tx.category_id, current + Number(tx.amount));
    }
  });

  // Get split transactions with their splits
  const { data: splitTx, error: splitError } = await supabase
    .from('transactions')
    .select('id')
    .eq('is_deleted', false)
    .eq('is_split', true)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (splitError) throw splitError;

  if (splitTx && splitTx.length > 0) {
    const transactionIds = splitTx.map((t) => t.id);

    const { data: splits, error: splitsError } = await supabase
      .from('transaction_splits')
      .select('category_id, amount')
      .in('transaction_id', transactionIds);

    if (splitsError) throw splitsError;

    splits?.forEach((split) => {
      const current = categorySpending.get(split.category_id) || 0;
      categorySpending.set(split.category_id, current + Number(split.amount));
    });
  }

  return categorySpending;
}

export default {
  getTransactionSplits,
  createTransactionSplit,
  updateTransactionSplit,
  deleteTransactionSplit,
  deleteAllTransactionSplits,
  splitTransaction,
  getTransactionWithSplits,
  unsplitTransaction,
  getSpendingByCategoryWithSplits,
};
