// SPENDTRAK - Global Currency Context
// Manages currency selection, conversion, and formatting across the app

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import {
  Currency,
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencyByCode,
  getCurrencySymbolForLanguage,
} from '../config/currencies';
import { useSettingsStore } from '../stores/settingsStore';
import {
  fetchExchangeRates,
  convertCurrency as convertAmount,
  getFallbackRates,
} from '../services/exchangeRates';

const CURRENCY_STORAGE_KEY = 'spendtrak_selected_currency';

interface CurrencyContextType {
  // Current currency
  currency: Currency;
  currencyCode: string;
  currencySymbol: string;

  // All supported currencies
  supportedCurrencies: Currency[];

  // Exchange rates (base: USD)
  exchangeRates: Record<string, number>;
  ratesLoading: boolean;
  ratesError: string | null;

  // Actions
  setCurrency: (code: string) => Promise<void>;
  refreshRates: () => Promise<void>;

  // Conversion helpers
  convert: (amount: number, fromCurrency: string) => number;
  convertFromBase: (amount: number) => number;
  convertToBase: (amount: number) => number;

  // Formatting helpers
  format: (amount: number, options?: FormatOptions) => string;
  formatWithCode: (amount: number) => string;
  formatCompact: (amount: number) => string;
}

interface FormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  decimals?: number;
  compact?: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(getFallbackRates());
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Get current language from settings store
  const language = useSettingsStore((state) => state.language) || 'en';

  // Get the language-aware symbol
  const localizedSymbol = useMemo(() => {
    return getCurrencySymbolForLanguage(currency.code, language);
  }, [currency.code, language]);

  // Load saved currency on mount
  useEffect(() => {
    const loadSavedCurrency = async () => {
      try {
        const savedCode = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (savedCode) {
          const savedCurrency = getCurrencyByCode(savedCode);
          setCurrencyState(savedCurrency);
        }
      } catch (error) {
        logger.currency.error('Error loading saved currency:', error);
      }
    };

    loadSavedCurrency();
  }, []);

  // Fetch exchange rates on mount
  useEffect(() => {
    refreshRates();
  }, []);

  // Refresh exchange rates
  const refreshRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(null);

    try {
      const rates = await fetchExchangeRates('USD');
      setExchangeRates(rates);
    } catch (error) {
      logger.currency.error('Error fetching exchange rates:', error);
      setRatesError('Failed to fetch exchange rates');
      // Fallback rates are already set
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Set currency and persist
  const setCurrency = useCallback(async (code: string) => {
    const newCurrency = getCurrencyByCode(code);
    setCurrencyState(newCurrency);

    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch (error) {
      logger.currency.error('Error saving currency preference:', error);
    }
  }, []);

  // Convert from any currency to the current currency
  const convert = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (fromCurrency === currency.code) return amount;
      return convertAmount(amount, fromCurrency, currency.code, exchangeRates);
    },
    [currency.code, exchangeRates]
  );

  // Convert from base currency (USD) to current currency
  const convertFromBase = useCallback(
    (amount: number): number => {
      return convert(amount, 'USD');
    },
    [convert]
  );

  // Convert from current currency to base currency (USD)
  const convertToBase = useCallback(
    (amount: number): number => {
      if (currency.code === 'USD') return amount;
      return convertAmount(amount, currency.code, 'USD', exchangeRates);
    },
    [currency.code, exchangeRates]
  );

  // Format amount with current currency
  // Uses language-aware symbol positioning
  const format = useCallback(
    (amount: number, options: FormatOptions = {}): string => {
      const {
        showSymbol = true,
        showCode = false,
        decimals = currency.decimalDigits,
        compact = false,
      } = options;

      let formattedAmount: string;

      if (compact && Math.abs(amount) >= 1000) {
        // Compact formatting for large numbers
        const absAmount = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';

        if (absAmount >= 1000000000) {
          formattedAmount = `${sign}${(absAmount / 1000000000).toFixed(1)}B`;
        } else if (absAmount >= 1000000) {
          formattedAmount = `${sign}${(absAmount / 1000000).toFixed(1)}M`;
        } else if (absAmount >= 1000) {
          formattedAmount = `${sign}${(absAmount / 1000).toFixed(1)}K`;
        } else {
          formattedAmount = amount.toFixed(decimals);
        }
      } else {
        // Standard formatting with thousand separators
        const parts = amount.toFixed(decimals).split('.');
        const integerPart = parts[0].replace(
          /\B(?=(\d{3})+(?!\d))/g,
          currency.thousandSeparator
        );
        formattedAmount = parts[1]
          ? `${integerPart}${currency.decimalSeparator}${parts[1]}`
          : integerPart;
      }

      // Determine symbol position based on language
      // For Arabic, always put symbol after the number
      // For English and other languages, put symbol before with a space
      const symbolPosition = language === 'ar' ? 'after' : 'before';

      // Add symbol or code using language-aware symbol
      if (showSymbol && showCode) {
        return symbolPosition === 'before'
          ? `${localizedSymbol} ${formattedAmount} ${currency.code}`
          : `${formattedAmount} ${localizedSymbol} ${currency.code}`;
      } else if (showSymbol) {
        return symbolPosition === 'before'
          ? `${localizedSymbol} ${formattedAmount}`
          : `${formattedAmount} ${localizedSymbol}`;
      } else if (showCode) {
        return `${formattedAmount} ${currency.code}`;
      }

      return formattedAmount;
    },
    [currency, localizedSymbol, language]
  );

  // Format with currency code
  const formatWithCode = useCallback(
    (amount: number): string => {
      return format(amount, { showSymbol: true, showCode: true });
    },
    [format]
  );

  // Format compact (for charts, summaries)
  const formatCompact = useCallback(
    (amount: number): string => {
      return format(amount, { compact: true });
    },
    [format]
  );

  const contextValue: CurrencyContextType = {
    currency,
    currencyCode: currency.code,
    currencySymbol: localizedSymbol, // Use language-aware symbol
    supportedCurrencies: SUPPORTED_CURRENCIES,
    exchangeRates,
    ratesLoading,
    ratesError,
    setCurrency,
    refreshRates,
    convert,
    convertFromBase,
    convertToBase,
    format,
    formatWithCode,
    formatCompact,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use currency context
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// Export types for use in other files
export type { CurrencyContextType, FormatOptions };
