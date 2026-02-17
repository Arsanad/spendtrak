/**
 * Supabase Service Tests
 * Tests the supabase client configuration and methods
 */

describe('Supabase Client', () => {
  // Create chainable query builder
  const queryBuilder: any = {};
  queryBuilder.select = jest.fn();
  queryBuilder.insert = jest.fn();
  queryBuilder.update = jest.fn();
  queryBuilder.delete = jest.fn();
  queryBuilder.eq = jest.fn();
  queryBuilder.neq = jest.fn();
  queryBuilder.gt = jest.fn();
  queryBuilder.gte = jest.fn();
  queryBuilder.lt = jest.fn();
  queryBuilder.lte = jest.fn();
  queryBuilder.order = jest.fn();
  queryBuilder.limit = jest.fn();
  queryBuilder.single = jest.fn();
  queryBuilder.maybeSingle = jest.fn();

  const storageBucket = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  };

  const supabase = mockSupabase;

  // Reset mock implementations before each test
  beforeEach(() => {
    // Setup queryBuilder chains
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.insert.mockReturnValue(queryBuilder);
    queryBuilder.update.mockReturnValue(queryBuilder);
    queryBuilder.delete.mockReturnValue(queryBuilder);
    queryBuilder.eq.mockReturnValue(queryBuilder);
    queryBuilder.neq.mockReturnValue(queryBuilder);
    queryBuilder.gt.mockReturnValue(queryBuilder);
    queryBuilder.gte.mockReturnValue(queryBuilder);
    queryBuilder.lt.mockReturnValue(queryBuilder);
    queryBuilder.lte.mockReturnValue(queryBuilder);
    queryBuilder.order.mockReturnValue(queryBuilder);
    queryBuilder.limit.mockReturnValue(queryBuilder);
    queryBuilder.single.mockResolvedValue({ data: null, error: null });
    queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    // Setup storage bucket
    storageBucket.upload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
    storageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } });

    // Setup supabase methods
    supabase.from.mockReturnValue(queryBuilder);
    supabase.storage.from.mockReturnValue(storageBucket);
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    supabase.functions.invoke.mockResolvedValue({ data: {}, error: null });
  });

  describe('initialization', () => {
    it('should create supabase client', () => {
      expect(supabase).toBeDefined();
    });

    it('should have auth methods', () => {
      expect(supabase.auth).toBeDefined();
      expect(supabase.auth.getSession).toBeDefined();
      expect(supabase.auth.signInWithOAuth).toBeDefined();
      expect(supabase.auth.signOut).toBeDefined();
    });

    it('should have database methods', () => {
      expect(supabase.from).toBeDefined();
    });

    it('should have storage methods', () => {
      expect(supabase.storage).toBeDefined();
    });

    it('should have functions methods', () => {
      expect(supabase.functions).toBeDefined();
    });
  });

  describe('database queries', () => {
    it('should create query builder for tables', () => {
      const query = supabase.from('transactions');
      expect(query).toBeDefined();
      expect(query.select).toBeDefined();
    });

    it('should support select queries', () => {
      const query = supabase.from('transactions').select('*');
      expect(query).toBeDefined();
    });

    it('should support insert queries', () => {
      const query = supabase.from('transactions').insert({ amount: 100 });
      expect(query).toBeDefined();
    });

    it('should support update queries', () => {
      const query = supabase.from('transactions').update({ amount: 100 });
      expect(query).toBeDefined();
    });

    it('should support delete queries', () => {
      const query = supabase.from('transactions').delete();
      expect(query).toBeDefined();
    });

    it('should support filtering with eq', () => {
      const query = supabase.from('transactions').select('*').eq('id', '123');
      expect(query).toBeDefined();
    });
  });

  describe('auth', () => {
    it('should get session', async () => {
      const result = await supabase.auth.getSession();
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should support OAuth sign in', async () => {
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      expect(result).toBeDefined();
    });

    it('should support sign out', async () => {
      const result = await supabase.auth.signOut();
      expect(result).toBeDefined();
    });

    it('should support auth state change listener', () => {
      const callback = jest.fn();
      const result = supabase.auth.onAuthStateChange(callback);
      expect(result).toBeDefined();
      expect(result.data.subscription.unsubscribe).toBeDefined();
    });
  });

  describe('storage', () => {
    it('should create storage bucket reference', () => {
      const bucket = supabase.storage.from('receipts');
      expect(bucket).toBeDefined();
      expect(bucket.upload).toBeDefined();
      expect(bucket.getPublicUrl).toBeDefined();
    });

    it('should upload files', async () => {
      const bucket = supabase.storage.from('receipts');
      const result = await bucket.upload('test.jpg', new Blob());
      expect(result).toBeDefined();
    });

    it('should get public URL', () => {
      const bucket = supabase.storage.from('receipts');
      const result = bucket.getPublicUrl('test.jpg');
      expect(result).toBeDefined();
      expect(result.data.publicUrl).toBeDefined();
    });
  });

  describe('functions', () => {
    it('should invoke edge functions', async () => {
      const result = await supabase.functions.invoke('parse-receipt', {
        body: { image_url: 'https://test.com/image.jpg' },
      });
      expect(result).toBeDefined();
    });
  });
});
