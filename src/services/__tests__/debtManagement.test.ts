/**
 * Debt Management Service Tests
 */

import {
  getDebts,
  getDebtSummary,
  calculatePayoffPlan,
  compareStrategies,
} from '../debtManagement';
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

// Helper to create chainable mock query
function createMockQuery(resolvedData: any) {
  const mockQuery: any = {
    select: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    single: jest.fn(() => Promise.resolve({ data: resolvedData, error: null })),
  };
  // Make the query thenable for await
  mockQuery.then = (resolve: any) => {
    resolve({ data: resolvedData, error: null });
    return mockQuery;
  };
  return mockQuery;
}

describe('Debt Management Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getDebts', () => {
    it('should fetch active debts for authenticated user', async () => {
      const mockDebts = [
        {
          id: 'debt-1',
          user_id: 'user-123',
          name: 'Credit Card',
          debt_type: 'credit_card',
          original_balance: 5000,
          current_balance: 3000,
          interest_rate: 0.1999,
          minimum_payment: 100,
          currency: 'USD',
          is_active: true,
        },
        {
          id: 'debt-2',
          user_id: 'user-123',
          name: 'Car Loan',
          debt_type: 'auto_loan',
          original_balance: 20000,
          current_balance: 15000,
          interest_rate: 0.0599,
          minimum_payment: 400,
          currency: 'USD',
          is_active: true,
        },
      ];

      const mockQuery = createMockQuery(mockDebts);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getDebts(true);

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('debts');
      expect(result).toEqual(mockDebts);
      expect(result.length).toBe(2);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getDebts()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getDebtSummary', () => {
    it('should return empty summary when no debts exist', async () => {
      const mockQuery = createMockQuery([]);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getDebtSummary();

      expect(result.total_debt).toBe(0);
      expect(result.debts_count).toBe(0);
      expect(result.monthly_interest_cost).toBe(0);
    });

    it('should calculate correct summary for multiple debts', async () => {
      const mockDebts = [
        {
          id: 'debt-1',
          current_balance: 3000,
          interest_rate: 0.20, // 20% APR
          minimum_payment: 100,
        },
        {
          id: 'debt-2',
          current_balance: 15000,
          interest_rate: 0.06, // 6% APR
          minimum_payment: 400,
        },
      ];

      const mockQuery = createMockQuery(mockDebts);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getDebtSummary();

      expect(result.total_debt).toBe(18000); // 3000 + 15000
      expect(result.total_minimum_payments).toBe(500); // 100 + 400
      expect(result.debts_count).toBe(2);
      expect(result.highest_interest_rate).toBe(0.20);
      expect(result.lowest_balance).toBe(3000);
    });
  });

  describe('calculatePayoffPlan', () => {
    const mockDebts = [
      {
        id: 'debt-1',
        name: 'Credit Card',
        current_balance: 3000,
        interest_rate: 0.20,
        minimum_payment: 100,
      },
      {
        id: 'debt-2',
        name: 'Car Loan',
        current_balance: 15000,
        interest_rate: 0.06,
        minimum_payment: 400,
      },
      {
        id: 'debt-3',
        name: 'Personal Loan',
        current_balance: 5000,
        interest_rate: 0.12,
        minimum_payment: 150,
      },
    ];

    beforeEach(() => {
      const mockQuery = createMockQuery(mockDebts);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);
    });

    it('should order debts by interest rate for avalanche strategy', async () => {
      const plan = await calculatePayoffPlan('avalanche', 0);

      // Avalanche: highest interest first
      expect(plan[0].debt_name).toBe('Credit Card'); // 20% APR
      expect(plan[1].debt_name).toBe('Personal Loan'); // 12% APR
      expect(plan[2].debt_name).toBe('Car Loan'); // 6% APR
    });

    it('should order debts by balance for snowball strategy', async () => {
      const plan = await calculatePayoffPlan('snowball', 0);

      // Snowball: smallest balance first
      expect(plan[0].debt_name).toBe('Credit Card'); // $3000
      expect(plan[1].debt_name).toBe('Personal Loan'); // $5000
      expect(plan[2].debt_name).toBe('Car Loan'); // $15000
    });

    it('should include payoff order in plan', async () => {
      const plan = await calculatePayoffPlan('avalanche', 0);

      expect(plan[0].payoff_order).toBe(1);
      expect(plan[1].payoff_order).toBe(2);
      expect(plan[2].payoff_order).toBe(3);
    });
  });

  describe('compareStrategies', () => {
    it('should show avalanche saves more on interest', async () => {
      const mockDebts = [
        {
          id: 'debt-1',
          name: 'High Interest',
          current_balance: 5000,
          interest_rate: 0.25,
          minimum_payment: 150,
        },
        {
          id: 'debt-2',
          name: 'Low Interest',
          current_balance: 3000,
          interest_rate: 0.05,
          minimum_payment: 100,
        },
      ];

      const mockQuery = createMockQuery(mockDebts);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const comparison = await compareStrategies(0);

      // Avalanche should save money on interest
      expect(comparison.avalanche.totalInterest).toBeLessThanOrEqual(
        comparison.snowball.totalInterest
      );
      expect(comparison.savings).toBeGreaterThanOrEqual(0);
    });
  });
});
