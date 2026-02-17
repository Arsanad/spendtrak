/**
 * SpendTrak Behavioral Engine v2.0
 * State Machine - Manages user behavioral states
 *
 * States: OBSERVING, FOCUSED, COOLDOWN, WITHDRAWN
 */

import { THRESHOLDS, LIMITS } from '../config/behavioralConstants';
import type { UserBehavioralProfile, BehaviorType, UserBehavioralState } from '../types/behavior';

export interface StateTransition {
  newState: UserBehavioralState;
  previousState: UserBehavioralState;
  activeBehavior: BehaviorType | null;
  reason: string;
  cooldownEndsAt?: string;
  withdrawalEndsAt?: string;
}

export type TransitionTrigger = 'INTERVENTION_DELIVERED' | 'POSITIVE_SIGNAL' | 'TRANSACTION' | 'SCHEDULED';

export class BehavioralStateMachine {

  async evaluateTransition(
    profile: UserBehavioralProfile,
    trigger: TransitionTrigger
  ): Promise<StateTransition> {
    const currentState = profile.user_state;

    switch (currentState) {
      case 'OBSERVING':
        return this.evaluateObserving(profile);
      case 'FOCUSED':
        return this.evaluateFocused(profile, trigger);
      case 'COOLDOWN':
        return this.evaluateCooldown(profile);
      case 'WITHDRAWN':
        return this.evaluateWithdrawn(profile, trigger);
      default:
        return this.noTransition('OBSERVING', 'Unknown state');
    }
  }

  private evaluateObserving(profile: UserBehavioralProfile): StateTransition {
    const confidences = {
      small_recurring: profile.confidence_small_recurring,
      stress_spending: profile.confidence_stress_spending,
      end_of_month: profile.confidence_end_of_month,
    };

    const sorted = Object.entries(confidences)
      .sort(([, a], [, b]) => b - a);
    const [behavior, confidence] = sorted[0] as [BehaviorType, number];

    if (confidence >= THRESHOLDS.ACTIVATION) {
      return {
        newState: 'FOCUSED',
        previousState: 'OBSERVING',
        activeBehavior: behavior,
        reason: `Confidence ${confidence.toFixed(2)} >= ${THRESHOLDS.ACTIVATION}`,
      };
    }

    return this.noTransition('OBSERVING', 'Confidence too low');
  }

  private evaluateFocused(
    profile: UserBehavioralProfile,
    trigger: TransitionTrigger
  ): StateTransition {
    // Check withdrawal conditions
    if (profile.ignored_interventions >= LIMITS.IGNORED_THRESHOLD) {
      return {
        newState: 'WITHDRAWN',
        previousState: 'FOCUSED',
        activeBehavior: null,
        reason: `Ignored ${profile.ignored_interventions} interventions`,
        withdrawalEndsAt: this.addDays(new Date(), LIMITS.WITHDRAWAL_DAYS).toISOString(),
      };
    }

    if (profile.dismissed_count >= LIMITS.DISMISSED_THRESHOLD) {
      return {
        newState: 'WITHDRAWN',
        previousState: 'FOCUSED',
        activeBehavior: null,
        reason: `Dismissed ${profile.dismissed_count} times`,
        withdrawalEndsAt: this.addDays(new Date(), LIMITS.WITHDRAWAL_DAYS).toISOString(),
      };
    }

    // Check cooldown trigger
    if (trigger === 'INTERVENTION_DELIVERED') {
      return {
        newState: 'COOLDOWN',
        previousState: 'FOCUSED',
        activeBehavior: profile.active_behavior,
        reason: 'Post-intervention cooldown',
        cooldownEndsAt: this.addHours(new Date(), LIMITS.COOLDOWN_HOURS).toISOString(),
      };
    }

    // Check confidence drop
    const activeConfidence = this.getActiveConfidence(profile);
    if (activeConfidence < THRESHOLDS.DEACTIVATION) {
      return {
        newState: 'OBSERVING',
        previousState: 'FOCUSED',
        activeBehavior: null,
        reason: `Confidence dropped to ${activeConfidence.toFixed(2)}`,
      };
    }

    return this.noTransition('FOCUSED', 'No conditions met');
  }

  private evaluateCooldown(profile: UserBehavioralProfile): StateTransition {
    if (profile.cooldown_ends_at && new Date() < new Date(profile.cooldown_ends_at)) {
      return this.noTransition('COOLDOWN', 'Cooldown active');
    }

    const activeConfidence = this.getActiveConfidence(profile);

    if (activeConfidence >= THRESHOLDS.ACTIVATION) {
      return {
        newState: 'FOCUSED',
        previousState: 'COOLDOWN',
        activeBehavior: profile.active_behavior,
        reason: 'Cooldown ended, resuming',
      };
    }

    return {
      newState: 'OBSERVING',
      previousState: 'COOLDOWN',
      activeBehavior: null,
      reason: 'Cooldown ended, confidence low',
    };
  }

  private evaluateWithdrawn(
    profile: UserBehavioralProfile,
    trigger: TransitionTrigger
  ): StateTransition {
    if (trigger === 'POSITIVE_SIGNAL') {
      return {
        newState: 'OBSERVING',
        previousState: 'WITHDRAWN',
        activeBehavior: null,
        reason: 'Positive signal, early exit',
      };
    }

    if (profile.withdrawal_ends_at && new Date() >= new Date(profile.withdrawal_ends_at)) {
      return {
        newState: 'OBSERVING',
        previousState: 'WITHDRAWN',
        activeBehavior: null,
        reason: 'Withdrawal period ended',
      };
    }

    return this.noTransition('WITHDRAWN', 'Withdrawal active');
  }

  private getActiveConfidence(profile: UserBehavioralProfile): number {
    if (!profile.active_behavior) return 0;
    const key = `confidence_${profile.active_behavior}` as keyof UserBehavioralProfile;
    return (profile[key] as number) || 0;
  }

  private noTransition(state: UserBehavioralState, reason: string): StateTransition {
    return {
      newState: state,
      previousState: state,
      activeBehavior: null,
      reason,
    };
  }

  private addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}

export const stateMachine = new BehavioralStateMachine();
