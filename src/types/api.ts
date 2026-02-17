/**
 * API Types - Request/Response interfaces
 */

import type {
  Transaction,
  Subscription,
  Alert,
  Category,
  FinancialGoal,
  Budget,
  SubscriptionFrequency,
  SubscriptionStatus,
  AlertType,
  AlertSeverity,
} from './database';

// ============================================
// COMMON API TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// TRANSACTION API TYPES
// ============================================

export interface TransactionListParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  source?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  isRecurring?: boolean;
}

export interface TransactionCreateRequest {
  amount: number;
  currency?: string;
  merchant_name: string;
  category_id?: string;
  transaction_date: string;
  transaction_time?: string;
  source?: 'manual' | 'receipt';
  notes?: string;
  receipt_image_url?: string;
}

export interface TransactionUpdateRequest {
  amount?: number;
  currency?: string;
  merchant_name?: string;
  category_id?: string | null;
  transaction_date?: string;
  notes?: string;
  is_reviewed?: boolean;
}

// ============================================
// SUBSCRIPTION API TYPES
// ============================================

export interface SubscriptionListParams extends PaginationParams {
  status?: SubscriptionStatus;
  frequency?: SubscriptionFrequency;
}

export interface SubscriptionCreateRequest {
  merchant_name: string;
  display_name?: string;
  amount: number;
  frequency: SubscriptionFrequency;
  category_id?: string;
  next_billing_date?: string;
  cancellation_url?: string;
  notes?: string;
}

export interface SubscriptionUpdateRequest {
  display_name?: string;
  amount?: number;
  frequency?: SubscriptionFrequency;
  category_id?: string | null;
  next_billing_date?: string;
  status?: SubscriptionStatus;
  notes?: string;
}

export interface SubscriptionCancelRequest {
  reason?: string;
  cancellation_date?: string;
}

// ============================================
// ALERT API TYPES
// ============================================

export interface AlertListParams extends PaginationParams {
  type?: AlertType;
  severity?: AlertSeverity;
  isRead?: boolean;
}

export interface AlertActionRequest {
  action: 'read' | 'dismiss' | 'action';
}

export interface AlertBatchUpdateRequest {
  alertIds: string[];
  action: 'read' | 'dismiss';
}

// ============================================
// DASHBOARD API TYPES
// ============================================

export interface DashboardSummary {
  total_spent: number;
  transaction_count: number;
  category_breakdown: CategorySpending[];
  source_breakdown: SourceBreakdown;
  comparison: MonthComparison;
  top_merchants: MerchantSummary[];
}

export interface CategorySpending {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface SourceBreakdown {
  email: number;
  receipt: number;
  manual: number;
  import: number;
}

export interface MonthComparison {
  current_month: number;
  previous_month: number;
  change_percentage: number;
  change_direction: 'up' | 'down' | 'same';
}

export interface MerchantSummary {
  merchant_name: string;
  total_amount: number;
  transaction_count: number;
  category_id: string | null;
}

// ============================================
// SUBSCRIPTION SUMMARY TYPES
// ============================================

export interface SubscriptionSummary {
  total_monthly: number;
  total_yearly: number;
  active_count: number;
  cancelled_count: number;
  upcoming_renewals: number;
  potential_savings: number;
  unused_subscriptions: Subscription[];
}

export interface SubscriptionAnalysis {
  subscription: Subscription;
  usage_score: number;
  value_rating: 'good' | 'average' | 'poor';
  recommendation: 'keep' | 'review' | 'cancel';
  potential_savings: number;
  similar_alternatives?: {
    name: string;
    price: number;
    savings: number;
  }[];
}

// ============================================
// CARD OPTIMIZER TYPES
// ============================================

export interface CardOptimization {
  transaction_id?: string;
  merchant_name: string;
  category: string;
  amount: number;
  card_used?: string;
  best_card: {
    card_id: string;
    card_name: string;
    bank_name: string;
    rate: number;
    reward_type: string;
    reason: string;
  };
  potential_reward: number;
  missed_reward?: number;
}

export interface CardRecommendation {
  card_id: string;
  bank_name: string;
  card_name: string;
  monthly_savings: number;
  annual_savings: number;
  best_for_categories: string[];
  apply_url?: string;
  annual_fee: number;
  welcome_bonus?: string;
}

export interface MissedReward {
  transaction_id: string;
  merchant_name: string;
  amount: number;
  date: string;
  card_used: string;
  best_card: string;
  missed_amount: number;
}

export interface CardOptimizerSummary {
  total_missed_this_month: number;
  total_missed_this_year: number;
  optimizations: CardOptimization[];
  recommendations: CardRecommendation[];
}

// ============================================
// AI CONSULTANT TYPES
// ============================================

export interface AIConsultantRequest {
  message: string;
  conversation_id?: string;
}

export interface AIConsultantResponse {
  message: string;
  conversation_id: string;
  suggestions?: string[];
  insights?: AIInsight[];
}

export interface AIInsight {
  type: 'tip' | 'warning' | 'achievement' | 'opportunity';
  title: string;
  description: string;
  action?: {
    label: string;
    url: string;
  };
  data?: Record<string, unknown>;
}

export interface FinancialHealthScore {
  overall_score: number; // 0-100
  components: {
    savings_rate: HealthScoreComponent;
    spending_control: HealthScoreComponent;
    subscription_health: HealthScoreComponent;
    goal_progress: HealthScoreComponent;
    budget_adherence: HealthScoreComponent;
  };
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
  last_updated: string;
}

export interface HealthScoreComponent {
  score: number;
  value: number;
  benchmark: number;
  status: 'good' | 'average' | 'needs_attention';
}

// ============================================
// BUDGET API TYPES
// ============================================

export interface BudgetCreateRequest {
  category_id?: string;
  name?: string;
  amount: number;
  currency?: string;
  period?: 'weekly' | 'monthly' | 'yearly';
  alert_threshold?: number;
}

export interface BudgetUpdateRequest {
  name?: string;
  amount?: number;
  alert_threshold?: number;
  is_active?: boolean;
}

export interface BudgetProgress {
  budget_id: string;
  budget_name: string | null;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  is_exceeded: boolean;
  days_remaining: number;
}

// ============================================
// GOAL API TYPES
// ============================================

export interface GoalCreateRequest {
  name: string;
  goal_type: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  monthly_contribution?: number;
  icon?: string;
  color?: string;
  notes?: string;
}

export interface GoalUpdateRequest {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  monthly_contribution?: number;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
  notes?: string;
}

export interface GoalProgress {
  goal: FinancialGoal;
  percentage: number;
  remaining_amount: number;
  monthly_needed: number;
  on_track: boolean;
  projected_completion_date: string | null;
}

// ============================================
// RECEIPT SCAN API TYPES
// ============================================

export interface ReceiptScanRequest {
  image_base64?: string;
  image_url?: string;
}

export interface ReceiptScanResponse {
  scan_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  parsed_data?: {
    total_amount: number;
    currency: string;
    merchant_name: string;
    transaction_date: string;
    items: {
      name: string;
      quantity: number;
      price: number;
    }[];
    vat_amount: number | null;
    category_suggestion: string;
  };
  confidence?: number;
  error_message?: string;
}

// ============================================
// EMAIL SYNC API TYPES
// ============================================

export interface EmailSyncRequest {
  connection_id: string;
  force_full_sync?: boolean;
}

export interface EmailSyncResponse {
  status: 'started' | 'in_progress' | 'completed' | 'error';
  emails_processed: number;
  transactions_created: number;
  subscriptions_detected: number;
  errors: string[];
}

export interface EmailConnectionRequest {
  provider: 'google' | 'microsoft';
  auth_code: string;
  redirect_uri: string;
}

// ============================================
// EXPORT/IMPORT API TYPES
// ============================================

export interface ExportRequest {
  format: 'csv' | 'json' | 'pdf';
  date_range?: {
    start: string;
    end: string;
  };
  include_categories?: boolean;
  include_receipts?: boolean;
}

export interface ExportResponse {
  download_url: string;
  expires_at: string;
  file_size: number;
  record_count: number;
}

export interface ImportRequest {
  format: 'csv' | 'json';
  data: string;
  mapping?: Record<string, string>;
}

export interface ImportResponse {
  status: 'success' | 'partial' | 'failed';
  records_imported: number;
  records_skipped: number;
  errors: {
    row: number;
    message: string;
  }[];
}

// ============================================
// SEARCH API TYPES
// ============================================

export interface SearchRequest {
  query: string;
  types?: ('transaction' | 'subscription' | 'merchant')[];
  limit?: number;
}

export interface SearchResult {
  type: 'transaction' | 'subscription' | 'merchant';
  id: string;
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  category_color?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}
