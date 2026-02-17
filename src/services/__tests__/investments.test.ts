/**
 * Investment Service Tests
 */

import {
  getHoldings,
  getHolding,
  createHolding,
  updateHolding,
  deleteHolding,
  getCryptoHoldings,
  getTransactions,
  recordTransaction,
  getPortfolioSummary,
  createSnapshot,
  getPerformance,
  formatCurrency,
  formatPercentage,
  getGainColor,
} from '../investments';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
    },
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
    upsert: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    not: jest.fn(() => mockQuery),
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

describe('Investment Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock all auth methods for authenticated user
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    (mockSupabase.auth.refreshSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getHoldings', () => {
    it('should fetch all active holdings with performance metrics', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          user_id: 'user-123',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          investment_type: 'stock',
          quantity: 10,
          cost_basis: 1500.00,
          current_value: 1750.00,
          current_price: 175.00,
          is_active: true,
        },
        {
          id: 'holding-2',
          user_id: 'user-123',
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          investment_type: 'stock',
          quantity: 5,
          cost_basis: 1000.00,
          current_value: 1250.00,
          current_price: 250.00,
          is_active: true,
        },
      ];

      const mockQuery = createMockQuery(mockHoldings);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getHoldings();

      expect(mockSupabase.from).toHaveBeenCalledWith('investment_holdings');
      expect(result.length).toBe(2);

      // Check performance metrics calculated
      expect(result[0].unrealized_gain).toBe(250); // 1750 - 1500
      expect(result[0].unrealized_gain_percentage).toBeCloseTo(16.67, 1); // (250/1500)*100
    });

    it('should filter by investment type', async () => {
      const mockHoldings = [
        { id: 'holding-1', investment_type: 'etf', current_value: 1000 },
      ];

      const mockQuery = createMockQuery(mockHoldings);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await getHoldings({ investmentType: 'etf' });

      expect(mockQuery.eq).toHaveBeenCalledWith('investment_type', 'etf');
    });

    it('should throw error when not authenticated', async () => {
      // Reset all auth mocks to return no user
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (mockSupabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getHoldings()).rejects.toThrow('Not authenticated');
    });
  });


  describe('updateHolding', () => {
    it('should update holding with new values', async () => {
      const updatedHolding = {
        id: 'holding-1',
        quantity: 15,
        current_price: 180.00,
        current_value: 2700.00,
      };

      const mockQuery = createMockQuery(updatedHolding);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await updateHolding('holding-1', {
        quantity: 15,
        current_price: 180.00,
      });

      expect(result.quantity).toBe(15);
    });
  });

  describe('deleteHolding', () => {
    it('should soft delete a holding', async () => {
      const mockQuery = createMockQuery(null);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await deleteHolding('holding-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('investment_holdings');
      expect(mockQuery.update).toHaveBeenCalled();
    });
  });

  describe('getCryptoHoldings', () => {
    it('should fetch crypto holdings with performance metrics', async () => {
      const mockCrypto = [
        {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 0.5,
          cost_basis: 20000.00,
          current_value: 25000.00,
          is_active: true,
        },
        {
          id: 'crypto-2',
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: 5,
          cost_basis: 10000.00,
          current_value: 12500.00,
          is_active: true,
        },
      ];

      const mockQuery = createMockQuery(mockCrypto);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getCryptoHoldings();

      expect(result.length).toBe(2);
      expect(result[0].unrealized_gain).toBe(5000); // 25000 - 20000
      expect(result[0].unrealized_gain_percentage).toBe(25); // (5000/20000)*100
    });
  });

  describe('getTransactions', () => {
    it('should fetch investment transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          symbol: 'AAPL',
          transaction_type: 'buy',
          quantity: 10,
          price: 150.00,
          amount: 1500.00,
          transaction_date: '2024-01-15',
        },
        {
          id: 'tx-2',
          symbol: 'AAPL',
          transaction_type: 'dividend',
          quantity: 0,
          price: 0,
          amount: 5.00,
          transaction_date: '2024-01-30',
        },
      ];

      const mockQuery = createMockQuery(mockTransactions);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getTransactions({ symbol: 'AAPL' });

      expect(result.length).toBe(2);
    });
  });

  describe('recordTransaction', () => {
    it('should record a buy transaction and update holding', async () => {
      const transaction = {
        holding_id: 'holding-1',
        symbol: 'AAPL',
        transaction_type: 'buy' as const,
        quantity: 5,
        price: 160.00,
        transaction_date: '2024-01-20',
      };

      const createdTransaction = {
        id: 'tx-new',
        ...transaction,
        amount: 800.00,
      };

      const existingHolding = { quantity: 10, cost_basis: 1500.00 };

      const insertQuery = createMockQuery(createdTransaction);
      const selectQuery = createMockQuery(existingHolding);
      const updateQuery = createMockQuery({});

      // recordTransaction calls getUser, then updateHoldingFromTransaction also calls getUser
      (mockSupabase.auth.getUser as jest.Mock)
        .mockResolvedValue({ data: { user: mockUser }, error: null });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(insertQuery) // insert transaction
        .mockReturnValueOnce(selectQuery) // get holding
        .mockReturnValueOnce(updateQuery); // update holding

      const result = await recordTransaction(transaction);

      expect(result.id).toBe('tx-new');
      expect(result.amount).toBe(800);
    });
  });

  describe('getPortfolioSummary', () => {
    it('should calculate complete portfolio summary', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          investment_type: 'stock',
          cost_basis: 1500.00,
          current_value: 1750.00,
          is_active: true,
          account_name: 'Brokerage',
        },
        {
          id: 'holding-2',
          investment_type: 'etf',
          cost_basis: 2000.00,
          current_value: 2200.00,
          is_active: true,
          account_name: 'IRA',
        },
      ];

      const mockCrypto = [
        {
          id: 'crypto-1',
          cost_basis: 5000.00,
          current_value: 6000.00,
          is_active: true,
          exchange_name: 'Coinbase',
        },
      ];

      const holdingsQuery = createMockQuery(mockHoldings);
      const cryptoQuery = createMockQuery(mockCrypto);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(holdingsQuery)
        .mockReturnValueOnce(cryptoQuery);

      const result = await getPortfolioSummary();

      expect(result.total_value).toBe(9950); // 1750 + 2200 + 6000
      expect(result.total_cost_basis).toBe(8500); // 1500 + 2000 + 5000
      expect(result.total_gain).toBe(1450);
      expect(result.total_gain_percentage).toBeCloseTo(17.06, 1);
      expect(result.holdings_count).toBe(3);
    });
  });

  describe('createSnapshot', () => {
    it('should create a portfolio snapshot', async () => {
      const mockHoldings = [
        { investment_type: 'stock', cost_basis: 1000, current_value: 1200, is_active: true },
      ];

      const mockSnapshot = {
        id: 'snapshot-1',
        total_value: 1200,
        total_cost_basis: 1000,
        total_gain: 200,
        total_gain_percentage: 20,
      };

      const holdingsQuery = createMockQuery(mockHoldings);
      const cryptoQuery = createMockQuery([]);
      const snapshotQuery = createMockQuery(mockSnapshot);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(holdingsQuery)
        .mockReturnValueOnce(cryptoQuery)
        .mockReturnValueOnce(snapshotQuery);

      const result = await createSnapshot('Monthly snapshot');

      expect(result.total_value).toBe(1200);
    });
  });

  describe('getPerformance', () => {
    it('should calculate performance for period', async () => {
      const mockSnapshots = [
        { snapshot_date: '2024-01-01', total_value: 10000, total_cost_basis: 9000 },
        { snapshot_date: '2024-01-15', total_value: 10500, total_cost_basis: 9000 },
      ];

      const mockHoldings = [
        { investment_type: 'stock', cost_basis: 9000, current_value: 11000, is_active: true },
      ];

      const snapshotsQuery = createMockQuery(mockSnapshots);
      const holdingsQuery = createMockQuery(mockHoldings);
      const cryptoQuery = createMockQuery([]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(snapshotsQuery) // getPortfolioHistory
        .mockReturnValueOnce(holdingsQuery) // getHoldings
        .mockReturnValueOnce(cryptoQuery); // getCryptoHoldings

      const result = await getPerformance('1M');

      expect(result.period).toBe('1M');
      expect(result.start_value).toBe(10000);
      expect(result.end_value).toBe(11000);
      expect(result.absolute_change).toBe(1000);
      expect(result.percentage_change).toBe(10);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(-500)).toBe('-$500.00');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage with sign', () => {
      expect(formatPercentage(15.5)).toBe('+15.50%');
    });

    it('should format negative percentage with sign', () => {
      expect(formatPercentage(-8.25)).toBe('-8.25%');
    });

    it('should format without sign when specified', () => {
      expect(formatPercentage(15.5, false)).toBe('15.50%');
    });
  });

  describe('getGainColor', () => {
    it('should return green for positive gain', () => {
      expect(getGainColor(100)).toBe('#22C55E');
    });

    it('should return red for negative gain', () => {
      expect(getGainColor(-50)).toBe('#EF4444');
    });

    it('should return gray for zero', () => {
      expect(getGainColor(0)).toBe('#6B7280');
    });
  });
});
