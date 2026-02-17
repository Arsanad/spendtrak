/**
 * SpendTrak Behavioral Engine v2.0
 * Failure Handler - Handles user rejection and negative signals
 */

import { LIMITS } from '../config/behavioralConstants';
import type { UserBehavioralProfile } from '../types/behavior';
import type { Intervention } from './decisionEngine';

export type FailureMode =
  | 'USER_IGNORED'
  | 'USER_DISMISSED'
  | 'USER_ANNOYED'
  | 'USER_CHURNING'
  | 'CONFIDENCE_DROPPED';

export interface FailureResponse {
  action: 'withdraw' | 'extend_cooldown' | 'reset' | 'reduce_frequency';
  duration?: number;
  reason: string;
}

export interface AnnoyanceSignal {
  type: 'rapid_dismiss' | 'settings_change';
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export function handleFailure(mode: FailureMode, profile: UserBehavioralProfile): FailureResponse {
  switch (mode) {
    case 'USER_IGNORED': {
      const count = (profile.ignored_interventions || 0) + 1;
      if (count >= LIMITS.IGNORED_THRESHOLD) {
        return { action: 'withdraw', duration: LIMITS.WITHDRAWAL_DAYS * 24, reason: `Ignored ${count}` };
      }
      return { action: 'extend_cooldown', duration: 24, reason: `Ignored #${count}` };
    }

    case 'USER_DISMISSED': {
      const count = (profile.dismissed_count || 0) + 1;
      if (count >= LIMITS.DISMISSED_THRESHOLD) {
        return { action: 'withdraw', duration: LIMITS.WITHDRAWAL_DAYS * 24, reason: `Dismissed ${count}` };
      }
      return { action: 'extend_cooldown', duration: LIMITS.EXTENDED_COOLDOWN_HOURS, reason: `Dismissed #${count}` };
    }

    case 'USER_ANNOYED':
      return { action: 'withdraw', duration: LIMITS.ANNOYANCE_WITHDRAWAL_DAYS * 24, reason: 'Annoyance detected' };

    case 'USER_CHURNING':
      return { action: 'reset', reason: 'User inactive' };

    case 'CONFIDENCE_DROPPED':
      return { action: 'reduce_frequency', reason: 'Confidence dropped' };

    default:
      return { action: 'reduce_frequency', reason: `Unknown: ${mode}` };
  }
}

export function detectAnnoyance(
  recentInterventions: Intervention[],
  profile: UserBehavioralProfile
): AnnoyanceSignal | null {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentDismissals = recentInterventions.filter(i =>
    i.user_response === 'dismissed' && new Date(i.delivered_at) >= last24h
  );

  if (recentDismissals.length >= 3) {
    return { type: 'rapid_dismiss', severity: 'high', timestamp: new Date() };
  }

  if (!profile.intervention_enabled) {
    return { type: 'settings_change', severity: 'high', timestamp: new Date() };
  }

  return null;
}

export function calculateNewState(
  profile: UserBehavioralProfile,
  response: FailureResponse
): Partial<UserBehavioralProfile> {
  const now = new Date();
  const updates: Partial<UserBehavioralProfile> = {};

  switch (response.action) {
    case 'withdraw':
      updates.user_state = 'WITHDRAWN';
      updates.withdrawal_ends_at = new Date(now.getTime() + (response.duration || 168) * 60 * 60 * 1000).toISOString();
      updates.active_behavior = null;
      break;
    case 'extend_cooldown':
      updates.user_state = 'COOLDOWN';
      updates.cooldown_ends_at = new Date(now.getTime() + (response.duration || 48) * 60 * 60 * 1000).toISOString();
      break;
    case 'reset':
      updates.user_state = 'OBSERVING';
      updates.active_behavior = null;
      updates.confidence_small_recurring = 0;
      updates.confidence_stress_spending = 0;
      updates.confidence_end_of_month = 0;
      updates.ignored_interventions = 0;
      updates.dismissed_count = 0;
      break;
    case 'reduce_frequency':
      updates.cooldown_ends_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      break;
  }

  return updates;
}
