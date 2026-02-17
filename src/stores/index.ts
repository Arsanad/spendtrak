/**
 * Stores Barrel Export
 * Central export for all Zustand stores
 */

// Auth Store
export { useAuthStore } from './authStore';

// Transaction Store
export { useTransactionStore } from './transactionStore';

// Subscription Store
export { useSubscriptionStore } from './subscriptionStore';

// Alert Store
export { useAlertStore } from './alertStore';

// AI Store
export { useAIStore } from './aiStore';

// Dashboard Store
export { useDashboardStore } from './dashboardStore';

// Settings Store
export { useSettingsStore } from './settingsStore';

// Category Store
export {
  useCategoryStore,
  useCategories,
  SYSTEM_CATEGORIES,
  AVAILABLE_ICONS,
  AVAILABLE_COLORS,
} from './categoryStore';
export type { Category } from './categoryStore';

// Investment Store (Phase 4)
export {
  useInvestmentStore,
  usePortfolioValue,
  usePortfolioGain,
  useHoldingsCount,
  useTopHoldings,
  useAllocationByType,
} from './investmentStore';

// Gamification Store (Phase 4)
export {
  useGamificationStore,
  useUserLevel,
  useTotalPoints,
  useCurrentStreak,
  useUnlockedAchievements,
  useInProgressAchievements,
  useActiveChallengesCount,
} from './gamificationStore';

// Behavioral Intelligence Store (Phase 6)
export {
  useBehaviorStore,
  useActiveBehavior,
  useActiveBehaviorConfidence,
  useConfidenceScores,
  useWinStreak,
  useTotalWins,
  useHasActiveIntervention,
  useHasWinCelebration,
  useInterventionsToday,
  useQuantumAcknowledgment,
  useIsQuantumSpeaking,
} from './behaviorStore';

// Household Store
export { useHouseholdStore } from './householdStore';

// Bill Store
export { useBillStore } from './billStore';

// Debt Store
export { useDebtStore } from './debtStore';

// Income Store
export { useIncomeStore } from './incomeStore';

// Net Worth Store
export { useNetWorthStore } from './netWorthStore';

// Zero-Based Budgeting Store
export { useZeroBasedStore } from './zeroBasedStore';

// Receipt Store (Offline Queue)
export { useReceiptStore } from './receiptStore';

// Tier Store (Subscription Feature Gating)
export {
  useTierStore,
  getCurrentTier,
  hasPremiumAccess,
} from './tierStore';

// Contextual Upgrade Engine Store
export {
  useUpgradePromptStore,
  useActiveUpgradePrompt,
  useUpgradePromptVisible,
} from './upgradePromptStore';

// Quantum Presence Store (Alive Experience)
export {
  useQuantumPresenceStore,
  useQuantumMode,
  useQuantumToast,
  useQuantumCelebration,
  useQuantumGreeting,
  useQuantumStreak,
  useQuantumLevel,
} from './quantumPresenceStore';

// Dev Mode Utilities
export { isDevMode, useIsDevMode, getDevUserId } from '@/utils/devMode';
