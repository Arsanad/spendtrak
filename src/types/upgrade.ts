/**
 * SpendTrak Contextual Upgrade Engine
 * Type definitions for friction detection, decision gating, and prompt presentation
 */

import type { FeatureName } from '@/config/features';

// ============================================
// FRICTION DETECTION TYPES
// ============================================

/** 10 friction patterns the engine detects */
export type FrictionType =
  | 'MANUAL_ENTRY_FATIGUE'
  | 'RECEIPT_MOMENT'
  | 'EMAIL_OPPORTUNITY'
  | 'HEALTH_CURIOSITY'
  | 'REPEAT_CATEGORY_ENTRY'
  | 'TIME_SPENT_TRACKING'
  | 'MISSED_TRANSACTION'
  | 'FINANCIAL_QUESTION'
  | 'COMPLEX_BUDGET_SETUP'
  | 'TRIAL_EXPIRY';

/** Context returned by a successful friction detection */
export interface FrictionContext {
  frictionType: FrictionType;
  confidence: number; // 0-1
  timestamp: string; // ISO
  metadata: Record<string, string | number>;
}

// ============================================
// DECISION ENGINE TYPES
// ============================================

/** 7 gate identifiers */
export type GateId =
  | 'TIER_CHECK'
  | 'COOLDOWN'
  | 'DAILY_LIMIT'
  | 'WEEKLY_LIMIT'
  | 'DISMISS_TRACKING'
  | 'CONFIDENCE_THRESHOLD'
  | 'CONTEXT_RELEVANCE';

/** Result from the gate evaluation */
export interface UpgradeDecisionResult {
  shouldShow: boolean;
  blockedBy?: GateId | 'NEW_USER_GRACE';
  reason: string;
  selectedPrompt?: UpgradePromptConfig;
}

// ============================================
// PROMPT TYPES
// ============================================

export type PromptVariant = 'card' | 'modal';

export interface UpgradePromptConfig {
  id: string;
  frictionType: FrictionType;
  title: string; // May contain {{variable}} placeholders
  body: string; // May contain {{variable}} placeholders
  cta: string;
  icon: string; // Ionicons name
  variant: PromptVariant;
  targetFeature: FeatureName;
  variantIndex: number;
}

// ============================================
// SESSION COUNTERS
// ============================================

export interface FrictionCounters {
  /** Manual entries this session */
  manualEntries: number;
  /** Cumulative screen time on add-expense (ms) */
  screenTimeMs: number;
  /** Category repeat map: categoryId -> count this session */
  categoryRepeatMap: Record<string, number>;
  /** Last merchant name entered */
  lastMerchantName: string | null;
  /** Health score view count this session */
  healthViewCount: number;
  /** Budget edit count this session */
  budgetEditCount: number;
  /** Session start timestamp */
  sessionStartedAt: string;
}

// ============================================
// ENGINE STATE (persisted)
// ============================================

export interface UpgradeEngineState {
  /** ISO timestamp of last prompt shown */
  lastPromptShownAt: string | null;
  /** ISO timestamp of last prompt dismissed */
  lastDismissedAt: string | null;
  /** Total dismiss count (lifetime) */
  dismissCount: number;
  /** Prompts shown today */
  dailyCount: number;
  /** Date string of last daily reset (YYYY-MM-DD) */
  dailyResetDate: string | null;
  /** Prompts shown this week */
  weeklyCount: number;
  /** ISO timestamp of weekly window start */
  weeklyResetAt: string | null;
  /** If set, no prompts until this ISO timestamp */
  silenceUntil: string | null;
  /** If true, never show prompts again */
  permanentlySilenced: boolean;
  /** User signup timestamp for grace period */
  signupTimestamp: string | null;
  /** Last prompt variant index per friction type (for round-robin) */
  lastPromptVariantMap: Partial<Record<FrictionType, number>>;
  /** Total prompts tapped (lifetime engagement) */
  lifetimeTaps: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export type UpgradeEventType =
  | 'friction_detected'
  | 'prompt_shown'
  | 'prompt_dismissed'
  | 'prompt_tapped'
  | 'gate_blocked'
  | 'trial_reminder_shown'
  | 'upgrade_initiated';

export interface UpgradeAnalyticsEvent {
  id: string;
  eventType: UpgradeEventType;
  frictionType: FrictionType | null;
  promptId: string | null;
  timestamp: string;
  metadata: Record<string, string | number>;
  synced: boolean;
}
