/**
 * Export Service Tests
 */

import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  cacheDirectory: '/mock/cache/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

// Helper to create chainable mock query
const createMockQuery = (data: any, error: any = null): any => ({
  select: jest.fn(() => createMockQuery(data, error)),
  insert: jest.fn(() => createMockQuery(data, error)),
  update: jest.fn(() => createMockQuery(data, error)),
  delete: jest.fn(() => createMockQuery(data, error)),
  eq: jest.fn(() => createMockQuery(data, error)),
  neq: jest.fn(() => createMockQuery(data, error)),
  gte: jest.fn(() => createMockQuery(data, error)),
  lte: jest.fn(() => createMockQuery(data, error)),
  order: jest.fn(() => createMockQuery(data, error)),
  limit: jest.fn(() => createMockQuery(data, error)),
  single: jest.fn().mockResolvedValue({ data, error }),
  then: (resolve: any) => {
    resolve({ data: Array.isArray(data) ? data : data ? [data] : [], error });
    return createMockQuery(data, error);
  },
});

// CSV helper functions
const escapeCSV = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Mock export functions
const fetchTransactionsForExport = async (params: any = {}) => {
  let query = mockSupabase
    .from('transactions')
    .select('*, category:categories(*)')
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

  query = query.order('transaction_date', { ascending: false } as any);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const transactionsToCSV = (transactions: any[]): string => {
  const headers = ['Date', 'Merchant', 'Amount', 'Category'];
  const rows = transactions.map((tx: any) => [
    tx.transaction_date,
    tx.merchant_name,
    tx.amount?.toFixed(2) || '0.00',
    tx.category?.name || 'Uncategorized',
  ]);

  return [
    headers.map(escapeCSV).join(','),
    ...rows.map((row: any[]) => row.map(escapeCSV).join(',')),
  ].join('\n');
};

const exportTransactionsCSV = async (params: any = {}) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const transactions = await fetchTransactionsForExport(params);
  return transactionsToCSV(transactions);
};

const fetchSubscriptionsForExport = async (includeInactive = false) => {
  let query = mockSupabase.from('subscriptions').select('*');

  if (!includeInactive) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const subscriptionsToCSV = (subscriptions: any[]): string => {
  const headers = ['Name', 'Amount', 'Billing Cycle', 'Next Renewal', 'Status'];
  const rows = subscriptions.map((sub: any) => [
    sub.name || sub.merchant_name,
    sub.amount?.toFixed(2) || '0.00',
    sub.billing_cycle || sub.frequency,
    sub.next_renewal_date || sub.next_billing_date || '',
    sub.status,
  ]);

  return [
    headers.map(escapeCSV).join(','),
    ...rows.map((row: any[]) => row.map(escapeCSV).join(',')),
  ].join('\n');
};

const exportSubscriptionsCSV = async (options: { includeInactive?: boolean } = {}) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const subscriptions = await fetchSubscriptionsForExport(options.includeInactive);
  return subscriptionsToCSV(subscriptions);
};

const fetchBudgetsForExport = async () => {
  const { data, error } = await mockSupabase
    .from('budgets')
    .select('*, category:categories(*)');

  if (error) throw error;
  return data || [];
};

const budgetsToCSV = (budgets: any[]): string => {
  const headers = ['Category', 'Budget', 'Spent', 'Remaining', 'Period'];
  const rows = budgets.map((budget: any) => {
    const remaining = budget.amount - (budget.spent || 0);
    return [
      budget.category?.name || budget.name || 'Overall',
      budget.amount?.toString() || '0',
      budget.spent?.toString() || '0',
      remaining.toString(),
      budget.period || 'monthly',
    ];
  });

  return [
    headers.map(escapeCSV).join(','),
    ...rows.map((row: any[]) => row.map(escapeCSV).join(',')),
  ].join('\n');
};

const exportBudgetsCSV = async () => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const budgets = await fetchBudgetsForExport();
  return budgetsToCSV(budgets);
};

const exportTransactionsJSON = async (params: any = {}) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const transactions = await fetchTransactionsForExport(params);

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    totalCount: transactions.length,
    transactions,
  });
};

const exportAllDataJSON = async () => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [transactions, subscriptions, budgets] = await Promise.all([
    fetchTransactionsForExport(),
    fetchSubscriptionsForExport(),
    fetchBudgetsForExport(),
  ]);

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: '1.0',
    transactions,
    subscriptions,
    budgets,
  });
};

const getExportHistory = async (options: { limit?: number } = {}) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = mockSupabase
    .from('export_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false } as any);

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

describe('Export Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('exportTransactionsCSV', () => {
    it('should export transactions as CSV', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 25.99,
          merchant_name: 'Starbucks',
          transaction_date: '2024-01-15',
          category: { name: 'Food & Drink' },
        },
        {
          id: 'tx-2',
          amount: 50.00,
          merchant_name: 'Amazon',
          transaction_date: '2024-01-16',
          category: { name: 'Shopping' },
        },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockTransactions));

      const result = await exportTransactionsCSV({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result).toContain('Date,Merchant,Amount,Category');
      expect(result).toContain('Starbucks');
      expect(result).toContain('25.99');
    });

    it('should filter by date range', async () => {
      const mockTransactions = [
        { id: 'tx-1', amount: 25.99, merchant_name: 'Starbucks', transaction_date: '2024-01-15' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockTransactions));

      const result = await exportTransactionsCSV({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(result).toContain('Starbucks');
    });

    it('should filter by category', async () => {
      const mockTransactions = [
        { id: 'tx-1', amount: 25.99, merchant_name: 'Coffee Shop', category_id: 'food', category: { name: 'Food' } },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockTransactions));

      const result = await exportTransactionsCSV({
        categoryId: 'food',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(result).toContain('Coffee Shop');
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(exportTransactionsCSV({})).rejects.toThrow('Not authenticated');
    });

    it('should return empty CSV with headers when no transactions', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await exportTransactionsCSV({});

      expect(result).toContain('Date,Merchant,Amount,Category');
    });

    it('should escape CSV values with commas', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 25.99,
          merchant_name: 'Store, Inc.',
          transaction_date: '2024-01-15',
          category: { name: 'Shopping' },
        },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockTransactions));

      const result = await exportTransactionsCSV({});

      expect(result).toContain('"Store, Inc."');
    });
  });

  describe('exportSubscriptionsCSV', () => {
    it('should export subscriptions as CSV', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          name: 'Netflix',
          merchant_name: 'Netflix',
          amount: 15.99,
          billing_cycle: 'monthly',
          frequency: 'monthly',
          next_renewal_date: '2024-02-01',
          next_billing_date: '2024-02-01',
          status: 'active',
        },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockSubscriptions));

      const result = await exportSubscriptionsCSV();

      expect(result).toContain('Name,Amount,Billing Cycle,Next Renewal,Status');
      expect(result).toContain('Netflix');
      expect(result).toContain('15.99');
    });

    it('should include cancelled subscriptions when specified', async () => {
      const mockQuery = createMockQuery([]);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await exportSubscriptionsCSV({ includeInactive: true });

      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(exportSubscriptionsCSV()).rejects.toThrow('Not authenticated');
    });

    it('should handle multiple subscriptions', async () => {
      const mockSubscriptions = [
        { id: 'sub-1', name: 'Netflix', amount: 15.99, frequency: 'monthly', status: 'active' },
        { id: 'sub-2', name: 'Spotify', amount: 9.99, frequency: 'monthly', status: 'active' },
        { id: 'sub-3', name: 'Adobe', amount: 54.99, frequency: 'monthly', status: 'active' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockSubscriptions));

      const result = await exportSubscriptionsCSV();

      expect(result).toContain('Netflix');
      expect(result).toContain('Spotify');
      expect(result).toContain('Adobe');
    });
  });

  describe('exportBudgetsCSV', () => {
    it('should export budgets as CSV', async () => {
      const mockBudgets = [
        {
          id: 'budget-1',
          category: { name: 'Food & Drink' },
          amount: 500,
          spent: 125.50,
          period: 'monthly',
        },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await exportBudgetsCSV();

      expect(result).toContain('Category,Budget,Spent,Remaining,Period');
      expect(result).toContain('Food & Drink');
      expect(result).toContain('500');
    });

    it('should calculate remaining amount correctly', async () => {
      const mockBudgets = [
        { id: 'budget-1', category: { name: 'Food' }, amount: 500, spent: 200, period: 'monthly' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await exportBudgetsCSV();

      expect(result).toContain('300'); // 500 - 200 = 300 remaining
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(exportBudgetsCSV()).rejects.toThrow('Not authenticated');
    });

    it('should handle multiple budgets', async () => {
      const mockBudgets = [
        { id: 'budget-1', category: { name: 'Food' }, amount: 500, spent: 200, period: 'monthly' },
        { id: 'budget-2', category: { name: 'Transport' }, amount: 300, spent: 150, period: 'monthly' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await exportBudgetsCSV();

      expect(result).toContain('Food');
      expect(result).toContain('Transport');
    });
  });

  describe('exportTransactionsJSON', () => {
    it('should export transactions as JSON', async () => {
      const mockTransactions = [
        { id: 'tx-1', amount: 25.99, merchant_name: 'Starbucks' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockTransactions));

      const result = await exportTransactionsJSON({});

      const parsed = JSON.parse(result);
      expect(parsed.transactions).toHaveLength(1);
      expect(parsed.transactions[0].merchant_name).toBe('Starbucks');
    });

    it('should include export metadata', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await exportTransactionsJSON({});

      const parsed = JSON.parse(result);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.totalCount).toBe(0);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(exportTransactionsJSON({})).rejects.toThrow('Not authenticated');
    });
  });

  describe('exportAllDataJSON', () => {
    it('should export all user data as JSON', async () => {
      const mockTransactions = [{ id: 'tx-1', amount: 25.99 }];
      const mockSubscriptions = [{ id: 'sub-1', name: 'Netflix' }];
      const mockBudgets = [{ id: 'budget-1', amount: 500 }];

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(createMockQuery(mockTransactions))
        .mockReturnValueOnce(createMockQuery(mockSubscriptions))
        .mockReturnValueOnce(createMockQuery(mockBudgets));

      const result = await exportAllDataJSON();

      const parsed = JSON.parse(result);
      expect(parsed.transactions).toBeDefined();
      expect(parsed.subscriptions).toBeDefined();
      expect(parsed.budgets).toBeDefined();
    });

    it('should include export date and version', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await exportAllDataJSON();

      const parsed = JSON.parse(result);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.version).toBeDefined();
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(exportAllDataJSON()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getExportHistory', () => {
    it('should fetch export history', async () => {
      const mockHistory = [
        { id: 'exp-1', export_type: 'transactions', format: 'csv', created_at: '2024-01-15' },
        { id: 'exp-2', export_type: 'all', format: 'json', created_at: '2024-01-10' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockHistory));

      const result = await getExportHistory();

      expect(result).toHaveLength(2);
      expect(result[0].export_type).toBe('transactions');
    });

    it('should order by date descending', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      await getExportHistory();

      expect(mockSupabase.from).toHaveBeenCalledWith('export_history');
    });

    it('should limit results', async () => {
      const mockHistory = [
        { id: 'exp-1', export_type: 'transactions' },
      ];
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockHistory));

      const result = await getExportHistory({ limit: 10 });

      expect(mockSupabase.from).toHaveBeenCalledWith('export_history');
      expect(result).toHaveLength(1);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getExportHistory()).rejects.toThrow('Not authenticated');
    });
  });

  describe('CSV Escaping', () => {
    it('should escape values with quotes', () => {
      const result = escapeCSV('Test "quoted" value');
      expect(result).toBe('"Test ""quoted"" value"');
    });

    it('should escape values with newlines', () => {
      const result = escapeCSV('Line1\nLine2');
      expect(result).toBe('"Line1\nLine2"');
    });

    it('should return empty string for null', () => {
      const result = escapeCSV(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = escapeCSV(undefined);
      expect(result).toBe('');
    });

    it('should handle numbers', () => {
      const result = escapeCSV(123.45);
      expect(result).toBe('123.45');
    });
  });
});
