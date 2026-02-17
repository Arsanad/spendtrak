/**
 * Currency Formatting Utilities
 * Provides functions to format currency values based on user settings and language
 */

import { useSettingsStore } from '../stores/settingsStore';
import { getCurrencySymbolForLanguage } from '../config/currencies';

/**
 * Get the appropriate currency symbol based on current app language
 * @param currencyCode - The currency code (e.g., 'AED')
 * @returns The localized currency symbol
 */
export const getLocalizedCurrencySymbol = (currencyCode: string): string => {
  const language = useSettingsStore.getState().language || 'en';
  return getCurrencySymbolForLanguage(currencyCode, language);
};

/**
 * Format a number as currency using the app's selected currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  currencySymbol: string,
  options?: {
    showSign?: boolean; // Show + or - sign
    showCode?: boolean; // Show currency code instead of symbol
    compact?: boolean;  // Use compact notation (e.g., 1.2K, 1.5M)
    decimals?: number;  // Number of decimal places
    language?: string;  // Override language for symbol selection
  }
): string => {
  const { showSign = false, showCode = false, compact = false, decimals = 2, language } = options || {};

  // Get the current app language
  const appLanguage = language || useSettingsStore.getState().language || 'en';

  // Get the localized symbol based on language
  const localizedSymbol = getCurrencySymbolForLanguage(currencyCode, appLanguage);

  // Handle compact notation
  let formattedValue: string;
  let suffix = '';

  if (compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1000000000) {
      formattedValue = (amount / 1000000000).toFixed(1);
      suffix = 'B';
    } else if (Math.abs(amount) >= 1000000) {
      formattedValue = (amount / 1000000).toFixed(1);
      suffix = 'M';
    } else if (Math.abs(amount) >= 1000) {
      formattedValue = (amount / 1000).toFixed(1);
      suffix = 'K';
    } else {
      formattedValue = amount.toFixed(decimals);
    }
  } else {
    formattedValue = Math.abs(amount).toFixed(decimals);
  }

  // Add thousand separators
  const parts = formattedValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  formattedValue = parts.join('.') + suffix;

  // Build the final string
  const currencyPart = showCode ? currencyCode : localizedSymbol;
  const sign = showSign ? (amount >= 0 ? '+' : '-') : (amount < 0 ? '-' : '');

  // For Arabic language, put symbol after the number
  // For English and other languages, put symbol before the number
  if (appLanguage === 'ar') {
    return `${sign}${formattedValue} ${currencyPart}`;
  }

  return `${sign}${currencyPart} ${formattedValue}`;
};

/**
 * Hook to get currency formatting function with current settings
 * Automatically uses the correct symbol based on current language
 */
export const useCurrencyFormatter = () => {
  const { currency, language } = useSettingsStore();

  // Get the localized symbol based on current language
  const localizedSymbol = getCurrencySymbolForLanguage(currency, language || 'en');

  const format = (
    amount: number,
    options?: {
      showSign?: boolean;
      showCode?: boolean;
      compact?: boolean;
      decimals?: number;
    }
  ) => {
    return formatCurrency(amount, currency, localizedSymbol, { ...options, language });
  };

  return {
    format,
    currency,
    currencySymbol: localizedSymbol,
    language,
  };
};

/**
 * Get currency symbol by code (language-aware)
 * Uses the current app language to determine the appropriate symbol
 * @param code - Currency code (e.g., 'AED', 'USD')
 * @param language - Optional language override
 */
export const getCurrencySymbol = (code: string, language?: string): string => {
  const appLanguage = language || useSettingsStore.getState().language || 'en';

  // Language-specific symbols for currencies with Arabic representations
  const symbolsEn: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', CHF: 'CHF',
    AUD: 'A$', CAD: 'C$', HKD: 'HK$', SGD: 'S$', NZD: 'NZ$',
    AED: 'AED', SAR: 'SAR', QAR: 'QAR', KWD: 'KWD', BHD: 'BHD',
    OMR: 'OMR', JOD: 'JOD', EGP: 'EGP', MAD: 'MAD', TND: 'TND',
    INR: '₹', PKR: '₨', BDT: '৳', THB: '฿', MYR: 'RM', IDR: 'Rp',
    PHP: '₱', VND: '₫', KRW: '₩', TWD: 'NT$', RUB: '₽', UAH: '₴',
    PLN: 'zł', CZK: 'Kč', HUF: 'Ft', TRY: '₺', BRL: 'R$', MXN: '$',
    ZAR: 'R', NGN: '₦', KES: 'KSh', GHS: 'GH₵', BTC: '₿', ETH: 'Ξ',
  };

  const symbolsAr: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', CHF: 'CHF',
    AUD: 'A$', CAD: 'C$', HKD: 'HK$', SGD: 'S$', NZD: 'NZ$',
    AED: 'د.إ', SAR: 'ر.س', QAR: 'ر.ق', KWD: 'د.ك', BHD: 'د.ب',
    OMR: 'ر.ع', JOD: 'د.أ', EGP: 'ج.م', MAD: 'د.م', TND: 'د.ت',
    INR: '₹', PKR: '₨', BDT: '৳', THB: '฿', MYR: 'RM', IDR: 'Rp',
    PHP: '₱', VND: '₫', KRW: '₩', TWD: 'NT$', RUB: '₽', UAH: '₴',
    PLN: 'zł', CZK: 'Kč', HUF: 'Ft', TRY: '₺', BRL: 'R$', MXN: '$',
    ZAR: 'R', NGN: '₦', KES: 'KSh', GHS: 'GH₵', BTC: '₿', ETH: 'Ξ',
  };

  const symbols = appLanguage === 'ar' ? symbolsAr : symbolsEn;
  return symbols[code] || code;
};

export default { formatCurrency, useCurrencyFormatter, getCurrencySymbol, getLocalizedCurrencySymbol };
