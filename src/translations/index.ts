// SPENDTRAK - Translations Index
// Exports all translations and utility functions

import { en, TranslationKeys } from './en';
import { ar } from './ar';
import { fr } from './fr';
import { es } from './es';
import { de } from './de';
import { hi } from './hi';
import { ur } from './ur';
import { zh } from './zh';
import { ja } from './ja';
import { pt } from './pt';
import { ru } from './ru';
import { tr } from './tr';

export type { TranslationKeys };

// DeepPartial allows non-English translations to omit keys that haven't been translated yet.
// At runtime, the app falls back to English for any missing keys.
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const translations: Record<string, DeepPartial<TranslationKeys>> = {
  en,
  ar,
  fr,
  es,
  de,
  hi,
  ur,
  zh,
  ja,
  pt,
  ru,
  tr,
};

export const getTranslation = (languageCode: string): DeepPartial<TranslationKeys> => {
  return translations[languageCode] || translations.en;
};

// Re-export individual translations for direct access if needed
export { en, ar, fr, es, de, hi, ur, zh, ja, pt, ru, tr };
