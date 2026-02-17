/**
 * SpendTrak Behavioral Engine v2.0
 * Zustand Store - Manages behavioral state with state machine
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import { isDevMode, getDevUserId } from '@/utils/devMode';
import {
  runAllDetection,
  runAllDetectionWithSeasonal,
  clampConfidence,
  calibrateSeasonalFactors,
  type AllDetectionResults,
} from '@/services/detection';
import { detectBehavioralMoment, type BehavioralMomentResult } from '@/services/behavioralMoment';
import { makeDecision, type DecisionResult, type Intervention } from '@/services/decisionEngine';
import { stateMachine, type StateTransition } from '@/services/stateMachine';
import { selectMessage } from '@/config/interventionMessages';
import { handleFailure, calculateNewState } from '@/services/failureHandler';
import {
  detectWin,
  detectWinWithStreakCheck,
  checkStreakBreak,
  getStreakBreakMessage,
  type WinResult,
} from '@/services/winDetection';
import { LIMITS } from '@/config/behavioralConstants';
import {
  getUserBehavioralProfile as getSupabaseProfile,
  updateBehavioralProfile as updateSupabaseProfile,
  recordIntervention as recordSupabaseIntervention,
  recordWin as recordSupabaseWin,
  markWinCelebrated as markSupabaseWinCelebrated,
} from '@/services/behavior';
import { useAuthStore } from '@/stores/authStore';
import type {
  UserBehavioralProfile,
  BehavioralWin,
  InterventionDecision,
  UserResponse,
  BehaviorType,
  ConfidenceHistoryEntry,
  StreakBreakReason,
} from '@/types/behavior';
import { DEFAULT_SEASONAL_FACTORS } from '@/types/behavior';
import {
  getUserExperiments,
  trackExperimentEvent,
} from '@/services/abTesting';
import type { TransactionWithCategory } from '@/types';
import { getRandomAcknowledgment } from '@/config/quantumAcknowledgments';

// Dev mode storage keys
const DEV_PROFILE_KEY = 'spendtrak_dev_behavioral_profile';
const DEV_INTERVENTIONS_KEY = 'spendtrak_dev_interventions';
const DEV_WINS_KEY = 'spendtrak_dev_wins';

// Memory limits to prevent unbounded growth
const MAX_RECENT_INTERVENTIONS = 50;

interface BehaviorState {
  // Profile
  profile: UserBehavioralProfile | null;

  // Current state
  activeIntervention: InterventionDecision | null;
  pendingWin: BehavioralWin | null;

  // Detection results (cached)
  detectionResults: AllDetectionResults | null;

  // Recent interventions for decision engine
  recentInterventions: Intervention[];

  // UI state
  showMicroCard: boolean;
  showWinCelebration: boolean;

  // QUANTUM Acknowledgment (separate from interventions)
  acknowledgmentMessage: string | null;
  showAcknowledgment: boolean;
  isQuantumSpeaking: boolean; // For QUANTUM avatar animation

  // Loading
  isLoading: boolean;
  isEvaluating: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  evaluateBehaviors: (transactions: TransactionWithCategory[]) => Promise<void>;
  processTransaction: (transaction: TransactionWithCategory, recentTransactions: TransactionWithCategory[]) => Promise<InterventionDecision | null>;
  dismissIntervention: (response: UserResponse) => Promise<void>;
  checkForWins: (transactions: TransactionWithCategory[]) => Promise<void>;
  dismissWin: () => Promise<void>;
  triggerAcknowledgment: (transaction?: TransactionWithCategory) => void;
  hideAcknowledgment: () => void;
  clearError: () => void;
  reset: () => void;
  resetBehavioralProfile: () => Promise<void>;
}

const createDefaultProfile = (userId: string): UserBehavioralProfile => ({
  id: `profile-${userId}`,
  user_id: userId,
  user_state: 'OBSERVING',
  active_behavior: null,
  active_behavior_intensity: 0,
  state_changed_at: new Date().toISOString(),
  confidence_small_recurring: 0,
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
  budget_adherence_early_month: 1.0,
  budget_adherence_current: 1.0,
  intervention_enabled: true,
  // FIX #1: Evaluation tracking
  last_evaluated_at: null,
  evaluation_count: 0,
  // FIX #2: Confidence history
  confidence_history: [],
  // FIX #3: Seasonal factors
  seasonal_factors: DEFAULT_SEASONAL_FACTORS,
  // FIX #7: Streak tracking
  streak_broken_at: null,
  streak_break_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const initialState = {
  profile: null,
  activeIntervention: null,
  pendingWin: null,
  detectionResults: null,
  recentInterventions: [],
  showMicroCard: false,
  showWinCelebration: false,
  acknowledgmentMessage: null,
  showAcknowledgment: false,
  isQuantumSpeaking: false,
  isLoading: false,
  isEvaluating: false,
  error: null,
};

export const useBehaviorStore = create<BehaviorState>((set, get) => ({
  ...initialState,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });

      if (isDevMode()) {
        const userId = getDevUserId() || 'dev-user-default';
        const stored = await AsyncStorage.getItem(DEV_PROFILE_KEY);
        const profile = stored ? JSON.parse(stored) : createDefaultProfile(userId);
        const interventions = await AsyncStorage.getItem(DEV_INTERVENTIONS_KEY);
        set({
          profile,
          recentInterventions: interventions ? JSON.parse(interventions) : [],
          isLoading: false,
        });
      } else {
        // Production: Load from Supabase
        const user = useAuthStore.getState().user;
        if (!user?.id) {
          set({ profile: null, isLoading: false });
          return;
        }

        const supabaseProfile = await getSupabaseProfile();
        if (supabaseProfile) {
          set({
            profile: supabaseProfile,
            recentInterventions: [],
            isLoading: false,
          });
        } else {
          // Create default profile for new user
          const newProfile = createDefaultProfile(user.id);
          await updateSupabaseProfile(newProfile);
          set({
            profile: newProfile,
            recentInterventions: [],
            isLoading: false,
          });
        }
      }
    } catch (error) {
      logger.behavior.error('Failed to fetch profile:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  evaluateBehaviors: async (transactions: TransactionWithCategory[]) => {
    if (transactions.length < 10) {
      return;
    }

    try {
      set({ isEvaluating: true, error: null });

      const { profile } = get();
      if (!profile) {
        set({ isEvaluating: false });
        return;
      }

      // Run all detection algorithms
      const existingConfidences = {
        small_recurring: profile.confidence_small_recurring,
        stress_spending: profile.confidence_stress_spending,
        end_of_month: profile.confidence_end_of_month,
      };

      // FIX #3: Use seasonal-adjusted detection
      const seasonalFactors = profile.seasonal_factors || DEFAULT_SEASONAL_FACTORS;
      const results = runAllDetectionWithSeasonal(transactions, existingConfidences, seasonalFactors);

      // FIX #9: Apply confidence ceiling
      const clampedConfidences = {
        small_recurring: clampConfidence(results.small_recurring.confidence),
        stress_spending: clampConfidence(results.stress_spending.confidence),
        end_of_month: clampConfidence(results.end_of_month.confidence),
      };

      // FIX #2: Update confidence history
      const now = new Date();
      const lastHistoryEntry = profile.confidence_history?.[profile.confidence_history.length - 1];
      const shouldAddHistory = !lastHistoryEntry ||
        (now.getTime() - new Date(lastHistoryEntry.timestamp).getTime()) >= 4 * 60 * 60 * 1000; // 4 hours minimum

      let updatedHistory = profile.confidence_history || [];
      if (shouldAddHistory) {
        const historyEntry: ConfidenceHistoryEntry = {
          timestamp: now.toISOString(),
          small_recurring: clampedConfidences.small_recurring,
          stress_spending: clampedConfidences.stress_spending,
          end_of_month: clampedConfidences.end_of_month,
          detection_triggered: results.small_recurring.detected ||
            results.stress_spending.detected ||
            results.end_of_month.detected,
        };
        updatedHistory = [...updatedHistory, historyEntry].slice(-30); // Keep last 30 entries
      }

      // FIX #3: Recalibrate seasonal factors if needed
      let updatedSeasonalFactors = seasonalFactors;
      const lastCalibrated = seasonalFactors.last_calibrated_at;
      const daysSinceCalibration = lastCalibrated
        ? Math.floor((now.getTime() - new Date(lastCalibrated).getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      if (daysSinceCalibration >= 90 && transactions.length >= 90) {
        updatedSeasonalFactors = calibrateSeasonalFactors(transactions, seasonalFactors);
        logger.behavior.info('Seasonal factors recalibrated');
      }

      // FIX #1: Update evaluation tracking
      const updatedProfile: UserBehavioralProfile = {
        ...profile,
        confidence_small_recurring: clampedConfidences.small_recurring,
        confidence_stress_spending: clampedConfidences.stress_spending,
        confidence_end_of_month: clampedConfidences.end_of_month,
        last_evaluated_at: now.toISOString(),
        evaluation_count: (profile.evaluation_count || 0) + 1,
        confidence_history: updatedHistory,
        seasonal_factors: updatedSeasonalFactors,
        updated_at: now.toISOString(),
      };

      // Evaluate state transition
      const transition = await stateMachine.evaluateTransition(updatedProfile, 'TRANSACTION');

      if (transition.newState !== transition.previousState) {
        updatedProfile.user_state = transition.newState;
        updatedProfile.active_behavior = transition.activeBehavior;
        updatedProfile.state_changed_at = now.toISOString();
        if (transition.cooldownEndsAt) updatedProfile.cooldown_ends_at = transition.cooldownEndsAt;
        if (transition.withdrawalEndsAt) updatedProfile.withdrawal_ends_at = transition.withdrawalEndsAt;
      }

      // Save profile
      if (isDevMode()) {
        await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(updatedProfile));
      } else {
        // Production: Sync to Supabase
        await updateSupabaseProfile(updatedProfile);
      }

      set({
        profile: updatedProfile,
        detectionResults: results,
        isEvaluating: false,
      });
    } catch (error) {
      logger.behavior.error('Evaluation failed:', error);
      set({ error: (error as Error).message, isEvaluating: false });
    }
  },

  processTransaction: async (transaction: TransactionWithCategory, recentTransactions: TransactionWithCategory[]) => {

    try {
      const { profile, recentInterventions } = get();
      if (!profile) {
        return null;
      }

      // Step 1: Detect behavioral moment
      const behavioralMoment = detectBehavioralMoment(transaction, profile, recentTransactions);

      // Step 2: Make decision (8 gates)
      const decision = makeDecision({
        profile,
        behavioralMoment,
        recentInterventions,
      });


      if (!decision.shouldIntervene) {
        return {
          shouldIntervene: false,
          interventionType: null,
          behavior: null,
          reason: decision.reason,
          confidence: decision.confidence,
          blockedBy: decision.blockedBy,
        };
      }

      // Step 3: Select message
      const recentKeys = recentInterventions
        .slice(0, LIMITS.MESSAGE_RECENT_MEMORY)
        .map(i => i.message_key)
        .filter((key): key is string => key !== undefined);
      const message = selectMessage(
        decision.behavior!,
        decision.interventionType!,
        behavioralMoment.momentType,
        recentKeys
      );

      if (!message) {
        return null;
      }

      // Step 4: Create intervention decision
      const interventionDecision: InterventionDecision = {
        shouldIntervene: true,
        interventionType: decision.interventionType,
        behavior: decision.behavior,
        reason: decision.reason,
        confidence: decision.confidence,
        messageKey: message.key,
        messageContent: message.template,
        transactionId: transaction.id,
      };

      // Step 5: Record intervention
      const newIntervention: Intervention = {
        id: `int-${Date.now()}`,
        delivered_at: new Date().toISOString(),
        intervention_type: decision.interventionType!,
        message_key: message.key,
        user_response: undefined,
      };

      const updatedInterventions = [newIntervention, ...recentInterventions].slice(0, MAX_RECENT_INTERVENTIONS);

      // Step 6: Update profile (transition to COOLDOWN)
      const transition = await stateMachine.evaluateTransition(profile, 'INTERVENTION_DELIVERED');
      const updatedProfile: UserBehavioralProfile = {
        ...profile,
        user_state: transition.newState,
        cooldown_ends_at: transition.cooldownEndsAt || null,
        last_intervention_at: new Date().toISOString(),
        interventions_today: profile.interventions_today + 1,
        interventions_this_week: profile.interventions_this_week + 1,
        updated_at: new Date().toISOString(),
      };

      // Save
      if (isDevMode()) {
        await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(updatedProfile));
        await AsyncStorage.setItem(DEV_INTERVENTIONS_KEY, JSON.stringify(updatedInterventions));
      } else {
        // Production: Sync to Supabase
        await updateSupabaseProfile(updatedProfile);
        await recordSupabaseIntervention({
          type: decision.interventionType!,
          messageKey: message.key,
          transactionId: transaction.id,
        });
      }

      set({
        profile: updatedProfile,
        recentInterventions: updatedInterventions,
        activeIntervention: interventionDecision,
        showMicroCard: true,
      });

      // FIX #6: Track experiment event for intervention shown
      const trackingUserId = isDevMode() ? getDevUserId() : (profile.user_id || '');
      if (trackingUserId) {
        const userExperiments = await getUserExperiments(trackingUserId);
        for (const assignment of userExperiments.assignments) {
          await trackExperimentEvent(
            trackingUserId,
            assignment.experiment_id,
            assignment.variant_id,
            'intervention_shown',
            { behavior: decision.behavior, interventionType: decision.interventionType }
          );
        }
      }

      return interventionDecision;
    } catch (error) {
      logger.behavior.error('Process transaction failed:', error);
      return null;
    }
  },

  dismissIntervention: async (response: UserResponse) => {

    try {
      const { profile, recentInterventions, activeIntervention } = get();
      if (!profile) return;

      // Update the intervention record
      const updatedInterventions = recentInterventions.map((i, idx) =>
        idx === 0 ? { ...i, user_response: response } : i
      );

      // Handle failure modes
      let updatedProfile = { ...profile };

      if (response === 'ignored') {
        updatedProfile.ignored_interventions += 1;
        const failureResponse = handleFailure('USER_IGNORED', updatedProfile);
        const stateUpdates = calculateNewState(updatedProfile, failureResponse);
        updatedProfile = { ...updatedProfile, ...stateUpdates };
      } else if (response === 'dismissed') {
        updatedProfile.dismissed_count += 1;
        const failureResponse = handleFailure('USER_DISMISSED', updatedProfile);
        const stateUpdates = calculateNewState(updatedProfile, failureResponse);
        updatedProfile = { ...updatedProfile, ...stateUpdates };
      }

      updatedProfile.updated_at = new Date().toISOString();

      // Save
      if (isDevMode()) {
        await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(updatedProfile));
        await AsyncStorage.setItem(DEV_INTERVENTIONS_KEY, JSON.stringify(updatedInterventions));
      } else {
        // Production: Sync to Supabase
        await updateSupabaseProfile(updatedProfile);
      }

      set({
        profile: updatedProfile,
        recentInterventions: updatedInterventions,
        activeIntervention: null,
        showMicroCard: false,
      });

      // FIX #6: Track experiment event for intervention response
      const trackingUserId = isDevMode() ? getDevUserId() : (updatedProfile.user_id || '');
      if (trackingUserId) {
        const userExperiments = await getUserExperiments(trackingUserId);
        const eventType = response === 'engaged' ? 'intervention_engaged' : 'intervention_dismissed';
        for (const assignment of userExperiments.assignments) {
          await trackExperimentEvent(
            trackingUserId,
            assignment.experiment_id,
            assignment.variant_id,
            eventType,
            { response, behavior: activeIntervention?.behavior }
          );
        }
      }
    } catch (error) {
      logger.behavior.error('Dismiss failed:', error);
      set({ activeIntervention: null, showMicroCard: false });
    }
  },

  checkForWins: async (transactions: TransactionWithCategory[]) => {
    try {
      const { profile } = get();
      if (!profile || !profile.active_behavior || !profile.user_id) return;

      const userId = isDevMode() ? (getDevUserId() || 'dev-user-default') : profile.user_id;

      // FIX #7: Check for wins with streak break detection
      const { winResult, streakBreak } = await detectWinWithStreakCheck(
        userId,
        profile,
        transactions
      );

      // Handle streak break first
      if (streakBreak) {
        const updatedProfile: UserBehavioralProfile = {
          ...profile,
          current_streak: 0,
          streak_broken_at: streakBreak.broken_at,
          streak_break_reason: streakBreak.reason,
          updated_at: new Date().toISOString(),
        };

        if (isDevMode()) {
          await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(updatedProfile));
        } else {
          await updateSupabaseProfile(updatedProfile);
        }

        set({ profile: updatedProfile });
        logger.behavior.info('Streak broken:', streakBreak);
      }

      // FIX #6: Track experiment event for win
      if (winResult.hasWin && userId) {
        const userExperiments = await getUserExperiments(userId);
        for (const assignment of userExperiments.assignments) {
          await trackExperimentEvent(
            userId,
            assignment.experiment_id,
            assignment.variant_id,
            'win_celebrated',
            { winType: winResult.winType }
          );
        }
      }

      if (winResult.hasWin && winResult.shouldCelebrate) {
        const streakDays = typeof winResult.metadata?.streakDays === 'number'
          ? winResult.metadata.streakDays
          : null;
        const improvementPercent = typeof winResult.metadata?.improvementPercentage === 'number'
          ? winResult.metadata.improvementPercentage
          : null;

        // Type guard: active_behavior is guaranteed non-null from the check at function start
        const activeBehavior = profile.active_behavior!;

        const win: BehavioralWin = {
          id: `win-${Date.now()}`,
          user_id: userId,
          behavior_type: activeBehavior,
          win_type: winResult.winType!,
          message: winResult.message,
          streak_days: streakDays,
          improvement_percent: improvementPercent,
          celebrated: false,
          celebrated_at: null,
          created_at: new Date().toISOString(),
        };

        // Save win
        if (isDevMode()) {
          const stored = await AsyncStorage.getItem(DEV_WINS_KEY);
          const wins = stored ? JSON.parse(stored) : [];
          wins.unshift(win);
          await AsyncStorage.setItem(DEV_WINS_KEY, JSON.stringify(wins.slice(0, 50)));
        } else {
          // Production: Sync to Supabase
          await recordSupabaseWin({
            user_id: userId,
            behavior_type: activeBehavior,
            win_type: winResult.winType!,
            message: winResult.message,
            streak_days: streakDays,
            improvement_percent: improvementPercent,
            celebrated: false,
            celebrated_at: null,
          });
        }

        set({
          pendingWin: win,
          showWinCelebration: true,
        });

      }
    } catch (error) {
      logger.behavior.error('Check wins failed:', error);
    }
  },

  dismissWin: async () => {
    try {
      const { pendingWin, profile } = get();
      if (!pendingWin || !profile) {
        set({ pendingWin: null, showWinCelebration: false });
        return;
      }

      // Update win as celebrated
      if (isDevMode()) {
        const stored = await AsyncStorage.getItem(DEV_WINS_KEY);
        const wins: BehavioralWin[] = stored ? JSON.parse(stored) : [];
        const updated = wins.map(w =>
          w.id === pendingWin.id
            ? { ...w, celebrated: true, celebrated_at: new Date().toISOString() }
            : w
        );
        await AsyncStorage.setItem(DEV_WINS_KEY, JSON.stringify(updated));
      } else {
        // Production: Mark celebrated in Supabase
        await markSupabaseWinCelebrated(pendingWin.id);
      }

      // Update profile streak
      const updatedProfile: UserBehavioralProfile = {
        ...profile,
        total_wins: profile.total_wins + 1,
        current_streak: profile.current_streak + 1,
        longest_streak: Math.max(profile.longest_streak, profile.current_streak + 1),
        last_win_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isDevMode()) {
        await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(updatedProfile));
      } else {
        // Production: Sync to Supabase
        await updateSupabaseProfile(updatedProfile);
      }

      set({
        profile: updatedProfile,
        pendingWin: null,
        showWinCelebration: false,
      });
    } catch (error) {
      logger.behavior.error('Dismiss win failed:', error);
      set({ pendingWin: null, showWinCelebration: false });
    }
  },

  // QUANTUM Acknowledgment - show speech bubble on every transaction (like Duolingo!)
  triggerAcknowledgment: (transaction?: TransactionWithCategory) => {
    const ackContext = transaction ? {
      amount: transaction.amount,
      category_id: transaction.category_id || undefined,
    } : undefined;
    const message = getRandomAcknowledgment(ackContext);
    set({
      acknowledgmentMessage: message,
      showAcknowledgment: true,
      isQuantumSpeaking: true, // Trigger QUANTUM avatar animation
    });
  },

  hideAcknowledgment: () => {
    set({
      acknowledgmentMessage: null,
      showAcknowledgment: false,
      isQuantumSpeaking: false,
    });
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),

  // Reset behavioral profile to OBSERVING state (for re-engagement)
  // FIX #7: Properly handle streak reset
  resetBehavioralProfile: async () => {
    try {
      const { profile } = get();
      if (!profile) return;

      const now = new Date().toISOString();

      const resetProfile: UserBehavioralProfile = {
        ...profile,
        user_state: 'OBSERVING',
        active_behavior: null,
        active_behavior_intensity: 0,
        state_changed_at: now,
        cooldown_ends_at: null,
        withdrawal_ends_at: null,
        ignored_interventions: 0,
        dismissed_count: 0,
        // FIX #7: Record streak break if there was a streak
        streak_broken_at: profile.current_streak > 0 ? now : profile.streak_broken_at,
        streak_break_reason: profile.current_streak > 0 ? 'user_reset' : profile.streak_break_reason,
        current_streak: 0,
        // FIX #2: Preserve confidence history during reset
        confidence_history: profile.confidence_history || [],
        updated_at: now,
      };

      if (isDevMode()) {
        await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(resetProfile));
      } else {
        // Production: Sync to Supabase
        await updateSupabaseProfile(resetProfile);
      }

      set({
        profile: resetProfile,
        activeIntervention: null,
        showMicroCard: false,
      });

      logger.behavior.info('Profile reset with streak break tracking');
    } catch (error) {
      logger.behavior.error('Reset profile failed:', error);
    }
  },
}));

// ============================================
// SELECTOR HOOKS
// ============================================

export function useUserState() {
  return useBehaviorStore((state) => state.profile?.user_state ?? 'OBSERVING');
}

export function useActiveBehavior() {
  return useBehaviorStore((state) => state.profile?.active_behavior ?? null);
}

export function useActiveBehaviorConfidence() {
  return useBehaviorStore((state) => state.profile?.active_behavior_intensity ?? 0);
}

export function useConfidenceScores() {
  return useBehaviorStore((state) => ({
    small_recurring: state.profile?.confidence_small_recurring ?? 0,
    stress_spending: state.profile?.confidence_stress_spending ?? 0,
    end_of_month: state.profile?.confidence_end_of_month ?? 0,
  }));
}

export function useWinStreak() {
  return useBehaviorStore((state) => state.profile?.current_streak ?? 0);
}

export function useTotalWins() {
  return useBehaviorStore((state) => state.profile?.total_wins ?? 0);
}

export function useHasActiveIntervention() {
  return useBehaviorStore((state) => state.showMicroCard && state.activeIntervention !== null);
}

export function useHasWinCelebration() {
  return useBehaviorStore((state) => state.showWinCelebration && state.pendingWin !== null);
}

export function useIsInCooldown() {
  return useBehaviorStore((state) => state.profile?.user_state === 'COOLDOWN');
}

export function useIsWithdrawn() {
  return useBehaviorStore((state) => state.profile?.user_state === 'WITHDRAWN');
}

export function useInterventionsToday() {
  return useBehaviorStore((state) => state.profile?.interventions_today ?? 0);
}

export function useQuantumAcknowledgment() {
  return useBehaviorStore((state) => ({
    message: state.acknowledgmentMessage,
    visible: state.showAcknowledgment,
    isSpeaking: state.isQuantumSpeaking,
  }));
}

export function useIsQuantumSpeaking() {
  return useBehaviorStore((state) => state.isQuantumSpeaking);
}

// ============================================
// FIX-RELATED SELECTOR HOOKS
// ============================================

// FIX #1: Evaluation tracking hooks
export function useLastEvaluatedAt() {
  return useBehaviorStore((state) => state.profile?.last_evaluated_at ?? null);
}

export function useEvaluationCount() {
  return useBehaviorStore((state) => state.profile?.evaluation_count ?? 0);
}

// FIX #2: Confidence history hooks
export function useConfidenceHistory() {
  return useBehaviorStore((state) => state.profile?.confidence_history ?? []);
}

export function useConfidenceTrend() {
  return useBehaviorStore((state) => {
    const history = state.profile?.confidence_history ?? [];
    if (history.length < 2) return 'stable';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((s, h) =>
      s + h.small_recurring + h.stress_spending + h.end_of_month, 0) / (recent.length * 3);
    const olderAvg = older.reduce((s, h) =>
      s + h.small_recurring + h.stress_spending + h.end_of_month, 0) / (older.length * 3);

    if (recentAvg > olderAvg * 1.1) return 'increasing';
    if (recentAvg < olderAvg * 0.9) return 'decreasing';
    return 'stable';
  });
}

// FIX #3: Seasonal factor hooks
export function useSeasonalFactors() {
  return useBehaviorStore((state) => state.profile?.seasonal_factors ?? DEFAULT_SEASONAL_FACTORS);
}

export function useIsHolidayPeriod() {
  return useBehaviorStore((state) => state.profile?.seasonal_factors?.is_holiday_period ?? false);
}

// FIX #7: Streak break hooks
export function useStreakBreakInfo() {
  return useBehaviorStore((state) => ({
    brokenAt: state.profile?.streak_broken_at ?? null,
    reason: state.profile?.streak_break_reason ?? null,
    currentStreak: state.profile?.current_streak ?? 0,
    longestStreak: state.profile?.longest_streak ?? 0,
  }));
}

export function useHasStreakBroken() {
  return useBehaviorStore((state) => state.profile?.streak_broken_at !== null);
}
