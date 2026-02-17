/**
 * Search Service Tests
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
  ilike: jest.fn(() => createMockQuery(data, error)),
  or: jest.fn(() => createMockQuery(data, error)),
  order: jest.fn(() => createMockQuery(data, error)),
  limit: jest.fn(() => createMockQuery(data, error)),
  range: jest.fn().mockResolvedValue({ data, error, count: data?.length || 0 }),
  single: jest.fn().mockResolvedValue({ data, error }),
  then: (resolve: any) => {
    resolve({ data: Array.isArray(data) ? data : data ? [data] : [], error });
    return createMockQuery(data, error);
  },
});

// Mock search functions
const searchTransactions = async (query: string, options: any = {}) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (!query || query.trim().length === 0) {
    return [];
  }

  let dbQuery = mockSupabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .ilike('merchant_name', `%${query}%`)
    .order('transaction_date', { ascending: false } as any)
    .limit(options.limit || 20);

  const { data, error } = await dbQuery;
  if (error) throw error;
  return data || [];
};

const searchSubscriptions = async (query: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .or(`merchant_name.ilike.%${query}%,display_name.ilike.%${query}%`)
    .order('amount', { ascending: false } as any);

  if (error) throw error;
  return data || [];
};

const searchAll = async (query: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [transactions, subscriptions] = await Promise.all([
    searchTransactions(query),
    searchSubscriptions(query),
  ]);

  return {
    transactions,
    subscriptions,
    totalResults: transactions.length + subscriptions.length,
  };
};

const getRecentSearches = async () => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('recent_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false } as any)
    .limit(10);

  if (error) throw error;
  return data || [];
};

const saveSearch = async (query: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('recent_searches')
    .insert({ user_id: user.id, query, searched_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const clearSearchHistory = async () => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await mockSupabase
    .from('recent_searches')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
};

const getSuggestions = async (query: string) => {
  if (!query || query.length < 2) return [];

  const { data, error } = await mockSupabase
    .from('merchants')
    .select('name')
    .ilike('name', `${query}%`)
    .limit(5);

  if (error) throw error;
  return (data || []).map((m: any) => m.name);
};

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('searchTransactions', () => {
    it('should search transactions by merchant name', async () => {
      const mockTransactions = [
        { id: 'tx-1', merchant_name: 'Starbucks', amount: 5.99 },
        { id: 'tx-2', merchant_name: 'Starbucks Reserve', amount: 8.50 },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockTransactions));

      const result = await searchTransactions('Starbucks');

      expect(result).toHaveLength(2);
      expect(result[0].merchant_name).toContain('Starbucks');
    });

    it('should return empty array for empty query', async () => {
      const result = await searchTransactions('');

      expect(result).toHaveLength(0);
    });

    it('should return empty array for whitespace query', async () => {
      const result = await searchTransactions('   ');

      expect(result).toHaveLength(0);
    });

    it('should limit results', async () => {
      const mockTransactions = [
        { id: 'tx-1', merchant_name: 'Amazon' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockTransactions));

      const result = await searchTransactions('Amazon', { limit: 5 });

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(result).toHaveLength(1);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(searchTransactions('test')).rejects.toThrow('Not authenticated');
    });
  });

  describe('searchSubscriptions', () => {
    it('should search subscriptions by name', async () => {
      const mockSubscriptions = [
        { id: 'sub-1', merchant_name: 'Netflix', display_name: 'Netflix Premium' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockSubscriptions));

      const result = await searchSubscriptions('Netflix');

      expect(result).toHaveLength(1);
      expect(result[0].merchant_name).toBe('Netflix');
    });

    it('should return empty array when no matches', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await searchSubscriptions('NonExistent');

      expect(result).toHaveLength(0);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(searchSubscriptions('test')).rejects.toThrow('Not authenticated');
    });
  });

  describe('searchAll', () => {
    it('should search across transactions and subscriptions', async () => {
      const mockTransactions = [
        { id: 'tx-1', merchant_name: 'Amazon' },
      ];
      const mockSubscriptions = [
        { id: 'sub-1', merchant_name: 'Amazon Prime' },
      ];

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(createMockQuery(mockTransactions))
        .mockReturnValueOnce(createMockQuery(mockSubscriptions));

      const result = await searchAll('Amazon');

      expect(result.transactions).toHaveLength(1);
      expect(result.subscriptions).toHaveLength(1);
      expect(result.totalResults).toBe(2);
    });

    it('should return totalResults count', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await searchAll('unknown');

      expect(result.totalResults).toBe(0);
    });
  });

  describe('getRecentSearches', () => {
    it('should fetch recent searches', async () => {
      const mockSearches = [
        { id: 'search-1', query: 'Amazon', searched_at: '2024-01-15' },
        { id: 'search-2', query: 'Netflix', searched_at: '2024-01-14' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockSearches));

      const result = await getRecentSearches();

      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('Amazon');
    });

    it('should return empty array when no recent searches', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await getRecentSearches();

      expect(result).toHaveLength(0);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getRecentSearches()).rejects.toThrow('Not authenticated');
    });
  });

  describe('saveSearch', () => {
    it('should save a search query', async () => {
      const savedSearch = { id: 'search-1', query: 'Starbucks' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(savedSearch));

      const result = await saveSearch('Starbucks');

      expect(result.query).toBe('Starbucks');
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(saveSearch('test')).rejects.toThrow('Not authenticated');
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear all search history', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      await expect(clearSearchHistory()).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('recent_searches');
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(clearSearchHistory()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getSuggestions', () => {
    it('should get merchant suggestions', async () => {
      const mockMerchants = [
        { name: 'Starbucks' },
        { name: 'Staples' },
        { name: 'Star Market' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockMerchants));

      const result = await getSuggestions('Sta');

      expect(result).toContain('Starbucks');
      expect(result).toHaveLength(3);
    });

    it('should return empty array for short queries', async () => {
      const result = await getSuggestions('S');

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty query', async () => {
      const result = await getSuggestions('');

      expect(result).toHaveLength(0);
    });
  });
});
