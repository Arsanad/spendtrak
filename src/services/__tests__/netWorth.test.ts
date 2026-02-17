/**
 * Net Worth Service Tests
 */

import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getLiabilities,
  getLiability,
  createLiability,
  updateLiability,
  deleteLiability,
  calculateNetWorth,
  createNetWorthSnapshot,
  getNetWorthHistory,
} from '../netWorth';
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
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(() => Promise.resolve({ data: resolvedData, error })),
  };
  // Make the query thenable for await
  mockQuery.then = (resolve: any) => {
    resolve({ data: resolvedData, error });
    return mockQuery;
  };
  return mockQuery;
}

describe('Net Worth Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getAssets', () => {
    it('should fetch all active assets', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          user_id: 'user-123',
          name: 'Savings Account',
          asset_type: 'cash',
          current_value: 10000,
          is_liquid: true,
          is_active: true,
          include_in_net_worth: true,
        },
        {
          id: 'asset-2',
          user_id: 'user-123',
          name: 'House',
          asset_type: 'real_estate',
          current_value: 250000,
          is_liquid: false,
          is_active: true,
          include_in_net_worth: true,
        },
      ];

      const mockQuery = createMockQuery(mockAssets);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getAssets(true);

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('assets');
      expect(result).toEqual(mockAssets);
      expect(result.length).toBe(2);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getAssets()).rejects.toThrow('Not authenticated');
    });
  });

  describe('createAsset', () => {
    it('should create a new asset and record initial history', async () => {
      const newAsset = {
        name: 'Investment Account',
        asset_type: 'investment' as const,
        current_value: 50000,
        original_value: null,
        purchase_date: null,
        currency: 'USD',
        institution_name: null,
        account_number_last_four: null,
        notes: null,
        is_liquid: true,
        include_in_net_worth: true,
        is_active: true,
      };

      const createdAsset = {
        id: 'asset-new',
        user_id: 'user-123',
        ...newAsset,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const insertQuery = createMockQuery(createdAsset);
      const historyQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(historyQuery);

      const result = await createAsset(newAsset);

      expect(result.id).toBe('asset-new');
      expect(result.name).toBe('Investment Account');
      expect(result.current_value).toBe(50000);
    });
  });

  describe('updateAsset', () => {
    it('should update an existing asset', async () => {
      const updatedAsset = {
        id: 'asset-1',
        user_id: 'user-123',
        name: 'Updated Savings',
        asset_type: 'cash',
        current_value: 15000,
        is_active: true,
      };

      const mockQuery = createMockQuery(updatedAsset);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await updateAsset('asset-1', { current_value: 15000 });

      expect(result.current_value).toBe(15000);
    });
  });

  describe('deleteAsset', () => {
    it('should soft delete an asset', async () => {
      const mockQuery = createMockQuery(null);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await deleteAsset('asset-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('assets');
    });
  });

  describe('getLiabilities', () => {
    it('should fetch all active liabilities', async () => {
      const mockLiabilities = [
        {
          id: 'liability-1',
          user_id: 'user-123',
          name: 'Mortgage',
          liability_type: 'mortgage',
          current_balance: 200000,
          interest_rate: 4.5,
          is_active: true,
          include_in_net_worth: true,
        },
        {
          id: 'liability-2',
          user_id: 'user-123',
          name: 'Car Loan',
          liability_type: 'loan',
          current_balance: 15000,
          interest_rate: 6.0,
          is_active: true,
          include_in_net_worth: true,
        },
      ];

      const mockQuery = createMockQuery(mockLiabilities);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getLiabilities(true);

      expect(result).toEqual(mockLiabilities);
      expect(result.length).toBe(2);
    });
  });

  describe('createLiability', () => {
    it('should create a new liability and record initial history', async () => {
      const newLiability = {
        name: 'Credit Card',
        liability_type: 'credit_card' as const,
        current_balance: 5000,
        original_balance: null,
        interest_rate: 19.9,
        minimum_payment: null,
        currency: 'USD',
        lender_name: null,
        account_number_last_four: null,
        due_date: null,
        notes: null,
        linked_debt_id: null,
        include_in_net_worth: true,
        is_active: true,
      };

      const createdLiability = {
        id: 'liability-new',
        user_id: 'user-123',
        ...newLiability,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const insertQuery = createMockQuery(createdLiability);
      const historyQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(historyQuery);

      const result = await createLiability(newLiability);

      expect(result.id).toBe('liability-new');
      expect(result.name).toBe('Credit Card');
      expect(result.current_balance).toBe(5000);
    });
  });

  describe('calculateNetWorth', () => {
    it('should calculate correct net worth from assets and liabilities', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          asset_type: 'cash',
          current_value: 10000,
          is_liquid: true,
          include_in_net_worth: true,
        },
        {
          id: 'asset-2',
          asset_type: 'real_estate',
          current_value: 250000,
          is_liquid: false,
          include_in_net_worth: true,
        },
      ];

      const mockLiabilities = [
        {
          id: 'liability-1',
          liability_type: 'mortgage',
          current_balance: 200000,
          include_in_net_worth: true,
          linked_debt_id: null,
        },
      ];

      const mockDebts: any[] = [];

      const assetsQuery = createMockQuery(mockAssets);
      const liabilitiesQuery = createMockQuery(mockLiabilities);
      const debtsQuery = createMockQuery(mockDebts);
      const monthSnapshotQuery = createMockQuery(null);
      const yearSnapshotQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(assetsQuery) // getAssets
        .mockReturnValueOnce(liabilitiesQuery) // getLiabilities
        .mockReturnValueOnce(debtsQuery) // debts query
        .mockReturnValueOnce(monthSnapshotQuery) // month snapshot
        .mockReturnValueOnce(yearSnapshotQuery); // year snapshot

      const result = await calculateNetWorth();

      // Net worth = 10000 + 250000 - 200000 = 60000
      expect(result.total_assets).toBe(260000);
      expect(result.total_liabilities).toBe(200000);
      expect(result.net_worth).toBe(60000);
      expect(result.liquid_assets).toBe(10000);
    });

    it('should calculate asset breakdown by type', async () => {
      const mockAssets = [
        { asset_type: 'cash', current_value: 10000, is_liquid: true, include_in_net_worth: true },
        { asset_type: 'cash', current_value: 5000, is_liquid: true, include_in_net_worth: true },
        { asset_type: 'investment', current_value: 50000, is_liquid: false, include_in_net_worth: true },
      ];

      const assetsQuery = createMockQuery(mockAssets);
      const liabilitiesQuery = createMockQuery([]);
      const debtsQuery = createMockQuery([]);
      const monthSnapshotQuery = createMockQuery(null);
      const yearSnapshotQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(assetsQuery)
        .mockReturnValueOnce(liabilitiesQuery)
        .mockReturnValueOnce(debtsQuery)
        .mockReturnValueOnce(monthSnapshotQuery)
        .mockReturnValueOnce(yearSnapshotQuery);

      const result = await calculateNetWorth();

      expect(result.asset_breakdown.cash).toBe(15000);
      expect(result.asset_breakdown.investment).toBe(50000);
    });
  });

  describe('createNetWorthSnapshot', () => {
    it('should create a snapshot with current net worth values', async () => {
      const mockAssets = [
        { asset_type: 'cash', current_value: 10000, is_liquid: true, include_in_net_worth: true },
      ];

      const mockSnapshot = {
        id: 'snapshot-1',
        user_id: 'user-123',
        snapshot_date: '2024-01-15',
        total_assets: 10000,
        total_liabilities: 0,
        net_worth: 10000,
        liquid_assets: 10000,
      };

      const assetsQuery = createMockQuery(mockAssets);
      const liabilitiesQuery = createMockQuery([]);
      const debtsQuery = createMockQuery([]);
      const monthSnapshotQuery = createMockQuery(null);
      const yearSnapshotQuery = createMockQuery(null);
      const upsertQuery = createMockQuery(mockSnapshot);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(assetsQuery)
        .mockReturnValueOnce(liabilitiesQuery)
        .mockReturnValueOnce(debtsQuery)
        .mockReturnValueOnce(monthSnapshotQuery)
        .mockReturnValueOnce(yearSnapshotQuery)
        .mockReturnValueOnce(upsertQuery);

      const result = await createNetWorthSnapshot('Monthly update');

      expect(result.net_worth).toBe(10000);
    });
  });

  describe('getNetWorthHistory', () => {
    it('should fetch net worth history with date filtering', async () => {
      const mockHistory = [
        { snapshot_date: '2024-01-15', net_worth: 60000, total_assets: 260000, total_liabilities: 200000 },
        { snapshot_date: '2024-01-01', net_worth: 55000, total_assets: 255000, total_liabilities: 200000 },
      ];

      const mockQuery = createMockQuery(mockHistory);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getNetWorthHistory('2024-01-01', '2024-01-31');

      expect(result.length).toBe(2);
      expect(result[0].net_worth).toBe(60000);
    });
  });

  describe('month and year change calculations', () => {
    it('should calculate month-over-month change', async () => {
      const mockAssets = [
        { asset_type: 'cash', current_value: 12000, is_liquid: true, include_in_net_worth: true },
      ];

      const monthSnapshot = { net_worth: 10000 };
      const yearSnapshot = { net_worth: 8000 };

      const assetsQuery = createMockQuery(mockAssets);
      const liabilitiesQuery = createMockQuery([]);
      const debtsQuery = createMockQuery([]);
      const monthSnapshotQuery = createMockQuery(monthSnapshot);
      const yearSnapshotQuery = createMockQuery(yearSnapshot);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(assetsQuery)
        .mockReturnValueOnce(liabilitiesQuery)
        .mockReturnValueOnce(debtsQuery)
        .mockReturnValueOnce(monthSnapshotQuery)
        .mockReturnValueOnce(yearSnapshotQuery);

      const result = await calculateNetWorth();

      // Current: 12000, Month ago: 10000 = +2000 (+20%)
      expect(result.month_change).toBe(2000);
      expect(result.month_change_percentage).toBe(20);

      // Current: 12000, Year ago: 8000 = +4000 (+50%)
      expect(result.year_change).toBe(4000);
      expect(result.year_change_percentage).toBe(50);
    });
  });
});
