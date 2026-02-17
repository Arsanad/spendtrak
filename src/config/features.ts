/**
 * SPENDTRAK FEATURE GATING CONFIGURATION
 * Defines all gated features and their tier requirements
 */

export type SubscriptionTier = 'free' | 'premium';

export type FeatureName =
  | 'receipt_scans'
  | 'ai_messages'
  | 'ai_consultant'
  | 'receipt_scanner'
  | 'email_import'
  | 'ai_health_recommendations'
  | 'budgets'
  | 'goals'
  | 'accounts'
  | 'transaction_history'
  | 'household_members'
  | 'custom_categories'
  | 'export_data'
  | 'advanced_analytics'
  | 'debt_tracking'
  | 'investment_tracking'
  | 'bill_calendar'
  | 'net_worth'
  | 'subscriptions_tracking';

/** Features that require AI and are premium-only */
export const AI_FEATURES: FeatureName[] = [
  'ai_consultant',
  'receipt_scanner',
  'email_import',
  'ai_health_recommendations',
  'receipt_scans',
  'ai_messages',
];

/** Check if a feature is an AI feature */
export const isAIFeature = (feature: FeatureName): boolean =>
  AI_FEATURES.includes(feature);

export interface FeatureLimit {
  /** -1 = unlimited, 0 = not available, positive number = limit */
  limit: number;
  /** Period for usage-based limits */
  period?: 'hour' | 'day' | 'month' | 'forever';
  /** Whether feature is enabled (for boolean features) */
  enabled: boolean;
}

export interface TierConfig {
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: Record<FeatureName, FeatureLimit>;
  badge?: string;
  color: string;
}

// Unlimited constant for readability
const UNLIMITED = -1;
const NOT_AVAILABLE = 0;

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    description: 'All features, free forever',
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: '#888888',
    features: {
      // AI features: BLOCKED for free tier
      receipt_scans: { limit: NOT_AVAILABLE, period: 'month', enabled: false },
      ai_messages: { limit: NOT_AVAILABLE, period: 'hour', enabled: false },
      ai_consultant: { limit: NOT_AVAILABLE, enabled: false },
      receipt_scanner: { limit: NOT_AVAILABLE, enabled: false },
      email_import: { limit: NOT_AVAILABLE, enabled: false },
      ai_health_recommendations: { limit: NOT_AVAILABLE, enabled: false },
      // All non-AI features: UNLIMITED
      budgets: { limit: UNLIMITED, period: 'forever', enabled: true },
      goals: { limit: UNLIMITED, period: 'forever', enabled: true },
      accounts: { limit: UNLIMITED, period: 'forever', enabled: true },
      transaction_history: { limit: UNLIMITED, enabled: true },
      household_members: { limit: UNLIMITED, period: 'forever', enabled: true },
      custom_categories: { limit: UNLIMITED, period: 'forever', enabled: true },
      export_data: { limit: UNLIMITED, enabled: true },
      advanced_analytics: { limit: UNLIMITED, enabled: true },
      debt_tracking: { limit: UNLIMITED, enabled: true },
      investment_tracking: { limit: UNLIMITED, enabled: true },
      bill_calendar: { limit: UNLIMITED, enabled: true },
      net_worth: { limit: UNLIMITED, enabled: true },
      subscriptions_tracking: { limit: UNLIMITED, enabled: true },
    },
  },
  premium: {
    name: 'premium',
    displayName: 'Premium',
    description: 'Everything in Free, plus AI intelligence',
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    color: '#FFD700',
    badge: 'AI',
    features: {
      // AI features: UNLIMITED for premium
      receipt_scans: { limit: UNLIMITED, enabled: true },
      ai_messages: { limit: UNLIMITED, enabled: true },
      ai_consultant: { limit: UNLIMITED, enabled: true },
      receipt_scanner: { limit: UNLIMITED, enabled: true },
      email_import: { limit: UNLIMITED, enabled: true },
      ai_health_recommendations: { limit: UNLIMITED, enabled: true },
      // All non-AI features: still UNLIMITED
      budgets: { limit: UNLIMITED, enabled: true },
      goals: { limit: UNLIMITED, enabled: true },
      accounts: { limit: UNLIMITED, enabled: true },
      transaction_history: { limit: UNLIMITED, enabled: true },
      household_members: { limit: UNLIMITED, enabled: true },
      custom_categories: { limit: UNLIMITED, enabled: true },
      export_data: { limit: UNLIMITED, enabled: true },
      advanced_analytics: { limit: UNLIMITED, enabled: true },
      debt_tracking: { limit: UNLIMITED, enabled: true },
      investment_tracking: { limit: UNLIMITED, enabled: true },
      bill_calendar: { limit: UNLIMITED, enabled: true },
      net_worth: { limit: UNLIMITED, enabled: true },
      subscriptions_tracking: { limit: UNLIMITED, enabled: true },
    },
  },
};

// Feature metadata for UI display
export const FEATURE_METADATA: Record<FeatureName, {
  displayName: string;
  description: string;
  icon: string;
  category: 'core' | 'financial' | 'ai';
}> = {
  // AI features
  receipt_scans: {
    displayName: 'AI Receipt Scanning',
    description: 'Scan receipts with AI to automatically extract transaction details',
    icon: 'scan-outline',
    category: 'ai',
  },
  ai_messages: {
    displayName: 'AI Financial Advisor',
    description: 'Get personalized financial advice and insights from QUANTUM',
    icon: 'sparkles-outline',
    category: 'ai',
  },
  ai_consultant: {
    displayName: 'AI Financial Consultant',
    description: 'Chat with QUANTUM for personalized financial coaching',
    icon: 'chatbubble-ellipses-outline',
    category: 'ai',
  },
  receipt_scanner: {
    displayName: 'AI Receipt Scanner',
    description: 'Camera-based AI receipt scanning and data extraction',
    icon: 'camera-outline',
    category: 'ai',
  },
  email_import: {
    displayName: 'Email Auto-Import',
    description: 'Automatically import receipts from Gmail, Outlook, and iCloud',
    icon: 'mail-outline',
    category: 'ai',
  },
  ai_health_recommendations: {
    displayName: 'AI Health Recommendations',
    description: 'AI-generated personalized financial health advice',
    icon: 'heart-outline',
    category: 'ai',
  },
  // Core features (free, unlimited)
  budgets: {
    displayName: 'Budgets',
    description: 'Create and track spending budgets',
    icon: 'wallet-outline',
    category: 'core',
  },
  goals: {
    displayName: 'Savings Goals',
    description: 'Set and track financial goals',
    icon: 'flag-outline',
    category: 'core',
  },
  accounts: {
    displayName: 'Accounts',
    description: 'Connect and manage multiple accounts',
    icon: 'card-outline',
    category: 'core',
  },
  transaction_history: {
    displayName: 'Transaction History',
    description: 'Access your full transaction history',
    icon: 'time-outline',
    category: 'core',
  },
  custom_categories: {
    displayName: 'Custom Categories',
    description: 'Create personalized spending categories',
    icon: 'pricetag-outline',
    category: 'core',
  },
  // Financial features (free, unlimited)
  household_members: {
    displayName: 'Household',
    description: 'Share budgets with family members',
    icon: 'people-outline',
    category: 'financial',
  },
  export_data: {
    displayName: 'Export Data',
    description: 'Export transactions to CSV or PDF',
    icon: 'download-outline',
    category: 'financial',
  },
  advanced_analytics: {
    displayName: 'Advanced Analytics',
    description: 'Deep insights into your spending patterns',
    icon: 'analytics-outline',
    category: 'financial',
  },
  debt_tracking: {
    displayName: 'Debt Tracking',
    description: 'Track and manage debt payoff strategies',
    icon: 'trending-down-outline',
    category: 'financial',
  },
  investment_tracking: {
    displayName: 'Investment Tracking',
    description: 'Monitor your investment portfolio',
    icon: 'trending-up-outline',
    category: 'financial',
  },
  bill_calendar: {
    displayName: 'Bill Calendar',
    description: 'Never miss a bill payment with reminders',
    icon: 'calendar-outline',
    category: 'financial',
  },
  net_worth: {
    displayName: 'Net Worth Tracker',
    description: 'Track your total assets and liabilities',
    icon: 'bar-chart-outline',
    category: 'financial',
  },
  subscriptions_tracking: {
    displayName: 'Subscription Tracking',
    description: 'Monitor and manage recurring subscriptions',
    icon: 'repeat-outline',
    category: 'financial',
  },
};

// Map route names to features for navigation gating (AI features only)
export const ROUTE_FEATURE_MAP: Record<string, FeatureName> = {
  '(modals)/ai-consultant': 'ai_consultant',
  '(modals)/camera': 'receipt_scanner',
  'settings/connect-email': 'email_import',
};

// Helper functions
export const isUnlimited = (limit: number): boolean => limit === UNLIMITED;
export const isNotAvailable = (limit: number): boolean => limit === NOT_AVAILABLE;

export const getRequiredTierForFeature = (feature: FeatureName): SubscriptionTier => {
  // Check from lowest to highest tier
  if (TIER_CONFIGS.free.features[feature].enabled &&
      TIER_CONFIGS.free.features[feature].limit !== NOT_AVAILABLE) {
    return 'free';
  }
  return 'premium';
};

export const getTierHierarchy = (tier: SubscriptionTier): number => {
  switch (tier) {
    case 'free': return 0;
    case 'premium': return 1;
    default: return 0;
  }
};

export const hasAccessToFeature = (
  userTier: SubscriptionTier,
  feature: FeatureName
): boolean => {
  const featureConfig = TIER_CONFIGS[userTier].features[feature];
  return featureConfig.enabled && featureConfig.limit !== NOT_AVAILABLE;
};

export const getFeatureLimit = (
  userTier: SubscriptionTier,
  feature: FeatureName
): number => {
  return TIER_CONFIGS[userTier].features[feature].limit;
};

export const compareToLimit = (
  userTier: SubscriptionTier,
  feature: FeatureName,
  currentUsage: number
): { withinLimit: boolean; remaining: number | 'unlimited' } => {
  const limit = getFeatureLimit(userTier, feature);

  if (isUnlimited(limit)) {
    return { withinLimit: true, remaining: 'unlimited' };
  }

  if (isNotAvailable(limit)) {
    return { withinLimit: false, remaining: 0 };
  }

  const remaining = Math.max(0, limit - currentUsage);
  return { withinLimit: currentUsage < limit, remaining };
};

// Get upgrade benefits when comparing tiers
export const getUpgradeBenefits = (
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier
): Array<{ feature: FeatureName; currentLimit: string; newLimit: string }> => {
  const benefits: Array<{ feature: FeatureName; currentLimit: string; newLimit: string }> = [];

  const formatLimit = (limit: number, period?: string): string => {
    if (isUnlimited(limit)) return 'Unlimited';
    if (isNotAvailable(limit)) return 'Not available';
    return `${limit}${period ? ` / ${period}` : ''}`;
  };

  const currentConfig = TIER_CONFIGS[currentTier].features;
  const targetConfig = TIER_CONFIGS[targetTier].features;

  (Object.keys(currentConfig) as FeatureName[]).forEach(feature => {
    const current = currentConfig[feature];
    const target = targetConfig[feature];

    // Only include if there's an improvement
    if (target.limit > current.limit ||
        (target.enabled && !current.enabled) ||
        (isUnlimited(target.limit) && !isUnlimited(current.limit))) {
      benefits.push({
        feature,
        currentLimit: formatLimit(current.limit, current.period),
        newLimit: formatLimit(target.limit, target.period),
      });
    }
  });

  return benefits;
};
