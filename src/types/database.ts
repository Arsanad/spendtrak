/**
 * Database Types - Generated from Supabase Schema
 */

// ============================================
// ENUMS
// ============================================

export type TransactionSource = 'email' | 'receipt' | 'manual' | 'import';
export type TransactionType = 'purchase' | 'payment' | 'refund' | 'atm' | 'transfer';
export type SubscriptionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'expired';
export type AlertType =
  | 'unusual_spending'
  | 'duplicate_charge'
  | 'price_increase'
  | 'free_trial_ending'
  | 'subscription_renewal'
  | 'large_transaction'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'upcoming_bill'
  | 'low_balance'
  | 'goal_milestone'
  | 'weekly_summary'
  | 'monthly_report';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type GoalType =
  | 'emergency_fund'
  | 'vacation'
  | 'home_down_payment'
  | 'car'
  | 'education'
  | 'retirement'
  | 'debt_payoff'
  | 'custom';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type SubscriptionTier = 'free' | 'premium';
export type TierStatus = 'active' | 'trialing' | 'cancelled' | 'expired' | 'paused' | 'billing_issue';
export type SavingType =
  | 'subscription_cancelled'
  | 'card_optimization'
  | 'alternative_found'
  | 'duplicate_refund'
  | 'budget_saved';
export type EmailProvider = 'google' | 'microsoft';
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'error';
export type ProcessingResult = 'transaction' | 'subscription' | 'ignored' | 'error';
export type ReceiptScanStatus = 'pending' | 'processing' | 'completed' | 'error';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type CardType = 'credit' | 'debit';
export type RewardType = 'cashback' | 'miles' | 'points';

// ============================================
// USER TYPES
// ============================================

export interface NotificationPreferences {
  push_enabled: boolean;
  email_digest: boolean;
  alert_unusual_spending: boolean;
  alert_subscriptions: boolean;
  alert_budget: boolean;
  alert_bills: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  default_currency: string;
  language: string;
  timezone: string;
  onboarding_completed: boolean;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export type UserInsert = Omit<User, 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;

// ============================================
// EMAIL CONNECTION TYPES
// ============================================

export interface EmailConnection {
  id: string;
  user_id: string;
  provider: EmailProvider;
  email_address: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailConnectionInsert = Omit<EmailConnection, 'id' | 'created_at' | 'updated_at'>;
export type EmailConnectionUpdate = Partial<Omit<EmailConnection, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  name_ar: string | null;
  icon: string;
  color: string;
  keywords: string[];
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>;

// ============================================
// TRANSACTION TYPES
// ============================================

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  merchant_name: string;
  merchant_name_clean: string | null;
  category_id: string | null;
  transaction_date: string;
  transaction_time: string | null;
  source: TransactionSource;
  card_last_four: string | null;
  bank_name: string | null;
  receipt_image_url: string | null;
  notes: string | null;
  transaction_type: TransactionType;
  is_recurring: boolean;
  is_reviewed: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category | null;
}

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface Subscription {
  id: string;
  user_id: string;
  merchant_name: string;
  display_name: string | null;
  icon: string | null;
  category_id: string | null;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  billing_day: number | null;
  next_billing_date: string | null;
  last_billing_date: string | null;
  status: SubscriptionStatus;
  cancellation_url: string | null;
  cancellation_instructions: string | null;
  auto_detected: boolean;
  detection_confidence: number | null;
  last_used_at: string | null;
  usage_count: number;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithCategory extends Subscription {
  category: Category | null;
}

export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// ALERT TYPES
// ============================================

export interface Alert {
  id: string;
  user_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  is_dismissed: boolean;
  is_actioned: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export type AlertInsert = Omit<Alert, 'id' | 'created_at'>;
export type AlertUpdate = Partial<Pick<Alert, 'is_read' | 'is_dismissed' | 'is_actioned' | 'read_at'>>;

// ============================================
// USER CARD TYPES
// ============================================

export interface UserCard {
  id: string;
  user_id: string;
  bank_name: string;
  card_name: string;
  card_type: CardType;
  last_four_digits: string | null;
  reward_type: RewardType | null;
  card_reward_id: string | null;
  is_primary: boolean;
  nickname: string | null;
  color: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  created_at: string;
  updated_at: string;
}

export type UserCardInsert = Omit<UserCard, 'id' | 'created_at' | 'updated_at'>;
export type UserCardUpdate = Partial<Omit<UserCard, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// FINANCIAL GOAL TYPES
// ============================================

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  monthly_contribution: number | null;
  priority: number;
  status: GoalStatus;
  icon: string | null;
  color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FinancialGoalInsert = Omit<FinancialGoal, 'id' | 'created_at' | 'updated_at'>;
export type FinancialGoalUpdate = Partial<Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// BUDGET TYPES
// ============================================

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string | null;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  start_date: string | null;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithCategory extends Budget {
  category: Category | null;
  spent: number;
  remaining: number;
  percentage: number;
}

export type BudgetInsert = Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
export type BudgetUpdate = Partial<Omit<Budget, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// AI CONVERSATION TYPES
// ============================================

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string | null;
  messages: AIMessage[];
  context_snapshot: Record<string, unknown> | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type AIConversationInsert = Omit<AIConversation, 'id' | 'created_at' | 'updated_at'>;
export type AIConversationUpdate = Partial<Omit<AIConversation, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// PROCESSED EMAILS TYPES
// ============================================

export interface ProcessedEmail {
  id: string;
  user_id: string;
  email_connection_id: string | null;
  message_id: string;
  thread_id: string | null;
  subject: string | null;
  sender: string | null;
  received_at: string | null;
  processing_result: ProcessingResult | null;
  transaction_id: string | null;
  subscription_id: string | null;
  error_message: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// USER SUBSCRIPTION (APP TIER) TYPES
// ============================================

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: TierStatus;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  payment_provider: string | null;
  payment_id: string | null;
  amount: number | null;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // RevenueCat integration fields
  revenuecat_app_user_id?: string;
  product_id?: string | null;
  store?: string;
  environment?: 'sandbox' | 'production';
  is_family_share?: boolean;
  billing_issue_detected_at?: string | null;
  grace_period_expires_at?: string | null;
}

// ============================================
// SUBSCRIPTION EVENT TYPES (for analytics)
// ============================================

export type SubscriptionEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'BILLING_ISSUE'
  | 'SUBSCRIBER_ALIAS'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_EXTENDED'
  | 'BILLING_ISSUE_RESOLVED';

export interface SubscriptionEvent {
  id: string;
  user_id: string;
  event_type: SubscriptionEventType;
  event_id: string;
  product_id: string;
  price: number;
  currency: string;
  store: string;
  environment: 'sandbox' | 'production';
  event_timestamp: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

// ============================================
// RECEIPT & SCAN TYPES
// ============================================

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptParseResult {
  total_amount: number;
  currency: string;
  merchant_name: string;
  transaction_date: string;
  items: ReceiptItem[];
  payment_method: 'card' | 'cash' | 'other';
  vat_amount: number | null;
  category_suggestion: string;
  confidence: number;
}

export interface ReceiptScan {
  id: string;
  user_id: string;
  image_url: string;
  image_path: string | null;
  parsed_data: ReceiptParseResult | null;
  confidence: number | null;
  status: ReceiptScanStatus;
  error_message: string | null;
  transaction_id: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface ReceiptScanUsage {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  scans_used: number;
  scans_limit: number;
}

export interface AIChatUsage {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  messages_used: number;
  messages_limit: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// SAVINGS LOG TYPES
// ============================================

export interface SavingsLog {
  id: string;
  user_id: string;
  saving_type: SavingType;
  amount: number;
  currency: string;
  description: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  saved_at: string;
}

// ============================================
// DATABASE HELPER FUNCTION RETURN TYPES
// ============================================

export interface MonthlySpendingByCategory {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface SubscriptionSummaryResult {
  total_monthly: number;
  total_yearly: number;
  active_count: number;
  cancelled_count: number;
  upcoming_renewals: number;
}

// ============================================
// PHASE 1 FEATURES - TRANSACTION SPLITS
// ============================================

export interface TransactionSplit {
  id: string;
  transaction_id: string;
  category_id: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionSplitWithCategory extends TransactionSplit {
  category: Category;
}

export type TransactionSplitInsert = Omit<TransactionSplit, 'id' | 'created_at' | 'updated_at'>;
export type TransactionSplitUpdate = Partial<Omit<TransactionSplit, 'id' | 'transaction_id' | 'created_at'>>;

// ============================================
// PHASE 1 FEATURES - BUDGET ROLLOVER
// ============================================

export interface BudgetHistory {
  id: string;
  budget_id: string;
  period_start: string;
  period_end: string;
  budget_amount: number;
  spent_amount: number;
  rollover_in: number;
  rollover_out: number;
  created_at: string;
}

export type BudgetHistoryInsert = Omit<BudgetHistory, 'id' | 'created_at'>;

// ============================================
// PHASE 1 FEATURES - DAILY SPENDING LIMITS
// ============================================

export interface DailySpendingLimit {
  id: string;
  user_id: string;
  daily_limit: number;
  currency: string;
  exclude_categories: string[];
  exclude_recurring: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailySpendingLog {
  id: string;
  user_id: string;
  date: string;
  spent_amount: number;
  daily_limit: number;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface SafeToSpendResult {
  daily_limit: number;
  spent_today: number;
  remaining: number;
  percentage_used: number;
  is_over_limit: boolean;
}

export type DailySpendingLimitInsert = Omit<DailySpendingLimit, 'id' | 'created_at' | 'updated_at'>;
export type DailySpendingLimitUpdate = Partial<Omit<DailySpendingLimit, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// PHASE 1 FEATURES - CUSTOM DATE PRESETS
// ============================================

export interface CustomDatePreset {
  id: string;
  user_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  relative_days: number | null;
  is_relative: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CustomDatePresetInsert = Omit<CustomDatePreset, 'id' | 'created_at' | 'updated_at'>;
export type CustomDatePresetUpdate = Partial<Omit<CustomDatePreset, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// PHASE 1 FEATURES - EXPORT HISTORY
// ============================================

export type ExportType = 'csv' | 'excel' | 'pdf' | 'json';
export type ExportDataType = 'transactions' | 'subscriptions' | 'budgets' | 'all';

export interface ExportHistory {
  id: string;
  user_id: string;
  export_type: ExportType;
  data_type: ExportDataType;
  filters: Record<string, unknown> | null;
  row_count: number | null;
  file_url: string | null;
  file_size_bytes: number | null;
  expires_at: string | null;
  created_at: string;
}

export type ExportHistoryInsert = Omit<ExportHistory, 'id' | 'created_at'>;

// ============================================
// EXTENDED TRANSACTION TYPE WITH SPLITS
// ============================================

export interface TransactionWithSplits extends Transaction {
  splits?: TransactionSplitWithCategory[];
}

// ============================================
// PHASE 2 FEATURES - DEBT MANAGEMENT
// ============================================

export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'student_loan' | 'auto_loan' | 'personal_loan' | 'medical' | 'other';
export type PayoffStrategy = 'snowball' | 'avalanche' | 'custom';

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  debt_type: DebtType;
  original_balance: number;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_date: number; // Day of month (1-31)
  currency: string;
  lender_name: string | null;
  account_number_last_four: string | null;
  start_date: string | null;
  target_payoff_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  balance_after: number;
  notes: string | null;
  transaction_id: string | null;
  created_at: string;
}

export interface DebtWithPayments extends Debt {
  payments: DebtPayment[];
  total_paid: number;
  total_interest_paid: number;
  months_remaining: number | null;
}

export interface PayoffPlan {
  debt_id: string;
  debt_name: string;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  recommended_payment: number;
  payoff_order: number;
  months_to_payoff: number;
  total_interest: number;
  payoff_date: string;
}

export interface DebtSummary {
  total_debt: number;
  total_minimum_payments: number;
  highest_interest_rate: number;
  lowest_balance: number;
  debts_count: number;
  monthly_interest_cost: number;
  projected_payoff_date: string | null;
}

export type DebtInsert = Omit<Debt, 'id' | 'created_at' | 'updated_at'>;
export type DebtUpdate = Partial<Omit<Debt, 'id' | 'user_id' | 'created_at'>>;
export type DebtPaymentInsert = Omit<DebtPayment, 'id' | 'created_at'>;

// ============================================
// PHASE 2 FEATURES - INCOME TRACKING
// ============================================

export type IncomeSource = 'salary' | 'freelance' | 'investment' | 'rental' | 'business' | 'gift' | 'refund' | 'other';
export type IncomeFrequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  source: IncomeSource;
  description: string | null;
  payer_name: string | null;
  income_date: string;
  is_recurring: boolean;
  frequency: IncomeFrequency | null;
  category_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeWithCategory extends Income {
  category: Category | null;
}

export type IncomeInsert = Omit<Income, 'id' | 'created_at' | 'updated_at'>;
export type IncomeUpdate = Partial<Omit<Income, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// PHASE 2 FEATURES - CASH FLOW
// ============================================

export interface CashFlowPeriod {
  period_start: string;
  period_end: string;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  savings_rate: number;
}

export interface CashFlowSummary {
  current_month: CashFlowPeriod;
  previous_month: CashFlowPeriod;
  year_to_date: CashFlowPeriod;
  monthly_average_income: number;
  monthly_average_expenses: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface IncomeBySource {
  source: IncomeSource;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

// ============================================
// PHASE 3 FEATURES - NET WORTH DASHBOARD
// ============================================

export type AssetType =
  | 'cash'
  | 'checking'
  | 'savings'
  | 'investment'
  | 'retirement'
  | 'real_estate'
  | 'vehicle'
  | 'cryptocurrency'
  | 'collectibles'
  | 'business'
  | 'other';

export type LiabilityType =
  | 'credit_card'
  | 'mortgage'
  | 'auto_loan'
  | 'student_loan'
  | 'personal_loan'
  | 'medical_debt'
  | 'tax_debt'
  | 'other';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  asset_type: AssetType;
  current_value: number;
  original_value: number | null;
  purchase_date: string | null;
  currency: string;
  institution_name: string | null;
  account_number_last_four: string | null;
  notes: string | null;
  is_liquid: boolean;
  include_in_net_worth: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  liability_type: LiabilityType;
  current_balance: number;
  original_balance: number | null;
  interest_rate: number | null;
  minimum_payment: number | null;
  currency: string;
  lender_name: string | null;
  account_number_last_four: string | null;
  due_date: number | null;
  notes: string | null;
  linked_debt_id: string | null;
  include_in_net_worth: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetHistory {
  id: string;
  asset_id: string;
  user_id: string;
  recorded_value: number;
  recorded_date: string;
  change_reason: string | null;
  created_at: string;
}

export interface LiabilityHistory {
  id: string;
  liability_id: string;
  user_id: string;
  recorded_balance: number;
  recorded_date: string;
  change_reason: string | null;
  created_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  liquid_assets: number;
  asset_breakdown: Record<AssetType, number>;
  liability_breakdown: Record<LiabilityType, number>;
  notes: string | null;
  created_at: string;
}

export interface NetWorthSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  liquid_assets: number;
  asset_breakdown: Record<AssetType, number>;
  liability_breakdown: Record<LiabilityType, number>;
  month_change: number;
  month_change_percentage: number;
  year_change: number;
  year_change_percentage: number;
}

export type AssetInsert = Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
export type AssetUpdate = Partial<Omit<Asset, 'id' | 'user_id' | 'created_at'>>;
export type LiabilityInsert = Omit<Liability, 'id' | 'created_at' | 'updated_at'>;
export type LiabilityUpdate = Partial<Omit<Liability, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// PHASE 3 FEATURES - PARTNER/SPOUSE SHARING
// ============================================

export type HouseholdRole = 'owner' | 'admin' | 'member' | 'viewer';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface Household {
  id: string;
  name: string;
  created_by: string;
  currency: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  nickname: string | null;
  can_view_transactions: boolean;
  can_add_transactions: boolean;
  can_edit_budgets: boolean;
  can_manage_members: boolean;
  joined_at: string;
}

export interface HouseholdMemberWithUser extends HouseholdMember {
  user: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  invited_by: string;
  invited_email: string;
  role: HouseholdRole;
  status: InviteStatus;
  invite_code: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface SharedBudget {
  id: string;
  household_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedBudgetWithCategory extends SharedBudget {
  category: Category | null;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface SharedGoal {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedGoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  notes: string | null;
  created_at: string;
}

export interface SharedGoalWithContributions extends SharedGoal {
  contributions: SharedGoalContribution[];
  total_contributed: number;
  percentage_complete: number;
}

export interface TransactionAssignment {
  id: string;
  transaction_id: string;
  household_id: string;
  assigned_to: string | null;
  is_shared: boolean;
  split_percentage: number;
  notes: string | null;
  created_at: string;
}

export type HouseholdInsert = Omit<Household, 'id' | 'created_at' | 'updated_at'>;
export type HouseholdUpdate = Partial<Omit<Household, 'id' | 'created_by' | 'created_at'>>;
export type HouseholdMemberInsert = Omit<HouseholdMember, 'id' | 'joined_at'>;
export type HouseholdMemberUpdate = Partial<Omit<HouseholdMember, 'id' | 'household_id' | 'user_id' | 'joined_at'>>;
export type SharedBudgetInsert = Omit<SharedBudget, 'id' | 'created_at' | 'updated_at'>;
export type SharedBudgetUpdate = Partial<Omit<SharedBudget, 'id' | 'household_id' | 'created_at'>>;
export type SharedGoalInsert = Omit<SharedGoal, 'id' | 'created_at' | 'updated_at'>;
export type SharedGoalUpdate = Partial<Omit<SharedGoal, 'id' | 'household_id' | 'created_at'>>;

// ============================================
// PHASE 3 FEATURES - BILL CALENDAR
// ============================================

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled';

export interface Bill {
  id: string;
  user_id: string;
  household_id: string | null;
  name: string;
  amount: number;
  currency: string;
  category_id: string | null;
  payee_name: string | null;
  due_day: number | null;
  frequency: IncomeFrequency;
  start_date: string;
  end_date: string | null;
  auto_pay: boolean;
  reminder_days: number;
  is_essential: boolean;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillWithCategory extends Bill {
  category: Category | null;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  user_id: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: BillStatus;
  paid_date: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillReminder {
  id: string;
  bill_id: string;
  user_id: string;
  reminder_date: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface BillOccurrence {
  bill_id: string;
  bill_name: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  is_essential: boolean;
  category: Category | null;
}

export interface BillCalendarMonth {
  month: string; // YYYY-MM
  total_due: number;
  total_paid: number;
  bills: BillOccurrence[];
}

export interface BillSummary {
  upcoming_count: number;
  upcoming_total: number;
  overdue_count: number;
  overdue_total: number;
  paid_this_month: number;
  essential_total: number;
  next_due_date: string | null;
  next_due_bill: string | null;
}

export type BillInsert = Omit<Bill, 'id' | 'created_at' | 'updated_at'>;
export type BillUpdate = Partial<Omit<Bill, 'id' | 'user_id' | 'created_at'>>;
export type BillPaymentInsert = Omit<BillPayment, 'id' | 'created_at' | 'updated_at'>;
export type BillPaymentUpdate = Partial<Omit<BillPayment, 'id' | 'bill_id' | 'user_id' | 'created_at'>>;

// ============================================
// PHASE 3 FEATURES - ZERO-BASED BUDGETING
// ============================================

export interface ZeroBasedPeriod {
  id: string;
  user_id: string;
  household_id: string | null;
  period_name: string;
  start_date: string;
  end_date: string;
  total_income: number;
  total_allocated: number;
  is_balanced: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZeroBasedAllocation {
  id: string;
  period_id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  priority: number;
  is_essential: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZeroBasedAllocationWithCategory extends ZeroBasedAllocation {
  category: Category | null;
  remaining: number;
  percentage_spent: number;
}

export interface ZeroBasedIncomeSource {
  id: string;
  period_id: string;
  user_id: string;
  name: string;
  expected_amount: number;
  received_amount: number;
  expected_date: string | null;
  received_date: string | null;
  income_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZeroBasedPeriodWithDetails extends ZeroBasedPeriod {
  allocations: ZeroBasedAllocationWithCategory[];
  income_sources: ZeroBasedIncomeSource[];
  unallocated: number;
  total_spent: number;
  total_remaining: number;
}

export interface ZeroBasedSummary {
  is_balanced: boolean;
  total_income: number;
  total_allocated: number;
  unallocated: number;
  total_spent: number;
  total_remaining: number;
  essential_allocated: number;
  non_essential_allocated: number;
  categories_over_budget: number;
}

export type ZeroBasedPeriodInsert = Omit<ZeroBasedPeriod, 'id' | 'created_at' | 'updated_at'>;
export type ZeroBasedPeriodUpdate = Partial<Omit<ZeroBasedPeriod, 'id' | 'user_id' | 'created_at'>>;
export type ZeroBasedAllocationInsert = Omit<ZeroBasedAllocation, 'id' | 'created_at' | 'updated_at'>;
export type ZeroBasedAllocationUpdate = Partial<Omit<ZeroBasedAllocation, 'id' | 'period_id' | 'user_id' | 'created_at'>>;
export type ZeroBasedIncomeSourceInsert = Omit<ZeroBasedIncomeSource, 'id' | 'created_at' | 'updated_at'>;
export type ZeroBasedIncomeSourceUpdate = Partial<Omit<ZeroBasedIncomeSource, 'id' | 'period_id' | 'user_id' | 'created_at'>>;

// ============================================
// BACKWARD COMPATIBILITY TYPE ALIASES
// ============================================

// Legacy type aliases for backward compatibility
export type SavingsGoal = FinancialGoal;
export type CreditCard = UserCard;
