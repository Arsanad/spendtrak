/**
 * SpendTrak Contextual Upgrade Engine
 * Decision Engine - 7-gate system to prevent prompt fatigue
 *
 * Pattern: Matches decisionEngine.ts — sequential gate checks with blocked() helper
 */

import type {
  FrictionContext,
  UpgradeDecisionResult,
  UpgradeEngineState,
  GateId,
  FrictionType,
} from '@/types/upgrade';
import type { SubscriptionTier } from '@/config/features';

// ============================================
// CONSTANTS (matches LIMITS pattern from behavioralConstants)
// ============================================

export const UPGRADE_LIMITS = {
  COOLDOWN_HOURS: 24,
  COOLDOWN_AFTER_DISMISS_HOURS: 48,
  MAX_PER_DAY: 1,
  MAX_PER_WEEK: 3,
  DISMISS_SILENCE_THRESHOLD: 5,
  DISMISS_SILENCE_DAYS: 7,
  LIFETIME_DISMISS_LIMIT: 20,
  MIN_CONFIDENCE: 0.6,
  NEW_USER_GRACE_HOURS: 24,
} as const;

// ============================================
// MAIN GATE EVALUATION
// ============================================

export function evaluateUpgradeGates(
  context: FrictionContext,
  engineState: UpgradeEngineState,
  tier: SubscriptionTier,
  isTrialing: boolean
): UpgradeDecisionResult {
  const now = Date.now();

  // PRE-CHECK: New user grace period
  if (engineState.signupTimestamp) {
    const hoursSinceSignup =
      (now - new Date(engineState.signupTimestamp).getTime()) / (1000 * 60 * 60);
    if (hoursSinceSignup < UPGRADE_LIMITS.NEW_USER_GRACE_HOURS) {
      return blocked('NEW_USER_GRACE', `New user grace: ${Math.round(hoursSinceSignup)}h < ${UPGRADE_LIMITS.NEW_USER_GRACE_HOURS}h`);
    }
  }

  // GATE 1: TIER_CHECK — premium users never see prompts
  if (tier === 'premium') {
    return blocked('TIER_CHECK', 'User is premium');
  }

  // GATE 2: COOLDOWN — time since last shown
  if (engineState.permanentlySilenced) {
    return blocked('DISMISS_TRACKING', 'Permanently silenced');
  }

  if (engineState.silenceUntil && now < new Date(engineState.silenceUntil).getTime()) {
    return blocked('COOLDOWN', 'Silence period active');
  }

  if (engineState.lastPromptShownAt) {
    const hoursSinceShown =
      (now - new Date(engineState.lastPromptShownAt).getTime()) / (1000 * 60 * 60);
    const cooldownHours = engineState.lastDismissedAt
      ? UPGRADE_LIMITS.COOLDOWN_AFTER_DISMISS_HOURS
      : UPGRADE_LIMITS.COOLDOWN_HOURS;

    if (hoursSinceShown < cooldownHours) {
      return blocked('COOLDOWN', `Cooldown: ${Math.round(hoursSinceShown)}h < ${cooldownHours}h`);
    }
  }

  // GATE 3: DAILY_LIMIT — max 1/day (auto-reset)
  const state = checkAndResetCounters(engineState);
  if (state.dailyCount >= UPGRADE_LIMITS.MAX_PER_DAY) {
    return blocked('DAILY_LIMIT', `Daily limit: ${state.dailyCount}/${UPGRADE_LIMITS.MAX_PER_DAY}`);
  }

  // GATE 4: WEEKLY_LIMIT — max 3/week (auto-reset)
  if (state.weeklyCount >= UPGRADE_LIMITS.MAX_PER_WEEK) {
    return blocked('WEEKLY_LIMIT', `Weekly limit: ${state.weeklyCount}/${UPGRADE_LIMITS.MAX_PER_WEEK}`);
  }

  // GATE 5: DISMISS_TRACKING — 5 dismissals → 7-day silence; 20 lifetime → permanent stop
  if (state.dismissCount >= UPGRADE_LIMITS.LIFETIME_DISMISS_LIMIT) {
    return blocked('DISMISS_TRACKING', 'Lifetime dismiss limit reached');
  }

  // GATE 6: CONFIDENCE_THRESHOLD
  if (context.confidence < UPGRADE_LIMITS.MIN_CONFIDENCE) {
    return blocked('CONFIDENCE_THRESHOLD', `Confidence ${context.confidence.toFixed(2)} < ${UPGRADE_LIMITS.MIN_CONFIDENCE}`);
  }

  // GATE 7: CONTEXT_RELEVANCE
  if (context.frictionType === 'TRIAL_EXPIRY' && !isTrialing) {
    return blocked('CONTEXT_RELEVANCE', 'TRIAL_EXPIRY only for trial users');
  }

  // ALL GATES PASSED
  return {
    shouldShow: true,
    reason: `All gates passed for ${context.frictionType}`,
  };
}

// ============================================
// STATE MUTATION HELPERS (pure, return new state)
// ============================================

export function recordPromptShown(state: UpgradeEngineState): UpgradeEngineState {
  const now = new Date().toISOString();
  const updated = checkAndResetCounters(state);

  return {
    ...updated,
    lastPromptShownAt: now,
    dailyCount: updated.dailyCount + 1,
    weeklyCount: updated.weeklyCount + 1,
  };
}

export function recordPromptDismissed(state: UpgradeEngineState): UpgradeEngineState {
  const now = new Date().toISOString();
  const newDismissCount = state.dismissCount + 1;

  let silenceUntil = state.silenceUntil;
  let permanentlySilenced = state.permanentlySilenced;

  // 5 dismissals → 7-day silence
  if (newDismissCount >= UPGRADE_LIMITS.DISMISS_SILENCE_THRESHOLD &&
      newDismissCount < UPGRADE_LIMITS.LIFETIME_DISMISS_LIMIT) {
    const silenceDate = new Date();
    silenceDate.setDate(silenceDate.getDate() + UPGRADE_LIMITS.DISMISS_SILENCE_DAYS);
    silenceUntil = silenceDate.toISOString();
  }

  // 20 lifetime → permanent stop
  if (newDismissCount >= UPGRADE_LIMITS.LIFETIME_DISMISS_LIMIT) {
    permanentlySilenced = true;
  }

  return {
    ...state,
    dismissCount: newDismissCount,
    lastDismissedAt: now,
    silenceUntil,
    permanentlySilenced,
  };
}

export function recordPromptTapped(state: UpgradeEngineState): UpgradeEngineState {
  return {
    ...state,
    lifetimeTaps: state.lifetimeTaps + 1,
  };
}

export function initializeEngineState(signupTimestamp: string | null): UpgradeEngineState {
  return {
    lastPromptShownAt: null,
    lastDismissedAt: null,
    dismissCount: 0,
    dailyCount: 0,
    dailyResetDate: null,
    weeklyCount: 0,
    weeklyResetAt: null,
    silenceUntil: null,
    permanentlySilenced: false,
    signupTimestamp,
    lastPromptVariantMap: {},
    lifetimeTaps: 0,
  };
}

export function checkAndResetCounters(state: UpgradeEngineState): UpgradeEngineState {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let updated = { ...state };

  // Reset daily counter if stale
  if (updated.dailyResetDate !== todayStr) {
    updated.dailyCount = 0;
    updated.dailyResetDate = todayStr;
  }

  // Reset weekly counter if stale (7-day window)
  if (updated.weeklyResetAt) {
    const daysSinceReset =
      (now.getTime() - new Date(updated.weeklyResetAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReset >= 7) {
      updated.weeklyCount = 0;
      updated.weeklyResetAt = now.toISOString();
    }
  } else {
    updated.weeklyResetAt = now.toISOString();
  }

  return updated;
}

// ============================================
// HELPER
// ============================================

function blocked(
  blockedBy: GateId | 'NEW_USER_GRACE',
  reason: string
): UpgradeDecisionResult {
  return {
    shouldShow: false,
    blockedBy,
    reason,
  };
}
