// SPENDTRAK - Exchange Rates Service
// Fetches and caches exchange rates with fallback support

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const EXCHANGE_RATES_KEY = 'spendtrak_exchange_rates';
const RATES_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Fallback rates (USD as base) - updated January 2025
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  AED: 3.6725,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.377,
  OMR: 0.385,
  EGP: 30.9,
  INR: 83.12,
  PKR: 278.5,
  JPY: 149.5,
  CNY: 7.24,
  CHF: 0.88,
  CAD: 1.36,
  AUD: 1.53,
};

interface ExchangeRatesCache {
  rates: Record<string, number>;
  baseCurrency: string;
  timestamp: number;
}

// Fetch live exchange rates from free API
export const fetchExchangeRates = async (
  baseCurrency: string = 'USD'
): Promise<Record<string, number>> => {
  try {
    // Check cache first
    const cached = await getCachedRates();
    if (
      cached &&
      cached.baseCurrency === baseCurrency &&
      !isRatesExpired(cached.timestamp)
    ) {
      return cached.rates;
    }

    // Fetch from free API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    const rates = data.rates as Record<string, number>;

    // Cache the rates
    await cacheRates(rates, baseCurrency);

    return rates;
  } catch (error) {
    logger.exchange.warn('Error fetching exchange rates, using fallback:', error);
    return convertFallbackRates(baseCurrency);
  }
};

// Convert amount from one currency to another
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Convert: amount -> USD -> target currency
  const amountInBase = amount / fromRate;
  const convertedAmount = amountInBase * toRate;

  return convertedAmount;
};

// Get rate between two currencies
export const getExchangeRate = (
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) return 1;

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  return toRate / fromRate;
};

// Cache helpers
const getCachedRates = async (): Promise<ExchangeRatesCache | null> => {
  try {
    const cached = await AsyncStorage.getItem(EXCHANGE_RATES_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const cacheRates = async (
  rates: Record<string, number>,
  baseCurrency: string
): Promise<void> => {
  try {
    const cache: ExchangeRatesCache = {
      rates,
      baseCurrency,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(cache));
  } catch (error) {
    logger.exchange.error('Error caching exchange rates:', error);
  }
};

const isRatesExpired = (timestamp: number): boolean => {
  return Date.now() - timestamp > RATES_CACHE_DURATION;
};

const convertFallbackRates = (baseCurrency: string): Record<string, number> => {
  const baseRate = FALLBACK_RATES[baseCurrency] || 1;
  const converted: Record<string, number> = {};

  for (const [currency, rate] of Object.entries(FALLBACK_RATES)) {
    converted[currency] = rate / baseRate;
  }

  return converted;
};

// Get fallback rates directly (for initial load)
export const getFallbackRates = (): Record<string, number> => {
  return { ...FALLBACK_RATES };
};
