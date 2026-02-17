/**
 * SpendTrak Behavioral Engine v2.0
 * Types for behavior detection, state machine, interventions, and wins
 */

import {
  BehaviorType,
  UserBehavioralState,
  InterventionType,
  WinType,
} from '../config/behavioralConstants';

// Re-export from constants for convenience
export type { BehaviorType, UserBehavioralState, InterventionType, WinType };

// ============================================
// USER RESPONSE & TRIGGER TYPES
// ============================================

export type UserResponse = 'viewed' | 'dismissed' | 'engaged' | 'ignored';

export type TriggerEvent =
  | 'transaction_created'
  | 'app_open'
  | 'daily_summary'
  | 'scheduled';

// ============================================
// DATABASE TYPES
// ============================================

/** User behavioral profile (one per user) - v2.0 with state machine */
export interface UserBehavioralProfile {
  id: string;
  user_id: string;

  // State Machine
  user_state: UserBehavioralState;
  active_behavior: BehaviorType | null;
  active_behavior_intensity: number;
  state_changed_at: string;

  // Confidence scores (0.0 to 1.0)
  confidence_small_recurring: number;
  confidence_stress_spending: number;
  confidence_end_of_month: number;

  // Last Detection Times
  last_detected_small_recurring: string | null;
  last_detected_stress_spending: string | null;
  last_detected_end_of_month: string | null;

  // Intervention Tracking
  last_intervention_at: string | null;
  cooldown_ends_at: string | null;
  withdrawal_ends_at: string | null;
  interventions_today: number;
  interventions_this_week: number;
  last_intervention_reset: string;

  // Failure Tracking
  ignored_interventions: number;
  dismissed_count: number;

  // Win Tracking
  total_wins: number;
  current_streak: number;
  longest_streak: number;
  last_win_at: string | null;

  // Budget (for end-of-month)
  budget_adherence_early_month: number;
  budget_adherence_current: number;

  // Settings
  intervention_enabled: boolean;

  // Evaluation Tracking (FIX #1)
  last_evaluated_at: string | null;
  evaluation_count: number;

  // Confidence History (FIX #2)
  confidence_history: ConfidenceHistoryEntry[];

  // Seasonal Adjustment (FIX #3)
  seasonal_factors: SeasonalFactors;

  // Streak Tracking (FIX #7)
  streak_broken_at: string | null;
  streak_break_reason: StreakBreakReason | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

/** Behavioral signal (raw detected pattern) */
export interface BehavioralSignal {
  id: string;
  user_id: string;
  behavior_type: BehaviorType;
  signal_type: string;
  signal_strength: number;
  transaction_id: string | null;
  category_id: string | null;
  merchant_name: string | null;
  amount: number | null;
  hour_of_day: number | null;
  day_of_week: number | null;
  day_of_month: number | null;
  detection_reason: string;
  detected_at: string;
}

/** Intervention record */
export interface Intervention {
  id: string;
  user_id: string;
  behavior_type: BehaviorType;
  intervention_type: InterventionType;
  message_key: string;
  message_content: string;
  trigger_transaction_id: string | null;
  behavioral_moment_type: string | null;
  confidence_at_delivery: number;
  delivered_at: string;
  user_response: UserResponse | null;
  response_at: string | null;
  led_to_ai_chat: boolean;
  decision_reason: string;
}

/** Behavioral win record */
export interface BehavioralWin {
  id: string;
  user_id: string;
  behavior_type: BehaviorType;
  win_type: WinType;
  message: string;
  streak_days: number | null;
  improvement_percent: number | null;
  celebrated: boolean;
  celebrated_at: string | null;
  created_at: string;
}

/** State transition log */
export interface StateTransition {
  id: string;
  user_id: string;
  from_state: UserBehavioralState;
  to_state: UserBehavioralState;
  trigger: string;
  reason: string;
  active_behavior: BehaviorType | null;
  confidence_at_transition: number | null;
  created_at: string;
}

// ============================================
// INSERT/UPDATE TYPES
// ============================================

export type UserBehavioralProfileInsert = Omit<UserBehavioralProfile, 'id' | 'created_at' | 'updated_at'>;
export type UserBehavioralProfileUpdate = Partial<Omit<UserBehavioralProfile, 'id' | 'user_id' | 'created_at'>>;

export type BehavioralSignalInsert = Omit<BehavioralSignal, 'id' | 'detected_at'>;

export type InterventionInsert = Omit<Intervention, 'id' | 'delivered_at'>;
export type InterventionUpdate = Partial<Pick<Intervention, 'user_response' | 'response_at' | 'led_to_ai_chat'>>;

export type BehavioralWinInsert = Omit<BehavioralWin, 'id' | 'created_at'>;
export type BehavioralWinUpdate = Partial<Pick<BehavioralWin, 'celebrated' | 'celebrated_at'>>;

// ============================================
// DECISION TYPES
// ============================================

/** Decision to show (or not show) an intervention */
export interface InterventionDecision {
  shouldIntervene: boolean;
  interventionType: InterventionType | null;
  behavior: BehaviorType | null;
  reason: string;
  confidence: number;
  blockedBy?: string;
  messageKey?: string;
  messageContent?: string;
  transactionId?: string;
}

// ============================================
// CONTEXT TYPES (for AI)
// ============================================

/** Behavioral context passed to QUANTUM AI */
export interface BehavioralContext {
  has_profile: boolean;
  user_state: UserBehavioralState;
  confidence_scores: ConfidenceScores;
  active_behavior: BehaviorType | null;
  active_behavior_intensity: number;
  interventions_today: number;
  interventions_this_week: number;
  last_intervention_at: string | null;
  total_wins: number;
  current_streak: number;
  in_cooldown: boolean;
  in_withdrawal: boolean;
}

/** Confidence scores for all behavior types */
export interface ConfidenceScores {
  small_recurring: number;
  stress_spending: number;
  end_of_month: number;
}

// ============================================
// FIX #2: CONFIDENCE HISTORY TYPES
// ============================================

/** Historical confidence entry for trend analysis */
export interface ConfidenceHistoryEntry {
  timestamp: string;
  small_recurring: number;
  stress_spending: number;
  end_of_month: number;
  detection_triggered: boolean;
}

// ============================================
// FIX #3: SEASONAL ADJUSTMENT TYPES
// ============================================

/** Seasonal adjustment factors for drift detection */
export interface SeasonalFactors {
  // Monthly adjustment multipliers (1.0 = normal)
  monthly_factors: Record<number, number>; // 0-11 for Jan-Dec
  // Day of week factors (0-6, Sun-Sat)
  day_of_week_factors: Record<number, number>;
  // Holiday period flag
  is_holiday_period: boolean;
  // Last updated timestamp
  last_calibrated_at: string | null;
}

/** Default seasonal factors */
export const DEFAULT_SEASONAL_FACTORS: SeasonalFactors = {
  monthly_factors: {
    0: 1.0,  // January - post-holiday recovery
    1: 0.95, // February
    2: 1.0,  // March
    3: 1.0,  // April
    4: 1.0,  // May
    5: 1.05, // June - summer start
    6: 1.1,  // July - vacation season
    7: 1.1,  // August - vacation season
    8: 1.05, // September - back to school
    9: 1.0,  // October
    10: 1.15, // November - Black Friday/Thanksgiving
    11: 1.3,  // December - Holiday season
  },
  day_of_week_factors: {
    0: 1.15, // Sunday - weekend shopping
    1: 0.9,  // Monday
    2: 0.9,  // Tuesday
    3: 0.95, // Wednesday
    4: 1.0,  // Thursday
    5: 1.2,  // Friday - end of week
    6: 1.25, // Saturday - weekend shopping
  },
  is_holiday_period: false,
  last_calibrated_at: null,
};

// ============================================
// FIX #7: STREAK BREAK TYPES
// ============================================

/** Reasons for streak breaking */
export type StreakBreakReason =
  | 'behavior_relapse'      // User relapsed into old behavior
  | 'inactivity'            // No transactions for extended period
  | 'user_reset'            // User manually reset
  | 'severe_regression'     // >100% increase in behavior
  | 'withdrawal_triggered'; // User triggered withdrawal state

/** Streak break event for logging */
export interface StreakBreakEvent {
  broken_at: string;
  reason: StreakBreakReason;
  streak_length: number;
  behavior_type: BehaviorType | null;
  metadata?: Record<string, unknown>;
}

// ============================================
// FIX #6: A/B TESTING TYPES
// ============================================

/** Experiment variant assignment */
export interface ExperimentVariant {
  experiment_id: string;
  variant_id: string;
  assigned_at: string;
}

/** A/B test experiment definition */
export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: ExperimentVariantDefinition[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  allocation_percentage: number; // % of users in experiment
}

/** Variant definition within an experiment */
export interface ExperimentVariantDefinition {
  id: string;
  name: string;
  weight: number; // Relative weight for random assignment
  config: Record<string, unknown>;
}

/** Experiment result tracking */
export interface ExperimentResult {
  experiment_id: string;
  variant_id: string;
  user_id: string;
  event_type: 'intervention_shown' | 'intervention_engaged' | 'intervention_dismissed' | 'win_celebrated';
  event_data?: Record<string, unknown>;
  created_at: string;
}

/** User's experiment assignments */
export interface UserExperiments {
  user_id: string;
  assignments: ExperimentVariant[];
  last_updated: string;
}

// ============================================
// CONSTANTS
// ============================================

/** Behavior type display labels */
export const BEHAVIOR_TYPE_LABELS: Record<BehaviorType, string> = {
  small_recurring: 'Small Recurring Expenses',
  stress_spending: 'Stress Spending',
  end_of_month: 'End-of-Month Collapse',
};

/** Behavior type short labels */
export const BEHAVIOR_TYPE_SHORT_LABELS: Record<BehaviorType, string> = {
  small_recurring: 'Small Purchases',
  stress_spending: 'Stress Buying',
  end_of_month: 'Month-End',
};

/** Intervention type labels */
export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  immediate_mirror: 'Immediate Mirror',
  pattern_reflection: 'Pattern Reflection',
  reinforcement: 'Reinforcement',
};

/** Win type labels */
export const WIN_TYPE_LABELS: Record<WinType, string> = {
  pattern_break: 'Pattern Break',
  improvement: 'Improvement',
  streak_milestone: 'Streak Milestone',
  silent_win: 'Silent Win',
};

/** User state labels */
export const USER_STATE_LABELS: Record<UserBehavioralState, string> = {
  OBSERVING: 'Observing',
  FOCUSED: 'Focused',
  COOLDOWN: 'Cooldown',
  WITHDRAWN: 'Withdrawn',
};

// ============================================
// ADDITIONAL TYPES (for full API compatibility)
// ============================================

/** Time context for behavioral analysis */
export type TimeContext = 'morning' | 'afternoon' | 'evening' | 'night' | 'weekend' | 'weekday';

/** Pattern history entry for tracking behavior over time */
export interface PatternHistoryEntry {
  date: string;
  behavior_type: BehaviorType;
  signal_strength: number;
  transaction_count: number;
  total_amount: number;
}

/** Behavior note for manual annotations */
export interface BehaviorNote {
  id: string;
  user_id: string;
  behavior_type: BehaviorType;
  note: string;
  created_at: string;
}

/** Signal update type */
export type BehavioralSignalUpdate = Partial<Omit<BehavioralSignal, 'id' | 'user_id' | 'detected_at'>>;

// ============================================
// DETECTION TYPES
// ============================================

/** Result of behavior detection algorithm */
export interface BehaviorDetectionResult {
  detected: boolean;
  behavior_type: BehaviorType;
  confidence: number;
  signals: DetectedSignal[];
  metadata: DetectionMetadata;
}

/** Individual detected signal */
export interface DetectedSignal {
  type: string;
  strength: number;
  transaction_id?: string;
  amount?: number;
  merchant?: string;
  category?: string;
  timestamp: string;
}

/** Metadata about detection process */
export interface DetectionMetadata {
  algorithm_version: string;
  detection_time_ms: number;
  sample_size: number;
  date_range_start: string;
  date_range_end: string;
}

/** Confidence calculation result */
export interface ConfidenceCalculationResult {
  confidence: number;
  factors: ConfidenceFactor[];
  explanation: string;
}

/** Factor contributing to confidence score */
export interface ConfidenceFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

// ============================================
// INTERVENTION TYPES
// ============================================

/** Message content for intervention */
export interface InterventionMessage {
  key: string;
  title: string;
  body: string;
  cta_primary?: string;
  cta_secondary?: string;
}

/** Eligibility check result */
export interface InterventionEligibility {
  eligible: boolean;
  reason: string;
  cooldown_remaining_ms?: number;
  daily_limit_remaining?: number;
  weekly_limit_remaining?: number;
}

// ============================================
// RECENT DATA TYPES
// ============================================

/** Recent signal for display */
export interface RecentSignal {
  id: string;
  behavior_type: BehaviorType;
  signal_strength: number;
  detected_at: string;
  transaction_id?: string;
  amount?: number;
  merchant?: string;
}

/** Recent intervention for display */
export interface RecentIntervention {
  id: string;
  behavior_type: BehaviorType;
  intervention_type: InterventionType;
  message_content: string;
  delivered_at: string;
  user_response?: UserResponse;
}

/** Recent win for display */
export interface RecentWin {
  id: string;
  behavior_type: BehaviorType;
  win_type: WinType;
  message: string;
  created_at: string;
  celebrated: boolean;
}

// ============================================
// PATTERN TYPES
// ============================================

/** Small recurring pattern detection */
export interface SmallRecurringPattern {
  merchant_name: string;
  category_id?: string;
  average_amount: number;
  frequency_per_week: number;
  total_transactions: number;
  date_range_days: number;
}

/** Stress spending pattern detection */
export interface StressSpendingPattern {
  hour_of_day: number;
  day_of_week: number;
  average_amount: number;
  transaction_velocity: number;
  category_spread: number;
}

/** End of month pattern detection */
export interface EndOfMonthPattern {
  days_before_end: number;
  spending_acceleration: number;
  budget_utilization: number;
  category_breakdown: Record<string, number>;
}

// ============================================
// STORE TYPES
// ============================================

/** Behavior store state */
export interface BehaviorState {
  profile: UserBehavioralProfile | null;
  isLoading: boolean;
  error: string | null;
  activeIntervention: InterventionDecision | null;
  recentSignals: RecentSignal[];
  recentWins: RecentWin[];
}

/** Behavior store actions */
export interface BehaviorActions {
  fetchProfile: () => Promise<void>;
  evaluateBehaviors: (transactions: unknown[]) => Promise<void>;
  checkForWins: (transactions: unknown[]) => Promise<void>;
  dismissIntervention: (response: UserResponse) => void;
  reset: () => void;
}

// ============================================
// THRESHOLD CONSTANTS
// ============================================

/** Confidence thresholds for triggering interventions */
export const CONFIDENCE_THRESHOLDS = {
  small_recurring: 0.6,
  stress_spending: 0.7,
  end_of_month: 0.65,
} as const;

/** Intervention limits to prevent over-messaging */
export const INTERVENTION_LIMITS = {
  daily_max: 3,
  weekly_max: 10,
  cooldown_minutes: 60,
  withdrawal_days: 7,
} as const;
