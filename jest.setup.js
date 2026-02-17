/**
 * Jest Setup File
 * Global test configuration and mocks
 */

import '@testing-library/jest-native/extend-expect';

// ===== Environment Variables Mock =====
process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-gemini-key';
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/test';
process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'appl_test';
process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = 'goog_test';

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ===== NetInfo Mock =====
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: { isConnectionExpensive: false },
  }),
  addEventListener: jest.fn().mockReturnValue(jest.fn()), // Returns unsubscribe
  configure: jest.fn(),
  refresh: jest.fn(),
  useNetInfo: jest.fn().mockReturnValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));

// Create chainable query builder mock
const createQueryBuilder = () => {
  const queryBuilder = {
    select: jest.fn(() => queryBuilder),
    insert: jest.fn(() => queryBuilder),
    update: jest.fn(() => queryBuilder),
    delete: jest.fn(() => queryBuilder),
    eq: jest.fn(() => queryBuilder),
    neq: jest.fn(() => queryBuilder),
    gt: jest.fn(() => queryBuilder),
    gte: jest.fn(() => queryBuilder),
    lt: jest.fn(() => queryBuilder),
    lte: jest.fn(() => queryBuilder),
    like: jest.fn(() => queryBuilder),
    ilike: jest.fn(() => queryBuilder),
    is: jest.fn(() => queryBuilder),
    in: jest.fn(() => queryBuilder),
    contains: jest.fn(() => queryBuilder),
    containedBy: jest.fn(() => queryBuilder),
    range: jest.fn(() => queryBuilder),
    order: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder),
    offset: jest.fn(() => queryBuilder),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => resolve({ data: [], error: null })),
  };
  return queryBuilder;
};

// Create storage bucket mock
const createStorageBucket = () => ({
  upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
  getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
  download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
  remove: jest.fn().mockResolvedValue({ data: null, error: null }),
  list: jest.fn().mockResolvedValue({ data: [], error: null }),
});

// Mock Supabase with enhanced auth mock
jest.mock('@supabase/supabase-js', () => {
  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id', email: 'test@test.com' }, access_token: 'test-token' } },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@test.com' } },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    refreshSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithIdToken: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    setSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    exchangeCodeForSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  };

  return {
    createClient: jest.fn(() => ({
      auth: mockAuth,
      from: jest.fn(() => createQueryBuilder()),
      storage: {
        from: jest.fn(() => createStorageBucket()),
      },
      functions: {
        invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };
});

// Mock zustand persist middleware with full API
jest.mock('zustand/middleware', () => ({
  persist: (config, options) => (set, get, api) => {
    // Create the base store
    const result = config(set, get, api);

    // Add persist API to the store (attached to api)
    api.persist = {
      hasHydrated: () => true,
      onHydrate: jest.fn(() => jest.fn()),
      onFinishHydration: jest.fn(() => jest.fn()),
      rehydrate: jest.fn().mockResolvedValue(undefined),
      getOptions: () => options || {},
      setOptions: jest.fn(),
      clearStorage: jest.fn().mockResolvedValue(undefined),
    };

    return result;
  },
  createJSONStorage: () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Silence console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes?.('componentWillReceiveProps') ||
    args[0]?.includes?.('componentWillMount')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global test utilities
global.testUtils = {
  waitFor: (callback, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          callback();
          resolve();
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(check, 50);
          }
        }
      };
      check();
    });
  },
};

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);
