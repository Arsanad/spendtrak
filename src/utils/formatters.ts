/**
 * Formatting Utilities for SpendTrak
 * Currency, date, and number formatting functions
 */

import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { getCurrentLocale } from './locale';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Currency info with language-specific symbols
 */
interface CurrencyInfo {
  symbolEn: string;
  symbolAr: string;
  position: 'before' | 'after';
  name: string;
}

/**
 * Supported currencies with their symbols and formatting preferences
 * Includes both English and Arabic symbols for currencies that have Arabic representations
 */
export const SUPPORTED_CURRENCIES_DATA: Record<string, CurrencyInfo> = {
  USD: { symbolEn: '$', symbolAr: '$', position: 'before', name: 'US Dollar' },
  EUR: { symbolEn: '€', symbolAr: '€', position: 'before', name: 'Euro' },
  GBP: { symbolEn: '£', symbolAr: '£', position: 'before', name: 'British Pound' },
  JPY: { symbolEn: '¥', symbolAr: '¥', position: 'before', name: 'Japanese Yen' },
  CNY: { symbolEn: '¥', symbolAr: '¥', position: 'before', name: 'Chinese Yuan' },
  INR: { symbolEn: '₹', symbolAr: '₹', position: 'before', name: 'Indian Rupee' },
  AUD: { symbolEn: 'A$', symbolAr: 'A$', position: 'before', name: 'Australian Dollar' },
  CAD: { symbolEn: 'C$', symbolAr: 'C$', position: 'before', name: 'Canadian Dollar' },
  CHF: { symbolEn: 'CHF', symbolAr: 'CHF', position: 'before', name: 'Swiss Franc' },
  HKD: { symbolEn: 'HK$', symbolAr: 'HK$', position: 'before', name: 'Hong Kong Dollar' },
  SGD: { symbolEn: 'S$', symbolAr: 'S$', position: 'before', name: 'Singapore Dollar' },
  SEK: { symbolEn: 'kr', symbolAr: 'kr', position: 'after', name: 'Swedish Krona' },
  NOK: { symbolEn: 'kr', symbolAr: 'kr', position: 'after', name: 'Norwegian Krone' },
  DKK: { symbolEn: 'kr', symbolAr: 'kr', position: 'after', name: 'Danish Krone' },
  NZD: { symbolEn: 'NZ$', symbolAr: 'NZ$', position: 'before', name: 'New Zealand Dollar' },
  MXN: { symbolEn: 'MX$', symbolAr: 'MX$', position: 'before', name: 'Mexican Peso' },
  BRL: { symbolEn: 'R$', symbolAr: 'R$', position: 'before', name: 'Brazilian Real' },
  KRW: { symbolEn: '₩', symbolAr: '₩', position: 'before', name: 'South Korean Won' },
  RUB: { symbolEn: '₽', symbolAr: '₽', position: 'after', name: 'Russian Ruble' },
  ZAR: { symbolEn: 'R', symbolAr: 'R', position: 'before', name: 'South African Rand' },
  TRY: { symbolEn: '₺', symbolAr: '₺', position: 'before', name: 'Turkish Lira' },
  PLN: { symbolEn: 'zł', symbolAr: 'zł', position: 'after', name: 'Polish Zloty' },
  THB: { symbolEn: '฿', symbolAr: '฿', position: 'before', name: 'Thai Baht' },
  IDR: { symbolEn: 'Rp', symbolAr: 'Rp', position: 'before', name: 'Indonesian Rupiah' },
  MYR: { symbolEn: 'RM', symbolAr: 'RM', position: 'before', name: 'Malaysian Ringgit' },
  PHP: { symbolEn: '₱', symbolAr: '₱', position: 'before', name: 'Philippine Peso' },
  AED: { symbolEn: 'AED', symbolAr: 'د.إ', position: 'before', name: 'UAE Dirham' },
  SAR: { symbolEn: 'SAR', symbolAr: 'ر.س', position: 'before', name: 'Saudi Riyal' },
  EGP: { symbolEn: 'EGP', symbolAr: 'ج.م', position: 'before', name: 'Egyptian Pound' },
  NGN: { symbolEn: '₦', symbolAr: '₦', position: 'before', name: 'Nigerian Naira' },
  KES: { symbolEn: 'KSh', symbolAr: 'KSh', position: 'before', name: 'Kenyan Shilling' },
  PKR: { symbolEn: '₨', symbolAr: '₨', position: 'before', name: 'Pakistani Rupee' },
  BDT: { symbolEn: '৳', symbolAr: '৳', position: 'before', name: 'Bangladeshi Taka' },
  VND: { symbolEn: '₫', symbolAr: '₫', position: 'after', name: 'Vietnamese Dong' },
  COP: { symbolEn: 'COL$', symbolAr: 'COL$', position: 'before', name: 'Colombian Peso' },
  ARS: { symbolEn: 'AR$', symbolAr: 'AR$', position: 'before', name: 'Argentine Peso' },
  CLP: { symbolEn: 'CLP$', symbolAr: 'CLP$', position: 'before', name: 'Chilean Peso' },
  PEN: { symbolEn: 'S/', symbolAr: 'S/', position: 'before', name: 'Peruvian Sol' },
  ILS: { symbolEn: '₪', symbolAr: '₪', position: 'before', name: 'Israeli Shekel' },
  CZK: { symbolEn: 'Kč', symbolAr: 'Kč', position: 'after', name: 'Czech Koruna' },
  HUF: { symbolEn: 'Ft', symbolAr: 'Ft', position: 'after', name: 'Hungarian Forint' },
  RON: { symbolEn: 'lei', symbolAr: 'lei', position: 'after', name: 'Romanian Leu' },
  QAR: { symbolEn: 'QAR', symbolAr: 'ر.ق', position: 'before', name: 'Qatari Riyal' },
  KWD: { symbolEn: 'KWD', symbolAr: 'د.ك', position: 'before', name: 'Kuwaiti Dinar' },
  BHD: { symbolEn: 'BHD', symbolAr: 'د.ب', position: 'before', name: 'Bahraini Dinar' },
  OMR: { symbolEn: 'OMR', symbolAr: 'ر.ع', position: 'before', name: 'Omani Rial' },
};

/**
 * Get currency symbol based on language
 */
export const getCurrencySymbolByLanguage = (currency: string, language: string = 'en'): string => {
  const currencyInfo = SUPPORTED_CURRENCIES_DATA[currency];
  if (!currencyInfo) return currency;
  return language === 'ar' ? currencyInfo.symbolAr : currencyInfo.symbolEn;
};

/**
 * Legacy SUPPORTED_CURRENCIES for backward compatibility
 * Uses English symbols by default
 */
export const SUPPORTED_CURRENCIES: Record<string, { symbol: string; position: 'before' | 'after'; name: string }> =
  Object.fromEntries(
    Object.entries(SUPPORTED_CURRENCIES_DATA).map(([code, info]) => [
      code,
      { symbol: info.symbolEn, position: info.position, name: info.name }
    ])
  );

/**
 * Get list of currency options for picker
 */
export function getCurrencyOptions(): { label: string; value: string; symbol: string }[] {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    label: `${code} - ${info.name}`,
    value: code,
    symbol: info.symbol,
  }));
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
  /** Override language for symbol selection */
  language?: string;
}

/**
 * Format currency amount
 * Uses the current app language to determine the appropriate symbol
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'USD')
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options: CurrencyFormatOptions = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false,
    language,
  } = options;

  // Get the current app language
  const appLanguage = language || useSettingsStore.getState().language || 'en';

  // Get currency info with language-aware symbol
  const currencyData = SUPPORTED_CURRENCIES_DATA[currency] || {
    symbolEn: currency,
    symbolAr: currency,
    position: 'before' as const,
    name: currency
  };

  // Select the appropriate symbol based on language
  const symbol = appLanguage === 'ar' ? currencyData.symbolAr : currencyData.symbolEn;

  // Handle compact format for large numbers
  if (compact) {
    if (amount >= 1000000) {
      const displaySymbol = showSymbol ? symbol : '';
      const value = (amount / 1000000).toFixed(1);
      // For Arabic, always put symbol after; for English, put before
      if (appLanguage === 'ar') {
        return `${value}M ${displaySymbol}`.trim();
      }
      return `${displaySymbol} ${value}M`.trim();
    }
    if (amount >= 1000) {
      const displaySymbol = showSymbol ? symbol : '';
      const value = (amount / 1000).toFixed(1);
      if (appLanguage === 'ar') {
        return `${value}K ${displaySymbol}`.trim();
      }
      return `${displaySymbol} ${value}K`.trim();
    }
  }

  // Format the number
  const formattedNumber = amount.toLocaleString(getCurrentLocale(), {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  // Build the result
  if (showCode) {
    return `${currency} ${formattedNumber}`;
  }

  if (showSymbol) {
    // For Arabic language, put symbol after the number
    if (appLanguage === 'ar') {
      return `${formattedNumber} ${symbol}`;
    }
    // For English and other languages, put symbol before with a space
    return `${symbol} ${formattedNumber}`;
  }

  return formattedNumber;
}

/**
 * Format date
 * @param date - Date to format (string, Date, or timestamp)
 * @param formatString - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  formatString: string = 'MMM d, yyyy'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  return format(dateObj, formatString);
}

/**
 * Format relative date (e.g., "2 hours ago", "Yesterday", "Last week")
 * @param date - Date to format
 * @returns Relative date string
 */
export function formatRelativeDate(date: string | Date | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  // If today, show time
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  }

  // If yesterday
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'h:mm a')}`;
  }

  // If this week
  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE'); // Day name
  }

  // If this year
  if (isThisYear(dateObj)) {
    return format(dateObj, 'MMM d');
  }

  // Otherwise, full date
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: string | Date | number,
  options: { addSuffix?: boolean } = { addSuffix: true }
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  return formatDistanceToNow(dateObj, options);
}

/**
 * Format percentage
 * @param value - Value to format (0-100 or 0-1)
 * @param options - Formatting options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  options: {
    isDecimal?: boolean;
    showSign?: boolean;
    decimals?: number;
  } = {}
): string {
  const { isDecimal = false, showSign = false, decimals = 1 } = options;

  // Convert to percentage if decimal
  const percentage = isDecimal ? value * 100 : value;

  // Format the number
  const formatted = percentage.toFixed(decimals);

  // Add sign if needed
  const sign = showSign && percentage > 0 ? '+' : '';

  return `${sign}${formatted}%`;
}

/**
 * Format number with commas
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString(getCurrentLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format card number (mask all but last 4)
 * @param cardNumber - Full or partial card number
 * @returns Masked card number
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length <= 4) {
    return `•••• ${cleaned}`;
  }

  const lastFour = cleaned.slice(-4);
  return `•••• •••• •••• ${lastFour}`;
}

/**
 * Format phone number (generic international format)
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // If it starts with a country code (10+ digits), format internationally
  if (cleaned.length >= 10) {
    // Try to format as: +X XXX XXX XXXX or similar
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    // Generic international format
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
  }

  // Return as-is if doesn't match
  return phone;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format file size
 * @param bytes - Size in bytes
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Format subscription frequency
 * @param frequency - Subscription frequency
 * @returns Human-readable frequency
 */
export function formatFrequency(frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): string {
  const frequencies: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  return frequencies[frequency] || frequency;
}

/**
 * Format duration in days
 * @param days - Number of days
 * @returns Human-readable duration
 */
export function formatDuration(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days === 7) return '1 week';
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 60) return '1 month';
  if (days < 365) return `${Math.floor(days / 30)} months`;
  if (days < 730) return '1 year';
  return `${Math.floor(days / 365)} years`;
}

/**
 * Capitalize first letter
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format merchant name (clean up and capitalize)
 * @param name - Raw merchant name
 * @returns Cleaned merchant name
 */
export function formatMerchantName(name: string): string {
  if (!name) return 'Unknown Merchant';

  // Remove extra whitespace and common prefixes/suffixes
  let cleaned = name
    .replace(/\s+/g, ' ')
    .replace(/^(payment to|paid to|purchase at|transaction at)\s*/i, '')
    .replace(/\s*(llc|ltd|inc|corp|co|gmbh|ag|sa|nv|bv|plc)\.?$/i, '')
    .trim();

  // Capitalize each word
  cleaned = cleaned
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');

  return cleaned || 'Unknown Merchant';
}

export default {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatRelativeTime,
  formatPercentage,
  formatNumber,
  formatCardNumber,
  formatPhoneNumber,
  truncateText,
  formatFileSize,
  formatFrequency,
  formatDuration,
  capitalize,
  formatMerchantName,
  getCurrencyOptions,
  SUPPORTED_CURRENCIES,
};
