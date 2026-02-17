/**
 * SpendTrak Behavioral Engine v2.0
 * Barrel Export - Re-exports from modular services
 */

import { isDevMode } from '@/utils/devMode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { logger } from '@/utils/logger';
import type { UserBehavioralProfile, BehavioralContext, BehavioralWin } from '@/types/behavior';
import type { Transaction } from '@/types';

/**
 * Get the authenticated Supabase user ID, or null if not signed in.
 */
async function getAuthUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// Re-export detection functions
export {
  runAllDetection,
  detectSmallRecurring,
  detectStressSpending,
  detectEndOfMonthCollapse,
  type BehavioralSignal,
  type DetectionResult,
  type AllDetectionResults,
} from './detection';

// Re-export behavioral moment detection
export {
  detectBehavioralMoment,
  type BehavioralMomentType,
  type BehavioralMomentResult,
} from './behavioralMoment';

// Re-export decision engine
export {
  makeDecision,
  type DecisionResult,
  type Intervention,
} from './decisionEngine';

// Re-export state machine
export {
  stateMachine,
  type StateTransition,
} from './stateMachine';

// Re-export win detection
export {
  detectWin,
  type WinResult,
} from './winDetection';

// Re-export failure handler
export {
  handleFailure,
  calculateNewState,
  type FailureMode,
  type FailureResponse,
} from './failureHandler';

// Dev mode storage keys
const DEV_PROFILE_KEY = 'spendtrak_dev_behavioral_profile';
const DEV_INTERVENTIONS_KEY = 'spendtrak_dev_interventions';
const DEV_WINS_KEY = 'spendtrak_dev_wins';

/**
 * Load behavior profile result type
 */
export interface LoadBehaviorProfileResult {
  success: boolean;
  data?: UserBehavioralProfile;
  error?: string;
}

/**
 * Load behavior profile with status result (for error handling)
 */
export async function loadBehaviorProfile(): Promise<LoadBehaviorProfileResult> {
  try {
    const profile = await getUserBehavioralProfile();
    return { success: true, data: profile ?? undefined };
  } catch (error) {
    logger.behavior.error('Failed to load behavior profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load profile'
    };
  }
}

/**
 * Get user behavioral profile
 */
export async function getUserBehavioralProfile(): Promise<UserBehavioralProfile | null> {
  if (isDevMode()) {
    const stored = await AsyncStorage.getItem(DEV_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  const userId = await getAuthUserId();
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('user_behavioral_profile')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      // PGRST116 = no rows found — profile doesn't exist yet
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as UserBehavioralProfile;
  } catch (error) {
    logger.behavior.error('Failed to load profile from Supabase:', error);
    return null;
  }
}

/**
 * Update user behavioral profile
 */
export async function updateBehavioralProfile(
  updates: Partial<UserBehavioralProfile>
): Promise<void> {
  if (isDevMode()) {
    const stored = await AsyncStorage.getItem(DEV_PROFILE_KEY);
    const profile = stored ? JSON.parse(stored) : null;
    if (profile) {
      const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
      await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(updated));
    }
    return;
  }
  const userId = await getAuthUserId();
  if (!userId) return;
  try {
    // Ensure profile exists (upsert), then apply updates
    const { error: upsertError } = await supabase
      .from('user_behavioral_profile')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });
    if (upsertError) throw upsertError;

    const { id, user_id, created_at, ...safeUpdates } = updates as UserBehavioralProfile;
    const { error } = await supabase
      .from('user_behavioral_profile')
      .update(safeUpdates)
      .eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    logger.behavior.error('Failed to update profile in Supabase:', error);
  }
}

/**
 * Update behavior confidence score
 */
export async function updateBehaviorConfidence(
  behaviorType: 'small_recurring' | 'stress_spending' | 'end_of_month',
  confidence: number
): Promise<void> {
  const key = `confidence_${behaviorType}` as keyof UserBehavioralProfile;
  await updateBehavioralProfile({ [key]: confidence } as Partial<UserBehavioralProfile>);
}

/**
 * Record a behavioral signal
 */
export async function recordSignal(signal: {
  type: string;
  strength: number;
  transactionId: string;
  reason: string;
}): Promise<void> {
  // In v2.0, signals are processed in-memory by detection layer
  // This is kept for compatibility but is a no-op
}

/**
 * Check if intervention can be shown
 */
export function canShowIntervention(profile: UserBehavioralProfile): boolean {
  if (!profile.intervention_enabled) return false;
  if (profile.user_state === 'COOLDOWN' || profile.user_state === 'WITHDRAWN') return false;
  if (profile.interventions_today >= 3) return false;
  if (profile.cooldown_ends_at && new Date(profile.cooldown_ends_at) > new Date()) return false;
  return true;
}

/**
 * Decide if intervention should be shown (simplified wrapper)
 */
export function decideIntervention(
  profile: UserBehavioralProfile
): { shouldIntervene: boolean; reason: string } {
  if (!canShowIntervention(profile)) {
    return { shouldIntervene: false, reason: 'Intervention blocked by limits' };
  }
  if (!profile.active_behavior) {
    return { shouldIntervene: false, reason: 'No active behavior' };
  }
  const confidence = profile[`confidence_${profile.active_behavior}` as keyof UserBehavioralProfile] as number;
  if (confidence < 0.6) {
    return { shouldIntervene: false, reason: 'Confidence too low' };
  }
  return { shouldIntervene: true, reason: 'Ready for intervention' };
}

/**
 * Record an intervention
 */
export async function recordIntervention(intervention: {
  type: string;
  messageKey: string;
  transactionId?: string;
}): Promise<void> {
  if (isDevMode()) {
    const stored = await AsyncStorage.getItem(DEV_INTERVENTIONS_KEY);
    const interventions = stored ? JSON.parse(stored) : [];
    interventions.unshift({
      id: `int-${Date.now()}`,
      delivered_at: new Date().toISOString(),
      intervention_type: intervention.type,
      message_key: intervention.messageKey,
      transaction_id: intervention.transactionId,
    });
    await AsyncStorage.setItem(DEV_INTERVENTIONS_KEY, JSON.stringify(interventions.slice(0, 50)));
    return;
  }
  const userId = await getAuthUserId();
  if (!userId) return;
  try {
    const { error } = await supabase
      .from('interventions')
      .insert({
        user_id: userId,
        behavior_type: intervention.type,
        intervention_type: intervention.type,
        message_key: intervention.messageKey,
        message_content: intervention.messageKey,
        trigger_transaction_id: intervention.transactionId ?? null,
        confidence_at_delivery: 0,
        decision_reason: 'behavioral_engine',
      });
    if (error) throw error;
  } catch (error) {
    logger.behavior.error('Failed to record intervention in Supabase:', error);
  }
}

/**
 * Update intervention response
 */
export async function updateInterventionResponse(
  interventionId: string,
  response: 'acknowledged' | 'engaged' | 'dismissed' | 'ignored'
): Promise<void> {
  if (isDevMode()) {
    const stored = await AsyncStorage.getItem(DEV_INTERVENTIONS_KEY);
    const interventions = stored ? JSON.parse(stored) : [];
    interface StoredIntervention {
      id: string;
      user_response?: string;
      responded_at?: string;
    }
    const updated = interventions.map((i: StoredIntervention) =>
      i.id === interventionId ? { ...i, user_response: response, responded_at: new Date().toISOString() } : i
    );
    await AsyncStorage.setItem(DEV_INTERVENTIONS_KEY, JSON.stringify(updated));
    return;
  }
  try {
    const { error } = await supabase
      .from('interventions')
      .update({
        user_response: response,
        response_at: new Date().toISOString(),
      })
      .eq('id', interventionId);
    if (error) throw error;
  } catch (error) {
    logger.behavior.error('Failed to update intervention response in Supabase:', error);
  }
}

/**
 * Record a behavioral win
 */
export async function recordWin(win: Omit<BehavioralWin, 'id' | 'created_at'>): Promise<BehavioralWin> {
  const newWin: BehavioralWin = {
    ...win,
    id: `win-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isDevMode()) {
    const stored = await AsyncStorage.getItem(DEV_WINS_KEY);
    const wins = stored ? JSON.parse(stored) : [];
    wins.unshift(newWin);
    await AsyncStorage.setItem(DEV_WINS_KEY, JSON.stringify(wins.slice(0, 100)));
    return newWin;
  }
  const userId = await getAuthUserId();
  if (!userId) return newWin;
  try {
    const { data, error } = await supabase
      .from('behavioral_wins')
      .insert({
        user_id: userId,
        behavior_type: win.behavior_type,
        win_type: win.win_type,
        message: win.message,
        streak_days: win.streak_days ?? null,
        improvement_percent: win.improvement_percent ?? null,
        celebrated: win.celebrated ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    return data as BehavioralWin;
  } catch (error) {
    logger.behavior.error('Failed to record win in Supabase:', error);
  }

  return newWin;
}

/**
 * Get uncelebrated wins
 */
export async function getUncelebratedWins(): Promise<BehavioralWin[]> {
  if (isDevMode()) {
    const stored = await AsyncStorage.getItem(DEV_WINS_KEY);
    const wins: BehavioralWin[] = stored ? JSON.parse(stored) : [];
    return wins.filter(w => !w.celebrated);
  }
  const userId = await getAuthUserId();
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('behavioral_wins')
      .select('*')
      .eq('user_id', userId)
      .eq('celebrated', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as BehavioralWin[];
  } catch (error) {
    logger.behavior.error('Failed to load uncelebrated wins from Supabase:', error);
    return [];
  }
}

/**
 * Mark win as celebrated
 */
export async function markWinCelebrated(winId: string): Promise<void> {
  if (isDevMode()) {
    const stored = await AsyncStorage.getItem(DEV_WINS_KEY);
    const wins: BehavioralWin[] = stored ? JSON.parse(stored) : [];
    const updated = wins.map(w =>
      w.id === winId ? { ...w, celebrated: true, celebrated_at: new Date().toISOString() } : w
    );
    await AsyncStorage.setItem(DEV_WINS_KEY, JSON.stringify(updated));
    return;
  }
  try {
    const { error } = await supabase
      .from('behavioral_wins')
      .update({
        celebrated: true,
        celebrated_at: new Date().toISOString(),
      })
      .eq('id', winId);
    if (error) throw error;
  } catch (error) {
    logger.behavior.error('Failed to mark win celebrated in Supabase:', error);
  }
}

/**
 * Get behavioral context for AI system
 * Returns structured behavioral data for QUANTUM AI to use in responses
 */
export async function getBehavioralContext(): Promise<BehavioralContext | null> {
  try {
    const profile = await getUserBehavioralProfile();
    if (!profile) {
      return {
        has_profile: false,
        user_state: 'OBSERVING',
        confidence_scores: {
          small_recurring: 0,
          stress_spending: 0,
          end_of_month: 0,
        },
        active_behavior: null,
        active_behavior_intensity: 0,
        interventions_today: 0,
        interventions_this_week: 0,
        last_intervention_at: null,
        total_wins: 0,
        current_streak: 0,
        in_cooldown: false,
        in_withdrawal: false,
      };
    }

    const now = new Date();
    const inCooldown = profile.cooldown_ends_at
      ? new Date(profile.cooldown_ends_at) > now
      : false;
    const inWithdrawal = profile.withdrawal_ends_at
      ? new Date(profile.withdrawal_ends_at) > now
      : false;

    return {
      has_profile: true,
      user_state: profile.user_state,
      confidence_scores: {
        small_recurring: profile.confidence_small_recurring,
        stress_spending: profile.confidence_stress_spending,
        end_of_month: profile.confidence_end_of_month,
      },
      active_behavior: profile.active_behavior,
      active_behavior_intensity: profile.active_behavior_intensity,
      interventions_today: profile.interventions_today,
      interventions_this_week: profile.interventions_this_week,
      last_intervention_at: profile.last_intervention_at,
      total_wins: profile.total_wins,
      current_streak: profile.current_streak,
      in_cooldown: inCooldown,
      in_withdrawal: inWithdrawal,
    };
  } catch (error) {
    logger.behavior.error('Failed to get context:', error);
    return null;
  }
}

/**
 * Evaluate all behaviors on transaction set (main entry point)
 */
export async function evaluateBehaviors(transactions: Transaction[]): Promise<void> {
  // This is handled by behaviorStore.evaluateBehaviors
}

/**
 * Process a single transaction (main entry point)
 */
export async function processTransaction(
  transaction: Transaction,
  recentTransactions: Transaction[]
): Promise<void> {
  // This is handled by behaviorStore.processTransaction
}
