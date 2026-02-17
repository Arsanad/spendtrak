/**
 * Currency Converter Service Tests
 * Tests for exchange rate fetching and currency conversion
 */

import {
  getExchangeRate,
  convertCurrency,
  convertCurrencyWithDetails,
  clearRateCache,
  hasValidCache,
  getCacheInfo,
} from '../currencyConverter';

// Mock fetch
global.fetch = jest.fn();

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    currency: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

describe('currencyConverter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRateCache();
  });

  describe('getExchangeRate', () => {
    it('should return 1 for same currency', async () => {
      const rate = await getExchangeRate('USD', 'USD');

      expect(rate).toBe(1);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch and return exchange rate', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            EUR: 0.92,
            GBP: 0.79,
          },
        }),
      });

      const rate = await getExchangeRate('USD', 'EUR');

      expect(rate).toBe(0.92);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('exchangerate-api.com/v4/latest/USD')
      );
    });

    it('should use cached rates on subsequent calls', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });

      // First call - fetches from API
      await getExchangeRate('USD', 'EUR');

      // Second call - should use cache
      await getExchangeRate('USD', 'EUR');

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error for unsupported currency', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });

      await expect(getExchangeRate('USD', 'INVALID')).rejects.toThrow(
        'Exchange rate not found'
      );
    });

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getExchangeRate('USD', 'EUR')).rejects.toThrow();
    });
  });

  describe('convertCurrency', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            EUR: 0.92,
            GBP: 0.79,
            AED: 3.67,
          },
        }),
      });
    });

    it('should return same amount for same currency', async () => {
      const result = await convertCurrency(100, 'USD', 'USD');

      expect(result).toBe(100);
    });

    it('should convert currency correctly', async () => {
      const result = await convertCurrency(100, 'USD', 'EUR');

      expect(result).toBe(92); // 100 * 0.92, rounded to 2 decimals
    });

    it('should round to 2 decimal places', async () => {
      const result = await convertCurrency(33.33, 'USD', 'EUR');

      // 33.33 * 0.92 = 30.6636, rounded to 30.66
      expect(result).toBe(30.66);
    });
  });

  describe('convertCurrencyWithDetails', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });
    });

    it('should return full conversion details', async () => {
      const result = await convertCurrencyWithDetails(100, 'USD', 'EUR');

      expect(result.originalAmount).toBe(100);
      expect(result.originalCurrency).toBe('USD');
      expect(result.convertedAmount).toBe(92);
      expect(result.targetCurrency).toBe('EUR');
      expect(result.exchangeRate).toBe(0.92);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('cache functions', () => {
    it('hasValidCache should return false initially', () => {
      expect(hasValidCache()).toBe(false);
    });

    it('hasValidCache should return true after fetching rates', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });

      await getExchangeRate('USD', 'EUR');

      expect(hasValidCache()).toBe(true);
    });

    it('getCacheInfo should return null when no cache', () => {
      expect(getCacheInfo()).toBeNull();
    });

    it('getCacheInfo should return info after fetching', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });

      await getExchangeRate('USD', 'EUR');
      const info = getCacheInfo();

      expect(info).not.toBeNull();
      expect(info?.baseCurrency).toBe('USD');
      expect(info?.age).toBe(0); // Just fetched
    });

    it('clearRateCache should clear the cache', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });

      await getExchangeRate('USD', 'EUR');
      expect(hasValidCache()).toBe(true);

      clearRateCache();

      expect(hasValidCache()).toBe(false);
      expect(getCacheInfo()).toBeNull();
    });
  });
});
