// SPENDTRAK - Transaction Calculations Hook
// Memoized calculations for transaction-related computations

import { useMemo } from 'react';

// Transaction type compatible with various transaction formats
interface BaseTransaction {
  id: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  category_id?: string;
  category?: string;
  transaction_type?: string;
  type?: string;
  merchant_name?: string;
  merchantName?: string;
}

type TransactionType = 'income' | 'expense' | 'purchase' | 'deposit' | 'transfer';

/**
 * Hook for computing common transaction calculations with memoization
 * Prevents expensive recalculations on every render
 */
export const useTransactionCalculations = <T extends BaseTransaction>(transactions: T[]) => {
  // Total income from all transactions
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => {
          const type = t.transaction_type || t.type;
          return type === 'income' || type === 'deposit' || t.amount > 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [transactions]
  );

  // Total expenses from all transactions
  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((t) => {
          const type = t.transaction_type || t.type;
          return type === 'expense' || type === 'purchase' || t.amount < 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [transactions]
  );

  // Net balance (income - expenses)
  const netBalance = useMemo(
    () => totalIncome - totalExpenses,
    [totalIncome, totalExpenses]
  );

  // Group transactions by category
  const byCategory = useMemo(() => {
    const grouped: Record<string, T[]> = {};
    transactions.forEach((t) => {
      const category = t.category_id || t.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(t);
    });
    return grouped;
  }, [transactions]);

  // Calculate spending per category
  const spendingByCategory = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions.forEach((t) => {
      const category = t.category_id || t.category || 'uncategorized';
      const type = t.transaction_type || t.type;
      if (type === 'expense' || type === 'purchase' || t.amount < 0) {
        spending[category] = (spending[category] || 0) + Math.abs(t.amount);
      }
    });
    return spending;
  }, [transactions]);

  // Group transactions by date (YYYY-MM-DD)
  const byDate = useMemo(() => {
    const grouped: Record<string, T[]> = {};
    transactions.forEach((t) => {
      const dateStr = t.transaction_date || t.date;
      if (dateStr) {
        const date = new Date(dateStr).toISOString().split('T')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(t);
      }
    });
    return grouped;
  }, [transactions]);

  // Group transactions by month (YYYY-MM)
  const byMonth = useMemo(() => {
    const grouped: Record<string, T[]> = {};
    transactions.forEach((t) => {
      const dateStr = t.transaction_date || t.date;
      if (dateStr) {
        const date = new Date(dateStr);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[month]) {
          grouped[month] = [];
        }
        grouped[month].push(t);
      }
    });
    return grouped;
  }, [transactions]);

  // Get transactions for the current month
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions.filter((t) => {
      const dateStr = t.transaction_date || t.date;
      if (!dateStr) return false;
      const txDate = new Date(dateStr);
      return txDate >= startOfMonth && txDate <= now;
    });
  }, [transactions]);

  // Calculate current month totals
  const currentMonthTotals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    currentMonthTransactions.forEach((t) => {
      const type = t.transaction_type || t.type;
      if (type === 'income' || type === 'deposit' || t.amount > 0) {
        income += Math.abs(t.amount);
      } else {
        expenses += Math.abs(t.amount);
      }
    });

    return {
      income,
      expenses,
      net: income - expenses,
      count: currentMonthTransactions.length,
    };
  }, [currentMonthTransactions]);

  // Get unique merchants
  const uniqueMerchants = useMemo(() => {
    const merchants = new Set<string>();
    transactions.forEach((t) => {
      const merchant = t.merchant_name || t.merchantName;
      if (merchant) {
        merchants.add(merchant);
      }
    });
    return Array.from(merchants);
  }, [transactions]);

  // Calculate spending by merchant
  const spendingByMerchant = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions.forEach((t) => {
      const merchant = t.merchant_name || t.merchantName || 'Unknown';
      const type = t.transaction_type || t.type;
      if (type === 'expense' || type === 'purchase' || t.amount < 0) {
        spending[merchant] = (spending[merchant] || 0) + Math.abs(t.amount);
      }
    });
    return spending;
  }, [transactions]);

  // Top merchants by spending (sorted)
  const topMerchants = useMemo(() => {
    return Object.entries(spendingByMerchant)
      .sort(([, a], [, b]) => b - a)
      .map(([merchant, amount]) => ({ merchant, amount }));
  }, [spendingByMerchant]);

  // Average transaction amount
  const averageTransaction = useMemo(() => {
    if (transactions.length === 0) return 0;
    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return total / transactions.length;
  }, [transactions]);

  // Sort transactions by date (most recent first)
  const sortedByDate = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.date || 0).getTime();
        const dateB = new Date(b.transaction_date || b.date || 0).getTime();
        return dateB - dateA;
      }),
    [transactions]
  );

  // Recent transactions (last N)
  const getRecentTransactions = useMemo(
    () => (count: number = 5) => sortedByDate.slice(0, count),
    [sortedByDate]
  );

  return {
    // Totals
    totalIncome,
    totalExpenses,
    netBalance,

    // Groupings
    byCategory,
    byDate,
    byMonth,
    spendingByCategory,
    spendingByMerchant,

    // Current month
    currentMonthTransactions,
    currentMonthTotals,

    // Merchants
    uniqueMerchants,
    topMerchants,

    // Utilities
    averageTransaction,
    sortedByDate,
    getRecentTransactions,

    // Raw count
    count: transactions.length,
  };
};

/**
 * Hook for filtering transactions with memoization
 */
export const useFilteredTransactions = <T extends BaseTransaction>(
  transactions: T[],
  filters: {
    type?: TransactionType;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    searchQuery?: string;
  }
) => {
  return useMemo(() => {
    let filtered = [...transactions];

    if (filters.type) {
      filtered = filtered.filter((t) => {
        const txType = t.transaction_type || t.type;
        return txType === filters.type;
      });
    }

    if (filters.categoryId) {
      filtered = filtered.filter((t) => {
        const category = t.category_id || t.category;
        return category === filters.categoryId;
      });
    }

    if (filters.startDate) {
      filtered = filtered.filter((t) => {
        const dateStr = t.transaction_date || t.date;
        if (!dateStr) return false;
        return new Date(dateStr) >= filters.startDate!;
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter((t) => {
        const dateStr = t.transaction_date || t.date;
        if (!dateStr) return false;
        return new Date(dateStr) <= filters.endDate!;
      });
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) <= filters.maxAmount!);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const merchant = (t.merchant_name || t.merchantName || '').toLowerCase();
        const category = (t.category_id || t.category || '').toLowerCase();
        return merchant.includes(query) || category.includes(query);
      });
    }

    return filtered;
  }, [
    transactions,
    filters.type,
    filters.categoryId,
    filters.startDate,
    filters.endDate,
    filters.minAmount,
    filters.maxAmount,
    filters.searchQuery,
  ]);
};

export default useTransactionCalculations;
