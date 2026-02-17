/**
 * Authentication Store
 * Manages user session and profile
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import * as authService from '@/services/auth';
import { setMonitoringUser, clearMonitoringUser } from '@/services/errorMonitoring';
import { supabase } from '@/services/supabase';
import type { User, EmailConnection } from '@/types';

// Track if auth listener is already set up
let authListenerUnsubscribe: (() => void) | null = null;

// Track if sign-out is in progress to prevent double calls
let isSigningOut = false;

/**
 * Clean up existing auth listener to prevent duplicates
 */
function cleanupAuthListener(): void {
  if (authListenerUnsubscribe) {
    if (__DEV__) console.log('[AuthStore] Cleaning up existing auth listener');
    authListenerUnsubscribe();
    authListenerUnsubscribe = null;
  }
}

interface SignInResult {
  success: boolean;
  user: User | null;
  error?: string;
}

interface AuthState {
  // State
  user: User | null;
  emailConnections: EmailConnection[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<SignInResult>;
  devSignIn: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshEmailConnections: () => Promise<void>;
  connectGoogleEmail: () => Promise<void>;
  connectMicrosoftEmail: () => Promise<void>;
  removeEmailConnection: (connectionId: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      emailConnections: [],
      isLoading: false,
      isInitialized: false,
      error: null,

      // Initialize auth state
      initialize: async () => {
        if (__DEV__) console.log('[AuthStore] initialize() called');

        // Check if we have a dev user persisted - don't overwrite with Supabase
        const currentUser = get().user;
        if (currentUser?.id?.startsWith('dev-user-')) {
          if (__DEV__) console.log('[AuthStore] Dev user detected, skipping Supabase init');
          set({ isInitialized: true, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });

        // Clean up any existing listener before setting up a new one
        // This prevents duplicate listeners on sign-out → sign-in cycles
        cleanupAuthListener();

        // Set up auth state listener (but DON'T call getCurrentUser in it - causes hangs)
        {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (__DEV__) console.log(`[AuthStore] onAuthStateChange: ${event}`);

              // Don't update store for dev users
              const storeUser = get().user;
              if (storeUser?.id?.startsWith('dev-user-')) {
                return;
              }

              if (event === 'SIGNED_OUT') {
                clearMonitoringUser();
                set({ user: null, emailConnections: [], error: null });
              }
              // For SIGNED_IN - we handle user loading in the sign-in functions
              // NOT here, because calling getCurrentUser here can cause hangs
            }
          );
          authListenerUnsubscribe = () => subscription.unsubscribe();
        }

        // Use timeout to prevent hanging forever
        const TIMEOUT_MS = 5000;
        const TIMED_OUT = Symbol('TIMED_OUT');

        try {
          if (__DEV__) console.log('[AuthStore] Fetching current user with timeout...');

          const userPromise = authService.getCurrentUser();
          const timeoutPromise = new Promise<typeof TIMED_OUT>((resolve) => {
            setTimeout(() => {
              if (__DEV__) console.log('[AuthStore] getCurrentUser timed out');
              resolve(TIMED_OUT);
            }, TIMEOUT_MS);
          });

          const result = await Promise.race([userPromise, timeoutPromise]);

          if (result === TIMED_OUT) {
            // Timeout: keep the hydrated user from zustand persistence instead of overwriting with null.
            // The persisted session in SecureStore is still valid — we just couldn't verify it in time.
            const hydratedUser = get().user;
            if (__DEV__) console.log('[AuthStore] getCurrentUser timed out, keeping hydrated user:', hydratedUser?.id || 'null');
            if (hydratedUser) {
              setMonitoringUser({ id: hydratedUser.id, email: hydratedUser.email });
            }
            set({ isInitialized: true, isLoading: false });
          } else {
            // Got a definitive result (user or null)
            const user = result;
            if (__DEV__) console.log('[AuthStore] getCurrentUser result:', user ? user.id : 'null');

            if (user) {
              setMonitoringUser({ id: user.id, email: user.email });
              // Fetch email connections in background (non-blocking)
              authService.getEmailConnections()
                .then((connections) => set({ emailConnections: connections }))
                .catch((e) => {
                  if (__DEV__) console.log('[AuthStore] Failed to get email connections:', e);
                });
            }

            set({
              user,
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (error) {
          logger.auth.error('AuthStore initialize error:', error);
          // ALWAYS set isInitialized to true, even on error.
          // Keep hydrated user on error — don't clear session due to transient failures.
          set({
            error: (error as Error).message,
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      // Sign in with email and password
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const result = await authService.signInWithEmail(email, password);

          if (result.success && result.user) {
            setMonitoringUser({ id: result.user.id, email: result.user.email });

            // Set user immediately — don't block on email connections
            set({
              user: result.user,
              isLoading: false,
            });

            // Fetch email connections in the background (non-blocking)
            authService.getEmailConnections()
              .then((connections) => set({ emailConnections: connections }))
              .catch((e) => {
                if (__DEV__) console.log('[AuthStore] Background email connections fetch failed:', e);
              });

            return { success: true, user: result.user };
          }

          set({ isLoading: false, error: result.error || null });
          return { success: false, user: null, error: result.error };
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Dev sign in (bypasses OAuth for development)
      // SECURITY: This function returns null in production as authService.devSignIn is undefined
      devSignIn: async () => {
        try {
          // SECURITY: devSignIn is undefined in production builds
          if (!authService.devSignIn) {
            set({ isLoading: false, error: 'Dev sign-in is not available' });
            return { success: false, user: null, error: 'Dev sign-in is not available' };
          }

          set({ isLoading: true, error: null });

          const result = await authService.devSignIn();

          if (result.success && result.user) {
            setMonitoringUser({ id: result.user.id, email: result.user.email });
            // Don't fetch email connections for dev user (no real Supabase session)
            set({
              user: result.user,
              emailConnections: [],
              isLoading: false,
              isInitialized: true,
            });
            return { success: true, user: result.user };
          }

          set({ isLoading: false, error: result.error || null });
          return { success: false, user: null, error: result.error };
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Sign out - clears ALL stores for complete logout
      signOut: async () => {
        // Prevent double sign-out
        if (isSigningOut) {
          logger.auth.info('Sign out already in progress');
          return;
        }

        isSigningOut = true;

        try {
          set({ isLoading: true });

          // CRITICAL: Clean up auth listener FIRST to prevent duplicate handlers
          // on sign-out → sign-in cycles
          cleanupAuthListener();

          // Clear monitoring user first
          clearMonitoringUser();

          // Clear auth state immediately to prevent any authenticated calls
          set({
            user: null,
            emailConnections: [],
            isLoading: false,
            error: null,
          });

          // Sign out from Supabase (clears tokens from SecureStore)
          await authService.signOut();

          // Clear all other stores
          await clearAllStores();

          logger.auth.info('Sign out completed successfully');
        } catch (error) {
          logger.auth.error('Sign out error:', error);
          // Still clear auth state even if Supabase sign out fails
          set({
            user: null,
            emailConnections: [],
            error: (error as Error).message,
            isLoading: false,
          });
        } finally {
          isSigningOut = false;
        }
      },

      // Update profile
      updateProfile: async (updates) => {
        try {
          set({ isLoading: true, error: null });

          const currentUser = get().user;

          // For dev mode users, update locally (no backend)
          if (currentUser?.id?.startsWith('dev-user-')) {
            const updatedUser = {
              ...currentUser,
              ...updates,
              updated_at: new Date().toISOString(),
            };
            set({ user: updatedUser, isLoading: false });
            logger.auth.info('Dev user profile updated locally');
            return;
          }

          // For real users, update via Supabase
          const user = await authService.updateUserProfile(updates);
          set({ user, isLoading: false });
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Complete onboarding
      completeOnboarding: async () => {
        try {
          await authService.completeOnboarding();
          const { user } = get();
          if (user) {
            set({ user: { ...user, onboarding_completed: true } });
          }
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      // Refresh email connections
      refreshEmailConnections: async () => {
        try {
          const connections = await authService.getEmailConnections();
          set({ emailConnections: connections });
        } catch (error) {
          // Silent fail for refresh
        }
      },

      // Connect Google email
      connectGoogleEmail: async () => {
        try {
          set({ isLoading: true, error: null });
          await authService.connectGoogleEmail();
          const connections = await authService.getEmailConnections();
          set({ emailConnections: connections, isLoading: false });
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Connect Microsoft email
      connectMicrosoftEmail: async () => {
        try {
          set({ isLoading: true, error: null });
          await authService.connectMicrosoftEmail();
          const connections = await authService.getEmailConnections();
          set({ emailConnections: connections, isLoading: false });
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Remove email connection
      removeEmailConnection: async (connectionId) => {
        try {
          await authService.removeEmailConnection(connectionId);
          const { emailConnections } = get();
          set({
            emailConnections: emailConnections.filter((c) => c.id !== connectionId),
          });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          logger.auth.error('Store rehydration error:', error);
        }
      },
    }
  )
);

// Helper to wait for store hydration
export const waitForAuthHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });

    // Fallback timeout in case hydration never completes
    setTimeout(() => {
      unsubscribe();
      resolve();
    }, 2000);
  });
};

// Helper to get current user (for debugging)
export const getCurrentAuthUser = () => {
  return useAuthStore.getState().user;
};

/**
 * Clear all stores on sign-out
 * CRITICAL: This ensures no data leaks between users
 */
export const clearAllStores = async (): Promise<void> => {
  logger.auth.info('Clearing all stores...');

  try {
    // Import stores dynamically to avoid circular dependencies
    const [
      { useTransactionStore },
      { useSubscriptionStore },
      { useAlertStore },
      { useAIStore },
      { useDashboardStore },
      { useCategoryStore },
      { useInvestmentStore },
      { useGamificationStore },
      { useBehaviorStore },
      { useHouseholdStore },
      { useBillStore },
      { useDebtStore },
      { useIncomeStore },
      { useNetWorthStore },
      { useZeroBasedStore },
      { useReceiptStore },
      { useTierStore },
      { usePurchasesStore },
    ] = await Promise.all([
      import('./transactionStore'),
      import('./subscriptionStore'),
      import('./alertStore'),
      import('./aiStore'),
      import('./dashboardStore'),
      import('./categoryStore'),
      import('./investmentStore'),
      import('./gamificationStore'),
      import('./behaviorStore'),
      import('./householdStore'),
      import('./billStore'),
      import('./debtStore'),
      import('./incomeStore'),
      import('./netWorthStore'),
      import('./zeroBasedStore'),
      import('./receiptStore'),
      import('./tierStore'),
      import('./purchasesStore'),
    ]);

    // Clear transaction store
    useTransactionStore.setState({
      transactions: [],
      currentTransaction: null,
      summary: { totalIncome: 0, totalExpenses: 0, balance: 0, transactionCount: 0 },
      recentTransactions: [],
      categoryTotals: {},
      monthlyData: {},
      monthlySummary: null,
      spendingTrend: [],
      pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
      filters: {},
      isLoading: false,
      isLoadingMore: false,
      error: null,
    });

    // Clear subscription store
    useSubscriptionStore.setState({
      subscriptions: [],
      upcomingRenewals: [],
      isLoading: false,
      error: null,
    });

    // Clear alert store
    useAlertStore.setState({
      alerts: [],
      unreadCount: 0,
      criticalAlerts: [],
      isLoading: false,
      error: null,
    });

    // Clear AI store
    useAIStore.setState({
      conversations: [],
      currentConversation: null,
      healthScore: null,
      isLoading: false,
      error: null,
    });

    // Clear dashboard store
    useDashboardStore.setState({
      summary: null,
      subscriptionSummary: null,
      criticalAlerts: [],
      isLoading: false,
    });

    // Clear category store (only custom categories)
    const categoryState = useCategoryStore.getState();
    useCategoryStore.setState({
      ...categoryState,
      customCategories: [],
    });

    // Clear investment store
    useInvestmentStore.setState({
      holdings: [],
      cryptoHoldings: [],
      portfolioSummary: null,
      isLoading: false,
      error: null,
    });

    // Clear gamification store
    useGamificationStore.setState({
      userProfile: null,
      achievements: [],
      challenges: [],
      leaderboard: null,
      streak: null,
      points: null,
      isLoading: false,
      error: null,
    });

    // Clear behavior store
    useBehaviorStore.setState({
      profile: null,
      recentInterventions: [],
      activeIntervention: null,
      showWinCelebration: false,
      acknowledgmentMessage: null,
      showAcknowledgment: false,
      isLoading: false,
      error: null,
    });

    // Clear household store
    useHouseholdStore.setState({
      households: [],
      currentHousehold: null,
      members: [],
      invitations: [],
      isLoading: false,
      error: null,
    });

    // Clear bill store
    useBillStore.setState({
      bills: [],
      selectedBill: null,
      summary: null,
      isLoading: false,
      error: null,
    });

    // Clear debt store
    useDebtStore.setState({
      debts: [],
      selectedDebt: null,
      summary: null,
      isLoading: false,
      error: null,
    });

    // Clear income store
    useIncomeStore.setState({
      income: [],
      cashFlowSummary: null,
      prediction: null,
      isLoading: false,
      error: null,
    });

    // Clear net worth store
    useNetWorthStore.setState({
      assets: [],
      liabilities: [],
      history: [],
      summary: null,
      isLoading: false,
      error: null,
    });

    // Clear zero-based store
    useZeroBasedStore.setState({
      periods: [],
      currentPeriod: null,
      selectedPeriod: null,
      isLoading: false,
      error: null,
    });

    // Clear receipt store
    useReceiptStore.setState({
      queuedReceipts: [],
      recentlyProcessed: [],
      isProcessingQueue: false,
      isScanning: false,
      scanError: null,
    });

    // Clear tier store - reset to free (use setTier to respect VIP override)
    const tierState = useTierStore.getState();
    tierState.setTier('free');
    useTierStore.setState({
      subscriptionId: null,
      expiresAt: null,
      usage: {},
    });

    // Clear purchases store
    const purchasesState = usePurchasesStore.getState();
    if (purchasesState.logoutUser) {
      await purchasesState.logoutUser();
    }

    logger.auth.info('All stores cleared successfully');
  } catch (error) {
    logger.auth.error('Error clearing stores:', error);
    // Don't throw - sign out should still complete even if store clearing fails
  }
};
