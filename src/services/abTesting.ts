/**
 * SpendTrak Behavioral Engine v2.0
 * FIX #6: A/B Testing Infrastructure
 *
 * Provides experiment management, variant assignment, and result tracking
 * for optimizing intervention effectiveness.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import type {
  Experiment,
  ExperimentVariant,
  ExperimentVariantDefinition,
  ExperimentResult,
  UserExperiments,
} from '@/types/behavior';

// Storage key for user experiment assignments
const AB_TEST_STORAGE_KEY = 'spendtrak_ab_test_assignments';
const AB_TEST_RESULTS_KEY = 'spendtrak_ab_test_results';

// ============================================
// ACTIVE EXPERIMENTS
// ============================================

/**
 * Currently active experiments
 * Add new experiments here to run them
 */
export const ACTIVE_EXPERIMENTS: Experiment[] = [
  {
    id: 'msg_tone_v1',
    name: 'Message Tone Test',
    description: 'Test reflective vs observational message tone',
    variants: [
      {
        id: 'control',
        name: 'Control (Reflective)',
        weight: 50,
        config: { messageStyle: 'reflective' },
      },
      {
        id: 'observational',
        name: 'Observational',
        weight: 50,
        config: { messageStyle: 'observational' },
      },
    ],
    start_date: '2026-01-01',
    end_date: null,
    is_active: true,
    allocation_percentage: 100,
  },
  {
    id: 'intervention_frequency_v1',
    name: 'Intervention Frequency Test',
    description: 'Test different intervention frequencies',
    variants: [
      {
        id: 'control',
        name: 'Control (1/day)',
        weight: 33,
        config: { maxPerDay: 1, maxPerWeek: 5 },
      },
      {
        id: 'low_frequency',
        name: 'Low Frequency',
        weight: 33,
        config: { maxPerDay: 1, maxPerWeek: 3 },
      },
      {
        id: 'high_frequency',
        name: 'Higher Frequency',
        weight: 34,
        config: { maxPerDay: 2, maxPerWeek: 7 },
      },
    ],
    start_date: '2026-01-01',
    end_date: null,
    is_active: true,
    allocation_percentage: 50, // Only 50% of users in this experiment
  },
  {
    id: 'moment_timing_v1',
    name: 'Moment Timing Test',
    description: 'Test immediate vs delayed interventions',
    variants: [
      {
        id: 'immediate',
        name: 'Immediate',
        weight: 50,
        config: { delayMs: 0 },
      },
      {
        id: 'delayed_5s',
        name: 'Delayed 5 seconds',
        weight: 50,
        config: { delayMs: 5000 },
      },
    ],
    start_date: '2026-01-01',
    end_date: null,
    is_active: false, // Not currently active
    allocation_percentage: 100,
  },
  // ============================================
  // PRODUCT A/B TESTS
  // ============================================
  {
    id: 'onboarding_flow',
    name: 'Onboarding Flow Test',
    description: 'Test current full onboarding vs shortened flow (skip intro video)',
    variants: [
      {
        id: 'control',
        name: 'Full Onboarding',
        weight: 50,
        config: { showIntroVideo: true, showAllSteps: true },
      },
      {
        id: 'shortened',
        name: 'Shortened Flow',
        weight: 50,
        config: { showIntroVideo: false, showAllSteps: false },
      },
    ],
    start_date: '2026-02-10',
    end_date: null,
    is_active: true,
    allocation_percentage: 100,
  },
  {
    id: 'paywall_design',
    name: 'Paywall Design Test',
    description: 'Test current upgrade screen vs feature-comparison layout',
    variants: [
      {
        id: 'control',
        name: 'Current Design',
        weight: 50,
        config: { layout: 'current', showSocialProof: false },
      },
      {
        id: 'comparison',
        name: 'Feature Comparison',
        weight: 50,
        config: { layout: 'comparison', showSocialProof: true },
      },
    ],
    start_date: '2026-02-10',
    end_date: null,
    is_active: true,
    allocation_percentage: 50, // 50% of users in this experiment
  },
  {
    id: 'dashboard_layout',
    name: 'Dashboard Layout Test',
    description: 'Test default dashboard vs spending-first layout',
    variants: [
      {
        id: 'control',
        name: 'Default Layout',
        weight: 50,
        config: { heroSection: 'balance', quickActionsPosition: 'top' },
      },
      {
        id: 'spending_first',
        name: 'Spending First',
        weight: 50,
        config: { heroSection: 'spending', quickActionsPosition: 'bottom' },
      },
    ],
    start_date: '2026-02-10',
    end_date: null,
    is_active: false, // Enable when ready to test
    allocation_percentage: 100,
  },
];

// ============================================
// EXPERIMENT MANAGEMENT
// ============================================

/**
 * Get active experiments for current date
 */
export function getActiveExperiments(): Experiment[] {
  const now = new Date().toISOString();
  return ACTIVE_EXPERIMENTS.filter(exp => {
    if (!exp.is_active) return false;
    if (exp.start_date > now) return false;
    if (exp.end_date && exp.end_date < now) return false;
    return true;
  });
}

/**
 * Deterministically assign user to experiment variant
 * Uses hash of user ID + experiment ID for consistent assignment
 */
function assignVariant(
  userId: string,
  experiment: Experiment
): ExperimentVariantDefinition | null {
  // Check if user is in experiment allocation
  const userHash = hashString(`${userId}_allocation_${experiment.id}`);
  const allocationBucket = userHash % 100;

  if (allocationBucket >= experiment.allocation_percentage) {
    return null; // User not in experiment
  }

  // Assign variant based on weights
  const variantHash = hashString(`${userId}_variant_${experiment.id}`);
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
  let variantBucket = variantHash % totalWeight;

  for (const variant of experiment.variants) {
    variantBucket -= variant.weight;
    if (variantBucket < 0) {
      return variant;
    }
  }

  // Fallback to first variant
  return experiment.variants[0];
}

/**
 * Simple string hash function for deterministic assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ============================================
// USER EXPERIMENT ASSIGNMENT
// ============================================

/**
 * Get or create user experiment assignments
 */
export async function getUserExperiments(userId: string): Promise<UserExperiments> {
  try {
    const stored = await AsyncStorage.getItem(AB_TEST_STORAGE_KEY);
    const allAssignments: Record<string, UserExperiments> = stored ? JSON.parse(stored) : {};

    if (allAssignments[userId]) {
      // Check if assignments need updating (new experiments added)
      const userExp = allAssignments[userId];
      const activeExps = getActiveExperiments();
      const assignedExpIds = userExp.assignments.map(a => a.experiment_id);
      const needsUpdate = activeExps.some(exp => !assignedExpIds.includes(exp.id));

      if (needsUpdate) {
        return await updateUserExperiments(userId, userExp);
      }

      return userExp;
    }

    // Create new assignments
    return await createUserExperiments(userId);
  } catch (error) {
    logger.behavior.error('Failed to get user experiments:', error);
    return {
      user_id: userId,
      assignments: [],
      last_updated: new Date().toISOString(),
    };
  }
}

/**
 * Create experiment assignments for new user
 */
async function createUserExperiments(userId: string): Promise<UserExperiments> {
  const activeExperiments = getActiveExperiments();
  const assignments: ExperimentVariant[] = [];

  for (const experiment of activeExperiments) {
    const variant = assignVariant(userId, experiment);
    if (variant) {
      assignments.push({
        experiment_id: experiment.id,
        variant_id: variant.id,
        assigned_at: new Date().toISOString(),
      });
    }
  }

  const userExperiments: UserExperiments = {
    user_id: userId,
    assignments,
    last_updated: new Date().toISOString(),
  };

  await saveUserExperiments(userId, userExperiments);
  return userExperiments;
}

/**
 * Update experiment assignments when new experiments are added
 */
async function updateUserExperiments(
  userId: string,
  existing: UserExperiments
): Promise<UserExperiments> {
  const activeExperiments = getActiveExperiments();
  const existingExpIds = existing.assignments.map(a => a.experiment_id);
  const newAssignments = [...existing.assignments];

  for (const experiment of activeExperiments) {
    if (!existingExpIds.includes(experiment.id)) {
      const variant = assignVariant(userId, experiment);
      if (variant) {
        newAssignments.push({
          experiment_id: experiment.id,
          variant_id: variant.id,
          assigned_at: new Date().toISOString(),
        });
      }
    }
  }

  const updated: UserExperiments = {
    ...existing,
    assignments: newAssignments,
    last_updated: new Date().toISOString(),
  };

  await saveUserExperiments(userId, updated);
  return updated;
}

/**
 * Save user experiment assignments to storage
 */
async function saveUserExperiments(userId: string, userExperiments: UserExperiments): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(AB_TEST_STORAGE_KEY);
    const allAssignments: Record<string, UserExperiments> = stored ? JSON.parse(stored) : {};
    allAssignments[userId] = userExperiments;
    await AsyncStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(allAssignments));
  } catch (error) {
    logger.behavior.error('Failed to save user experiments:', error);
  }
}

// ============================================
// EXPERIMENT RESULT TRACKING
// ============================================

/**
 * Track an experiment event
 */
export async function trackExperimentEvent(
  userId: string,
  experimentId: string,
  variantId: string,
  eventType: ExperimentResult['event_type'],
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const result: ExperimentResult = {
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString(),
    };

    const stored = await AsyncStorage.getItem(AB_TEST_RESULTS_KEY);
    const results: ExperimentResult[] = stored ? JSON.parse(stored) : [];
    results.push(result);

    // Keep last 1000 results
    const trimmed = results.slice(-1000);
    await AsyncStorage.setItem(AB_TEST_RESULTS_KEY, JSON.stringify(trimmed));

    logger.behavior.info('AB test event tracked:', {
      experimentId,
      variantId,
      eventType,
    });
  } catch (error) {
    logger.behavior.error('Failed to track experiment event:', error);
  }
}

/**
 * Get experiment results for analysis
 */
export async function getExperimentResults(experimentId?: string): Promise<ExperimentResult[]> {
  try {
    const stored = await AsyncStorage.getItem(AB_TEST_RESULTS_KEY);
    const results: ExperimentResult[] = stored ? JSON.parse(stored) : [];

    if (experimentId) {
      return results.filter(r => r.experiment_id === experimentId);
    }

    return results;
  } catch (error) {
    logger.behavior.error('Failed to get experiment results:', error);
    return [];
  }
}

/**
 * Calculate experiment metrics
 */
export async function calculateExperimentMetrics(experimentId: string): Promise<Record<string, ExperimentMetrics>> {
  const results = await getExperimentResults(experimentId);
  const experiment = ACTIVE_EXPERIMENTS.find(e => e.id === experimentId);

  if (!experiment) {
    return {};
  }

  const metricsByVariant: Record<string, ExperimentMetrics> = {};

  for (const variant of experiment.variants) {
    const variantResults = results.filter(r => r.variant_id === variant.id);

    const interventionsShown = variantResults.filter(r => r.event_type === 'intervention_shown').length;
    const interventionsEngaged = variantResults.filter(r => r.event_type === 'intervention_engaged').length;
    const interventionsDismissed = variantResults.filter(r => r.event_type === 'intervention_dismissed').length;
    const winsCelebrated = variantResults.filter(r => r.event_type === 'win_celebrated').length;

    metricsByVariant[variant.id] = {
      variant_id: variant.id,
      variant_name: variant.name,
      total_events: variantResults.length,
      interventions_shown: interventionsShown,
      interventions_engaged: interventionsEngaged,
      interventions_dismissed: interventionsDismissed,
      wins_celebrated: winsCelebrated,
      engagement_rate: interventionsShown > 0 ? interventionsEngaged / interventionsShown : 0,
      dismissal_rate: interventionsShown > 0 ? interventionsDismissed / interventionsShown : 0,
    };
  }

  return metricsByVariant;
}

export interface ExperimentMetrics {
  variant_id: string;
  variant_name: string;
  total_events: number;
  interventions_shown: number;
  interventions_engaged: number;
  interventions_dismissed: number;
  wins_celebrated: number;
  engagement_rate: number;
  dismissal_rate: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get variant config for a specific experiment
 */
export async function getVariantConfig(
  userId: string,
  experimentId: string
): Promise<Record<string, unknown> | null> {
  const userExperiments = await getUserExperiments(userId);
  const assignment = userExperiments.assignments.find(a => a.experiment_id === experimentId);

  if (!assignment) {
    return null;
  }

  const experiment = ACTIVE_EXPERIMENTS.find(e => e.id === experimentId);
  if (!experiment) {
    return null;
  }

  const variant = experiment.variants.find(v => v.id === assignment.variant_id);
  return variant?.config || null;
}

/**
 * Check if user is in a specific variant
 */
export async function isUserInVariant(
  userId: string,
  experimentId: string,
  variantId: string
): Promise<boolean> {
  const userExperiments = await getUserExperiments(userId);
  return userExperiments.assignments.some(
    a => a.experiment_id === experimentId && a.variant_id === variantId
  );
}

/**
 * Get all variant IDs for a user
 */
export async function getUserVariants(userId: string): Promise<Record<string, string>> {
  const userExperiments = await getUserExperiments(userId);
  const variants: Record<string, string> = {};

  for (const assignment of userExperiments.assignments) {
    variants[assignment.experiment_id] = assignment.variant_id;
  }

  return variants;
}
