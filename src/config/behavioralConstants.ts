/**
 * SpendTrak Behavioral Engine v2.0
 * Central configuration for all behavioral detection and intervention
 *
 * IMPORTANT: Do not modify these values without understanding the full system.
 * These thresholds are carefully calibrated for behavioral change, not engagement.
 */

export const THRESHOLDS = {
  // Activation & Intervention
  ACTIVATION: 0.75,
  INTERVENTION: 0.80,
  DEACTIVATION: 0.50,

  // Small Recurring Detection
  SMALL_TRANSACTION_MAX: 15,
  SMALL_RECURRING_MIN_COUNT: 10,  // Require at least 10 small transactions to detect pattern
  SMALL_RECURRING_DAYS: 7,
  SMALL_RECURRING_CATEGORY_MIN: 3,  // Require at least 3 in same category

  // Stress Spending Detection
  STRESS_LATE_NIGHT_START: 21,
  STRESS_LATE_NIGHT_END: 2,
  STRESS_POST_WORK_START: 17,
  STRESS_POST_WORK_END: 20,
  STRESS_MIN_OCCURRENCES: 3,
  STRESS_CLUSTER_WINDOW_HOURS: 2,
  STRESS_LOOKBACK_DAYS: 14,

  // End of Month Detection
  END_OF_MONTH_START_DAY: 21,
  END_OF_MONTH_MIN_MONTHS: 2,
  END_OF_MONTH_SPIKE_RATIO: 1.5,

  // Confidence Calculations
  CONFIDENCE_SMOOTHING_FACTOR: 0.7,
  CONFIDENCE_DECAY_DAILY: 0.02,
  CONFIDENCE_DECAY_MIN: 0.0,
  CONFIDENCE_CEILING: 0.95, // FIX #9: Soft ceiling to prevent over-confidence

  // Win Detection
  WIN_IMPROVEMENT_THRESHOLD: 0.30,
  WIN_STREAK_MILESTONES: [7, 14, 30, 60, 90],

  // FIX #7: Streak Breaking Thresholds
  STREAK_BREAK_INACTIVITY_DAYS: 7,  // Days without behavioral transactions to break streak
  STREAK_BREAK_RELAPSE_THRESHOLD: 0.5, // 50%+ increase breaks streak

  // FIX #3: Seasonal Drift Detection
  SEASONAL_CALIBRATION_DAYS: 90, // Recalibrate seasonal factors every 90 days
  SEASONAL_VARIANCE_THRESHOLD: 0.3, // 30% variance triggers recalibration

  // FIX #2: Confidence History
  CONFIDENCE_HISTORY_MAX_ENTRIES: 30, // Keep last 30 evaluation snapshots
  CONFIDENCE_HISTORY_MIN_INTERVAL_HOURS: 4, // Minimum hours between history entries
} as const;

export const LIMITS = {
  MAX_INTERVENTIONS_PER_DAY: 1,
  MAX_INTERVENTIONS_PER_WEEK: 5,
  COOLDOWN_HOURS: 12,
  EXTENDED_COOLDOWN_HOURS: 48,
  IGNORED_THRESHOLD: 2,
  DISMISSED_THRESHOLD: 3,
  WITHDRAWAL_DAYS: 7,
  ANNOYANCE_WITHDRAWAL_DAYS: 14,
  MESSAGE_MAX_WORDS: 12,
  MESSAGE_MAX_SENTENCES: 2,
  MESSAGE_RECENT_MEMORY: 5,
  INACTIVE_DAYS_FOR_REENGAGEMENT: 14,
} as const;

export const COMFORT_CATEGORIES = [
  'food_dining', 'food_delivery', 'entertainment', 'shopping',
  'coffee', 'coffee_drinks', 'alcohol', 'fast_food', 'snacks',
  'streaming', 'gaming', 'delivery', 'takeout',
] as const;

export const BEHAVIOR_TYPES = ['small_recurring', 'stress_spending', 'end_of_month'] as const;
export const USER_STATES = ['OBSERVING', 'FOCUSED', 'COOLDOWN', 'WITHDRAWN'] as const;
export const INTERVENTION_TYPES = ['immediate_mirror', 'pattern_reflection', 'reinforcement'] as const;
export const WIN_TYPES = ['pattern_break', 'improvement', 'streak_milestone', 'silent_win'] as const;

export type BehaviorType = typeof BEHAVIOR_TYPES[number];
export type UserBehavioralState = typeof USER_STATES[number];
export type InterventionType = typeof INTERVENTION_TYPES[number];
export type WinType = typeof WIN_TYPES[number];
export type ComfortCategory = typeof COMFORT_CATEGORIES[number];

// Helper function to check if a string is a comfort category
export function isComfortCategory(categoryId: string): categoryId is ComfortCategory {
  return (COMFORT_CATEGORIES as readonly string[]).includes(categoryId);
}
