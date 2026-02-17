/**
 * Purchases Service Tests
 * Tests for RevenueCat integration, subscription management
 */

import {
  getSubscriptionStatus,
  getTrialDurationString,
} from '../purchases';

// Mock RevenueCat
jest.mock('react-native-purchases', () => ({
  Purchases: {
    configure: jest.fn().mockResolvedValue(undefined),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    setLogLevel: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    checkTrialOrIntroductoryPriceEligibility: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', ERROR: 'ERROR' },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 1,
    PAYMENT_PENDING_ERROR: 2,
    PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: 3,
    PURCHASE_NOT_ALLOWED_ERROR: 4,
    PURCHASE_INVALID_ERROR: 5,
    NETWORK_ERROR: 6,
    STORE_PROBLEM_ERROR: 7,
    PRODUCT_ALREADY_PURCHASED_ERROR: 8,
    RECEIPT_ALREADY_IN_USE_ERROR: 9,
    INVALID_CREDENTIALS_ERROR: 10,
    CONFIGURATION_ERROR: 11,
  },
  INTRO_ELIGIBILITY_STATUS: {
    INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2,
    INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1,
    INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0,
  },
}));

jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    purchases: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

jest.mock('@/config/revenuecat', () => ({
  REVENUECAT_API_KEY: 'test_api_key',
  PRODUCT_IDS: {
    PLUS_MONTHLY: 'plus_monthly',
    PLUS_YEARLY: 'plus_yearly',
    PREMIUM_MONTHLY: 'premium_monthly',
    PREMIUM_YEARLY: 'premium_yearly',
  },
  ENTITLEMENTS: {
    PRO: 'SpendTrak Pro',
  },
  isRevenueCatConfigured: jest.fn().mockReturnValue(true),
}));

jest.mock('@/utils/errors', () => ({
  getErrorMessage: jest.fn((e) => e?.message || 'Unknown error'),
}));

describe('purchases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionStatus', () => {
    it('should return free tier when no customer info', () => {
      const status = getSubscriptionStatus(null);

      expect(status.tier).toBe('free');
      expect(status.isActive).toBe(false);
      expect(status.willRenew).toBe(false);
      expect(status.expirationDate).toBeNull();
    });

    it('should return free tier when no active entitlements', () => {
      const customerInfo = {
        entitlements: {
          active: {},
        },
        originalAppUserId: 'test-user',
        originalPurchaseDate: '2024-01-01',
      };

      const status = getSubscriptionStatus(customerInfo as any);

      expect(status.tier).toBe('free');
      expect(status.isActive).toBe(false);
    });

    it('should return premium tier when pro entitlement is active', () => {
      const customerInfo = {
        entitlements: {
          active: {
            'SpendTrak Pro': {
              isActive: true,
              willRenew: true,
              expirationDate: '2024-12-31',
              periodType: 'NORMAL',
              productIdentifier: 'premium_monthly',
              originalPurchaseDate: '2024-01-01',
            },
          },
        },
        originalAppUserId: 'test-user',
        originalPurchaseDate: '2024-01-01',
      };

      const status = getSubscriptionStatus(customerInfo as any);

      expect(status.tier).toBe('premium');
      expect(status.isActive).toBe(true);
      expect(status.willRenew).toBe(true);
      expect(status.isTrialActive).toBe(false);
    });

    it('should detect trial status', () => {
      const customerInfo = {
        entitlements: {
          active: {
            'SpendTrak Pro': {
              isActive: true,
              willRenew: true,
              expirationDate: '2024-01-15',
              periodType: 'TRIAL',
              productIdentifier: 'premium_monthly',
              originalPurchaseDate: '2024-01-01',
            },
          },
        },
        originalAppUserId: 'test-user',
        originalPurchaseDate: '2024-01-01',
      };

      const status = getSubscriptionStatus(customerInfo as any);

      expect(status.tier).toBe('premium');
      expect(status.isTrialActive).toBe(true);
      expect(status.trialEndDate).toEqual(new Date('2024-01-15'));
    });

    it('should detect plus tier from legacy entitlement', () => {
      const customerInfo = {
        entitlements: {
          active: {
            plus: {
              isActive: true,
              willRenew: true,
              expirationDate: '2024-12-31',
              periodType: 'NORMAL',
              productIdentifier: 'plus_monthly',
              originalPurchaseDate: '2024-01-01',
            },
          },
        },
        originalAppUserId: 'test-user',
        originalPurchaseDate: '2024-01-01',
      };

      const status = getSubscriptionStatus(customerInfo as any);

      expect(status.tier).toBe('plus');
      expect(status.isActive).toBe(true);
    });
  });

  describe('getTrialDurationString', () => {
    it('should return null when no intro price', () => {
      const pkg = {
        product: {
          introPrice: null,
        },
      };

      const duration = getTrialDurationString(pkg as any);

      expect(duration).toBeNull();
    });

    it('should format day trial duration', () => {
      const pkg = {
        product: {
          introPrice: {
            periodUnit: 'DAY',
            periodNumberOfUnits: 7,
          },
        },
      };

      const duration = getTrialDurationString(pkg as any);

      expect(duration).toBe('7 days');
    });

    it('should format single day trial', () => {
      const pkg = {
        product: {
          introPrice: {
            periodUnit: 'DAY',
            periodNumberOfUnits: 1,
          },
        },
      };

      const duration = getTrialDurationString(pkg as any);

      expect(duration).toBe('1 day');
    });

    it('should format week trial duration', () => {
      const pkg = {
        product: {
          introPrice: {
            periodUnit: 'WEEK',
            periodNumberOfUnits: 2,
          },
        },
      };

      const duration = getTrialDurationString(pkg as any);

      expect(duration).toBe('2 weeks');
    });

    it('should format month trial duration', () => {
      const pkg = {
        product: {
          introPrice: {
            periodUnit: 'MONTH',
            periodNumberOfUnits: 1,
          },
        },
      };

      const duration = getTrialDurationString(pkg as any);

      expect(duration).toBe('1 month');
    });

    it('should format year trial duration', () => {
      const pkg = {
        product: {
          introPrice: {
            periodUnit: 'YEAR',
            periodNumberOfUnits: 1,
          },
        },
      };

      const duration = getTrialDurationString(pkg as any);

      expect(duration).toBe('1 year');
    });
  });
});
