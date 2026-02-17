/**
 * Mock Data for SpendTrak Tests
 * Provides realistic test data for all entities
 */

import type {
  User,
  Transaction,
  TransactionWithCategory,
  Subscription,
  Alert,
  Category,
  Budget,
  SavingsGoal,
  CreditCard,
  AIInsight,
} from '@/types';

// ============================================
// USERS
// ============================================

export const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  default_currency: 'USD',
  language: 'en',
  timezone: 'UTC',
  onboarding_completed: true,
  notification_preferences: {
    push_enabled: true,
    email_digest: false,
    alert_unusual_spending: true,
    alert_subscriptions: true,
    alert_budget: true,
    alert_bills: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

// ============================================
// CATEGORIES
// ============================================

export const mockCategories: Category[] = [
  {
    id: 'food-dining',
    user_id: null,
    name: 'Food & Dining',
    name_ar: null,
    icon: 'restaurant',
    color: '#FF6B6B',
    keywords: ['food', 'restaurant', 'dining', 'cafe'],
    is_default: true,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'transportation',
    user_id: null,
    name: 'Transportation',
    name_ar: null,
    icon: 'car',
    color: '#4ECDC4',
    keywords: ['uber', 'lyft', 'gas', 'transit'],
    is_default: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shopping',
    user_id: null,
    name: 'Shopping',
    name_ar: null,
    icon: 'cart',
    color: '#A06CD5',
    keywords: ['amazon', 'store', 'shopping'],
    is_default: true,
    sort_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'entertainment',
    user_id: null,
    name: 'Entertainment',
    name_ar: null,
    icon: 'film',
    color: '#FF8C42',
    keywords: ['netflix', 'movie', 'game'],
    is_default: true,
    sort_order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'bills-utilities',
    user_id: null,
    name: 'Bills & Utilities',
    name_ar: null,
    icon: 'flash',
    color: '#2196F3',
    keywords: ['electric', 'water', 'internet', 'phone'],
    is_default: true,
    sort_order: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'health',
    user_id: null,
    name: 'Health',
    name_ar: null,
    icon: 'medical',
    color: '#00C853',
    keywords: ['pharmacy', 'doctor', 'hospital'],
    is_default: true,
    sort_order: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// TRANSACTIONS
// ============================================

export const mockTransaction: Transaction = {
  id: 'tx-001',
  user_id: 'user-123',
  amount: 45.99,
  currency: 'USD',
  merchant_name: 'Whole Foods Market',
  merchant_name_clean: null,
  category_id: 'food-dining',
  transaction_date: '2024-01-15T10:30:00Z',
  transaction_time: null,
  transaction_type: 'purchase',
  source: 'email',
  card_last_four: null,
  bank_name: null,
  receipt_image_url: null,
  notes: null,
  is_recurring: false,
  is_reviewed: false,
  is_deleted: false,
  deleted_at: null,
  metadata: {},
  created_at: '2024-01-15T10:31:00Z',
  updated_at: '2024-01-15T10:31:00Z',
};

export const mockTransactionWithCategory: TransactionWithCategory = {
  ...mockTransaction,
  category: mockCategories[0],
};

export const mockTransactions: TransactionWithCategory[] = [
  {
    ...mockTransaction,
    category: mockCategories[0],
  },
  {
    id: 'tx-002',
    user_id: 'user-123',
    amount: 25.00,
    currency: 'USD',
    merchant_name: 'Uber',
    merchant_name_clean: null,
    category_id: 'transportation',
    transaction_date: '2024-01-14T18:00:00Z',
    transaction_time: null,
    transaction_type: 'purchase',
    source: 'manual',
    card_last_four: null,
    bank_name: null,
    receipt_image_url: null,
    notes: 'Airport ride',
    is_recurring: false,
    is_reviewed: false,
    is_deleted: false,
    deleted_at: null,
    metadata: {},
    created_at: '2024-01-14T18:05:00Z',
    updated_at: '2024-01-14T18:05:00Z',
    category: mockCategories[1],
  },
  {
    id: 'tx-003',
    user_id: 'user-123',
    amount: 150.00,
    currency: 'USD',
    merchant_name: 'Amazon',
    merchant_name_clean: null,
    category_id: 'shopping',
    transaction_date: '2024-01-13T14:20:00Z',
    transaction_time: null,
    transaction_type: 'purchase',
    source: 'email',
    card_last_four: null,
    bank_name: null,
    receipt_image_url: null,
    notes: null,
    is_recurring: false,
    is_reviewed: false,
    is_deleted: false,
    deleted_at: null,
    metadata: {},
    created_at: '2024-01-13T14:25:00Z',
    updated_at: '2024-01-13T14:25:00Z',
    category: mockCategories[2],
  },
];

// ============================================
// SUBSCRIPTIONS
// ============================================

export const mockSubscription: Subscription = {
  id: 'sub-001',
  user_id: 'user-123',
  merchant_name: 'Netflix',
  display_name: 'Netflix Premium',
  icon: '🎬',
  amount: 22.99,
  currency: 'USD',
  frequency: 'monthly',
  billing_day: null,
  status: 'active',
  next_billing_date: '2024-02-01T00:00:00Z',
  last_billing_date: null,
  cancellation_url: null,
  cancellation_instructions: null,
  auto_detected: false,
  detection_confidence: null,
  last_used_at: '2024-01-20T00:00:00Z',
  usage_count: 0,
  notes: null,
  metadata: {},
  category_id: 'entertainment',
  created_at: '2023-06-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

export const mockSubscriptions: Subscription[] = [
  mockSubscription,
  {
    id: 'sub-002',
    user_id: 'user-123',
    merchant_name: 'Spotify',
    display_name: 'Spotify Family',
    icon: '🎵',
    amount: 16.99,
    currency: 'USD',
    frequency: 'monthly',
    billing_day: null,
    status: 'active',
    next_billing_date: '2024-01-25T00:00:00Z',
    last_billing_date: null,
    cancellation_url: null,
    cancellation_instructions: null,
    auto_detected: false,
    detection_confidence: null,
    last_used_at: '2024-01-21T00:00:00Z',
    usage_count: 0,
    notes: null,
    metadata: {},
    category_id: 'entertainment',
    created_at: '2022-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'sub-003',
    user_id: 'user-123',
    merchant_name: 'Adobe',
    display_name: 'Adobe Creative Cloud',
    icon: '🎨',
    amount: 54.99,
    currency: 'USD',
    frequency: 'monthly',
    billing_day: null,
    status: 'active',
    next_billing_date: '2024-02-05T00:00:00Z',
    last_billing_date: null,
    cancellation_url: null,
    cancellation_instructions: null,
    auto_detected: false,
    detection_confidence: null,
    last_used_at: '2023-11-01T00:00:00Z',
    usage_count: 0,
    notes: null,
    metadata: {},
    category_id: 'bills-utilities',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

// ============================================
// ALERTS
// ============================================

export const mockAlert: Alert = {
  id: 'alert-001',
  user_id: 'user-123',
  alert_type: 'unusual_spending',
  severity: 'warning',
  title: 'Unusual Spending Detected',
  message: 'You spent 50% more on Food & Dining this week compared to your average.',
  data: {
    category: 'food-dining',
    amount: 250,
    average: 150,
    percentage: 66.7,
  },
  action_label: 'View Details',
  action_url: '/transactions?category=food-dining',
  related_entity_type: null,
  related_entity_id: null,
  is_read: false,
  is_dismissed: false,
  is_actioned: false,
  read_at: null,
  expires_at: '2024-02-15T00:00:00Z',
  created_at: '2024-01-15T00:00:00Z',
};

export const mockAlerts: Alert[] = [
  mockAlert,
  {
    id: 'alert-002',
    user_id: 'user-123',
    alert_type: 'subscription_renewal',
    severity: 'info',
    title: 'Subscription Renewing Soon',
    message: 'Your Netflix subscription will renew in 3 days for $22.99.',
    data: {
      subscription_id: 'sub-001',
      amount: 22.99,
      days_until: 3,
    },
    action_label: 'Manage',
    action_url: '/subscriptions/sub-001',
    related_entity_type: null,
    related_entity_id: null,
    is_read: false,
    is_dismissed: false,
    is_actioned: false,
    read_at: null,
    expires_at: '2024-02-01T00:00:00Z',
    created_at: '2024-01-18T00:00:00Z',
  },
  {
    id: 'alert-003',
    user_id: 'user-123',
    alert_type: 'large_transaction',
    severity: 'critical',
    title: 'Large Transaction Alert',
    message: 'A transaction of $500.00 was made at Apple Store.',
    data: {
      transaction_id: 'tx-100',
      amount: 500,
      merchant: 'Apple Store',
    },
    action_label: 'Review',
    action_url: '/transactions/tx-100',
    related_entity_type: null,
    related_entity_id: null,
    is_read: true,
    is_dismissed: false,
    is_actioned: true,
    read_at: '2024-01-10T01:00:00Z',
    expires_at: null,
    created_at: '2024-01-10T00:00:00Z',
  },
];

// ============================================
// BUDGETS
// ============================================

export const mockBudget: Budget = {
  id: 'budget-001',
  user_id: 'user-123',
  category_id: 'food-dining',
  name: null,
  amount: 500,
  currency: 'USD',
  period: 'monthly',
  start_date: null,
  alert_threshold: 80,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

export const mockBudgets: Budget[] = [
  mockBudget,
  {
    id: 'budget-002',
    user_id: 'user-123',
    category_id: 'transportation',
    name: null,
    amount: 200,
    currency: 'USD',
    period: 'monthly',
    start_date: null,
    alert_threshold: 80,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'budget-003',
    user_id: 'user-123',
    category_id: 'entertainment',
    name: null,
    amount: 150,
    currency: 'USD',
    period: 'monthly',
    start_date: null,
    alert_threshold: 80,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

// ============================================
// SAVINGS GOALS
// ============================================

export const mockSavingsGoal: SavingsGoal = {
  id: 'goal-001',
  user_id: 'user-123',
  name: 'Emergency Fund',
  goal_type: 'emergency_fund',
  target_amount: 10000,
  current_amount: 3500,
  currency: 'USD',
  target_date: '2024-12-31T00:00:00Z',
  monthly_contribution: null,
  priority: 1,
  icon: '🏦',
  color: '#00C853',
  status: 'active',
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

export const mockSavingsGoals: SavingsGoal[] = [
  mockSavingsGoal,
  {
    id: 'goal-002',
    user_id: 'user-123',
    name: 'Vacation',
    goal_type: 'vacation',
    target_amount: 3000,
    current_amount: 1200,
    currency: 'USD',
    target_date: '2024-06-01T00:00:00Z',
    monthly_contribution: null,
    priority: 2,
    icon: '✈️',
    color: '#2196F3',
    status: 'active',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

// ============================================
// CREDIT CARDS
// ============================================

export const mockCreditCard: CreditCard = {
  id: 'card-001',
  user_id: 'user-123',
  bank_name: 'Chase',
  card_name: 'Chase Sapphire Preferred',
  card_type: 'credit',
  last_four_digits: '4242',
  reward_type: 'points',
  card_reward_id: null,
  is_primary: true,
  nickname: null,
  color: '#1A1F71',
  expiry_month: null,
  expiry_year: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

export const mockCreditCards: CreditCard[] = [
  mockCreditCard,
  {
    id: 'card-002',
    user_id: 'user-123',
    bank_name: 'American Express',
    card_name: 'Amex Gold Card',
    card_type: 'credit',
    last_four_digits: '1234',
    reward_type: 'points',
    card_reward_id: null,
    is_primary: false,
    nickname: null,
    color: '#B8860B',
    expiry_month: null,
    expiry_year: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

// ============================================
// AI INSIGHTS
// ============================================

export const mockAIInsight: AIInsight & Record<string, unknown> = {
  id: 'insight-001',
  type: 'tip',
  title: 'Switch to Annual Billing',
  description: 'You could save $47.88/year by switching your Netflix subscription from monthly to annual billing.',
  priority: 'high',
  action: {
    label: 'View Subscription',
    url: '/subscriptions/sub-001',
  },
  created_at: '2024-01-15T00:00:00Z',
};

export const mockAIInsights: (AIInsight & Record<string, unknown>)[] = [
  mockAIInsight,
  {
    id: 'insight-002',
    type: 'warning',
    title: 'Budget Limit Approaching',
    description: 'Your Transportation budget is at 87%. Consider using public transit for the rest of the month.',
    priority: 'medium',
    action: {
      label: 'View Budget',
      url: '/settings/budgets',
    },
    created_at: '2024-01-14T00:00:00Z',
  },
  {
    id: 'insight-003',
    type: 'achievement',
    title: 'Spending Streak!',
    description: 'You\'ve stayed under budget for 5 consecutive weeks. Keep it up!',
    priority: 'low',
    created_at: '2024-01-13T00:00:00Z',
  },
];

// ============================================
// DASHBOARD SUMMARY
// ============================================

export const mockDashboardSummary = {
  totalSpent: 1250.75,
  transactionCount: 28,
  comparison: {
    previous: 1100.50,
    change: 13.6,
    direction: 'up' as const,
  },
  byCategory: [
    { category: 'Food & Dining', amount: 450.25, icon: '🍽️', color: '#FF6B6B' },
    { category: 'Transportation', amount: 325.00, icon: '🚗', color: '#4ECDC4' },
    { category: 'Shopping', amount: 275.50, icon: '🛒', color: '#A06CD5' },
    { category: 'Entertainment', amount: 200.00, icon: '🎬', color: '#FF8C42' },
  ],
};

export const mockSubscriptionSummary = {
  total_monthly: 94.97,
  total_yearly: 1139.64,
  active_count: 3,
  potential_savings: 54.99,
  upcoming_renewals: 1,
};

// ============================================
// RECEIPT PARSING
// ============================================

export const mockParsedReceipt = {
  total_amount: 125.50,
  currency: 'USD',
  merchant_name: 'Target',
  transaction_date: '2024-01-15',
  items: [
    { name: 'Household Items', quantity: 3, price: 45.50 },
    { name: 'Groceries', quantity: 1, price: 80.00 },
  ],
  payment_method: 'card',
  vat_amount: null,
  category_suggestion: 'shopping',
  confidence: 0.92,
};

// ============================================
// API RESPONSES
// ============================================

export const mockApiSuccess = <T>(data: T) => ({
  data,
  error: null,
});

export const mockApiError = (message: string) => ({
  data: null,
  error: { message },
});

export default {
  mockUser,
  mockCategories,
  mockTransaction,
  mockTransactionWithCategory,
  mockTransactions,
  mockSubscription,
  mockSubscriptions,
  mockAlert,
  mockAlerts,
  mockBudget,
  mockBudgets,
  mockSavingsGoal,
  mockSavingsGoals,
  mockCreditCard,
  mockCreditCards,
  mockAIInsight,
  mockAIInsights,
  mockDashboardSummary,
  mockSubscriptionSummary,
  mockParsedReceipt,
  mockApiSuccess,
  mockApiError,
};
