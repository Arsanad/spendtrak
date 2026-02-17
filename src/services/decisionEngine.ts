/**
 * SpendTrak Behavioral Engine v2.0
 * Decision Engine - Rule-based intervention decisions (NO AI)
 *
 * 8 Gates that ALL must pass for intervention
 */

import { THRESHOLDS, LIMITS, InterventionType } from '../config/behavioralConstants';
import type { UserBehavioralProfile, BehaviorType } from '../types/behavior';
import type { BehavioralMomentResult, BehavioralMomentType } from './behavioralMoment';

export interface Intervention {
  id: string;
  delivered_at: string;
  intervention_type: InterventionType;
  message_key?: string;
  user_response?: string;
}

export interface DecisionContext {
  profile: UserBehavioralProfile;
  behavioralMoment: BehavioralMomentResult;
  recentInterventions: Intervention[];
}

export interface DecisionResult {
  shouldIntervene: boolean;
  interventionType: InterventionType | null;
  behavior: BehaviorType | null;
  reason: string;
  confidence: number;
  blockedBy?: string;
}

export function makeDecision(context: DecisionContext): DecisionResult {
  const { profile, behavioralMoment, recentInterventions } = context;

  // GATE 1: State Check
  if (profile.user_state !== 'FOCUSED') {
    return blocked('STATE', `State is ${profile.user_state}, not FOCUSED`, 0);
  }

  // GATE 2: Intervention Enabled
  if (!profile.intervention_enabled) {
    return blocked('DISABLED', 'Interventions disabled', 0);
  }

  // GATE 3: Cooldown Check
  if (profile.cooldown_ends_at && new Date() < new Date(profile.cooldown_ends_at)) {
    return blocked('COOLDOWN', 'Cooldown active', 0);
  }

  // GATE 4: Daily Limit
  const today = new Date().toDateString();
  const todayCount = recentInterventions.filter(i =>
    new Date(i.delivered_at).toDateString() === today
  ).length;

  if (todayCount >= LIMITS.MAX_INTERVENTIONS_PER_DAY) {
    return blocked('DAILY_LIMIT', `Daily limit: ${todayCount}/${LIMITS.MAX_INTERVENTIONS_PER_DAY}`, 0);
  }

  // GATE 5: Weekly Limit
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekCount = recentInterventions.filter(i =>
    new Date(i.delivered_at) >= weekAgo
  ).length;

  if (weekCount >= LIMITS.MAX_INTERVENTIONS_PER_WEEK) {
    return blocked('WEEKLY_LIMIT', `Weekly limit: ${weekCount}/${LIMITS.MAX_INTERVENTIONS_PER_WEEK}`, 0);
  }

  // GATE 6: Active Behavior
  if (!profile.active_behavior) {
    return blocked('NO_ACTIVE_BEHAVIOR', 'No active behavior', 0);
  }

  // GATE 7: Confidence Check
  const confidenceKey = `confidence_${profile.active_behavior}` as keyof UserBehavioralProfile;
  const activeConfidence = (profile[confidenceKey] as number) || 0;

  if (activeConfidence < THRESHOLDS.INTERVENTION) {
    return blocked('LOW_CONFIDENCE', `Confidence ${activeConfidence.toFixed(2)} < ${THRESHOLDS.INTERVENTION}`, activeConfidence);
  }

  // GATE 8: BEHAVIORAL MOMENT (CRITICAL!)
  if (!behavioralMoment.isBehavioralMoment) {
    return blocked('NOT_BEHAVIORAL_MOMENT', behavioralMoment.reason, activeConfidence);
  }

  // ALL GATES PASSED
  const interventionType = selectInterventionType(
    profile.active_behavior,
    behavioralMoment.momentType,
    recentInterventions
  );

  return {
    shouldIntervene: true,
    interventionType,
    behavior: profile.active_behavior,
    reason: `Behavioral moment: ${behavioralMoment.momentType}`,
    confidence: activeConfidence,
  };
}

function selectInterventionType(
  behavior: BehaviorType,
  momentType: BehavioralMomentType | null,
  recentInterventions: Intervention[]
): InterventionType {
  const lastType = recentInterventions[0]?.intervention_type;

  if (momentType === 'RELAPSE_AFTER_IMPROVEMENT') {
    return 'reinforcement';
  }

  if (['REPEAT_PURCHASE', 'HABITUAL_TIME', 'STRESS_CLUSTER', 'COLLAPSE_START'].includes(momentType || '')) {
    return lastType === 'pattern_reflection' ? 'immediate_mirror' : 'pattern_reflection';
  }

  return 'immediate_mirror';
}

function blocked(blockedBy: string, reason: string, confidence: number): DecisionResult {
  return {
    shouldIntervene: false,
    interventionType: null,
    behavior: null,
    reason,
    confidence,
    blockedBy,
  };
}
