// SPENDTRAK - Supported Currencies Configuration
// ISO 4217 currency codes with formatting options

export interface Currency {
  code: string;
  symbol: string;
  /** Symbol to use when app language is English */
  symbolEn: string;
  /** Symbol to use when app language is Arabic */
  symbolAr: string;
  name: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
  decimalDigits: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'AED',
    symbol: 'AED', // Default to English
    symbolEn: 'AED',
    symbolAr: 'د.إ',
    name: 'UAE Dirham',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'USD',
    symbol: '$',
    symbolEn: '$',
    symbolAr: '$',
    name: 'US Dollar',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'EUR',
    symbol: '€',
    symbolEn: '€',
    symbolAr: '€',
    name: 'Euro',
    symbolPosition: 'before',
    decimalSeparator: ',',
    thousandSeparator: '.',
    decimalDigits: 2,
  },
  {
    code: 'GBP',
    symbol: '£',
    symbolEn: '£',
    symbolAr: '£',
    name: 'British Pound',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'SAR',
    symbol: 'SAR',
    symbolEn: 'SAR',
    symbolAr: 'ر.س',
    name: 'Saudi Riyal',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'QAR',
    symbol: 'QAR',
    symbolEn: 'QAR',
    symbolAr: 'ر.ق',
    name: 'Qatari Riyal',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'KWD',
    symbol: 'KWD',
    symbolEn: 'KWD',
    symbolAr: 'د.ك',
    name: 'Kuwaiti Dinar',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 3,
  },
  {
    code: 'BHD',
    symbol: 'BHD',
    symbolEn: 'BHD',
    symbolAr: 'د.ب',
    name: 'Bahraini Dinar',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 3,
  },
  {
    code: 'OMR',
    symbol: 'OMR',
    symbolEn: 'OMR',
    symbolAr: 'ر.ع',
    name: 'Omani Rial',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 3,
  },
  {
    code: 'EGP',
    symbol: 'EGP',
    symbolEn: 'EGP',
    symbolAr: 'ج.م',
    name: 'Egyptian Pound',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'INR',
    symbol: '₹',
    symbolEn: '₹',
    symbolAr: '₹',
    name: 'Indian Rupee',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'PKR',
    symbol: '₨',
    symbolEn: '₨',
    symbolAr: '₨',
    name: 'Pakistani Rupee',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'JPY',
    symbol: '¥',
    symbolEn: '¥',
    symbolAr: '¥',
    name: 'Japanese Yen',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 0,
  },
  {
    code: 'CNY',
    symbol: '¥',
    symbolEn: '¥',
    symbolAr: '¥',
    name: 'Chinese Yuan',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'CHF',
    symbol: 'CHF',
    symbolEn: 'CHF',
    symbolAr: 'CHF',
    name: 'Swiss Franc',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: "'",
    decimalDigits: 2,
  },
  {
    code: 'CAD',
    symbol: 'C$',
    symbolEn: 'C$',
    symbolAr: 'C$',
    name: 'Canadian Dollar',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    symbolEn: 'A$',
    symbolAr: 'A$',
    name: 'Australian Dollar',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalDigits: 2,
  },
];

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES.find(c => c.code === 'AED')!;

export const getCurrencyByCode = (code: string): Currency => {
  return SUPPORTED_CURRENCIES.find(c => c.code === code) || DEFAULT_CURRENCY;
};

/**
 * Get the appropriate currency symbol based on the app language
 * @param code - Currency code (e.g., 'AED')
 * @param language - App language ('en', 'ar', etc.)
 * @returns The localized currency symbol
 */
export const getCurrencySymbolForLanguage = (code: string, language: string): string => {
  const currency = getCurrencyByCode(code);
  if (language === 'ar') {
    return currency.symbolAr;
  }
  return currency.symbolEn;
};
