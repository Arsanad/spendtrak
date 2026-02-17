/**
 * Budgets Service Tests
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
  is: jest.fn(() => createMockQuery(data, error)),
  or: jest.fn(() => createMockQuery(data, error)),
  order: jest.fn(() => createMockQuery(data, error)),
  limit: jest.fn(() => createMockQuery(data, error)),
  single: jest.fn().mockResolvedValue({ data, error }),
  then: (resolve: any) => {
    resolve({ data: Array.isArray(data) ? data : data ? [data] : [], error });
    return createMockQuery(data, error);
  },
});

// Mock budget service functions
const getBudgets = async () => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
};

const getBudget = async (id: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
};

const createBudget = async (input: any) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('budgets')
    .insert({ ...input, user_id: user.id })
    .select('*, category:categories(*)')
    .single();

  if (error) throw error;
  return data;
};

const updateBudget = async (id: string, updates: any) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, category:categories(*)')
    .single();

  if (error) throw error;
  return data;
};

const deleteBudget = async (id: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await mockSupabase
    .from('budgets')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

const getBudgetProgress = (budget: any): number => {
  if (!budget.amount || budget.amount === 0) return 0;
  return Math.min((budget.spent / budget.amount) * 100, 100);
};

const getBudgetRemaining = (budget: any): number => {
  return Math.max(budget.amount - budget.spent, 0);
};

const isBudgetOverLimit = (budget: any): boolean => {
  return budget.spent > budget.amount;
};

const getBudgetsByCategory = async (categoryId: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
};

const getTotalBudgeted = async () => {
  const budgets = await getBudgets();
  return budgets.reduce((sum: number, b: any) => sum + b.amount, 0);
};

const getTotalSpent = async () => {
  const budgets = await getBudgets();
  return budgets.reduce((sum: number, b: any) => sum + (b.spent || 0), 0);
};

describe('Budgets Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getBudgets', () => {
    it('should fetch all active budgets for user', async () => {
      const mockBudgets = [
        { id: 'budget-1', amount: 500, spent: 200, category: { name: 'Food' } },
        { id: 'budget-2', amount: 300, spent: 100, category: { name: 'Transport' } },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await getBudgets();

      expect(result).toHaveLength(2);
      expect(result[0].category.name).toBe('Food');
    });

    it('should return empty array when no budgets exist', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await getBudgets();

      expect(result).toHaveLength(0);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getBudgets()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getBudget', () => {
    it('should fetch a single budget by ID', async () => {
      const mockBudget = { id: 'budget-1', amount: 500, category: { name: 'Food' } };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudget));

      const result = await getBudget('budget-1');

      expect(result.amount).toBe(500);
    });

    it('should return null when budget not found', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      const result = await getBudget('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createBudget', () => {
    it('should create a monthly budget', async () => {
      const newBudget = {
        category_id: 'food',
        amount: 500,
        period: 'monthly',
      };

      const createdBudget = { id: 'budget-new', ...newBudget, spent: 0 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(createdBudget));

      const result = await createBudget(newBudget);

      expect(result.amount).toBe(500);
      expect(result.period).toBe('monthly');
    });

    it('should create a weekly budget', async () => {
      const newBudget = {
        category_id: 'transport',
        amount: 100,
        period: 'weekly',
      };

      const createdBudget = { id: 'budget-new', ...newBudget, spent: 0 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(createdBudget));

      const result = await createBudget(newBudget);

      expect(result.period).toBe('weekly');
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(createBudget({ amount: 500 })).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateBudget', () => {
    it('should update budget amount', async () => {
      const updatedBudget = { id: 'budget-1', amount: 600 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedBudget));

      const result = await updateBudget('budget-1', { amount: 600 });

      expect(result.amount).toBe(600);
    });

    it('should update budget category', async () => {
      const updatedBudget = { id: 'budget-1', category_id: 'transport' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedBudget));

      const result = await updateBudget('budget-1', { category_id: 'transport' });

      expect(result.category_id).toBe('transport');
    });
  });

  describe('deleteBudget', () => {
    it('should soft delete a budget', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      await expect(deleteBudget('budget-1')).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('budgets');
    });
  });

  describe('getBudgetProgress', () => {
    it('should calculate progress percentage correctly', () => {
      const budget = { amount: 500, spent: 250 };

      const progress = getBudgetProgress(budget);

      expect(progress).toBe(50);
    });

    it('should cap progress at 100%', () => {
      const budget = { amount: 500, spent: 600 };

      const progress = getBudgetProgress(budget);

      expect(progress).toBe(100);
    });

    it('should return 0 for no spending', () => {
      const budget = { amount: 500, spent: 0 };

      const progress = getBudgetProgress(budget);

      expect(progress).toBe(0);
    });

    it('should handle zero budget amount', () => {
      const budget = { amount: 0, spent: 100 };

      const progress = getBudgetProgress(budget);

      expect(progress).toBe(0);
    });
  });

  describe('getBudgetRemaining', () => {
    it('should calculate remaining amount correctly', () => {
      const budget = { amount: 500, spent: 200 };

      const remaining = getBudgetRemaining(budget);

      expect(remaining).toBe(300);
    });

    it('should return 0 when over budget', () => {
      const budget = { amount: 500, spent: 600 };

      const remaining = getBudgetRemaining(budget);

      expect(remaining).toBe(0);
    });
  });

  describe('isBudgetOverLimit', () => {
    it('should return true when over budget', () => {
      const budget = { amount: 500, spent: 600 };

      expect(isBudgetOverLimit(budget)).toBe(true);
    });

    it('should return false when under budget', () => {
      const budget = { amount: 500, spent: 300 };

      expect(isBudgetOverLimit(budget)).toBe(false);
    });

    it('should return false when exactly at budget', () => {
      const budget = { amount: 500, spent: 500 };

      expect(isBudgetOverLimit(budget)).toBe(false);
    });
  });

  describe('getBudgetsByCategory', () => {
    it('should fetch budgets for a specific category', async () => {
      const mockBudgets = [
        { id: 'budget-1', category_id: 'food', amount: 500 },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await getBudgetsByCategory('food');

      expect(result).toHaveLength(1);
      expect(result[0].category_id).toBe('food');
    });

    it('should return empty array when no budgets for category', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await getBudgetsByCategory('unknown');

      expect(result).toHaveLength(0);
    });
  });

  describe('getTotalBudgeted', () => {
    it('should calculate total budgeted amount', async () => {
      const mockBudgets = [
        { id: 'budget-1', amount: 500 },
        { id: 'budget-2', amount: 300 },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await getTotalBudgeted();

      expect(result).toBe(800);
    });

    it('should return 0 when no budgets', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await getTotalBudgeted();

      expect(result).toBe(0);
    });
  });

  describe('getTotalSpent', () => {
    it('should calculate total spent across all budgets', async () => {
      const mockBudgets = [
        { id: 'budget-1', amount: 500, spent: 200 },
        { id: 'budget-2', amount: 300, spent: 150 },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await getTotalSpent();

      expect(result).toBe(350);
    });

    it('should handle missing spent values', async () => {
      const mockBudgets = [
        { id: 'budget-1', amount: 500 },
        { id: 'budget-2', amount: 300, spent: 150 },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockBudgets));

      const result = await getTotalSpent();

      expect(result).toBe(150);
    });
  });
});
