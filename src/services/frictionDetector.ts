/**
 * SpendTrak Contextual Upgrade Engine
 * Friction Detector - Detects 10 friction patterns (pure functions, no side effects)
 */

import type { FrictionContext, FrictionCounters } from '@/types/upgrade';

// ============================================
// THRESHOLD CONSTANTS
// ============================================

export const FRICTION_THRESHOLDS = {
  /** Manual entries before fatigue detection */
  MANUAL_ENTRY_MIN: 3,
  /** Same category repeats before detection */
  REPEAT_CATEGORY_MIN: 3,
  /** Screen time on add-expense before detection (ms) */
  SCREEN_TIME_MS: 5 * 60 * 1000, // 5 minutes
  /** Health score views before curiosity detection */
  HEALTH_VIEW_MIN: 3,
  /** Days since last entry before missed transaction */
  MISSED_DAYS_MIN: 3,
  /** Budget edits before complexity detection */
  BUDGET_EDIT_MIN: 3,
  /** Hours before trial expiry for detection */
  TRIAL_EXPIRY_HOURS: 24,
} as const;

/** ~40 known merchants that send email receipts (lowercase) */
export const EMAIL_RECEIPT_MERCHANTS: string[] = [
  'amazon', 'walmart', 'target', 'costco', 'bestbuy', 'apple',
  'uber', 'lyft', 'doordash', 'grubhub', 'ubereats', 'instacart',
  'netflix', 'spotify', 'hulu', 'disney', 'hbo', 'paramount',
  'starbucks', 'mcdonalds', 'chipotle', 'dominos', 'pizzahut',
  'nike', 'adidas', 'zara', 'hm', 'gap', 'nordstrom',
  'airbnb', 'booking', 'expedia', 'delta', 'united', 'southwest',
  'paypal', 'venmo', 'cashapp', 'stripe', 'square',
  'whole foods', 'trader joes', 'kroger', 'safeway',
];

// ============================================
// DETECTION FUNCTIONS
// Each returns FrictionContext | null
// ============================================

export function detectManualEntryFatigue(
  counters: FrictionCounters
): FrictionContext | null {
  if (counters.manualEntries < FRICTION_THRESHOLDS.MANUAL_ENTRY_MIN) return null;

  // Confidence scales 0.6-0.95 with count
  const confidence = Math.min(
    0.95,
    0.6 + (counters.manualEntries - FRICTION_THRESHOLDS.MANUAL_ENTRY_MIN) * 0.07
  );

  return {
    frictionType: 'MANUAL_ENTRY_FATIGUE',
    confidence,
    timestamp: new Date().toISOString(),
    metadata: { manualEntries: counters.manualEntries },
  };
}

export function detectReceiptMoment(
  counters: FrictionCounters
): FrictionContext | null {
  // Only after a manual entry (there's a recent one)
  if (counters.manualEntries < 1) return null;

  return {
    frictionType: 'RECEIPT_MOMENT',
    confidence: 0.7,
    timestamp: new Date().toISOString(),
    metadata: { manualEntries: counters.manualEntries },
  };
}

export function detectEmailOpportunity(
  merchantName: string | null
): FrictionContext | null {
  if (!merchantName) return null;

  const lowerMerchant = merchantName.toLowerCase();
  const matched = EMAIL_RECEIPT_MERCHANTS.some(
    (m) => lowerMerchant.includes(m)
  );
  if (!matched) return null;

  return {
    frictionType: 'EMAIL_OPPORTUNITY',
    confidence: 0.85,
    timestamp: new Date().toISOString(),
    metadata: { merchantName },
  };
}

export function detectHealthCuriosity(
  viewCount: number
): FrictionContext | null {
  if (viewCount < FRICTION_THRESHOLDS.HEALTH_VIEW_MIN) return null;

  return {
    frictionType: 'HEALTH_CURIOSITY',
    confidence: 0.7,
    timestamp: new Date().toISOString(),
    metadata: { viewCount },
  };
}

export function detectRepeatCategoryEntry(
  counters: FrictionCounters,
  categoryId: string
): FrictionContext | null {
  const count = counters.categoryRepeatMap[categoryId] || 0;
  if (count < FRICTION_THRESHOLDS.REPEAT_CATEGORY_MIN) return null;

  const confidence = Math.min(0.9, 0.6 + (count - FRICTION_THRESHOLDS.REPEAT_CATEGORY_MIN) * 0.1);

  return {
    frictionType: 'REPEAT_CATEGORY_ENTRY',
    confidence,
    timestamp: new Date().toISOString(),
    metadata: { categoryId, repeatCount: count },
  };
}

export function detectTimeSpentTracking(
  screenTimeMs: number
): FrictionContext | null {
  if (screenTimeMs < FRICTION_THRESHOLDS.SCREEN_TIME_MS) return null;

  return {
    frictionType: 'TIME_SPENT_TRACKING',
    confidence: 0.75,
    timestamp: new Date().toISOString(),
    metadata: { screenTimeMs, screenTimeMinutes: Math.round(screenTimeMs / 60000) },
  };
}

export function detectMissedTransactionHint(
  daysSinceLastEntry: number
): FrictionContext | null {
  if (daysSinceLastEntry < FRICTION_THRESHOLDS.MISSED_DAYS_MIN) return null;

  return {
    frictionType: 'MISSED_TRANSACTION',
    confidence: 0.65,
    timestamp: new Date().toISOString(),
    metadata: { daysSinceLastEntry },
  };
}

export function detectFinancialQuestion(): FrictionContext {
  return {
    frictionType: 'FINANCIAL_QUESTION',
    confidence: 0.9,
    timestamp: new Date().toISOString(),
    metadata: {},
  };
}

export function detectComplexBudgetSetup(
  editCount: number
): FrictionContext | null {
  if (editCount < FRICTION_THRESHOLDS.BUDGET_EDIT_MIN) return null;

  return {
    frictionType: 'COMPLEX_BUDGET_SETUP',
    confidence: 0.6,
    timestamp: new Date().toISOString(),
    metadata: { editCount },
  };
}

export function detectTrialExpiryApproaching(
  expiresAt: string | null,
  isTrialing: boolean
): FrictionContext | null {
  if (!isTrialing || !expiresAt) return null;

  const hoursRemaining =
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursRemaining > FRICTION_THRESHOLDS.TRIAL_EXPIRY_HOURS || hoursRemaining < 0) {
    return null;
  }

  return {
    frictionType: 'TRIAL_EXPIRY',
    confidence: 0.95,
    timestamp: new Date().toISOString(),
    metadata: { hoursRemaining: Math.round(hoursRemaining) },
  };
}

// ============================================
// COUNTER MUTATION HELPERS (pure)
// ============================================

export function trackManualEntry(
  counters: FrictionCounters,
  merchantName: string | null,
  categoryId: string | null
): FrictionCounters {
  const updated = { ...counters };
  updated.manualEntries += 1;
  updated.lastMerchantName = merchantName;

  if (categoryId) {
    updated.categoryRepeatMap = {
      ...updated.categoryRepeatMap,
      [categoryId]: (updated.categoryRepeatMap[categoryId] || 0) + 1,
    };
  }

  return updated;
}

export function startNewSession(counters: FrictionCounters): FrictionCounters {
  return {
    ...counters,
    manualEntries: 0,
    screenTimeMs: 0,
    categoryRepeatMap: {},
    lastMerchantName: null,
    healthViewCount: 0,
    budgetEditCount: 0,
    sessionStartedAt: new Date().toISOString(),
  };
}

export function trackScreenTime(
  counters: FrictionCounters,
  additionalMs: number
): FrictionCounters {
  return {
    ...counters,
    screenTimeMs: counters.screenTimeMs + additionalMs,
  };
}

/** Create default counters */
export function createDefaultCounters(): FrictionCounters {
  return {
    manualEntries: 0,
    screenTimeMs: 0,
    categoryRepeatMap: {},
    lastMerchantName: null,
    healthViewCount: 0,
    budgetEditCount: 0,
    sessionStartedAt: new Date().toISOString(),
  };
}
