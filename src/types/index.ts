/**
 * SpendTrak Types - Barrel Export
 * Central export for all type definitions
 */

// Database types
export type {
  // Enums
  TransactionSource,
  TransactionType,
  SubscriptionFrequency,
  SubscriptionStatus,
  AlertType,
  AlertSeverity,
  GoalType,
  GoalStatus,
  SubscriptionTier,
  TierStatus,
  SavingType,
  EmailProvider,
  SyncStatus,
  ProcessingResult,
  ReceiptScanStatus,
  BudgetPeriod,
  CardType,
  RewardType,
  // User types
  NotificationPreferences,
  User,
  UserInsert,
  UserUpdate,
  // Email connection types
  EmailConnection,
  EmailConnectionInsert,
  EmailConnectionUpdate,
  // Category types
  Category,
  CategoryInsert,
  CategoryUpdate,
  // Transaction types
  Transaction,
  TransactionWithCategory,
  TransactionInsert,
  TransactionUpdate,
  // Subscription types
  Subscription,
  SubscriptionWithCategory,
  SubscriptionInsert,
  SubscriptionUpdate,
  // Alert types
  Alert,
  AlertInsert,
  AlertUpdate,
  // User card types
  UserCard,
  UserCardInsert,
  UserCardUpdate,
  // Financial goal types
  FinancialGoal,
  FinancialGoalInsert,
  FinancialGoalUpdate,
  // Budget types
  Budget,
  BudgetWithCategory,
  BudgetInsert,
  BudgetUpdate,
  // AI conversation types
  AIMessage,
  AIConversation,
  AIConversationInsert,
  AIConversationUpdate,
  // Processed email types
  ProcessedEmail,
  // User subscription (app tier) types
  UserSubscription,
  SubscriptionEventType,
  SubscriptionEvent,
  // Receipt types
  ReceiptItem,
  ReceiptParseResult,
  ReceiptScan,
  ReceiptScanUsage,
  // AI Chat Usage (rate limiting)
  AIChatUsage,
  SavingsLog,
  // Helper function return types
  MonthlySpendingByCategory,
  SubscriptionSummaryResult,
  // Phase 1 - Transaction Splits
  TransactionSplit,
  TransactionSplitWithCategory,
  TransactionSplitInsert,
  TransactionSplitUpdate,
  TransactionWithSplits,
  // Phase 1 - Budget Rollover
  BudgetHistory,
  BudgetHistoryInsert,
  // Phase 1 - Daily Spending Limits
  DailySpendingLimit,
  DailySpendingLog,
  SafeToSpendResult,
  DailySpendingLimitInsert,
  DailySpendingLimitUpdate,
  // Phase 1 - Custom Date Presets
  CustomDatePreset,
  CustomDatePresetInsert,
  CustomDatePresetUpdate,
  // Phase 1 - Export History
  ExportType,
  ExportDataType,
  ExportHistory,
  ExportHistoryInsert,
  // Phase 2 - Debt Management
  DebtType,
  PayoffStrategy,
  Debt,
  DebtPayment,
  DebtWithPayments,
  PayoffPlan,
  DebtSummary,
  DebtInsert,
  DebtUpdate,
  DebtPaymentInsert,
  // Phase 2 - Income Tracking
  IncomeSource,
  IncomeFrequency,
  Income,
  IncomeWithCategory,
  IncomeInsert,
  IncomeUpdate,
  // Phase 2 - Cash Flow
  CashFlowPeriod,
  CashFlowSummary,
  IncomeBySource,
  // Phase 3 - Net Worth Dashboard
  AssetType,
  LiabilityType,
  Asset,
  Liability,
  AssetHistory,
  LiabilityHistory,
  NetWorthSnapshot,
  NetWorthSummary,
  AssetInsert,
  AssetUpdate,
  LiabilityInsert,
  LiabilityUpdate,
  // Phase 3 - Partner/Spouse Sharing
  HouseholdRole,
  InviteStatus,
  Household,
  HouseholdMember,
  HouseholdMemberWithUser,
  HouseholdInvitation,
  SharedBudget,
  SharedBudgetWithCategory,
  SharedGoal,
  SharedGoalContribution,
  SharedGoalWithContributions,
  TransactionAssignment,
  HouseholdInsert,
  HouseholdUpdate,
  HouseholdMemberInsert,
  HouseholdMemberUpdate,
  SharedBudgetInsert,
  SharedBudgetUpdate,
  SharedGoalInsert,
  SharedGoalUpdate,
  // Phase 3 - Bill Calendar
  BillStatus,
  Bill,
  BillWithCategory,
  BillPayment,
  BillReminder,
  BillOccurrence,
  BillCalendarMonth,
  BillSummary,
  BillInsert,
  BillUpdate,
  BillPaymentInsert,
  BillPaymentUpdate,
  // Phase 3 - Zero-Based Budgeting
  ZeroBasedPeriod,
  ZeroBasedAllocation,
  ZeroBasedAllocationWithCategory,
  ZeroBasedIncomeSource,
  ZeroBasedPeriodWithDetails,
  ZeroBasedSummary,
  ZeroBasedPeriodInsert,
  ZeroBasedPeriodUpdate,
  ZeroBasedAllocationInsert,
  ZeroBasedAllocationUpdate,
  ZeroBasedIncomeSourceInsert,
  ZeroBasedIncomeSourceUpdate,
  // Legacy type aliases
  SavingsGoal,
  CreditCard,
} from './database';


// Phase 4 - Investment Tracking types
export type {
  // Investment enums
  InvestmentType,
  InvestmentAccountType,
  TransactionType as InvestmentTransactionType,
  // Investment holding types
  InvestmentHolding,
  InvestmentHoldingWithPerformance,
  InvestmentHoldingInsert,
  InvestmentHoldingUpdate,
  // Investment price types
  InvestmentPrice,
  InvestmentPriceInsert,
  // Investment snapshot types
  InvestmentSnapshot,
  InvestmentSnapshotInsert,
  // Crypto holding types
  CryptoHolding,
  CryptoHoldingWithPerformance,
  CryptoHoldingInsert,
  CryptoHoldingUpdate,
  // Investment transaction types
  InvestmentTransaction,
  InvestmentTransactionWithHolding,
  InvestmentTransactionInsert,
  InvestmentTransactionUpdate,
  // Portfolio summary types
  PortfolioSummary,
  PortfolioPerformance,
  // Dividend types
  DividendPayment,
  DividendSummary,
  // Watchlist types
  WatchlistItem,
  WatchlistItemWithPrice,
  WatchlistItemInsert,
  WatchlistItemUpdate,
  // Rebalancing types
  TargetAllocation,
  RebalanceRecommendation,
  RebalancePlan,
  // API input types
  CreateHoldingInput,
  UpdateHoldingInput,
  CreateCryptoHoldingInput,
  RecordTransactionInput,
  // Price API types
  StockQuote,
  CryptoQuote,
} from './investments';

export {
  INVESTMENT_TYPE_LABELS,
  INVESTMENT_TYPE_ICONS,
  ACCOUNT_TYPE_LABELS,
} from './investments';

// Phase 4 - Gamification types
export type {
  // Achievement types
  AchievementCategory,
  AchievementRarity,
  Achievement,
  UserAchievement,
  UserAchievementWithDetails,
  // Challenge types
  ChallengeType,
  ChallengeStatus,
  Challenge,
  UserChallenge,
  UserChallengeWithDetails,
  // User gamification types
  UserGamification,
  LevelInfo,
  UserGamificationWithLevel,
  // Leaderboard types
  LeaderboardPeriod,
  LeaderboardType,
  LeaderboardEntry,
  LeaderboardEntryWithUser,
  LeaderboardData,
  // Points types
  PointsActivityType,
  PointsActivity,
  PointsSummary,
  // Streak types
  StreakInfo,
  // Summary types
  GamificationSummary,
  // API input types
  AddPointsInput,
  StartChallengeInput,
  UpdateChallengeProgressInput,
} from './gamification';

export {
  LEVELS,
  RARITY_COLORS,
  POINTS_VALUES,
  STREAK_MILESTONES,
  getLevelForPoints,
  getNextLevel,
  calculateLevelProgress,
} from './gamification';

// Phase 6 - Behavioral Intelligence Layer types
export type {
  // Behavior enums
  BehaviorType,
  InterventionType,
  WinType,
  UserResponse,
  TimeContext,
  TriggerEvent,
  // Database types
  UserBehavioralProfile,
  PatternHistoryEntry,
  BehaviorNote,
  BehavioralSignal,
  Intervention as BehavioralIntervention,
  BehavioralWin,
  // Insert/Update types
  UserBehavioralProfileInsert,
  UserBehavioralProfileUpdate,
  BehavioralSignalInsert,
  BehavioralSignalUpdate,
  InterventionInsert as BehavioralInterventionInsert,
  InterventionUpdate as BehavioralInterventionUpdate,
  BehavioralWinInsert,
  BehavioralWinUpdate,
  // Detection types
  BehaviorDetectionResult,
  DetectedSignal,
  DetectionMetadata,
  ConfidenceCalculationResult,
  ConfidenceFactor,
  // Intervention types
  InterventionDecision,
  InterventionMessage,
  InterventionEligibility,
  // Context types
  BehavioralContext,
  ConfidenceScores,
  RecentSignal,
  RecentIntervention,
  RecentWin,
  // Algorithm-specific types
  SmallRecurringPattern,
  StressSpendingPattern,
  EndOfMonthPattern,
  // Store types
  BehaviorState,
  BehaviorActions,
} from './behavior';

export {
  BEHAVIOR_TYPE_LABELS,
  BEHAVIOR_TYPE_SHORT_LABELS,
  INTERVENTION_TYPE_LABELS,
  WIN_TYPE_LABELS,
  CONFIDENCE_THRESHOLDS,
  INTERVENTION_LIMITS,
} from './behavior';

// Purchase types (RevenueCat)
export type {
  SubscriptionTier as PurchaseSubscriptionTier,
  SubscriptionPeriod,
  EntitlementId,
  PurchaseResult,
  RestoreResult,
  SubscriptionStatus as PurchaseSubscriptionStatus,
  EntitlementStatus,
  OfferingInfo,
  PackageInfo,
  PurchaseErrorCode,
  PurchaseError,
  TrialEligibility,
  TrialEligibilityResult,
  SubscriptionSyncData,
  CustomerInfoListener,
  PurchaseInitOptions,
  InitResult,
} from './purchases';

// Contextual Upgrade Engine types
export type {
  FrictionType,
  FrictionContext,
  GateId,
  UpgradeDecisionResult,
  PromptVariant,
  UpgradePromptConfig,
  FrictionCounters,
  UpgradeEngineState,
  UpgradeEventType,
  UpgradeAnalyticsEvent,
} from './upgrade';

// API types
export type {
  // Common API types
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
  // Transaction API types
  TransactionListParams,
  TransactionCreateRequest,
  TransactionUpdateRequest,
  // Subscription API types
  SubscriptionListParams,
  SubscriptionCreateRequest,
  SubscriptionUpdateRequest,
  SubscriptionCancelRequest,
  // Alert API types
  AlertListParams,
  AlertActionRequest,
  AlertBatchUpdateRequest,
  // Dashboard API types
  DashboardSummary,
  CategorySpending,
  SourceBreakdown,
  MonthComparison,
  MerchantSummary,
  // Subscription summary types
  SubscriptionSummary,
  SubscriptionAnalysis,
  // Card optimizer types
  CardOptimization,
  CardRecommendation,
  MissedReward,
  CardOptimizerSummary,
  // AI consultant types
  AIConsultantRequest,
  AIConsultantResponse,
  AIInsight,
  FinancialHealthScore,
  HealthScoreComponent,
  // Budget API types
  BudgetCreateRequest,
  BudgetUpdateRequest,
  BudgetProgress,
  // Goal API types
  GoalCreateRequest,
  GoalUpdateRequest,
  GoalProgress,
  // Receipt scan API types
  ReceiptScanRequest,
  ReceiptScanResponse,
  // Email sync API types
  EmailSyncRequest,
  EmailSyncResponse,
  EmailConnectionRequest,
  // Export/Import API types
  ExportRequest,
  ExportResponse,
  ImportRequest,
  ImportResponse,
  // Search API types
  SearchRequest,
  SearchResult,
  SearchResponse,
} from './api';
