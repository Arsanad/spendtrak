/**
 * Exchange Rates Service Tests
 * Tests for fetching and converting exchange rates
 */

import {
  fetchExchangeRates,
  convertCurrency,
  getExchangeRate,
  getFallbackRates,
} from '../exchangeRates';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    exchange: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

describe('exchangeRates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('fetchExchangeRates', () => {
    it('should fetch rates from API', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            USD: 1,
            EUR: 0.92,
            GBP: 0.79,
            AED: 3.67,
          },
        }),
      });

      const rates = await fetchExchangeRates('USD');

      expect(rates).toHaveProperty('EUR');
      expect(rates).toHaveProperty('GBP');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('exchangerate-api.com'),
        expect.any(Object)
      );
    });

    it('should use cached rates when available and fresh', async () => {
      const cachedRates = {
        rates: { EUR: 0.92, GBP: 0.79 },
        baseCurrency: 'USD',
        timestamp: Date.now(), // Fresh cache
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedRates));

      const rates = await fetchExchangeRates('USD');

      expect(rates).toEqual(cachedRates.rates);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch new rates when cache is expired', async () => {
      const expiredCache = {
        rates: { EUR: 0.90 },
        baseCurrency: 'USD',
        timestamp: Date.now() - 7 * 60 * 60 * 1000, // 7 hours ago (cache is 6 hours)
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(expiredCache));
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });

      const rates = await fetchExchangeRates('USD');

      expect(fetch).toHaveBeenCalled();
      expect(rates.EUR).toBe(0.92);
    });

    it('should fetch new rates when base currency differs', async () => {
      const cachedRates = {
        rates: { EUR: 0.92 },
        baseCurrency: 'USD',
        timestamp: Date.now(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedRates));
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { USD: 1.09 },
        }),
      });

      const rates = await fetchExchangeRates('EUR'); // Different base

      expect(fetch).toHaveBeenCalled();
    });

    it('should use fallback rates on API error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const rates = await fetchExchangeRates('USD');

      expect(rates).toHaveProperty('EUR');
      expect(rates).toHaveProperty('AED');
      expect(rates.USD).toBe(1);
    });

    it('should use fallback rates on non-ok response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const rates = await fetchExchangeRates('USD');

      expect(rates).toHaveProperty('EUR');
    });

    it('should cache fetched rates', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: { EUR: 0.92 },
        }),
      });

      await fetchExchangeRates('USD');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('EUR')
      );
    });
  });

  describe('convertCurrency', () => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      AED: 3.67,
    };

    it('should return same amount for same currency', () => {
      const result = convertCurrency(100, 'USD', 'USD', rates);

      expect(result).toBe(100);
    });

    it('should convert from USD to EUR correctly', () => {
      const result = convertCurrency(100, 'USD', 'EUR', rates);

      expect(result).toBe(92); // 100 * 0.92
    });

    it('should convert from EUR to USD correctly', () => {
      const result = convertCurrency(92, 'EUR', 'USD', rates);

      // 92 / 0.92 * 1 = 100
      expect(result).toBe(100);
    });

    it('should convert between non-USD currencies', () => {
      const result = convertCurrency(100, 'EUR', 'GBP', rates);

      // 100 EUR -> USD -> GBP
      // 100 / 0.92 * 0.79 ≈ 85.87
      expect(result).toBeCloseTo(85.87, 1);
    });

    it('should handle missing currencies with default rate 1', () => {
      const result = convertCurrency(100, 'UNKNOWN', 'USD', rates);

      expect(result).toBe(100);
    });
  });

  describe('getExchangeRate', () => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
    };

    it('should return 1 for same currency', () => {
      const rate = getExchangeRate('USD', 'USD', rates);

      expect(rate).toBe(1);
    });

    it('should return correct rate from USD to EUR', () => {
      const rate = getExchangeRate('USD', 'EUR', rates);

      expect(rate).toBe(0.92);
    });

    it('should return correct rate from EUR to USD', () => {
      const rate = getExchangeRate('EUR', 'USD', rates);

      // 1 / 0.92 ≈ 1.087
      expect(rate).toBeCloseTo(1.087, 2);
    });

    it('should return cross rate between non-USD currencies', () => {
      const rate = getExchangeRate('EUR', 'GBP', rates);

      // 0.79 / 0.92 ≈ 0.859
      expect(rate).toBeCloseTo(0.859, 2);
    });
  });

  describe('getFallbackRates', () => {
    it('should return fallback rates object', () => {
      const rates = getFallbackRates();

      expect(rates).toHaveProperty('USD');
      expect(rates).toHaveProperty('EUR');
      expect(rates).toHaveProperty('GBP');
      expect(rates).toHaveProperty('AED');
      expect(rates.USD).toBe(1);
    });

    it('should return a copy (not reference)', () => {
      const rates1 = getFallbackRates();
      const rates2 = getFallbackRates();

      rates1.USD = 999;

      expect(rates2.USD).toBe(1);
    });

    it('should include common currencies', () => {
      const rates = getFallbackRates();

      expect(rates).toHaveProperty('JPY');
      expect(rates).toHaveProperty('CNY');
      expect(rates).toHaveProperty('INR');
      expect(rates).toHaveProperty('SAR');
    });
  });
});
