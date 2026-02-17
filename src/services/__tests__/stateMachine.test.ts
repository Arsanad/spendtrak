/**
 * State Machine Service Tests
 * Tests for behavioral state transitions
 */

import { BehavioralStateMachine, stateMachine } from '../stateMachine';
import type { UserBehavioralProfile } from '../../types/behavior';

// Mock behavioral constants
jest.mock('../../config/behavioralConstants', () => ({
  THRESHOLDS: {
    ACTIVATION: 0.6,
    DEACTIVATION: 0.3,
  },
  LIMITS: {
    IGNORED_THRESHOLD: 3,
    DISMISSED_THRESHOLD: 5,
    COOLDOWN_HOURS: 4,
    WITHDRAWAL_DAYS: 7,
  },
}));

function createProfile(overrides: Partial<UserBehavioralProfile> = {}): UserBehavioralProfile {
  return {
    id: 'profile-1',
    user_id: 'user-1',
    user_state: 'OBSERVING',
    intervention_enabled: true,
    active_behavior: null,
    confidence_small_recurring: 0,
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

describe('BehavioralStateMachine', () => {
  let machine: BehavioralStateMachine;

  beforeEach(() => {
    machine = new BehavioralStateMachine();
  });

  describe('OBSERVING state', () => {
    it('should transition to FOCUSED when confidence exceeds activation threshold', async () => {
      const profile = createProfile({
        user_state: 'OBSERVING',
        confidence_small_recurring: 0.7,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('FOCUSED');
      expect(result.activeBehavior).toBe('small_recurring');
    });

    it('should stay OBSERVING when confidence is below threshold', async () => {
      const profile = createProfile({
        user_state: 'OBSERVING',
        confidence_small_recurring: 0.4,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('OBSERVING');
      expect(result.reason).toContain('Confidence too low');
    });

    it('should select behavior with highest confidence', async () => {
      const profile = createProfile({
        user_state: 'OBSERVING',
        confidence_small_recurring: 0.5,
        confidence_stress_spending: 0.8,
        confidence_end_of_month: 0.6,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('FOCUSED');
      expect(result.activeBehavior).toBe('stress_spending');
    });
  });

  describe('FOCUSED state', () => {
    it('should transition to WITHDRAWN when ignored threshold reached', async () => {
      const profile = createProfile({
        user_state: 'FOCUSED',
        active_behavior: 'small_recurring',
        confidence_small_recurring: 0.7,
        ignored_interventions: 3,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('WITHDRAWN');
      expect(result.withdrawalEndsAt).toBeDefined();
    });

    it('should transition to WITHDRAWN when dismissed threshold reached', async () => {
      const profile = createProfile({
        user_state: 'FOCUSED',
        active_behavior: 'small_recurring',
        confidence_small_recurring: 0.7,
        dismissed_count: 5,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('WITHDRAWN');
    });

    it('should transition to COOLDOWN after intervention delivered', async () => {
      const profile = createProfile({
        user_state: 'FOCUSED',
        active_behavior: 'small_recurring',
        confidence_small_recurring: 0.7,
      });

      const result = await machine.evaluateTransition(profile, 'INTERVENTION_DELIVERED');

      expect(result.newState).toBe('COOLDOWN');
      expect(result.cooldownEndsAt).toBeDefined();
    });

    it('should transition to OBSERVING when confidence drops', async () => {
      const profile = createProfile({
        user_state: 'FOCUSED',
        active_behavior: 'small_recurring',
        confidence_small_recurring: 0.2,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('OBSERVING');
      expect(result.activeBehavior).toBeNull();
    });

    it('should stay FOCUSED when no conditions met', async () => {
      const profile = createProfile({
        user_state: 'FOCUSED',
        active_behavior: 'small_recurring',
        confidence_small_recurring: 0.7,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('FOCUSED');
    });
  });

  describe('COOLDOWN state', () => {
    it('should stay in COOLDOWN when cooldown is active', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const profile = createProfile({
        user_state: 'COOLDOWN',
        active_behavior: 'small_recurring',
        cooldown_ends_at: futureDate,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('COOLDOWN');
    });

    it('should transition to FOCUSED when cooldown ends and confidence high', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const profile = createProfile({
        user_state: 'COOLDOWN',
        active_behavior: 'small_recurring',
        confidence_small_recurring: 0.7,
        cooldown_ends_at: pastDate,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('FOCUSED');
    });

    it('should transition to OBSERVING when cooldown ends and confidence low', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const profile = createProfile({
        user_state: 'COOLDOWN',
        active_behavior: 'small_recurring',
        confidence_small_recurring: 0.4,
        cooldown_ends_at: pastDate,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('OBSERVING');
    });
  });

  describe('WITHDRAWN state', () => {
    it('should stay WITHDRAWN when withdrawal is active', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const profile = createProfile({
        user_state: 'WITHDRAWN',
        withdrawal_ends_at: futureDate,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('WITHDRAWN');
    });

    it('should transition to OBSERVING on positive signal', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const profile = createProfile({
        user_state: 'WITHDRAWN',
        withdrawal_ends_at: futureDate,
      });

      const result = await machine.evaluateTransition(profile, 'POSITIVE_SIGNAL');

      expect(result.newState).toBe('OBSERVING');
      expect(result.reason).toContain('Positive signal');
    });

    it('should transition to OBSERVING when withdrawal period ends', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const profile = createProfile({
        user_state: 'WITHDRAWN',
        withdrawal_ends_at: pastDate,
      });

      const result = await machine.evaluateTransition(profile, 'TRANSACTION');

      expect(result.newState).toBe('OBSERVING');
      expect(result.reason).toContain('Withdrawal period ended');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(stateMachine).toBeInstanceOf(BehavioralStateMachine);
    });
  });
});
