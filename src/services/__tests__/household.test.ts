/**
 * Household Service Tests
 */

import {
  getHouseholds,
  getHousehold,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  getHouseholdMembers,
  inviteToHousehold,
  acceptInvitation,
  getSharedBudgets,
  createSharedBudget,
  getSharedGoals,
  createSharedGoal,
  addGoalContribution,
  assignTransaction,
  getHouseholdTransactions,
  getHouseholdSpendingSummary,
} from '../household';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Helper to create chainable mock query
function createMockQuery(resolvedData: any, error: any = null) {
  const mockQuery: any = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    delete: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    in: jest.fn(() => mockQuery),
    gt: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(() => Promise.resolve({ data: resolvedData, error })),
  };
  mockQuery.then = (resolve: any) => {
    resolve({ data: resolvedData, error });
    return mockQuery;
  };
  return mockQuery;
}

describe('Household Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getHouseholds', () => {
    it('should fetch all households for user', async () => {
      const mockHouseholds = [
        {
          id: 'household-1',
          name: 'Smith Family',
          created_by: 'user-123',
          is_active: true,
        },
        {
          id: 'household-2',
          name: 'Home Budget',
          created_by: 'user-456',
          is_active: true,
        },
      ];

      const mockQuery = createMockQuery(mockHouseholds);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getHouseholds();

      expect(mockSupabase.from).toHaveBeenCalledWith('households');
      expect(result).toEqual(mockHouseholds);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getHouseholds()).rejects.toThrow('Not authenticated');
    });
  });

  describe('createHousehold', () => {
    it('should create a new household', async () => {
      const newHousehold = {
        name: 'New Family Budget',
        currency: 'USD',
        settings: {},
        is_active: true,
      };

      const createdHousehold = {
        id: 'household-new',
        created_by: 'user-123',
        ...newHousehold,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const mockQuery = createMockQuery(createdHousehold);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await createHousehold(newHousehold);

      expect(result.id).toBe('household-new');
      expect(result.name).toBe('New Family Budget');
    });
  });

  describe('updateHousehold', () => {
    it('should update a household', async () => {
      const updatedHousehold = {
        id: 'household-1',
        name: 'Updated Family Budget',
        is_active: true,
      };

      const mockQuery = createMockQuery(updatedHousehold);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await updateHousehold('household-1', { name: 'Updated Family Budget' });

      expect(result.name).toBe('Updated Family Budget');
    });
  });

  describe('deleteHousehold', () => {
    it('should soft delete a household', async () => {
      const mockQuery = createMockQuery(null);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await deleteHousehold('household-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('households');
    });
  });

  describe('getHouseholdMembers', () => {
    it('should fetch all members of a household', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          household_id: 'household-1',
          user_id: 'user-123',
          role: 'owner',
          user: { display_name: 'John Smith', email: 'john@example.com' },
        },
        {
          id: 'member-2',
          household_id: 'household-1',
          user_id: 'user-456',
          role: 'member',
          user: { display_name: 'Jane Smith', email: 'jane@example.com' },
        },
      ];

      const mockQuery = createMockQuery(mockMembers);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getHouseholdMembers('household-1');

      expect(result.length).toBe(2);
      expect(result[0].role).toBe('owner');
    });
  });

  describe('inviteToHousehold', () => {
    it('should create an invitation with unique code', async () => {
      const invitation = {
        id: 'invite-1',
        household_id: 'household-1',
        invited_by: 'user-123',
        invited_email: 'newmember@example.com',
        role: 'member',
        invite_code: 'ABC12345',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockQuery = createMockQuery(invitation);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await inviteToHousehold('household-1', 'newmember@example.com', 'member');

      expect(result.invited_email).toBe('newmember@example.com');
      expect(result.status).toBe('pending');
      expect(result.invite_code).toBeDefined();
    });
  });

  describe('acceptInvitation', () => {
    it('should accept valid invitation and add member', async () => {
      const mockInvitation = {
        id: 'invite-1',
        household_id: 'household-1',
        invited_email: 'test@example.com',
        role: 'member',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockMember = {
        id: 'member-new',
        household_id: 'household-1',
        user_id: 'user-123',
        role: 'member',
        can_view_transactions: true,
        can_add_transactions: true,
        can_edit_budgets: false,
        can_manage_members: false,
      };

      const inviteQuery = createMockQuery(mockInvitation);
      const memberQuery = createMockQuery(mockMember);
      const updateQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(inviteQuery)
        .mockReturnValueOnce(memberQuery)
        .mockReturnValueOnce(updateQuery);

      const result = await acceptInvitation('VALIDCODE');

      expect(result.household_id).toBe('household-1');
      expect(result.role).toBe('member');
    });

    it('should reject expired invitations', async () => {
      const mockInvitation = null; // No matching invitation found

      const inviteQuery = createMockQuery(mockInvitation, { message: 'Not found' });
      (mockSupabase.from as jest.Mock).mockReturnValue(inviteQuery);

      await expect(acceptInvitation('EXPIREDCODE')).rejects.toThrow('Invalid or expired invitation');
    });
  });

  describe('getSharedBudgets', () => {
    it('should fetch shared budgets with progress', async () => {
      const mockBudgets = [
        {
          id: 'budget-1',
          household_id: 'household-1',
          name: 'Groceries',
          amount: 800,
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          is_active: true,
          category: { id: 'cat-1', name: 'Food' },
        },
      ];

      const mockTransactions: any[] = [];

      const budgetsQuery = createMockQuery(mockBudgets);
      const transactionsQuery = createMockQuery(mockTransactions);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(budgetsQuery)
        .mockReturnValueOnce(transactionsQuery);

      const result = await getSharedBudgets('household-1');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Groceries');
      expect(result[0].amount).toBe(800);
    });
  });

  describe('createSharedBudget', () => {
    it('should create a shared budget', async () => {
      const newBudget = {
        household_id: 'household-1',
        name: 'Entertainment',
        amount: 300,
        period: 'monthly' as const,
        start_date: '2024-02-01',
        category_id: null,
        end_date: null,
        is_active: true,
      };

      const createdBudget = {
        id: 'budget-new',
        ...newBudget,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const mockQuery = createMockQuery(createdBudget);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await createSharedBudget(newBudget);

      expect(result.id).toBe('budget-new');
      expect(result.name).toBe('Entertainment');
    });
  });

  describe('getSharedGoals', () => {
    it('should fetch shared goals with contributions', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          household_id: 'household-1',
          name: 'Vacation Fund',
          target_amount: 5000,
          current_amount: 2000,
          target_date: '2024-06-01',
          is_completed: false,
          is_active: true,
          contributions: [
            { id: 'contrib-1', amount: 1000, user_id: 'user-123' },
            { id: 'contrib-2', amount: 1000, user_id: 'user-456' },
          ],
        },
      ];

      const mockQuery = createMockQuery(mockGoals);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getSharedGoals('household-1');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Vacation Fund');
      expect(result[0].current_amount).toBe(2000);
      expect(result[0].percentage_complete).toBe(40); // 2000/5000 * 100
    });
  });

  describe('createSharedGoal', () => {
    it('should create a shared goal', async () => {
      const newGoal = {
        household_id: 'household-1',
        name: 'Emergency Fund',
        target_amount: 10000,
        current_amount: 0,
        target_date: '2024-12-31',
        color: '#4CAF50',
        icon: 'piggy-bank',
        is_completed: false,
        is_active: true,
      };

      const createdGoal = {
        id: 'goal-new',
        ...newGoal,
        is_completed: false,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const mockQuery = createMockQuery(createdGoal);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await createSharedGoal(newGoal);

      expect(result.id).toBe('goal-new');
      expect(result.name).toBe('Emergency Fund');
      expect(result.target_amount).toBe(10000);
    });
  });

  describe('addGoalContribution', () => {
    it('should add contribution and update goal amount', async () => {
      const mockContribution = {
        id: 'contrib-new',
        goal_id: 'goal-1',
        user_id: 'user-123',
        amount: 500,
        contribution_date: new Date().toISOString(),
      };

      const insertQuery = createMockQuery(mockContribution);
      (mockSupabase.from as jest.Mock).mockReturnValue(insertQuery);
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

      const result = await addGoalContribution('goal-1', 500, 'Monthly contribution');

      expect(result.amount).toBe(500);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_shared_goal_amount', {
        p_goal_id: 'goal-1',
        p_amount: 500,
      });
    });
  });

  describe('assignTransaction', () => {
    it('should assign a transaction to a household', async () => {
      const assignment = {
        id: 'assignment-1',
        transaction_id: 'tx-1',
        household_id: 'household-1',
        is_shared: true,
        split_percentage: 100,
      };

      const mockQuery = createMockQuery(assignment);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await assignTransaction('tx-1', 'household-1', { isShared: true });

      expect(result.transaction_id).toBe('tx-1');
      expect(result.is_shared).toBe(true);
    });

    it('should assign with split percentage', async () => {
      const assignment = {
        id: 'assignment-2',
        transaction_id: 'tx-2',
        household_id: 'household-1',
        assigned_to: 'user-123',
        is_shared: false,
        split_percentage: 50,
      };

      const mockQuery = createMockQuery(assignment);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await assignTransaction('tx-2', 'household-1', {
        assignedTo: 'user-123',
        isShared: false,
        splitPercentage: 50,
      });

      expect(result.split_percentage).toBe(50);
      expect(result.assigned_to).toBe('user-123');
    });
  });

  describe('getHouseholdTransactions', () => {
    it('should fetch household transactions', async () => {
      const mockTransactions = [
        {
          id: 'assign-1',
          transaction_id: 'tx-1',
          is_shared: true,
          split_percentage: 100,
          transaction: {
            id: 'tx-1',
            amount: 50,
            description: 'Groceries',
            category: { name: 'Food' },
          },
        },
      ];

      const mockQuery = createMockQuery(mockTransactions);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getHouseholdTransactions('household-1');

      expect(result.length).toBe(1);
      expect(result[0].transaction.amount).toBe(50);
    });
  });

  describe('getHouseholdSpendingSummary', () => {
    it('should calculate spending summary by member and category', async () => {
      const mockTransactions = [
        {
          assigned_to: 'user-123',
          split_percentage: 100,
          transaction: {
            amount: 100,
            category_id: 'cat-1',
            category: { id: 'cat-1', name: 'Food' },
          },
          assigned_to_user: { display_name: 'John' },
        },
        {
          assigned_to: 'user-456',
          split_percentage: 100,
          transaction: {
            amount: 50,
            category_id: 'cat-1',
            category: { id: 'cat-1', name: 'Food' },
          },
          assigned_to_user: { display_name: 'Jane' },
        },
        {
          assigned_to: 'user-123',
          split_percentage: 50,
          transaction: {
            amount: 200,
            category_id: 'cat-2',
            category: { id: 'cat-2', name: 'Entertainment' },
          },
          assigned_to_user: { display_name: 'John' },
        },
      ];

      const mockQuery = createMockQuery(mockTransactions);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getHouseholdSpendingSummary('household-1', '2024-01-01', '2024-01-31');

      // Total: 100 + 50 + (200 * 0.5) = 250
      expect(result.total_spending).toBe(250);

      // John: 100 + 100 = 200
      expect(result.by_member.find(m => m.user_id === 'user-123')?.amount).toBe(200);

      // Jane: 50
      expect(result.by_member.find(m => m.user_id === 'user-456')?.amount).toBe(50);
    });
  });

  describe('permissions handling', () => {
    it('should set correct permissions for different roles', async () => {
      const mockInvitation = {
        id: 'invite-1',
        household_id: 'household-1',
        invited_email: 'test@example.com',
        role: 'admin',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockMember = {
        id: 'member-new',
        household_id: 'household-1',
        user_id: 'user-123',
        role: 'admin',
        can_view_transactions: true,
        can_add_transactions: true,
        can_edit_budgets: true,
        can_manage_members: true,
      };

      const inviteQuery = createMockQuery(mockInvitation);
      const memberQuery = createMockQuery(mockMember);
      const updateQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(inviteQuery)
        .mockReturnValueOnce(memberQuery)
        .mockReturnValueOnce(updateQuery);

      const result = await acceptInvitation('ADMINCODE');

      expect(result.can_edit_budgets).toBe(true);
      expect(result.can_manage_members).toBe(true);
    });
  });
});
