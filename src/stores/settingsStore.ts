/**
 * Settings Store
 * Manages app settings and preferences with RevenueCat integration
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubscriptionTier } from '@/config/revenuecat';
import type { SubscriptionPeriod } from '@/types/purchases';
import {
  getCurrentSubscription,
  getCustomerInfo,
  getSubscriptionStatus,
  subscribeToCustomerInfo,
} from '@/services/purchases';
import { logger } from '@/utils/logger';
import { getCurrencySymbolForLanguage } from '@/config/currencies';
import { eventBus } from '@/services/eventBus';
import { useAuthStore } from '@/stores/authStore';

// DEV OVERRIDE — remove before production release
const VIP_EMAILS = ['ab.sanad17@gmail.com', 'ab.sanad71@gmail.com'];
const _isVIPUser = (): boolean => {
  const email = useAuthStore.getState().user?.email?.toLowerCase();
  return !!email && VIP_EMAILS.includes(email);
};

// Legacy type for backward compatibility
export type PremiumPlan = 'free' | 'monthly' | 'yearly';

interface SubscriptionState {
  /** Current subscription tier from RevenueCat */
  tier: SubscriptionTier;
  /** Whether subscription is active */
  isActive: boolean;
  /** Whether user is in trial period */
  isInTrial: boolean;
  /** Whether subscription will auto-renew */
  willRenew: boolean;
  /** Subscription expiration date (ISO string) */
  expiresAt: string | null;
  /** Original purchase date (ISO string) */
  purchasedAt: string | null;
  /** Billing period */
  period: SubscriptionPeriod | null;
  /** Product identifier */
  productId: string | null;
  /** Whether there's a billing issue */
  hasBillingIssue: boolean;
}

interface SettingsState {
  // App Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  currencySymbol: string;

  // Subscription State (from RevenueCat)
  subscription: SubscriptionState;
  subscriptionLoading: boolean;
  subscriptionError: string | null;

  // Legacy Premium Fields (for backward compatibility)
  isPremium: boolean;
  premiumPlan: PremiumPlan;
  premiumExpiresAt: string | null;
  premiumPurchasedAt: string | null;

  // Notification Settings
  pushNotifications: boolean;
  emailDigest: boolean;
  alertUnusualSpending: boolean;
  alertSubscriptions: boolean;
  alertBudget: boolean;
  alertBills: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // Display Settings
  showCents: boolean;
  weekStartsOn: 'sunday' | 'monday';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

  // Sound & Haptic Settings
  quantumSoundsEnabled: boolean;

  // Privacy & Consent Settings (LEGAL REQUIREMENTS)
  aiConsentGiven: boolean;
  analyticsEnabled: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string, symbol: string) => void;
  updateNotificationSettings: (settings: Partial<SettingsState>) => void;
  updateDisplaySettings: (settings: Partial<SettingsState>) => void;
  setQuantumSoundsEnabled: (enabled: boolean) => void;
  setAIConsent: (consent: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;

  // Subscription Actions
  fetchSubscription: () => Promise<void>;
  syncSubscriptionFromCustomerInfo: () => Promise<void>;
  setSubscriptionLoading: (loading: boolean) => void;
  setSubscriptionError: (error: string | null) => void;

  // Legacy Actions (for backward compatibility - maps to subscription state)
  setPremiumSubscription: (plan: PremiumPlan) => void;
  cancelPremiumSubscription: () => void;

  resetSettings: () => void;
}

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  tier: 'free',
  isActive: false,
  isInTrial: false,
  willRenew: false,
  expiresAt: null,
  purchasedAt: null,
  period: null,
  productId: null,
  hasBillingIssue: false,
};

const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  language: 'en',
  currency: 'AED',
  currencySymbol: 'AED', // Use English symbol by default; Arabic symbol (د.إ) used when language is 'ar'
  // Subscription defaults
  subscription: DEFAULT_SUBSCRIPTION,
  subscriptionLoading: false,
  subscriptionError: null as string | null,
  // Legacy premium defaults (for backward compatibility)
  isPremium: false,
  premiumPlan: 'free' as PremiumPlan,
  premiumExpiresAt: null as string | null,
  premiumPurchasedAt: null as string | null,
  // Notifications
  pushNotifications: true,
  emailDigest: false,
  alertUnusualSpending: true,
  alertSubscriptions: true,
  alertBudget: true,
  alertBills: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  showCents: true,
  weekStartsOn: 'sunday' as const,
  dateFormat: 'DD/MM/YYYY' as const,
  quantumSoundsEnabled: true,
  // Privacy & Consent
  aiConsentGiven: true,
  analyticsEnabled: true, // Default on, user can opt-out
};

/**
 * Convert subscription tier to legacy premium plan
 */
function tierToLegacyPlan(
  tier: SubscriptionTier,
  period: SubscriptionPeriod | null
): PremiumPlan {
  if (tier === 'free') return 'free';
  // Map both plus and premium to monthly/yearly based on period
  return period === 'yearly' ? 'yearly' : 'monthly';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      // ==========================================
      // App Settings Actions
      // ==========================================

      setTheme: (theme) => {
        set({ theme });
        eventBus.emit('settings:changed', { key: 'theme', value: theme });
      },

      setLanguage: (language) => {
        const currentCurrency = get().currency;
        // Update currency symbol to match new language
        const newSymbol = getCurrencySymbolForLanguage(currentCurrency, language);
        set({ language, currencySymbol: newSymbol });
        eventBus.emit('settings:changed', { key: 'language', value: language });
      },

      setCurrency: (currency, symbol) => {
        // Use the provided symbol or get the language-aware symbol
        const currentLanguage = get().language || 'en';
        const finalSymbol = symbol || getCurrencySymbolForLanguage(currency, currentLanguage);
        set({ currency, currencySymbol: finalSymbol });
        eventBus.emit('settings:changed', { key: 'currency', value: currency });
      },

      updateNotificationSettings: (settings) => set(settings),

      updateDisplaySettings: (settings) => set(settings),

      setQuantumSoundsEnabled: (enabled) =>
        set({ quantumSoundsEnabled: enabled }),

      // Privacy & Consent Actions (LEGAL REQUIREMENTS)
      setAIConsent: (consent) => set({ aiConsentGiven: consent }),
      setAnalyticsEnabled: (enabled) => set({ analyticsEnabled: enabled }),

      // ==========================================
      // Subscription Actions (RevenueCat)
      // ==========================================

      /**
       * Fetch current subscription status from RevenueCat
       * Updates both new subscription state and legacy fields
       */
      fetchSubscription: async () => {
        set({ subscriptionLoading: true, subscriptionError: null });

        try {
          const status = await getCurrentSubscription();

          const subscription: SubscriptionState = {
            tier: status.tier,
            isActive: status.isActive,
            isInTrial: status.isInTrial,
            willRenew: status.willRenew,
            expiresAt: status.expiresAt,
            purchasedAt: status.purchasedAt,
            period: status.period,
            productId: status.productId,
            hasBillingIssue: status.hasBillingIssue,
          };

          // DEV OVERRIDE — remove before production release
          const isVIP = _isVIPUser();
          if (isVIP) {
            subscription.tier = 'premium' as SubscriptionTier;
            subscription.isActive = true;
          }

          // Update both new and legacy fields
          set({
            subscription,
            subscriptionLoading: false,
            // Legacy fields for backward compatibility
            isPremium: isVIP || (status.tier !== 'free' && status.isActive),
            premiumPlan: tierToLegacyPlan(isVIP ? 'premium' : status.tier, status.period),
            premiumExpiresAt: status.expiresAt,
            premiumPurchasedAt: status.purchasedAt,
          });

          logger.purchases.info('Subscription fetched:', status.tier);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch subscription';
          logger.purchases.error('Failed to fetch subscription:', errorMessage);
          set({
            subscriptionLoading: false,
            subscriptionError: errorMessage,
          });
        }
      },

      /**
       * Sync subscription from customer info (called by listener)
       */
      syncSubscriptionFromCustomerInfo: async () => {
        try {
          const customerInfo = await getCustomerInfo();
          if (!customerInfo) return;

          const legacyStatus = getSubscriptionStatus(customerInfo);

          // Determine period from product ID
          let period: SubscriptionPeriod | null = null;
          if (legacyStatus.productId) {
            const productIdLower = legacyStatus.productId.toLowerCase();
            if (
              productIdLower.includes('yearly') ||
              productIdLower.includes('annual') ||
              productIdLower.includes('year')
            ) {
              period = 'yearly';
            } else if (
              productIdLower.includes('monthly') ||
              productIdLower.includes('month')
            ) {
              period = 'monthly';
            }
          }

          // DEV OVERRIDE — remove before production release
          const isVIP = _isVIPUser();
          const effectiveTier: SubscriptionTier = isVIP ? 'premium' : legacyStatus.tier;

          const subscription: SubscriptionState = {
            tier: effectiveTier,
            isActive: isVIP || legacyStatus.isActive,
            isInTrial: legacyStatus.isTrialActive,
            willRenew: legacyStatus.willRenew,
            expiresAt: legacyStatus.expirationDate?.toISOString() || null,
            purchasedAt: legacyStatus.originalPurchaseDate?.toISOString() || null,
            period,
            productId: legacyStatus.productId,
            hasBillingIssue: false, // Not available in legacy status
          };

          set({
            subscription,
            // Legacy fields
            isPremium: isVIP || (legacyStatus.tier !== 'free' && legacyStatus.isActive),
            premiumPlan: tierToLegacyPlan(effectiveTier, period),
            premiumExpiresAt: subscription.expiresAt,
            premiumPurchasedAt: subscription.purchasedAt,
          });

          logger.purchases.debug('Subscription synced from customer info');
        } catch (error) {
          logger.purchases.error('Failed to sync subscription:', error);
        }
      },

      setSubscriptionLoading: (loading) => set({ subscriptionLoading: loading }),

      setSubscriptionError: (error) => set({ subscriptionError: error }),

      // ==========================================
      // Legacy Actions (for backward compatibility)
      // ==========================================

      /**
       * @deprecated Use purchasePackage from purchases service instead
       * This now only updates local state for testing/dev purposes
       */
      setPremiumSubscription: (plan) => {
        if (__DEV__) {
          // In dev mode, allow setting subscription for testing
          const now = new Date();
          const expiresAt = new Date();

          if (plan === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else if (plan === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          }

          const tier: SubscriptionTier = plan === 'free' ? 'free' : 'premium';
          const period: SubscriptionPeriod | null =
            plan === 'yearly' ? 'yearly' : plan === 'monthly' ? 'monthly' : null;

          set({
            subscription: {
              tier,
              isActive: plan !== 'free',
              isInTrial: false,
              willRenew: plan !== 'free',
              expiresAt: plan !== 'free' ? expiresAt.toISOString() : null,
              purchasedAt: plan !== 'free' ? now.toISOString() : null,
              period,
              productId: null,
              hasBillingIssue: false,
            },
            isPremium: plan !== 'free',
            premiumPlan: plan,
            premiumPurchasedAt: plan !== 'free' ? now.toISOString() : null,
            premiumExpiresAt: plan !== 'free' ? expiresAt.toISOString() : null,
          });

          logger.purchases.debug('Dev mode: Set premium subscription to', plan);
        } else {
          logger.purchases.warn(
            'setPremiumSubscription is deprecated. Use purchases service.'
          );
        }
      },

      /**
       * @deprecated Use openSubscriptionManagement from purchases service instead
       */
      cancelPremiumSubscription: () => {
        if (__DEV__) {
          // In dev mode, allow cancelling for testing
          set({
            subscription: DEFAULT_SUBSCRIPTION,
            isPremium: false,
            premiumPlan: 'free',
            premiumExpiresAt: null,
            premiumPurchasedAt: null,
          });
          logger.purchases.debug('Dev mode: Cancelled premium subscription');
        } else {
          logger.purchases.warn(
            'cancelPremiumSubscription is deprecated. Use openSubscriptionManagement.'
          );
        }
      },

      // ==========================================
      // Reset
      // ==========================================

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist subscription loading/error state
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        currencySymbol: state.currencySymbol,
        subscription: state.subscription,
        isPremium: state.isPremium,
        premiumPlan: state.premiumPlan,
        premiumExpiresAt: state.premiumExpiresAt,
        premiumPurchasedAt: state.premiumPurchasedAt,
        pushNotifications: state.pushNotifications,
        emailDigest: state.emailDigest,
        alertUnusualSpending: state.alertUnusualSpending,
        alertSubscriptions: state.alertSubscriptions,
        alertBudget: state.alertBudget,
        alertBills: state.alertBills,
        quietHoursEnabled: state.quietHoursEnabled,
        quietHoursStart: state.quietHoursStart,
        quietHoursEnd: state.quietHoursEnd,
        showCents: state.showCents,
        weekStartsOn: state.weekStartsOn,
        dateFormat: state.dateFormat,
        quantumSoundsEnabled: state.quantumSoundsEnabled,
        // Privacy & Consent (LEGAL REQUIREMENTS)
        aiConsentGiven: state.aiConsentGiven,
        analyticsEnabled: state.analyticsEnabled,
      }),
    }
  )
);

/**
 * Initialize subscription listener
 * Call this after purchases SDK is initialized
 */
export function initSubscriptionListener(): () => void {
  const store = useSettingsStore.getState();

  // Subscribe to customer info updates
  const unsubscribe = subscribeToCustomerInfo(() => {
    store.syncSubscriptionFromCustomerInfo();
  });

  // Fetch initial subscription status
  store.fetchSubscription();

  return unsubscribe;
}

/**
 * Helper hook to check if user has premium access
 * DEV OVERRIDE — remove before production release
 */
export function useIsPremium(): boolean {
  const storePremium = useSettingsStore((state) => state.subscription.tier !== 'free');
  const email = useAuthStore((s) => s.user?.email?.toLowerCase());
  // DEV OVERRIDE — remove before production release
  if (email && VIP_EMAILS.includes(email)) return true;
  return storePremium;
}

/**
 * Helper hook to get subscription tier
 * DEV OVERRIDE — remove before production release
 */
export function useSubscriptionTier(): SubscriptionTier {
  const storeTier = useSettingsStore((state) => state.subscription.tier);
  const email = useAuthStore((s) => s.user?.email?.toLowerCase());
  // DEV OVERRIDE — remove before production release
  if (email && VIP_EMAILS.includes(email)) return 'premium';
  return storeTier;
}

/**
 * Helper hook to check if subscription is loading
 */
export function useSubscriptionLoading(): boolean {
  return useSettingsStore((state) => state.subscriptionLoading);
}
