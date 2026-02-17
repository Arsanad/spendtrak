/**
 * Decision Engine Service Tests
 * Tests for rule-based intervention decisions
 */

import { makeDecision } from '../decisionEngine';
import type { UserBehavioralProfile } from '../../types/behavior';
import type { BehavioralMomentResult } from '../behavioralMoment';

// Mock behavioral constants
jest.mock('../../config/behavioralConstants', () => ({
  THRESHOLDS: {
    INTERVENTION: 0.6,
  },
  LIMITS: {
    MAX_INTERVENTIONS_PER_DAY: 3,
    MAX_INTERVENTIONS_PER_WEEK: 10,
  },
  InterventionType: {},
}));

describe('decisionEngine', () => {
  const createProfile = (overrides: Partial<UserBehavioralProfile> = {}): UserBehavioralProfile => ({
    id: 'profile-1',
    user_id: 'user-1',
    user_state: 'FOCUSED',
    active_behavior: 'small_recurring',
    active_behavior_intensity: 0,
    state_changed_at: new Date().toISOString(),
    confidence_small_recurring: 0.8,
    confidence_stress_spending: 0,
    confidence_end_of_month: 0,
    last_detected_small_recurring: null,
    last_detected_stress_spending: null,
    last_detected_end_of_month: null,
    last_intervention_at: null,
    cooldown_ends_at: null,
    withdrawal_ends_at: null,
    interventions_today: 0,
    interventions_this_week: 0,
    last_intervention_reset: new Date().toISOString(),
    ignored_interventions: 0,
    dismissed_count: 0,
    total_wins: 0,
    current_streak: 0,
    longest_streak: 0,
    last_win_at: null,
    budget_adherence_early_month: 0,
    budget_adherence_current: 0,
    intervention_enabled: true,
    last_evaluated_at: null,
    evaluation_count: 0,
    confidence_history: [],
    seasonal_factors: { monthly_factors: {}, day_of_week_factors: {}, is_holiday_period: false, last_calibrated_at: null },
    streak_broken_at: null,
    streak_break_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const createBehavioralMoment = (isMoment: boolean): BehavioralMomentResult => ({
    isBehavioralMoment: isMoment,
    momentType: isMoment ? 'REPEAT_PURCHASE' : null,
    confidence: isMoment ? 0.85 : 0,
    reason: isMoment ? 'Repeat purchase detected' : 'Not a behavioral moment',
  });

  describe('makeDecision', () => {
    it('should block when user state is not FOCUSED', () => {
      const context = {
        profile: createProfile({ user_state: 'COOLING_DOWN' as any }),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('STATE');
    });

    it('should block when interventions are disabled', () => {
      const context = {
        profile: createProfile({ intervention_enabled: false }),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('DISABLED');
    });

    it('should block when in cooldown period', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const context = {
        profile: createProfile({ cooldown_ends_at: futureDate }),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('COOLDOWN');
    });

    it('should block when daily limit reached', () => {
      const today = new Date();
      const context = {
        profile: createProfile(),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions: [
          { id: '1', delivered_at: today.toISOString(), intervention_type: 'immediate_mirror' as const },
          { id: '2', delivered_at: today.toISOString(), intervention_type: 'immediate_mirror' as const },
          { id: '3', delivered_at: today.toISOString(), intervention_type: 'immediate_mirror' as const },
        ],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('DAILY_LIMIT');
    });

    it('should block when weekly limit reached', () => {
      const recentInterventions = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        delivered_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        intervention_type: 'immediate_mirror' as const,
      }));

      const context = {
        profile: createProfile(),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions,
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('WEEKLY_LIMIT');
    });

    it('should block when no active behavior', () => {
      const context = {
        profile: createProfile({ active_behavior: null }),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('NO_ACTIVE_BEHAVIOR');
    });

    it('should block when confidence is too low', () => {
      const context = {
        profile: createProfile({ confidence_small_recurring: 0.3 }),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('LOW_CONFIDENCE');
    });

    it('should block when not a behavioral moment', () => {
      const context = {
        profile: createProfile(),
        behavioralMoment: createBehavioralMoment(false),
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.blockedBy).toBe('NOT_BEHAVIORAL_MOMENT');
    });

    it('should allow intervention when all gates pass', () => {
      const context = {
        profile: createProfile(),
        behavioralMoment: createBehavioralMoment(true),
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(true);
      expect(result.behavior).toBe('small_recurring');
      expect(result.interventionType).toBeDefined();
      expect(result.confidence).toBe(0.8);
    });

    it('should select appropriate intervention type based on moment', () => {
      const context = {
        profile: createProfile(),
        behavioralMoment: {
          isBehavioralMoment: true,
          momentType: 'RELAPSE_AFTER_IMPROVEMENT' as const,
          confidence: 0.9,
          reason: 'Relapse detected',
        },
        recentInterventions: [],
      };

      const result = makeDecision(context);

      expect(result.shouldIntervene).toBe(true);
      expect(result.interventionType).toBe('reinforcement');
    });
  });
});
