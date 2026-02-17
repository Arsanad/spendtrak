/**
 * SpendTrak Contextual Upgrade Engine
 * Zustand Store - Orchestrates friction detection, gating, and prompt presentation
 *
 * Pattern: Matches behaviorStore.ts — create<State>() with persist middleware
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import { useTierStore } from '@/stores/tierStore';
import type {
  FrictionCounters,
  UpgradeEngineState,
  UpgradePromptConfig,
  FrictionType,
  FrictionContext,
} from '@/types/upgrade';
import {
  detectManualEntryFatigue,
  detectReceiptMoment,
  detectEmailOpportunity,
  detectHealthCuriosity,
  detectRepeatCategoryEntry,
  detectTimeSpentTracking,
  detectMissedTransactionHint,
  detectFinancialQuestion,
  detectComplexBudgetSetup,
  detectTrialExpiryApproaching,
  trackManualEntry as updateCountersManualEntry,
  startNewSession as resetSessionCounters,
  trackScreenTime as updateScreenTime,
  createDefaultCounters,
} from '@/services/frictionDetector';
import {
  evaluateUpgradeGates,
  recordPromptShown,
  recordPromptDismissed,
  recordPromptTapped,
  initializeEngineState,
} from '@/services/upgradeDecisionEngine';
import {
  interpolatePrompt,
  selectPromptVariant,
} from '@/config/upgradePrompts';
import {
  trackUpgradeEvent,
  syncAnalyticsQueue,
} from '@/services/upgradeAnalytics';

// ============================================
// STATE INTERFACE
// ============================================

interface UpgradePromptState {
  // Persisted
  frictionCounters: FrictionCounters;
  engineState: UpgradeEngineState;

  // Not persisted (UI state)
  activePrompt: UpgradePromptConfig | null;
  promptVisible: boolean;

  // Actions
  initialize: (signupTimestamp: string | null) => void;
  startSession: () => void;
  trackManualEntry: (merchantName: string | null, categoryId: string | null) => void;
  trackScreenTime: (additionalMs: number) => void;
  evaluateFriction: (frictionType: FrictionType, metadata?: Record<string, string | number>) => void;
  dismissPrompt: () => void;
  tapPrompt: () => void;
  checkTrialExpiry: () => void;
  checkMissedTransactions: (lastEntryDate: string | null) => void;
  syncAnalytics: () => Promise<void>;
}

// ============================================
// STORE
// ============================================

export const useUpgradePromptStore = create<UpgradePromptState>()(
  persist(
    (set, get) => ({
      // Initial state
      frictionCounters: createDefaultCounters(),
      engineState: initializeEngineState(null),
      activePrompt: null,
      promptVisible: false,

      initialize: (signupTimestamp) => {
        const { engineState } = get();
        // Only initialize if not already set
        if (!engineState.signupTimestamp) {
          set({
            engineState: initializeEngineState(signupTimestamp),
          });
        }
      },

      startSession: () => {
        const { frictionCounters } = get();
        set({
          frictionCounters: resetSessionCounters(frictionCounters),
        });
      },

      trackManualEntry: (merchantName, categoryId) => {
        const { frictionCounters } = get();
        const updated = updateCountersManualEntry(frictionCounters, merchantName, categoryId);
        set({ frictionCounters: updated });

        // Run detection chain (fire-and-forget)
        const store = get();

        // Check manual entry fatigue
        const fatigue = detectManualEntryFatigue(updated);
        if (fatigue) {
          store.evaluateFriction('MANUAL_ENTRY_FATIGUE', fatigue.metadata);
          return;
        }

        // Check email opportunity
        const emailOpp = detectEmailOpportunity(merchantName);
        if (emailOpp) {
          store.evaluateFriction('EMAIL_OPPORTUNITY', emailOpp.metadata);
          return;
        }

        // Check repeat category
        if (categoryId) {
          const repeat = detectRepeatCategoryEntry(updated, categoryId);
          if (repeat) {
            store.evaluateFriction('REPEAT_CATEGORY_ENTRY', repeat.metadata);
            return;
          }
        }

        // Check receipt moment (lowest priority)
        const receipt = detectReceiptMoment(updated);
        if (receipt) {
          store.evaluateFriction('RECEIPT_MOMENT', receipt.metadata);
        }
      },

      trackScreenTime: (additionalMs) => {
        const { frictionCounters } = get();
        set({
          frictionCounters: updateScreenTime(frictionCounters, additionalMs),
        });
      },

      evaluateFriction: (frictionType, metadata = {}) => {
        try {
          const { engineState, promptVisible } = get();

          // Don't evaluate if a prompt is already visible
          if (promptVisible) return;

          // Build friction context based on type
          let context: FrictionContext | null = null;
          const { frictionCounters } = get();

          switch (frictionType) {
            case 'MANUAL_ENTRY_FATIGUE':
              context = detectManualEntryFatigue(frictionCounters);
              break;
            case 'RECEIPT_MOMENT':
              context = detectReceiptMoment(frictionCounters);
              break;
            case 'EMAIL_OPPORTUNITY':
              context = detectEmailOpportunity(frictionCounters.lastMerchantName);
              break;
            case 'HEALTH_CURIOSITY': {
              const updated = { ...frictionCounters, healthViewCount: frictionCounters.healthViewCount + 1 };
              set({ frictionCounters: updated });
              context = detectHealthCuriosity(updated.healthViewCount);
              break;
            }
            case 'REPEAT_CATEGORY_ENTRY': {
              const catId = metadata.categoryId as string | undefined;
              if (catId) context = detectRepeatCategoryEntry(frictionCounters, catId);
              break;
            }
            case 'TIME_SPENT_TRACKING':
              context = detectTimeSpentTracking(frictionCounters.screenTimeMs);
              break;
            case 'MISSED_TRANSACTION': {
              const days = metadata.daysSinceLastEntry as number | undefined;
              if (days !== undefined) context = detectMissedTransactionHint(days);
              break;
            }
            case 'FINANCIAL_QUESTION':
              context = detectFinancialQuestion();
              break;
            case 'COMPLEX_BUDGET_SETUP': {
              const editCount = metadata.editCount as number | undefined;
              const updated = {
                ...frictionCounters,
                budgetEditCount: editCount ?? frictionCounters.budgetEditCount + 1,
              };
              set({ frictionCounters: updated });
              context = detectComplexBudgetSetup(updated.budgetEditCount);
              break;
            }
            case 'TRIAL_EXPIRY': {
              const tierState = useTierStore.getState();
              context = detectTrialExpiryApproaching(tierState.expiresAt, tierState.isTrialing);
              break;
            }
          }

          if (!context) {
            trackUpgradeEvent('friction_detected', frictionType, null, { detected: 0 });
            return;
          }

          trackUpgradeEvent('friction_detected', frictionType, null, { detected: 1, confidence: context.confidence });

          // Run through gates
          const tierState = useTierStore.getState();
          const decision = evaluateUpgradeGates(
            context,
            engineState,
            tierState.tier,
            tierState.isTrialing
          );

          if (!decision.shouldShow) {
            trackUpgradeEvent('gate_blocked', frictionType, null, {
              blockedBy: decision.blockedBy || 'unknown',
            });
            return;
          }

          // Select and interpolate prompt
          const lastIndex = engineState.lastPromptVariantMap[frictionType];
          const rawPrompt = selectPromptVariant(frictionType, lastIndex);
          const prompt = interpolatePrompt(rawPrompt, { ...context.metadata, ...metadata });

          // Update state
          const newEngineState = recordPromptShown(engineState);
          newEngineState.lastPromptVariantMap = {
            ...newEngineState.lastPromptVariantMap,
            [frictionType]: rawPrompt.variantIndex,
          };

          set({
            activePrompt: prompt,
            promptVisible: true,
            engineState: newEngineState,
          });

          trackUpgradeEvent('prompt_shown', frictionType, prompt.id, context.metadata);
        } catch (error) {
          logger.general.error?.('Upgrade friction evaluation failed:', error);
        }
      },

      dismissPrompt: () => {
        const { engineState, activePrompt } = get();

        if (activePrompt) {
          trackUpgradeEvent(
            'prompt_dismissed',
            activePrompt.frictionType,
            activePrompt.id,
            {}
          );
        }

        set({
          engineState: recordPromptDismissed(engineState),
          activePrompt: null,
          promptVisible: false,
        });
      },

      tapPrompt: () => {
        const { engineState, activePrompt } = get();

        if (activePrompt) {
          trackUpgradeEvent(
            'prompt_tapped',
            activePrompt.frictionType,
            activePrompt.id,
            {}
          );
        }

        set({
          engineState: recordPromptTapped(engineState),
          activePrompt: null,
          promptVisible: false,
        });
      },

      checkTrialExpiry: () => {
        const tierState = useTierStore.getState();
        if (tierState.isTrialing) {
          get().evaluateFriction('TRIAL_EXPIRY');
        }
      },

      checkMissedTransactions: (lastEntryDate) => {
        if (!lastEntryDate) return;

        const daysSince = Math.floor(
          (Date.now() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSince >= 3) {
          get().evaluateFriction('MISSED_TRANSACTION', { daysSinceLastEntry: daysSince });
        }
      },

      syncAnalytics: async () => {
        await syncAnalyticsQueue();
      },
    }),
    {
      name: 'spendtrak-upgrade-prompt',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        frictionCounters: state.frictionCounters,
        engineState: state.engineState,
      }),
    }
  )
);

// ============================================
// SELECTOR HOOKS
// ============================================

export function useActiveUpgradePrompt() {
  return useUpgradePromptStore((s) => s.activePrompt);
}

export function useUpgradePromptVisible() {
  return useUpgradePromptStore((s) => s.promptVisible);
}

export function useTrialDaysRemaining() {
  return useUpgradePromptStore((s) => {
    const signup = s.engineState.signupTimestamp;
    if (!signup) return null;
    // Trial is typically 7 days
    const trialEnd = new Date(signup);
    trialEnd.setDate(trialEnd.getDate() + 7);
    const remaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    return remaining;
  });
}
