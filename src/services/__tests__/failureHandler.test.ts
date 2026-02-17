/**
 * Failure Handler Service Tests
 * Tests for handling user rejection and negative signals
 */

import {
  handleFailure,
  detectAnnoyance,
  calculateNewState,
} from '../failureHandler';
import type { UserBehavioralProfile } from '../../types/behavior';
import type { Intervention } from '../decisionEngine';

// Mock behavioral constants
jest.mock('../../config/behavioralConstants', () => ({
  LIMITS: {
    IGNORED_THRESHOLD: 3,
    DISMISSED_THRESHOLD: 5,
    WITHDRAWAL_DAYS: 7,
    EXTENDED_COOLDOWN_HOURS: 12,
    ANNOYANCE_WITHDRAWAL_DAYS: 14,
  },
}));

function createProfile(overrides: Partial<UserBehavioralProfile> = {}): UserBehavioralProfile {
  return {
    id: 'profile-1',
    user_id: 'user-1',
    user_state: 'FOCUSED',
    intervention_enabled: true,
    active_behavior: 'small_recurring',
    confidence_small_recurring: 0.7,
    confidence_stress_spending: 0,
    confidence_end_of_month: 0,
    cooldown_ends_at: null,
    withdrawal_ends_at: null,
    current_streak: 0,
    last_win_at: null,
    ignored_interventions: 0,
    dismissed_count: 0,
    budget_adherence_early_month: null,
    budget_adherence_current: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as UserBehavioralProfile;
}

function createIntervention(
  id: string,
  response: string,
  hoursAgo: number = 0
): Intervention {
  const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return {
    id,
    delivered_at: date.toISOString(),
    intervention_type: 'immediate_mirror',
    user_response: response,
  };
}

describe('failureHandler', () => {
  describe('handleFailure', () => {
    describe('USER_IGNORED', () => {
      it('should extend cooldown for first ignores', () => {
        const profile = createProfile({ ignored_interventions: 1 });

        const result = handleFailure('USER_IGNORED', profile);

        expect(result.action).toBe('extend_cooldown');
        expect(result.duration).toBe(24);
      });

      it('should withdraw when ignored threshold reached', () => {
        const profile = createProfile({ ignored_interventions: 2 }); // Will become 3

        const result = handleFailure('USER_IGNORED', profile);

        expect(result.action).toBe('withdraw');
        expect(result.duration).toBe(168); // 7 days * 24 hours
      });
    });

    describe('USER_DISMISSED', () => {
      it('should extend cooldown for early dismissals', () => {
        const profile = createProfile({ dismissed_count: 2 });

        const result = handleFailure('USER_DISMISSED', profile);

        expect(result.action).toBe('extend_cooldown');
        expect(result.duration).toBe(12);
      });

      it('should withdraw when dismissed threshold reached', () => {
        const profile = createProfile({ dismissed_count: 4 }); // Will become 5

        const result = handleFailure('USER_DISMISSED', profile);

        expect(result.action).toBe('withdraw');
      });
    });

    describe('USER_ANNOYED', () => {
      it('should withdraw with annoyance duration', () => {
        const profile = createProfile();

        const result = handleFailure('USER_ANNOYED', profile);

        expect(result.action).toBe('withdraw');
        expect(result.duration).toBe(336); // 14 days * 24 hours
        expect(result.reason).toContain('Annoyance');
      });
    });

    describe('USER_CHURNING', () => {
      it('should reset profile', () => {
        const profile = createProfile();

        const result = handleFailure('USER_CHURNING', profile);

        expect(result.action).toBe('reset');
        expect(result.reason).toContain('inactive');
      });
    });

    describe('CONFIDENCE_DROPPED', () => {
      it('should reduce frequency', () => {
        const profile = createProfile();

        const result = handleFailure('CONFIDENCE_DROPPED', profile);

        expect(result.action).toBe('reduce_frequency');
      });
    });

    describe('unknown mode', () => {
      it('should reduce frequency for unknown modes', () => {
        const profile = createProfile();

        const result = handleFailure('UNKNOWN_MODE' as any, profile);

        expect(result.action).toBe('reduce_frequency');
        expect(result.reason).toContain('Unknown');
      });
    });
  });

  describe('detectAnnoyance', () => {
    it('should return null when no annoyance signals', () => {
      const profile = createProfile();
      const interventions: Intervention[] = [];

      const result = detectAnnoyance(interventions, profile);

      expect(result).toBeNull();
    });

    it('should detect rapid dismissals (3+ in 24h)', () => {
      const profile = createProfile();
      const interventions = [
        createIntervention('1', 'dismissed', 2),
        createIntervention('2', 'dismissed', 5),
        createIntervention('3', 'dismissed', 10),
      ];

      const result = detectAnnoyance(interventions, profile);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('rapid_dismiss');
      expect(result?.severity).toBe('high');
    });

    it('should not detect old dismissals', () => {
      const profile = createProfile();
      const interventions = [
        createIntervention('1', 'dismissed', 30), // 30 hours ago
        createIntervention('2', 'dismissed', 35),
        createIntervention('3', 'dismissed', 40),
      ];

      const result = detectAnnoyance(interventions, profile);

      expect(result).toBeNull();
    });

    it('should detect disabled interventions', () => {
      const profile = createProfile({ intervention_enabled: false });
      const interventions: Intervention[] = [];

      const result = detectAnnoyance(interventions, profile);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('settings_change');
      expect(result?.severity).toBe('high');
    });

    it('should not flag non-dismissal responses', () => {
      const profile = createProfile();
      const interventions = [
        createIntervention('1', 'engaged', 2),
        createIntervention('2', 'engaged', 5),
        createIntervention('3', 'engaged', 10),
      ];

      const result = detectAnnoyance(interventions, profile);

      expect(result).toBeNull();
    });
  });

  describe('calculateNewState', () => {
    describe('withdraw action', () => {
      it('should set WITHDRAWN state with end date', () => {
        const profile = createProfile();
        const response = { action: 'withdraw' as const, duration: 168, reason: 'test' };

        const updates = calculateNewState(profile, response);

        expect(updates.user_state).toBe('WITHDRAWN');
        expect(updates.withdrawal_ends_at).toBeDefined();
        expect(updates.active_behavior).toBeNull();
      });

      it('should calculate withdrawal end date correctly', () => {
        const profile = createProfile();
        const response = { action: 'withdraw' as const, duration: 24, reason: 'test' };

        const updates = calculateNewState(profile, response);
        const endDate = new Date(updates.withdrawal_ends_at!);
        const expectedEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Allow 1 second tolerance
        expect(Math.abs(endDate.getTime() - expectedEnd.getTime())).toBeLessThan(1000);
      });
    });

    describe('extend_cooldown action', () => {
      it('should set COOLDOWN state with end date', () => {
        const profile = createProfile();
        const response = { action: 'extend_cooldown' as const, duration: 12, reason: 'test' };

        const updates = calculateNewState(profile, response);

        expect(updates.user_state).toBe('COOLDOWN');
        expect(updates.cooldown_ends_at).toBeDefined();
      });

      it('should use default duration if not specified', () => {
        const profile = createProfile();
        const response = { action: 'extend_cooldown' as const, reason: 'test' };

        const updates = calculateNewState(profile, response);
        const endDate = new Date(updates.cooldown_ends_at!);
        const expectedEnd = new Date(Date.now() + 48 * 60 * 60 * 1000);

        expect(Math.abs(endDate.getTime() - expectedEnd.getTime())).toBeLessThan(1000);
      });
    });

    describe('reset action', () => {
      it('should reset all tracking fields', () => {
        const profile = createProfile({
          confidence_small_recurring: 0.8,
          confidence_stress_spending: 0.5,
          ignored_interventions: 5,
          dismissed_count: 3,
        });
        const response = { action: 'reset' as const, reason: 'test' };

        const updates = calculateNewState(profile, response);

        expect(updates.user_state).toBe('OBSERVING');
        expect(updates.active_behavior).toBeNull();
        expect(updates.confidence_small_recurring).toBe(0);
        expect(updates.confidence_stress_spending).toBe(0);
        expect(updates.confidence_end_of_month).toBe(0);
        expect(updates.ignored_interventions).toBe(0);
        expect(updates.dismissed_count).toBe(0);
      });
    });

    describe('reduce_frequency action', () => {
      it('should set 24-hour cooldown', () => {
        const profile = createProfile();
        const response = { action: 'reduce_frequency' as const, reason: 'test' };

        const updates = calculateNewState(profile, response);

        expect(updates.cooldown_ends_at).toBeDefined();
        const endDate = new Date(updates.cooldown_ends_at!);
        const expectedEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);

        expect(Math.abs(endDate.getTime() - expectedEnd.getTime())).toBeLessThan(1000);
      });
    });
  });
});
