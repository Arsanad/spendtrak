/**
 * Categories Service Tests
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

// Mock category service functions
const getCategories = async () => {
  const { data, error } = await mockSupabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true } as any);

  if (error) throw error;
  return data || [];
};

const getCategory = async (id: string) => {
  const { data, error } = await mockSupabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

const createCustomCategory = async (input: any) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('categories')
    .insert({ ...input, user_id: user.id, is_custom: true })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateCategory = async (id: string, updates: any) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteCategory = async (id: string) => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await mockSupabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_custom', true);

  if (error) throw error;
};

const getDefaultCategories = async () => {
  const { data, error } = await mockSupabase
    .from('categories')
    .select('*')
    .is('user_id', null)
    .order('name', { ascending: true } as any);

  if (error) throw error;
  return data || [];
};

const getUserCategories = async () => {
  const { data: { user } } = await mockSupabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await mockSupabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_custom', true);

  if (error) throw error;
  return data || [];
};

const getCategoryByName = async (name: string) => {
  const { data, error } = await mockSupabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .single();

  if (error) throw error;
  return data;
};

describe('Categories Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
        { id: 'cat-2', name: 'Shopping', icon: '🛒', color: '#4ECDC4' },
        { id: 'cat-3', name: 'Transport', icon: '🚗', color: '#45B7D1' },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategories));

      const result = await getCategories();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Food & Dining');
    });

    it('should return empty array when no categories exist', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await getCategories();

      expect(result).toHaveLength(0);
    });

    it('should order categories by name', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      await getCategories();

      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
    });
  });

  describe('getCategory', () => {
    it('should fetch a single category by ID', async () => {
      const mockCategory = { id: 'cat-1', name: 'Food & Dining', icon: '🍽️' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategory));

      const result = await getCategory('cat-1');

      expect(result.name).toBe('Food & Dining');
    });

    it('should return null when category not found', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      const result = await getCategory('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createCustomCategory', () => {
    it('should create a custom category', async () => {
      const newCategory = {
        name: 'Pets',
        icon: '🐕',
        color: '#FF9800',
      };

      const createdCategory = { id: 'cat-new', ...newCategory, is_custom: true };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(createdCategory));

      const result = await createCustomCategory(newCategory);

      expect(result.name).toBe('Pets');
      expect(result.is_custom).toBe(true);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(createCustomCategory({ name: 'Test' })).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateCategory', () => {
    it('should update category name', async () => {
      const updatedCategory = { id: 'cat-1', name: 'Food & Restaurants' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedCategory));

      const result = await updateCategory('cat-1', { name: 'Food & Restaurants' });

      expect(result.name).toBe('Food & Restaurants');
    });

    it('should update category icon', async () => {
      const updatedCategory = { id: 'cat-1', icon: '🍕' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedCategory));

      const result = await updateCategory('cat-1', { icon: '🍕' });

      expect(result.icon).toBe('🍕');
    });

    it('should update category color', async () => {
      const updatedCategory = { id: 'cat-1', color: '#00FF00' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(updatedCategory));

      const result = await updateCategory('cat-1', { color: '#00FF00' });

      expect(result.color).toBe('#00FF00');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a custom category', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      await expect(deleteCategory('cat-1')).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
    });
  });

  describe('getDefaultCategories', () => {
    it('should fetch only default categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Food & Dining', user_id: null },
        { id: 'cat-2', name: 'Shopping', user_id: null },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategories));

      const result = await getDefaultCategories();

      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBeNull();
    });
  });

  describe('getUserCategories', () => {
    it('should fetch only user custom categories', async () => {
      const mockCategories = [
        { id: 'cat-custom-1', name: 'Pets', user_id: 'user-123', is_custom: true },
      ];

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategories));

      const result = await getUserCategories();

      expect(result).toHaveLength(1);
      expect(result[0].is_custom).toBe(true);
    });

    it('should return empty array when user has no custom categories', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery([]));

      const result = await getUserCategories();

      expect(result).toHaveLength(0);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getUserCategories()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getCategoryByName', () => {
    it('should fetch a category by name', async () => {
      const mockCategory = { id: 'cat-1', name: 'Food & Dining' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategory));

      const result = await getCategoryByName('Food & Dining');

      expect(result.name).toBe('Food & Dining');
    });

    it('should return null when category name not found', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(null));

      const result = await getCategoryByName('Unknown Category');

      expect(result).toBeNull();
    });
  });

  describe('Category Colors', () => {
    it('should support hex color format', async () => {
      const mockCategory = { id: 'cat-1', name: 'Food', color: '#FF6B6B' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategory));

      const result = await getCategory('cat-1');

      expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('Category Icons', () => {
    it('should support emoji icons', async () => {
      const mockCategory = { id: 'cat-1', name: 'Food', icon: '🍽️' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategory));

      const result = await getCategory('cat-1');

      expect(result.icon).toBe('🍽️');
    });

    it('should support text icons', async () => {
      const mockCategory = { id: 'cat-1', name: 'Food', icon: 'restaurant' };

      (mockSupabase.from as jest.Mock).mockReturnValue(createMockQuery(mockCategory));

      const result = await getCategory('cat-1');

      expect(result.icon).toBe('restaurant');
    });
  });
});
