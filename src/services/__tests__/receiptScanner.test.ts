/**
 * Receipt Scanner Service Tests
 * Tests for receipt scanning and premium-only quota management
 */

import {
  checkScanQuota,
  trackScanUsage,
  getScanUsageStats,
  clearScanCache,
  getEstimatedScanCost,
} from '../receiptScanner';

// Mock dependencies
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64ImageData'),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    receipt: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

const mockHasPremiumAccess = jest.fn();

jest.mock('@/stores/tierStore', () => ({
  getCurrentTier: jest.fn().mockReturnValue('free'),
  hasPremiumAccess: (...args: any[]) => mockHasPremiumAccess(...args),
}));

describe('receiptScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearScanCache();
    mockHasPremiumAccess.mockReturnValue(false);
  });

  describe('checkScanQuota', () => {
    it('should return not allowed for free users', () => {
      mockHasPremiumAccess.mockReturnValue(false);

      const result = checkScanQuota();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(0);
      expect(result.message).toContain('Premium');
    });

    it('should return unlimited for premium users', () => {
      mockHasPremiumAccess.mockReturnValue(true);

      const result = checkScanQuota();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe('unlimited');
      expect(result.limit).toBe('unlimited');
    });
  });

  describe('trackScanUsage', () => {
    it('should return unlimited remaining for premium users', () => {
      mockHasPremiumAccess.mockReturnValue(true);

      const result = trackScanUsage();

      expect(result.newCount).toBe(0);
      expect(result.remaining).toBe('unlimited');
    });
  });

  describe('getScanUsageStats', () => {
    it('should return zero stats for free tier (not available)', () => {
      mockHasPremiumAccess.mockReturnValue(false);

      const result = getScanUsageStats();

      expect(result.used).toBe(0);
      expect(result.limit).toBe(0);
      expect(result.remaining).toBe(0);
      expect(result.percentage).toBe(100);
    });

    it('should return unlimited stats for premium tier', () => {
      mockHasPremiumAccess.mockReturnValue(true);

      const result = getScanUsageStats();

      expect(result.used).toBe(0);
      expect(result.limit).toBe('unlimited');
      expect(result.remaining).toBe('unlimited');
      expect(result.percentage).toBe(0);
    });
  });

  describe('getEstimatedScanCost', () => {
    it('should return estimated cost per scan', () => {
      const cost = getEstimatedScanCost();

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.001); // Should be very small
    });
  });

  describe('clearScanCache', () => {
    it('should clear the scan cache without errors', () => {
      expect(() => clearScanCache()).not.toThrow();
    });
  });
});
