/**
 * Services Barrel Export
 * Central export for all service modules
 */

// Supabase Client
export { supabase } from './supabase';

// Budgets Service
export * as budgetsService from './budgets';
export {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetsByCategory,
  getBudgetProgress,
  getBudgetRemaining,
  isBudgetOverLimit,
  isBudgetAtThreshold,
  getBudgetStatus,
  getTotalBudgeted,
  getTotalSpent,
  recalculateBudgetSpent,
} from './budgets';

// Auth Service
export * as authService from './auth';
export {
  signOut,
  getCurrentUser,
  updateUserProfile,
  completeOnboarding,
  connectGoogleEmail,
  connectMicrosoftEmail,
  getEmailConnections,
  addEmailConnection,
  removeEmailConnection,
  refreshTokens,
  onAuthStateChange,
} from './auth';

// Transaction Service
export * as transactionService from './transactions';
export {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getSpendingTrend,
  searchTransactions,
} from './transactions';

// Subscription Service
export * as subscriptionService from './subscriptions';
export {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionSummary,
  getUpcomingRenewals,
  getUnusedSubscriptions,
  markAsUsed as markSubscriptionAsUsed,
  generateCancellationEmail,
} from './subscriptions';

// Alert Service
export * as alertService from './alerts';
export {
  getAlerts,
  markAsRead,
  markAllAsRead,
  dismissAlert,
  getUnreadCount,
  getCriticalAlerts,
  checkUnusualSpending,
  checkDuplicateCharges,
  checkBudgetStatus,
  checkUpcomingRenewals,
} from './alerts';

// AI Service
export * as aiService from './ai';
export {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  archiveConversation,
  getFinancialHealthScore,
  getQuickInsights,
} from './ai';

// Phase 1 Features - Transaction Splits
export * as transactionSplitsService from './transactionSplits';
export {
  getTransactionSplits,
  splitTransaction,
  unsplitTransaction,
  getTransactionWithSplits,
  getSpendingByCategoryWithSplits,
} from './transactionSplits';

// Phase 1 Features - Export
export * as exportService from './export';
export {
  exportTransactionsCSV,
  exportSubscriptionsCSV,
  exportBudgetsCSV,
  exportTransactionsJSON,
  exportAllDataJSON,
  getExportHistory,
} from './export';

// Phase 1 Features - Daily Spending Limit
export * as dailyLimitService from './dailyLimit';
export {
  getDailyLimit,
  setDailyLimit,
  disableDailyLimit,
  getSafeToSpend,
  getDailySpendingLog,
  getWeeklySpendingSummary,
} from './dailyLimit';

// Phase 1 Features - Date Presets
export * as datePresetsService from './datePresets';
export {
  BUILT_IN_PRESETS,
  getBuiltInPresetDateRange,
  getCustomDatePresets,
  createCustomDatePreset,
  updateCustomDatePreset,
  deleteCustomDatePreset,
  getAllPresetsWithDateRanges,
  parseNaturalDate,
} from './datePresets';

// Phase 1 Features - Budget Rollover
export * as budgetRolloverService from './budgetRollover';
export {
  getBudgetWithRollover,
  enableRollover,
  disableRollover,
  setMaxRollover,
  getEffectiveBudget,
  processRollover,
  getBudgetHistory,
  getRolloverSummary,
  clearRollover,
  adjustRollover,
} from './budgetRollover';

// Phase 2 Features - Debt Management
export * as debtManagementService from './debtManagement';

// Phase 2 Features - Income Tracking
export * as incomeTrackingService from './incomeTracking';

// Phase 3 Features - Net Worth
export * as netWorthService from './netWorth';

// Phase 3 Features - Household Sharing
export * as householdService from './household';

// Phase 3 Features - Bill Calendar
export * as billCalendarService from './billCalendar';

// Phase 3 Features - Zero-Based Budgeting
export * as zeroBasedService from './zeroBased';

// Phase 4 Features - Investment Tracking
export * as investmentService from './investments';
export {
  // Holdings
  getHoldings,
  getHolding,
  createHolding,
  updateHolding,
  deleteHolding,
  // Crypto
  getCryptoHoldings,
  createCryptoHolding,
  updateCryptoHolding,
  deleteCryptoHolding,
  // Transactions
  getTransactions as getInvestmentTransactions,
  recordTransaction,
  // Portfolio
  getPortfolioSummary,
  createSnapshot,
  getPortfolioHistory,
  getPerformance,
  // Prices
  updatePrices,
  updateHoldingPrice,
  // Utilities
  formatCurrency,
  formatPercentage,
  getGainColor,
} from './investments';

// Currency Converter
export * as currencyConverterService from './currencyConverter';
export {
  getExchangeRate,
  convertCurrency,
  convertCurrencyWithDetails,
  clearRateCache,
  hasValidCache,
  getCacheInfo,
} from './currencyConverter';

// Phase 4 Features - Gamification
export * as gamificationService from './gamification';
export {
  // User gamification
  getUserGamification,
  // Points
  addPoints,
  getPointsSummary,
  awardActivityPoints,
  // Achievements
  getAchievements,
  getUserAchievements,
  updateAchievementProgress,
  claimAchievement,
  // Challenges
  getActiveChallenges,
  getUserChallenges,
  startChallenge,
  updateChallengeProgress,
  // Streaks
  getStreakInfo,
  updateStreak,
  // Leaderboard
  getLeaderboard,
  // Summary
  getGamificationSummary,
  // Utilities
  checkDailyLogin,
} from './gamification';

// Analytics Service
export * as analyticsService from './analytics';
export {
  getCashFlowTrend,
  getSpendingHeatmap,
  getTopMerchants,
  getBurnRate,
  getMonthlyKPIs,
  getBudgetPerformance,
  getSpendingVelocity,
  getCategorySpending,
  getGoalsProgress,
  getDebtOverview,
  getNetWorthSummary,
  getSubscriptionAnalytics,
  getBudgetEfficiency,
  // Weekly Analytics
  getDailyBreakdown,
  getWeekComparison,
  getWeekProjection,
  // Yearly Analytics
  getMonthByMonthTrend,
  getYearOverYearComparison,
  getAnnualSubscriptions,
  getDebtProgressYear,
  getGoalsAchievedYear,
  getNetWorthYearly,
} from './analytics';

// Financial Health Service
export * as financialHealthService from './financialHealth';
export {
  calculateHealthScore,
  getHealthFactorDetails,
  getSavingsRate,
  getEmergencyFundRatio,
} from './financialHealth';

// Phase 6 - Behavioral Intelligence Layer
export * as behaviorService from './behavior';
export {
  // Detection algorithms
  detectSmallRecurring,
  detectStressSpending,
  detectEndOfMonthCollapse,
  // Profile management
  getUserBehavioralProfile,
  updateBehavioralProfile,
  updateBehaviorConfidence,
  // Signal recording
  recordSignal,
  // Intervention logic
  canShowIntervention,
  decideIntervention,
  recordIntervention,
  updateInterventionResponse,
  // Win tracking
  recordWin,
  getUncelebratedWins,
  markWinCelebrated,
  // Context for AI
  getBehavioralContext,
  // Main evaluation
  evaluateBehaviors,
  processTransaction,
} from './behavior';

// FIX: Enhanced Detection exports
export {
  runAllDetection,
  runAllDetectionWithSeasonal,
  clampConfidence,
  getSeasonalFactor,
  applySeasonalAdjustment,
  calibrateSeasonalFactors,
  detectSavingHabit,
  analyzeTrends,
} from './detection';

// FIX: Win Detection exports
export {
  detectWin,
  detectWinWithStreakCheck,
  detectRelapse,
  checkStreakBreak,
  getStreakBreakMessage,
} from './winDetection';

// FIX: A/B Testing Service
export * as abTestingService from './abTesting';
export {
  ACTIVE_EXPERIMENTS,
  getActiveExperiments,
  getUserExperiments,
  trackExperimentEvent,
  getExperimentResults,
  calculateExperimentMetrics,
  getVariantConfig,
  isUserInVariant,
  getUserVariants,
} from './abTesting';

// FIX: Extended Behavioral Moment Detection
export {
  detectBehavioralMoment,
  detectWeekendSplurge,
  detectImpulseChain,
  detectBoredomBrowse,
  detectCategoryBinge,
  detectPaydaySurge,
} from './behavioralMoment';

// FIX: Budget Adherence for Behavioral Engine
export {
  calculateBudgetAdherence,
  getEarlyMonthAdherence,
  checkBudgetsNearLimit,
} from './budgets';

// Contextual Upgrade Engine
export * as frictionDetectorService from './frictionDetector';
export * as upgradeDecisionEngineService from './upgradeDecisionEngine';
export * as upgradeAnalyticsService from './upgradeAnalytics';
