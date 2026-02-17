// SPENDTRAK CINEMATIC EDITION - Dashboard Screen with Transactions
// Fade through black transitions
import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { HapticPressable, SelectionPressable } from '../../src/components/ui/HapticPressable';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { easeOutCubic } from '../../src/config/easingFunctions';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { SpacerXXL } from '../../src/components/ui/Spacer';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { IconButton } from '../../src/components/ui/Button';
import { SearchInput } from '../../src/components/ui/Input';
import { FeatureDrawer, TransactionItem } from '../../src/components/premium';
import { MenuIcon, FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon, HealthIcon, TransactionsIcon, FilterIcon } from '../../src/components/icons';
import { TransactionCalendar, WeeklyTransactionList, MonthlyTransactionSummary, TransactionFilter } from '../../src/components/transactions';
import type { FilterState, TransactionStats } from '../../src/components/transactions';
import { ErrorState } from '../../src/components/common/ErrorState';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
// Stores
import { useTransactionStore, useBehaviorStore, useHasActiveIntervention, useHasWinCelebration } from '../../src/stores';
import { shallow } from 'zustand/shallow';
import { useAuthStore } from '../../src/stores/authStore';
// QUANTUM context for triggering the living character
import { useQuantumActions } from '../../src/context/QuantumContext';
import { AnimatedQuantumMascot } from '../../src/components/quantum/AnimatedQuantumMascot';
import { QuantumStatusBar } from '../../src/components/quantum/QuantumStatusBar';
import { BehavioralMicroCard, WinCelebration, BehavioralOnboarding, checkBehavioralOnboardingComplete } from '../../src/components/behavior';
import { ReEngagementModal } from '../../src/components/onboarding/ReEngagementModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategoryById } from '../../src/config/categories';
import { useDebounce } from '../../src/hooks/useDebounce';
// Contextual Upgrade Engine
import { ContextualUpgradeCard, ContextualUpgradeModal, TrialProgressCard } from '../../src/components/upgrade';
import { useUpgradePromptStore, useActiveUpgradePrompt, useUpgradePromptVisible } from '../../src/stores';
import { useTierStore } from '../../src/stores/tierStore';
import { getTimeGreeting } from '../../src/config/quantumAliveMessages';

// View mode type - Removed 'daily' and 'summary' (Calendar now shows daily transactions)
type ViewMode = 'calendar' | 'weekly' | 'monthly';

// Animated Menu Button with smooth rotation and scale
const AnimatedMenuButton: React.FC<{
  isOpen: boolean;
  onPress: () => void;
}> = memo(({ isOpen, onPress }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      // Rotate to X-like position and add glow
      rotation.value = withSpring(90, {
        damping: 12,
        stiffness: 180,
        mass: 0.8,
      });
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      // Rotate back to hamburger
      rotation.value = withSpring(0, {
        damping: 14,
        stiffness: 200,
        mass: 0.6,
      });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, {
      damping: 10,
      stiffness: 400,
    });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <HapticPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.menuButtonContainer}
      accessibilityLabel="Open menu"
      accessibilityHint="Opens the feature drawer menu"
      accessibilityRole="button"
      hapticIntensity="light"
    >
      {/* Glow effect behind the icon */}
      <Animated.View style={[styles.menuButtonGlow, glowStyle]} />
      <Animated.View style={animatedStyle}>
        <View style={styles.menuButtonInner}>
          <MenuIcon size={24} color={Colors.neon} />
        </View>
      </Animated.View>
    </HapticPressable>
  );
});

// Helper to get category icon component
const getCategoryIcon = (categoryId: string | null) => {
  if (!categoryId) return <TransactionsIcon size={20} color={Colors.text.secondary} />;

  const category = getCategoryById(categoryId);
  if (!category) return <TransactionsIcon size={20} color={Colors.text.secondary} />;

  // Map category to icon
  const iconMap: Record<string, React.ReactNode> = {
    food_groceries: <FoodIcon size={20} color={Colors.neon} />,
    food_dining: <FoodIcon size={20} color={Colors.neon} />,
    coffee_drinks: <FoodIcon size={20} color={Colors.neon} />,
    transport_fuel: <TransportIcon size={20} color={Colors.primary} />,
    transport_public: <TransportIcon size={20} color={Colors.primary} />,
    transport_taxi: <TransportIcon size={20} color={Colors.primary} />,
    shopping_clothing: <ShoppingIcon size={20} color={Colors.deep} />,
    shopping_electronics: <ShoppingIcon size={20} color={Colors.deep} />,
    shopping_general: <ShoppingIcon size={20} color={Colors.deep} />,
    entertainment_streaming: <EntertainmentIcon size={20} color={Colors.bright} />,
    entertainment_events: <EntertainmentIcon size={20} color={Colors.bright} />,
    entertainment_gaming: <EntertainmentIcon size={20} color={Colors.bright} />,
    health_medical: <HealthIcon size={20} color={Colors.neon} />,
    health_fitness: <HealthIcon size={20} color={Colors.neon} />,
    health_pharmacy: <HealthIcon size={20} color={Colors.neon} />,
  };

  return iconMap[categoryId] || <TransactionsIcon size={20} color={Colors.text.secondary} />;
};

// View Mode Tabs Component - 3 tabs: Calendar / Weekly / Monthly (memoized)
const ViewModeTabs: React.FC<{
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}> = memo(({ activeMode, onModeChange }) => {
  const { t } = useTranslation();
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'calendar', label: t('transactions.calendar') },
    { key: 'weekly', label: t('transactions.weekly') },
    { key: 'monthly', label: t('transactions.monthly') },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBar}
      contentContainerStyle={styles.tabBarContent}
      nestedScrollEnabled
    >
      {modes.map((mode) => (
        <SelectionPressable
          key={mode.key}
          onPress={() => onModeChange(mode.key)}
          style={[styles.tab, activeMode === mode.key && styles.tabActive]}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel={`${mode.label} view`}
          accessibilityState={{ selected: activeMode === mode.key }}
        >
          <GradientText
            variant={activeMode === mode.key ? 'bright' : 'muted'}
            style={[styles.tabText, activeMode === mode.key ? styles.tabTextActive : {}]}
          >
            {mode.label}
          </GradientText>
        </SelectionPressable>
      ))}
    </ScrollView>
  );
});

// Luxury fade-in duration (matches intro video fade-out for seamless transition)
const SCREEN_FADE_IN_DURATION = 1200;

function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showBehavioralOnboarding, setShowBehavioralOnboarding] = useState(false);
  const [showReEngagement, setShowReEngagement] = useState(false);
  const { t, languageCode } = useTranslation();
  const { triggerBlackout } = useTransition();

  // User profile for display name
  const user = useAuthStore((state) => state.user);

  // Time-aware greeting (computed once on mount)
  const timeGreeting = useMemo(() => getTimeGreeting(), []);

  // Re-engagement modal: show if user hasn't opened app in 3+ days
  useEffect(() => {
    (async () => {
      try {
        const lastOpen = await AsyncStorage.getItem('spendtrak_last_open');
        const now = Date.now();
        await AsyncStorage.setItem('spendtrak_last_open', String(now));
        if (lastOpen) {
          const daysSince = (now - Number(lastOpen)) / (1000 * 60 * 60 * 24);
          if (daysSince >= 3) {
            setShowReEngagement(true);
          }
        }
      } catch {}
    })();
  }, []);

  // Luxury fade-in animation after intro video
  const screenOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in the screen smoothly
    screenOpacity.value = withTiming(1, {
      duration: SCREEN_FADE_IN_DURATION,
      easing: easeOutCubic,
    });

    // Cleanup: cancel animation on unmount
    return () => {
      cancelAnimation(screenOpacity);
    };
  }, []);

  const screenFadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  // Currency conversion and formatting
  const { convert, format: formatCurrency } = useCurrency();

  // Transaction Store - Use selectors with shallow comparison for performance
  const transactions = useTransactionStore((state) => state.transactions, shallow);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const transactionError = useTransactionStore((state) => state.error);
  const { fetchTransactions, fetchMonthlySummary, clearError } = useTransactionStore(
    (state) => ({
      fetchTransactions: state.fetchTransactions,
      fetchMonthlySummary: state.fetchMonthlySummary,
      clearError: state.clearError,
    }),
    shallow
  );

  // Behavioral Intelligence Layer - Use selectors
  const hasActiveIntervention = useHasActiveIntervention();
  const hasWinCelebration = useHasWinCelebration();
  const activeIntervention = useBehaviorStore((state) => state.activeIntervention);
  const pendingWin = useBehaviorStore((state) => state.pendingWin);
  const { dismissIntervention, dismissWin, fetchProfile, checkForWins, evaluateBehaviors } = useBehaviorStore(
    (state) => ({
      dismissIntervention: state.dismissIntervention,
      dismissWin: state.dismissWin,
      fetchProfile: state.fetchProfile,
      checkForWins: state.checkForWins,
      evaluateBehaviors: state.evaluateBehaviors,
    }),
    shallow
  );

  // QUANTUM actions (the living character is now a full-screen overlay)
  const quantumActions = useQuantumActions();

  // Contextual Upgrade Engine
  const activePrompt = useActiveUpgradePrompt();
  const promptVisible = useUpgradePromptVisible();
  const isTrialing = useTierStore((s) => s.isTrialing);
  const trialExpiresAt = useTierStore((s) => s.expiresAt);
  const { startSession, checkMissedTransactions, checkTrialExpiry, dismissPrompt, tapPrompt, syncAnalytics } = useUpgradePromptStore(
    (state) => ({
      startSession: state.startSession,
      checkMissedTransactions: state.checkMissedTransactions,
      checkTrialExpiry: state.checkTrialExpiry,
      dismissPrompt: state.dismissPrompt,
      tapPrompt: state.tapPrompt,
      syncAnalytics: state.syncAnalytics,
    }),
    shallow
  );

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      const loadData = async () => {
        await fetchTransactions();
        await fetchMonthlySummary();

        if (isCancelled) return;

        // Defer non-critical operations to avoid blocking UI
        setTimeout(() => {
          if (isCancelled) return;
          fetchProfile();

          // Only run behavior evaluation occasionally, not on every focus
          const { transactions } = useTransactionStore.getState();
          if (transactions.length >= 10) {
            // Defer to next frame to avoid blocking
            requestAnimationFrame(() => {
              if (!isCancelled) {
                evaluateBehaviors(transactions);
                checkForWins(transactions);
              }
            });

            // Show behavioral onboarding once when engine first activates
            checkBehavioralOnboardingComplete().then((complete) => {
              if (!complete && !isCancelled) {
                setShowBehavioralOnboarding(true);
              }
            });
          }

          // Contextual Upgrade Engine checks (fire-and-forget)
          startSession();
          const lastTx = transactions[0];
          if (lastTx) {
            checkMissedTransactions(lastTx.transaction_date);
          }
          checkTrialExpiry();
          syncAnalytics();
        }, 100);
      };

      loadData();

      return () => {
        isCancelled = true;
      };
    }, [fetchTransactions, fetchMonthlySummary, fetchProfile, evaluateBehaviors, checkForWins])
  );

  // Make QUANTUM react to behavioral interventions (through context)
  useEffect(() => {
    if (hasActiveIntervention) {
      // QUANTUM flies to center and shows alert!
      quantumActions.setEmotion('alert');
    }
  }, [hasActiveIntervention, quantumActions]);

  // Fade through black navigation - app identity
  const navigateWithBlackout = useCallback((route: string) => {
    triggerBlackout(() => {
      router.push(route as any);
    });
  }, [triggerBlackout, router]);

  // Memoized handlers for UI interactions
  const handleOpenDrawer = useCallback(() => {
    setDrawerVisible(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
  }, []);

  const handleOpenFilter = useCallback(() => {
    setFilterVisible(true);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setFilterVisible(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleOpenAIConsultant = useCallback(() => {
    navigateWithBlackout('/(modals)/ai-consultant');
  }, [navigateWithBlackout]);

  const handleDismissIntervention = useCallback(() => {
    dismissIntervention('dismissed');
  }, [dismissIntervention]);

  // Handle behavioral intervention engagement
  const handleInterventionEngage = useCallback(() => {
    dismissIntervention('engaged');
    navigateWithBlackout('/(modals)/ai-consultant');
  }, [dismissIntervention, navigateWithBlackout]);

  // Retry handler for transaction errors
  const handleRetryTransactions = useCallback(async () => {
    clearError();
    await fetchTransactions();
    await fetchMonthlySummary();
  }, [clearError, fetchTransactions, fetchMonthlySummary]);

  // Transaction state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search for performance
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    type: 'all',
    source: 'all',
    categories: [],
    accounts: [],
  });

  // Transform store transactions for display - convert all amounts to user's display currency
  const displayTransactions = useMemo(() => {
    return transactions.map((tx) => {
      const txCurrency = tx.currency || 'AED';
      const rawAmount = Math.abs(Number(tx.amount));
      const convertedAmount = convert(rawAmount, txCurrency);
      // Determine if income based on transaction_type (payment, refund) or positive amount
      const isIncome = tx.transaction_type === 'payment' || tx.transaction_type === 'refund' || Number(tx.amount) > 0;
      const signedAmount = isIncome ? convertedAmount : -convertedAmount;

      return {
        id: tx.id,
        merchantName: tx.merchant_name || t('common.unknown'),
        category: tx.category?.name || t('categories.uncategorized'),
        amount: signedAmount,
        date: new Date(tx.transaction_date).toLocaleDateString(languageCode, { month: 'short', day: 'numeric' }),
        transaction_date: tx.transaction_date,
        source: tx.source || 'manual',
        icon: getCategoryIcon(tx.category_id),
      };
    });
  }, [transactions, convert, languageCode]);

  // Calculate transaction stats for the filter modal
  const transactionStats: TransactionStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let receiptCount = 0;
    let manualCount = 0;

    displayTransactions.forEach((tx) => {
      if (tx.amount > 0) {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        totalExpenses += Math.abs(tx.amount);
        expenseCount++;
      }
      if (tx.source === 'receipt') receiptCount++;
      else manualCount++;
    });

    return {
      totalIncome,
      totalExpenses,
      total: totalIncome - totalExpenses,
      incomeCount,
      expenseCount,
      receiptCount,
      manualCount,
    };
  }, [displayTransactions]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      activeFilters.type !== 'all' ||
      activeFilters.source !== 'all' ||
      activeFilters.categories.length > 0 ||
      activeFilters.accounts.length > 0
    );
  }, [activeFilters]);

  const filteredTransactions = useMemo(() => {
    return displayTransactions.filter((tx) => {
      // Search filter - use debounced query for performance
      const searchLower = debouncedSearchQuery.toLowerCase();
      const matchesSearch = !searchLower ||
                            tx.merchantName.toLowerCase().includes(searchLower) ||
                            tx.category.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      // Type filter
      if (activeFilters.type === 'income' && tx.amount <= 0) return false;
      if (activeFilters.type === 'expense' && tx.amount > 0) return false;

      // Source filter
      if (activeFilters.source !== 'all' && tx.source !== activeFilters.source) return false;

      // Category filter (only for expenses)
      if (activeFilters.categories.length > 0 && tx.amount < 0) {
        if (!activeFilters.categories.includes(tx.category)) return false;
      }

      return true;
    });
  }, [displayTransactions, debouncedSearchQuery, activeFilters]);

  const handleApplyFilters = useCallback((filters: FilterState) => {
    setActiveFilters(filters);
  }, []);

  // Transform for calendar component
  const calendarTransactions = useMemo(() => {
    return filteredTransactions.map(tx => ({
      id: tx.id,
      amount: tx.amount,
      transaction_date: tx.transaction_date,
      transaction_type: tx.amount > 0 ? 'payment' as const : 'purchase' as const,
    }));
  }, [filteredTransactions]);

  // Get transactions for selected date (for calendar day view)
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return filteredTransactions.filter(tx => tx.transaction_date === selectedDate);
  }, [filteredTransactions, selectedDate]);

  const handleTransactionPress = useCallback((id: string) => {
    navigateWithBlackout(`/transaction/${id}`);
  }, [navigateWithBlackout]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  // Format selected date for display
  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(languageCode, { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Render content based on view mode
  const renderTransactionContent = () => {
    // Error state
    if (transactionError && transactions.length === 0) {
      return (
        <ErrorState
          message={transactionError}
          onRetry={handleRetryTransactions}
          icon="wallet-outline"
          title={t('transactions.loadError') || 'Failed to load transactions'}
        />
      );
    }

    if (isLoading && transactions.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.neon} />
          <GradientText variant="muted" style={styles.loadingText}>
            {t('transactions.loadingTransactions')}
          </GradientText>
        </View>
      );
    }

    // Always show calendar even with no transactions
    switch (viewMode) {
      case 'calendar':
        return (
          <View>
            <TransactionCalendar
              transactions={calendarTransactions}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />

            {/* Selected Day Transactions */}
            {selectedDate && (
              <View style={styles.selectedDaySection}>
                <GradientText variant="bright" style={styles.selectedDayTitle}>
                  {formatSelectedDate(selectedDate)}
                </GradientText>

                {selectedDayTransactions.length === 0 ? (
                  <View style={styles.emptyDayContainer}>
                    <GradientText variant="muted" style={styles.emptyDayText}>
                      {t('transactions.noTransactionsOnDay')}
                    </GradientText>
                  </View>
                ) : (
                  <View style={styles.selectedDayTransactions}>
                    {selectedDayTransactions.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        merchantName={tx.merchantName}
                        category={tx.category}
                        amount={tx.amount}
                        date={tx.date}
                        icon={tx.icon}
                        onPress={() => handleTransactionPress(tx.id)}
                        style={styles.transactionItem}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Prompt to select a day if none selected */}
            {!selectedDate && (
              <View style={styles.tapDayPrompt}>
                <GradientText variant="muted" style={styles.tapDayText}>
                  {t('transactions.tapDayToSee')}
                </GradientText>
              </View>
            )}
          </View>
        );

      case 'weekly':
        if (filteredTransactions.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <GradientText variant="muted" style={styles.emptyText}>
                {t('transactions.noTransactionsWeek')}
              </GradientText>
              <GradientText variant="muted" style={styles.emptySubtext}>
                {t('transactions.addFirstTransaction')}
              </GradientText>
            </View>
          );
        }
        return (
          <WeeklyTransactionList
            transactions={filteredTransactions}
            onTransactionPress={handleTransactionPress}
          />
        );

      case 'monthly':
        if (filteredTransactions.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <GradientText variant="muted" style={styles.emptyText}>
                {t('transactions.noTransactionsMonth')}
              </GradientText>
              <GradientText variant="muted" style={styles.emptySubtext}>
                {t('transactions.addFirstTransaction')}
              </GradientText>
            </View>
          );
        }
        return (
          <MonthlyTransactionSummary
            transactions={filteredTransactions}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.container, screenFadeStyle]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AnimatedMenuButton
              isOpen={drawerVisible}
              onPress={handleOpenDrawer}
            />
          </View>
          <View style={styles.headerCenter}>
            <GradientText variant="muted" style={styles.greeting}>{timeGreeting}</GradientText>
            <GradientTitle>{user?.display_name || t('common.user')}</GradientTitle>
          </View>
          {/* QUANTUM AI Consultant - Living mascot with sparkles */}
          <View style={styles.headerRight}>
            <AnimatedQuantumMascot
              size={56}
              onPress={handleOpenAIConsultant}
            />
          </View>
        </View>

        {/* Gamification Status Bar - streak, level, points */}
        <QuantumStatusBar />

        {/* Behavioral Intervention Card */}
        {hasActiveIntervention && activeIntervention && (
          <BehavioralMicroCard
            message={activeIntervention.messageContent || ''}
            behaviorType={activeIntervention.behavior || 'small_recurring'}
            onDismiss={handleDismissIntervention}
            onEngage={handleInterventionEngage}
          />
        )}

        {/* Win Celebration Overlay */}
        {hasWinCelebration && pendingWin && (
          <WinCelebration
            win={pendingWin}
            onDismiss={dismissWin}
          />
        )}

        {/* Re-engagement Modal - welcome back after 3+ days away */}
        <ReEngagementModal
          visible={showReEngagement}
          onDismiss={() => setShowReEngagement(false)}
        />

        {/* Trial Progress Card - shown for trial users */}
        {isTrialing && (
          <TrialProgressCard
            daysRemaining={trialExpiresAt ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 3}
          />
        )}

        {/* Contextual Upgrade Card - inline prompt */}
        {promptVisible && activePrompt && activePrompt.variant === 'card' && (
          <ContextualUpgradeCard
            prompt={activePrompt}
            onDismiss={dismissPrompt}
            onTap={tapPrompt}
          />
        )}

        {/* Transactions Section Title */}
        <GradientText variant="bright" style={styles.sectionTitle}>{t('transactions.title').toUpperCase()}</GradientText>

        {/* Transaction Summary Card - TOTAL at top, INCOME/EXPENSES below */}
        <GlassCard variant="elevated" style={styles.summaryCard} accessibilityLabel={t('transactions.transactionSummary')}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <GradientText variant="bronze" style={styles.balanceLabel}>
                {t('transactions.total')}
              </GradientText>
              <GradientText
                variant="bronze"
                style={styles.balanceAmount}
              >
                {formatCurrency(transactionStats.total)}
              </GradientText>
            </View>
          </View>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.incomeItem}>
              <GradientText variant="income" style={styles.statLabel}>
                {t('dashboard.income')}
              </GradientText>
              <GradientText variant="income" style={styles.statAmount}>
                {formatCurrency(transactionStats.totalIncome)}
              </GradientText>
            </View>
            <View style={styles.divider} />
            <View style={styles.expenseItem}>
              <GradientText variant="expense" style={styles.statLabel}>
                {t('dashboard.expenses')}
              </GradientText>
              <GradientText variant="expense" style={styles.statAmount}>
                {formatCurrency(transactionStats.totalExpenses)}
              </GradientText>
            </View>
          </View>
        </GlassCard>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          {/* Search Row with Filter Icon */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <SearchInput
                placeholder={t('transactions.searchTransactions')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={handleClearSearch}
              />
            </View>
            <View style={styles.filterButtonContainer}>
              <IconButton
                icon={<FilterIcon size={22} color={hasActiveFilters ? Colors.neon : Colors.text.secondary} />}
                onPress={handleOpenFilter}
                variant={hasActiveFilters ? 'secondary' : 'ghost'}
                style={hasActiveFilters ? styles.filterButtonActive : undefined}
                accessibilityLabel={hasActiveFilters ? "Filters active, tap to modify" : "Filter transactions"}
                accessibilityHint="Opens transaction filter options"
              />
              {hasActiveFilters && <View style={styles.filterIndicator} />}
            </View>
          </View>

          {/* View Mode Tabs */}
          <ViewModeTabs activeMode={viewMode} onModeChange={setViewMode} />

          {/* Transaction Content */}
          <View style={styles.transactionContent}>
            {renderTransactionContent()}
          </View>
        </View>

        {/* Bottom spacing */}
        <SpacerXXL />
      </ScrollView>

      {/* Feature Drawer */}
      <FeatureDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
      />

      {/* Filter Modal */}
      <TransactionFilter
        visible={filterVisible}
        onClose={handleCloseFilter}
        onApply={handleApplyFilters}
        stats={transactionStats}
        initialFilters={activeFilters}
      />

      {/* Contextual Upgrade Modal - full modal for high-confidence moments */}
      {activePrompt && activePrompt.variant === 'modal' && (
        <ContextualUpgradeModal
          visible={promptVisible}
          prompt={activePrompt}
          onDismiss={dismissPrompt}
          onTap={tapPrompt}
        />
      )}

      {/* Behavioral Onboarding - shown once when engine first activates */}
      {showBehavioralOnboarding && (
        <BehavioralOnboarding
          onComplete={() => setShowBehavioralOnboarding(false)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Allow AnimatedBackground to show through
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    width: 52,
  },
  menuButtonContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.transparent.dark20,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  menuButtonGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.transparent.neon20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  headerRight: {
    width: 52,
  },
  // Section Title
  sectionTitle: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    letterSpacing: 3,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    textAlign: 'left',
  },
  // Transactions Section
  transactionsSection: {
    marginTop: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
  },
  filterButtonContainer: {
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: Colors.neon,
    borderWidth: 1,
  },
  filterIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neon,
  },
  // Tab Bar Styles
  tabBar: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    flexGrow: 1,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.neon,
  },
  tabText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  tabTextActive: {
    fontFamily: FontFamily.semiBold,
  },
  // Transaction Content
  transactionContent: {
    marginTop: Spacing.md,
  },
  transactionItem: {
    marginBottom: Spacing.sm,
  },
  // Loading and Empty States
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.body,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
  emptySubtext: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  // Selected Day Section (Calendar view)
  selectedDaySection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  selectedDayTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  selectedDayTransactions: {
    gap: Spacing.sm,
  },
  emptyDayContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  tapDayPrompt: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  tapDayText: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  // Summary Card Styles
  summaryCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  balanceRow: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  incomeItem: {
    flex: 1,
    alignItems: 'center',
  },
  expenseItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border.subtle,
  },
  statLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  statAmount: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.semiBold,
  },
});

// Export with memo for performance optimization
export default memo(DashboardScreen);
