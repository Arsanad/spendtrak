/**
 * Currency Converter Service
 * Converts amounts between currencies using real-time exchange rates
 */

import { logger } from '@/utils/logger';

// Exchange rate API - Free tier with reasonable limits
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

// Cache for exchange rates (valid for 1 hour)
interface RateCache {
  rates: Record<string, number>;
  baseCurrency: string;
  timestamp: number;
}

let rateCache: RateCache | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch exchange rates for a base currency
 */
async function fetchExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  // Check cache first
  if (
    rateCache &&
    rateCache.baseCurrency === baseCurrency &&
    Date.now() - rateCache.timestamp < CACHE_DURATION
  ) {
    return rateCache.rates;
  }

  try {
    const response = await fetch(`${EXCHANGE_RATE_API_URL}/${baseCurrency}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data = await response.json();

    // Cache the rates
    rateCache = {
      rates: data.rates,
      baseCurrency,
      timestamp: Date.now(),
    };

    return data.rates;
  } catch (error) {
    logger.currency.error('Failed to fetch exchange rates:', error);
    throw error;
  }
}

/**
 * Get the exchange rate between two currencies
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rates = await fetchExchangeRates(fromCurrency);
  const rate = rates[toCurrency];

  if (!rate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  }

  return rate;
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = amount * rate;

  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Convert currency with result details
 */
export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  timestamp: Date;
}

export async function convertCurrencyWithDetails(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = Math.round(amount * rate * 100) / 100;

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount,
    targetCurrency: toCurrency,
    exchangeRate: rate,
    timestamp: new Date(),
  };
}

/**
 * Clear the exchange rate cache
 */
export function clearRateCache(): void {
  rateCache = null;
}

/**
 * Check if rates are cached and fresh
 */
export function hasValidCache(): boolean {
  return !!(
    rateCache && Date.now() - rateCache.timestamp < CACHE_DURATION
  );
}

/**
 * Get cached rates info (for debugging/display)
 */
export function getCacheInfo(): { baseCurrency: string; age: number } | null {
  if (!rateCache) return null;

  return {
    baseCurrency: rateCache.baseCurrency,
    age: Math.round((Date.now() - rateCache.timestamp) / 1000 / 60), // age in minutes
  };
}

export default {
  getExchangeRate,
  convertCurrency,
  convertCurrencyWithDetails,
  clearRateCache,
  hasValidCache,
  getCacheInfo,
};
