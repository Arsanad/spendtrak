// SPENDTRAK - Global Language Context
// Manages language selection, translations, and RTL support across the app

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, I18nManager } from 'react-native';
import { logger } from '@/utils/logger';
import * as Updates from 'expo-updates';
import {
  Language,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageByCode,
  isRTL as checkIsRTL,
} from '../config/languages';
import { translations, TranslationKeys, getTranslation } from '../translations';

const LANGUAGE_STORAGE_KEY = 'spendtrak_language_preference';

interface LanguageContextType {
  // Current language
  language: Language;

  // Current language code
  languageCode: string;

  // Is RTL
  isRTL: boolean;

  // Loading state
  isLoading: boolean;

  // Translation function
  t: (key: string, params?: Record<string, string | number>) => string;

  // Change language
  setLanguage: (languageCode: string) => Promise<void>;

  // Get all supported languages
  supportedLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [currentTranslations, setCurrentTranslations] = useState<TranslationKeys>(translations.en as TranslationKeys);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      setIsLoading(true);
      try {
        const savedLanguageCode = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguageCode) {
          const savedLanguage = getLanguageByCode(savedLanguageCode);
          setLanguageState(savedLanguage);
          setCurrentTranslations(getTranslation(savedLanguageCode) as TranslationKeys);

          // Ensure RTL is set correctly on load
          const shouldBeRTL = checkIsRTL(savedLanguageCode);
          if (I18nManager.isRTL !== shouldBeRTL) {
            I18nManager.allowRTL(shouldBeRTL);
            I18nManager.forceRTL(shouldBeRTL);
          }
        }
      } catch (error) {
        logger.language.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Change language
  const setLanguage = useCallback(async (languageCode: string) => {
    const newLanguage = getLanguageByCode(languageCode);
    const newIsRTL = checkIsRTL(languageCode);
    const currentIsRTL = I18nManager.isRTL;

    // Update state
    setLanguageState(newLanguage);
    setCurrentTranslations(getTranslation(languageCode) as TranslationKeys);

    // Save preference
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    } catch (error) {
      logger.language.error('Error saving language preference:', error);
    }

    // FIX 9: Handle RTL change - requires app restart with user notification
    if (newIsRTL !== currentIsRTL) {
      I18nManager.allowRTL(newIsRTL);
      I18nManager.forceRTL(newIsRTL);

      // Show restart notification to user
      const restartTitle = newLanguage.code === 'ar' || newLanguage.code === 'he' || newLanguage.code === 'ur'
        ? 'إعادة تشغيل مطلوبة'  // Arabic/Hebrew/Urdu: "Restart Required"
        : 'Restart Required';
      const restartMessage = newLanguage.code === 'ar' || newLanguage.code === 'he' || newLanguage.code === 'ur'
        ? 'يتطلب تغيير اتجاه النص إعادة تشغيل التطبيق. هل تريد إعادة التشغيل الآن؟'
        : 'Changing text direction requires an app restart to take effect. Restart now?';
      const restartNow = newLanguage.code === 'ar' || newLanguage.code === 'he' || newLanguage.code === 'ur'
        ? 'إعادة التشغيل الآن'
        : 'Restart Now';
      const later = newLanguage.code === 'ar' || newLanguage.code === 'he' || newLanguage.code === 'ur'
        ? 'لاحقاً'
        : 'Later';

      Alert.alert(
        restartTitle,
        restartMessage,
        [
          {
            text: later,
            style: 'cancel',
          },
          {
            text: restartNow,
            onPress: async () => {
              try {
                if (Updates.reloadAsync) {
                  await Updates.reloadAsync();
                }
              } catch (error) {
                logger.language.error('Error reloading app for RTL change:', error);
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, []);

  // Helper to resolve a dot-notation key from a translations object
  const resolveKey = useCallback((obj: Record<string, unknown>, key: string): string | undefined => {
    const keys = key.split('.');
    let value: unknown = obj;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return typeof value === 'string' ? value : undefined;
  }, []);

  // Translation function with interpolation and pluralization support
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let resolvedKey = key;

    // FIX 8: Pluralization support - handle _one/_other suffixes
    // If params contains 'count', check for pluralized keys
    if (params && typeof params.count === 'number') {
      const count = params.count;
      // Use _one for count === 1, _other for all other values
      const pluralSuffix = count === 1 ? '_one' : '_other';
      const pluralKey = `${key}${pluralSuffix}`;

      // Check if the pluralized key exists
      const pluralValue = resolveKey(currentTranslations, pluralKey) || resolveKey(translations.en, pluralKey);
      if (pluralValue !== undefined) {
        resolvedKey = pluralKey;
      }
    }

    // Try current language first, then fall back to English
    let value = resolveKey(currentTranslations, resolvedKey);
    if (value === undefined) {
      value = resolveKey(translations.en, resolvedKey);
    }
    if (value === undefined) {
      // Try original key if plural key wasn't found
      value = resolveKey(currentTranslations, key) || resolveKey(translations.en, key);
    }
    if (value === undefined) {
      logger.language.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Handle interpolation (e.g., "Hello {{name}}")
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || `{{${paramKey}}}`;
      });
    }

    return value;
  }, [currentTranslations, resolveKey]);

  const contextValue = useMemo<LanguageContextType>(() => ({
    language,
    languageCode: language.code,
    isRTL: language.direction === 'rtl',
    isLoading,
    t,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  }), [language, isLoading, t, setLanguage]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Shorthand hook for just the translation function
export const useTranslation = () => {
  const { t, isRTL, languageCode } = useLanguage();
  return { t, isRTL, languageCode };
};

// Export types
export type { LanguageContextType };
