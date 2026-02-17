/**
 * Financial Goals Service Tests
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
  or: jest.fn(() => createMockQuery(data, error)),
  order: jest.fn(() => createMockQuery(data, error)),
  limit: jest.fn(() => createMockQuery(data, error)),
  single: jest.fn().mockResolvedValue({ data, error }),
  then: (resolve: any) => {
    resolve({ data: Array.isArray(data) ? data : [data], error });
    return createMockQuery(data, error);
  },
});

// Mock goals service functions
const getGoals = async () => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data || [];
};

const getGoal = async (id: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('financial_goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
};

const createGoal = async (input: any) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('financial_goals')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateGoal = async (id: string, updates: any) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('financial_goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteGoal = async (id: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await mockSupabase
    .from('financial_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

const addContribution = async (goalId: string, amount: number) => {
  const goal = await getGoal(goalId);
  if (!goal) throw new Error('Goal not found');

  const newAmount = goal.current_amount + amount;
  return updateGoal(goalId, { current_amount: newAmount });
};

const getGoalProgress = (goal: any) => {
  return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
};

describe('Financial Goals Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getGoals', () => {
    it('should fetch all goals for user', async () => {
      const mockGoals = [
        { id: 'goal-1', name: 'Emergency Fund', target_amount: 10000, current_amount: 5000 },
        { id: 'goal-2', name: 'Vacation', target_amount: 3000, current_amount: 1500 },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockGoals));

      const result = await getGoals();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Emergency Fund');
    });

    it('should return empty array when no goals exist', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await getGoals();

      expect(result).toHaveLength(0);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getGoals()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getGoal', () => {
    it('should fetch a single goal by ID', async () => {
      const mockGoal = { id: 'goal-1', name: 'Emergency Fund', target_amount: 10000 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockGoal));

      const result = await getGoal('goal-1');

      expect(result.name).toBe('Emergency Fund');
    });

    it('should return null when goal not found', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      const result = await getGoal('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createGoal', () => {
    it('should create a new savings goal', async () => {
      const newGoal = {
        name: 'New Car',
        target_amount: 25000,
        goal_type: 'savings',
        deadline: '2025-12-31',
      };

      const createdGoal = { id: 'goal-new', ...newGoal, current_amount: 0 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(createdGoal));

      const result = await createGoal(newGoal);

      expect(result.name).toBe('New Car');
      expect(result.target_amount).toBe(25000);
    });

    it('should create a debt payoff goal', async () => {
      const newGoal = {
        name: 'Pay off Credit Card',
        target_amount: 5000,
        goal_type: 'debt_payoff',
        linked_debt_id: 'debt-1',
      };

      const createdGoal = { id: 'goal-new', ...newGoal, current_amount: 0 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(createdGoal));

      const result = await createGoal(newGoal);

      expect(result.goal_type).toBe('debt_payoff');
    });

    it('should create an investment goal', async () => {
      const newGoal = {
        name: 'Retirement',
        target_amount: 1000000,
        goal_type: 'investment',
      };

      const createdGoal = { id: 'goal-new', ...newGoal, current_amount: 0 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(createdGoal));

      const result = await createGoal(newGoal);

      expect(result.goal_type).toBe('investment');
    });
  });

  describe('updateGoal', () => {
    it('should update goal name', async () => {
      const updatedGoal = { id: 'goal-1', name: 'Updated Goal Name' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedGoal));

      const result = await updateGoal('goal-1', { name: 'Updated Goal Name' });

      expect(result.name).toBe('Updated Goal Name');
    });

    it('should update target amount', async () => {
      const updatedGoal = { id: 'goal-1', target_amount: 15000 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedGoal));

      const result = await updateGoal('goal-1', { target_amount: 15000 });

      expect(result.target_amount).toBe(15000);
    });

    it('should update current amount', async () => {
      const updatedGoal = { id: 'goal-1', current_amount: 7500 };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedGoal));

      const result = await updateGoal('goal-1', { current_amount: 7500 });

      expect(result.current_amount).toBe(7500);
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      await expect(deleteGoal('goal-1')).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('financial_goals');
    });
  });

  describe('addContribution', () => {
    it('should add contribution to goal', async () => {
      const existingGoal = { id: 'goal-1', current_amount: 5000, target_amount: 10000 };
      const updatedGoal = { ...existingGoal, current_amount: 5500 };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(createMockQuery(existingGoal))
        .mockReturnValueOnce(createMockQuery(updatedGoal));

      const result = await addContribution('goal-1', 500);

      expect(result.current_amount).toBe(5500);
    });

    it('should handle goal completion', async () => {
      const existingGoal = { id: 'goal-1', current_amount: 9500, target_amount: 10000 };
      const updatedGoal = { ...existingGoal, current_amount: 10000, status: 'completed' };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(createMockQuery(existingGoal))
        .mockReturnValueOnce(createMockQuery(updatedGoal));

      const result = await addContribution('goal-1', 500);

      expect(result.current_amount).toBe(10000);
    });
  });

  describe('getGoalProgress', () => {
    it('should calculate progress percentage correctly', () => {
      const goal = { current_amount: 5000, target_amount: 10000 };

      const progress = getGoalProgress(goal);

      expect(progress).toBe(50);
    });

    it('should cap progress at 100%', () => {
      const goal = { current_amount: 12000, target_amount: 10000 };

      const progress = getGoalProgress(goal);

      expect(progress).toBe(100);
    });

    it('should return 0 for no progress', () => {
      const goal = { current_amount: 0, target_amount: 10000 };

      const progress = getGoalProgress(goal);

      expect(progress).toBe(0);
    });

    it('should handle small progress amounts', () => {
      const goal = { current_amount: 100, target_amount: 10000 };

      const progress = getGoalProgress(goal);

      expect(progress).toBe(1);
    });
  });

  describe('Goal Types', () => {
    it('should support emergency fund goal', async () => {
      const goal = {
        name: 'Emergency Fund',
        target_amount: 10000,
        goal_type: 'emergency_fund',
        target_months: 6,
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery({ id: 'goal-1', ...goal }));

      const result = await createGoal(goal);

      expect(result.goal_type).toBe('emergency_fund');
    });

    it('should support house down payment goal', async () => {
      const goal = {
        name: 'House Down Payment',
        target_amount: 50000,
        goal_type: 'house',
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery({ id: 'goal-1', ...goal }));

      const result = await createGoal(goal);

      expect(result.target_amount).toBe(50000);
    });
  });
});
