/**
 * Locale Utilities for SpendTrak
 * Maps language codes to locale codes for Intl formatting
 */

import { useSettingsStore } from '../stores/settingsStore';

const languageToLocale: Record<string, string> = {
  en: 'en-US',
  ar: 'ar-SA',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  hi: 'hi-IN',
  ur: 'ur-PK',
  zh: 'zh-CN',
  ja: 'ja-JP',
  pt: 'pt-BR',
  ru: 'ru-RU',
  tr: 'tr-TR',
};

/**
 * Get the current locale based on the user's language setting.
 * Safe to call from both React components and plain service files.
 */
export function getCurrentLocale(): string {
  const languageCode = useSettingsStore.getState().language;
  return languageToLocale[languageCode] || 'en-US';
}

/**
 * Convert a language code to a locale string.
 */
export function getLocaleFromCode(languageCode: string): string {
  return languageToLocale[languageCode] || 'en-US';
}
