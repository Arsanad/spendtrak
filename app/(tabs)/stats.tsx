// SPENDTRAK CINEMATIC EDITION - Analytics Screen
// Comprehensive financial intelligence dashboard with animations
import React, { useState, useCallback, useEffect, useMemo, memo, useRef } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  FadeIn,
  FadeInDown,
  SlideInRight,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize } from '../../src/design/cinematic';
import { easeOutCubic, easeInOutQuad } from '../../src/config/easingFunctions';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Chip } from '../../src/components/ui/Badge';
import {
  DonutChart,
  ChartLegend,
  HealthScoreGauge,
  AreaChart,
  HeatmapChart,
  MiniFactorIndicator,
} from '../../src/components/charts';
import { SectionHeader } from '../../src/components/dashboard';
import { ErrorState } from '../../src/components/common/ErrorState';
import { useTransition } from '../../src/context/TransitionContext';
import { ProgressRing } from '../../src/components/premium';
import {
  KPICard,
  MerchantLeaderboard,
  BurnRateGauge,
  SubscriptionBurn,
  GoalsProgress,
  // Weekly Analytics Components
  DailyBreakdownChart,
  WeekComparisonCard,
  WeekProjectionCard,
  // Yearly Analytics Components
  MonthByMonthChart,
  YearOverYearCard,
  AnnualSubscriptionsCard,
  DebtProgressCard,
  YearlyKPICard,
  GoalsAchievedCard,
  NetWorthYearlyCard,
} from '../../src/components/analytics';

// Services
import { calculateHealthScore, HealthScore } from '../../src/services/financialHealth';
import {
  getMonthlyKPIs,
  getCashFlowTrend,
  getCategorySpending,
  getSpendingHeatmap,
  getTopMerchants,
  getBurnRate,
  getBudgetPerformance,
  getSubscriptionAnalytics,
  getGoalsProgress,
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
  MonthlyKPIs,
  CashFlowData,
  HeatmapData,
  MerchantData,
  BurnRateData,
  BudgetPerformance,
  SubscriptionAnalytics,
  GoalProgress,
  // Weekly Types
  WeeklySummary,
  WeekComparison,
  WeekProjection,
  // Yearly Types
  YearlyTrend,
  YearOverYear,
  AnnualSubscriptionsSummary,
  DebtProgress,
  GoalsAchievedSummary,
  NetWorthYearly,
} from '../../src/services/analytics';
import type { CategorySpending } from '@/types';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { logger } from '../../src/utils/logger';
import { useUpgradePromptStore } from '../../src/stores';

type PeriodType = 'week' | 'month' | 'year';

// Animated Section wrapper for staggered entrance
interface AnimatedSectionProps {
  children: React.ReactNode;
  delay: number;
  isVisible: boolean;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = memo(({ children, delay, isVisible }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20); // Reduced from 30

  useEffect(() => {
    if (isVisible) {
      // Faster animation - 250ms instead of 500ms
      opacity.value = withDelay(delay, withTiming(1, { duration: 250, easing: easeOutCubic }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 25, stiffness: 150 })); // Stiffer spring
    }
  }, [isVisible, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      {children}
    </Animated.View>
  );
});

// Loading Skeleton with shimmer effect - faster animation using withRepeat
const LoadingSkeleton: React.FC = memo(() => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    // Use withRepeat instead of setInterval for better performance and proper cleanup
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1000, easing: easeInOutQuad }),
      -1,
      true
    );

    return () => {
      cancelAnimation(shimmer);
    };
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: Colors.deep,
          borderRadius: 8,
        },
        shimmerStyle,
        style,
      ]}
    />
  );

  return (
    <View style={styles.skeletonContainer}>
      {/* Health Score Skeleton */}
      <View style={styles.skeletonSection}>
        <SkeletonBox width={180} height={20} style={{ marginBottom: 16 }} />
        <View style={styles.skeletonCard}>
          <SkeletonBox width={160} height={160} style={{ borderRadius: 80, alignSelf: 'center' }} />
          <View style={[styles.factorsRow, { marginTop: 20 }]}>
            <SkeletonBox width={50} height={50} style={{ borderRadius: 25 }} />
            <SkeletonBox width={50} height={50} style={{ borderRadius: 25 }} />
            <SkeletonBox width={50} height={50} style={{ borderRadius: 25 }} />
            <SkeletonBox width={50} height={50} style={{ borderRadius: 25 }} />
          </View>
        </View>
      </View>

      {/* KPIs Skeleton */}
      <View style={styles.skeletonSection}>
        <SkeletonBox width={140} height={20} style={{ marginBottom: 16 }} />
        <View style={styles.kpiRow}>
          <SkeletonBox width="31%" height={90} />
          <SkeletonBox width="31%" height={90} />
          <SkeletonBox width="31%" height={90} />
        </View>
      </View>

      {/* Chart Skeleton */}
      <View style={styles.skeletonSection}>
        <SkeletonBox width={150} height={20} style={{ marginBottom: 16 }} />
        <SkeletonBox width="100%" height={200} />
      </View>
    </View>
  );
});

// Empty State Component
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = memo(({ icon, title, subtitle }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon} size={32} color={Colors.text.tertiary} />
    <Text style={styles.emptyStateTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>}
  </View>
));

// Animated Number Counter for KPIs
interface AnimatedNumberProps {
  value: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = memo(({
  value,
  style,
  prefix = '',
  suffix = '',
  duration = 1200,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;
    const startValue = displayValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (value - startValue) * easedProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </Text>
  );
});

function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { format: formatCurrency, currencyCode } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  // Calculate chart width to fill container (screen width - padding on both sides)
  const chartContainerWidth = screenWidth - (Spacing.lg * 2) - (Spacing.md * 2); // Account for content padding + card padding
  const [period, setPeriod] = useState<PeriodType>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states - Common (period-agnostic)
  const [kpis, setKpis] = useState<MonthlyKPIs | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [dataReady, setDataReady] = useState(false);

  // Data states - Monthly specific (includes health score, goals)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [goals, setGoals] = useState<GoalProgress[]>([]);

  // Data states - Weekly specific
  const [dailyBreakdown, setDailyBreakdown] = useState<WeeklySummary | null>(null);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(null);
  const [weekProjection, setWeekProjection] = useState<WeekProjection | null>(null);

  // Data states - Monthly specific
  const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [burnRate, setBurnRate] = useState<BurnRateData | null>(null);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformance[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionAnalytics | null>(null);
  const [budgetEfficiency, setBudgetEfficiency] = useState<number>(0);

  // Data states - Yearly specific
  const [yearlyTrend, setYearlyTrend] = useState<YearlyTrend | null>(null);
  const [yearOverYear, setYearOverYear] = useState<YearOverYear | null>(null);
  const [annualSubscriptions, setAnnualSubscriptions] = useState<AnnualSubscriptionsSummary | null>(null);
  const [debtProgress, setDebtProgress] = useState<DebtProgress | null>(null);
  const [goalsAchieved, setGoalsAchieved] = useState<GoalsAchievedSummary | null>(null);
  const [netWorthYearly, setNetWorthYearly] = useState<NetWorthYearly | null>(null);

  // Contextual Upgrade Engine - track analytics browsing time
  const statsEntryTime = useRef(Date.now());
  const healthViewCount = useRef(0);
  const upgradeStore = useUpgradePromptStore;

  useEffect(() => {
    return () => {
      // On unmount: if user spent >2min browsing analytics, evaluate FINANCIAL_QUESTION
      const elapsedMs = Date.now() - statsEntryTime.current;
      if (elapsedMs > 2 * 60 * 1000) {
        upgradeStore.getState().evaluateFriction('FINANCIAL_QUESTION');
      }
    };
  }, []);

  // Animation timing constants - reduced for faster appearance
  const STAGGER_DELAY = 50; // ms between each section (was 100)

  // Load all data with period filtering - ZERO DUPLICATION APPROACH
  const loadData = useCallback(async (selectedPeriod: PeriodType) => {
    try {
      setDataReady(false);
      setError(null);

      // Common data for all periods (KPIs, categories, merchants)
      const [kpiData, categoryData, merchantData] = await Promise.all([
        getMonthlyKPIs(selectedPeriod),
        getCategorySpending(selectedPeriod),
        getTopMerchants(selectedPeriod === 'week' ? 3 : selectedPeriod === 'year' ? 10 : 5, selectedPeriod),
      ]);

      setKpis(kpiData);
      setCategorySpending(categoryData);
      setMerchants(merchantData);

      // Period-specific data loading - EACH SECTION BELONGS TO ONE PERIOD ONLY
      if (selectedPeriod === 'week') {
        // WEEKLY ONLY: Daily breakdown, week comparison, week projection
        const [dailyData, comparisonData, projectionData] = await Promise.all([
          getDailyBreakdown(),
          getWeekComparison(),
          getWeekProjection(),
        ]);
        setDailyBreakdown(dailyData);
        setWeekComparison(comparisonData);
        setWeekProjection(projectionData);
      } else if (selectedPeriod === 'month') {
        // MONTHLY ONLY: Health score, goals, cash flow, heatmap, burn rate, budget, subscriptions
        const [healthData, goalsData, cashFlowData, heatmapData, burnRateData, budgetData, subData, efficiencyData] = await Promise.all([
          calculateHealthScore(),
          getGoalsProgress(),
          getCashFlowTrend(6),
          getSpendingHeatmap(selectedPeriod),
          getBurnRate(selectedPeriod),
          getBudgetPerformance(),
          getSubscriptionAnalytics(),
          getBudgetEfficiency(),
        ]);
        setHealthScore(healthData);
        // Track health score view for Contextual Upgrade Engine
        healthViewCount.current += 1;
        if (healthViewCount.current >= 3) {
          upgradeStore.getState().evaluateFriction('HEALTH_CURIOSITY');
        }
        setGoals(goalsData);
        setCashFlow(cashFlowData);
        setHeatmap(heatmapData);
        setBurnRate(burnRateData);
        setBudgetPerformance(budgetData);
        setSubscriptions(subData);
        setBudgetEfficiency(efficiencyData);
      } else if (selectedPeriod === 'year') {
        // YEARLY ONLY: Trend, YoY, subscriptions, debt progress, goals achieved, net worth
        const [yearlyTrendData, yoyData, annualSubData, debtProgressData, goalsAchievedData, netWorthData] = await Promise.all([
          getMonthByMonthTrend(),
          getYearOverYearComparison(),
          getAnnualSubscriptions(),
          getDebtProgressYear(),
          getGoalsAchievedYear(),
          getNetWorthYearly(),
        ]);
        setYearlyTrend(yearlyTrendData);
        setYearOverYear(yoyData);
        setAnnualSubscriptions(annualSubData);
        setDebtProgress(debtProgressData);
        setGoalsAchieved(goalsAchievedData);
        setNetWorthYearly(netWorthData);
      }

      // Trigger animations immediately after data is loaded
      setDataReady(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(errorMessage);
      logger.analytics.error('Error loading analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on focus - start loading immediately for faster content display
  useFocusEffect(
    useCallback(() => {
      // Load data immediately without waiting for InteractionManager
      // This makes content appear faster
      loadData(period);
    }, [loadData, period])
  );

  // Reload when period changes
  const handlePeriodChange = useCallback((newPeriod: PeriodType) => {
    if (newPeriod !== period) {
      setPeriod(newPeriod);
      setIsLoading(true);
      loadData(newPeriod);
    }
  }, [period, loadData]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDataReady(false); // Reset animations
    await loadData(period);
    setRefreshing(false);
  }, [loadData, period]);

  // Memoized navigation handlers
  const handleNavigateToBudgets = useCallback(() => {
    triggerBlackout(() => router.push('/settings/budgets'));
  }, [router, triggerBlackout]);

  const handleNavigateToSubscriptions = useCallback(() => {
    triggerBlackout(() => router.push('/(tabs)/subscriptions' as any));
  }, [router, triggerBlackout]);

  const handleNavigateToGoals = useCallback(() => {
    triggerBlackout(() => router.push('/settings/goals' as any));
  }, [router, triggerBlackout]);

  const handleNavigateToDebts = useCallback(() => {
    triggerBlackout(() => router.push('/settings/debts' as any));
  }, [router, triggerBlackout]);

  const handleNavigateToNetWorth = useCallback(() => {
    triggerBlackout(() => router.push('/settings/net-worth' as any));
  }, [router, triggerBlackout]);

  // Memoized period change handlers
  const handleWeekSelect = useCallback(() => handlePeriodChange('week'), [handlePeriodChange]);
  const handleMonthSelect = useCallback(() => handlePeriodChange('month'), [handlePeriodChange]);
  const handleYearSelect = useCallback(() => handlePeriodChange('year'), [handlePeriodChange]);

  // Calculate totals - memoized for performance
  const totalSpent = useMemo(() =>
    categorySpending.reduce((sum, cat) => sum + cat.amount, 0),
    [categorySpending]
  );

  // Prepare chart data - memoized for performance
  const donutSegments = useMemo(() =>
    categorySpending.slice(0, 5).map((cat, index) => ({
      value: cat.amount,
      color: cat.category_color || Colors.chart.palette[index % Colors.chart.palette.length],
      label: cat.category_name,
    })),
    [categorySpending]
  );

  const areaChartData = useMemo(() =>
    cashFlow.map(cf => ({
      label: cf.month,
      income: cf.income,
      expenses: cf.expenses,
    })),
    [cashFlow]
  );

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.neon}
          />
        }
      >
        {/* Header - fast fade in */}
        <Animated.View entering={FadeInDown.duration(300).delay(0)}>
          <GradientTitle style={styles.title}>{t('analytics.title')}</GradientTitle>
        </Animated.View>

        {/* Period Selector - appears quickly after header */}
        <Animated.View entering={FadeInDown.duration(250).delay(50)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelector}>
            <Chip selected={period === 'week'} onPress={handleWeekSelect} style={styles.periodChip}>{t('analytics.thisWeek')}</Chip>
            <Chip selected={period === 'month'} onPress={handleMonthSelect} style={styles.periodChip}>{t('analytics.thisMonth')}</Chip>
            <Chip selected={period === 'year'} onPress={handleYearSelect} style={styles.periodChip}>{t('analytics.thisYear')}</Chip>
          </ScrollView>
        </Animated.View>

        {/* Loading State */}
        {isLoading && (
          <LoadingSkeleton />
        )}

        {/* Error State */}
        {!isLoading && error && (
          <ErrorState
            message={error}
            onRetry={() => loadData(period)}
            icon="stats-chart-outline"
            title={t('analytics.loadError') || 'Failed to load analytics'}
          />
        )}

        {/* SECTION 1: Period Snapshot (KPIs) - Adapts to period */}
        {!error && kpis && (
          <AnimatedSection delay={STAGGER_DELAY * 1} isVisible={dataReady}>
            <SectionHeader title={period === 'week' ? t('analytics.weeklySnapshot') : period === 'year' ? t('analytics.yearlySnapshot') : t('analytics.monthlySnapshot')} />
            {period === 'year' && yearlyTrend ? (
              <GlassCard variant="default">
                <YearlyKPICard
                  data={{
                    income: yearlyTrend.totalIncome,
                    expenses: yearlyTrend.totalSpent,
                    saved: yearlyTrend.totalSaved,
                    savingsRate: yearlyTrend.savingsRate,
                  }}
                  currency={currencyCode}
                />
              </GlassCard>
            ) : (
              <View style={styles.kpiRow}>
                <KPICard
                  label={t('analytics.income')}
                  value={kpis.income}
                  change={kpis.incomeChange}
                  type="income"
                  currency={currencyCode}
                />
                <KPICard
                  label={t('analytics.expenses')}
                  value={kpis.expenses}
                  change={kpis.expensesChange}
                  type="expense"
                  currency={currencyCode}
                />
                <KPICard
                  label={t('analytics.net')}
                  value={kpis.net}
                  change={kpis.netChange}
                  type="net"
                  currency={currencyCode}
                />
              </View>
            )}
          </AnimatedSection>
        )}

        {/* ==================== WEEKLY VIEW SECTIONS ==================== */}
        {!error && period === 'week' && (
          <>
            {/* WEEKLY: Daily Breakdown - PREMIUM */}
            {dailyBreakdown && (
              <AnimatedSection delay={STAGGER_DELAY * 2} isVisible={dataReady}>
                <SectionHeader title={t('analytics.dailyBreakdown')} />
                <GlassCard variant="default">
                    <DailyBreakdownChart
                      data={dailyBreakdown.dailyBreakdown}
                      highestDay={dailyBreakdown.highestDay}
                      lowestDay={dailyBreakdown.lowestDay}
                      currency={currencyCode}
                    />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* WEEKLY: Week vs Week Comparison - PREMIUM */}
            {weekComparison && (
              <AnimatedSection delay={STAGGER_DELAY * 3} isVisible={dataReady}>
                <SectionHeader title={t('analytics.weekComparison')} />
                <GlassCard variant="default">
                    <WeekComparisonCard data={weekComparison} currency={currencyCode} />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* WEEKLY: Spending by Category (smaller) */}
            {!isLoading && categorySpending.length > 0 && (
              <AnimatedSection delay={STAGGER_DELAY * 4} isVisible={dataReady}>
                <SectionHeader title={t('analytics.thisWeekByCategory')} />
                <GlassCard variant="default">
                  <View style={styles.donutContainer}>
                    <DonutChart
                      segments={donutSegments}
                      size={140}
                      strokeWidth={16}
                      centerContent={
                        <View style={styles.donutCenter}>
                          <GradientText variant="bronze" style={styles.donutCenterLabel}>{t('analytics.total')}</GradientText>
                          <AnimatedNumber
                            value={totalSpent}
                            style={[styles.donutCenterValue, { fontSize: FontSize.lg }]}
                            duration={1500}
                          />
                        </View>
                      }
                    />
                  </View>
                  <ChartLegend
                    items={donutSegments.slice(0, 4).map(seg => ({
                      color: seg.color,
                      label: seg.label,
                      value: formatCurrency(seg.value),
                    }))}
                    style={styles.legend}
                  />
                </GlassCard>
              </AnimatedSection>
            )}

            {/* WEEKLY: Top Merchants (Top 3) */}
            {!isLoading && merchants.length > 0 && (
              <AnimatedSection delay={STAGGER_DELAY * 5} isVisible={dataReady}>
                <SectionHeader title={t('analytics.topMerchantsWeek')} />
                <GlassCard variant="default">
                  <MerchantLeaderboard merchants={merchants.slice(0, 3)} currency={currencyCode} />
                </GlassCard>
              </AnimatedSection>
            )}

            {/* WEEKLY: Week Projection - PREMIUM */}
            {weekProjection && (
              <AnimatedSection delay={STAGGER_DELAY * 6} isVisible={dataReady}>
                <SectionHeader title={t('analytics.weekProjection')} />
                <GlassCard variant="default">
                    <WeekProjectionCard data={weekProjection} currency={currencyCode} />
                  </GlassCard>
              </AnimatedSection>
            )}
          </>
        )}

        {/* ==================== MONTHLY VIEW SECTIONS ==================== */}
        {!error && period === 'month' && (
          <>
            {/* MONTHLY ONLY: Financial Health Score - PREMIUM */}
            {healthScore && (
              <AnimatedSection delay={STAGGER_DELAY * 2} isVisible={dataReady}>
                <SectionHeader title={t('analytics.financialHealthScore')} />
                <GlassCard variant="elevated" contentStyle={styles.healthCardContent}>
                    {healthScore.hasEnoughData ? (
                      <>
                        <HealthScoreGauge
                          score={healthScore.overall}
                          grade={healthScore.grade}
                          size={180}
                        />
                        <View style={styles.factorsRow}>
                          <MiniFactorIndicator
                            value={healthScore.factors.savingsRate}
                            label={t('analytics.factorSavings')}
                          />
                          <MiniFactorIndicator
                            value={healthScore.factors.debtRatio}
                            label={t('analytics.factorDebt')}
                          />
                          <MiniFactorIndicator
                            value={healthScore.factors.budgetAdherence}
                            label={t('analytics.factorBudget')}
                          />
                          <MiniFactorIndicator
                            value={healthScore.factors.emergencyFund}
                            label={t('analytics.factorEmergency')}
                          />
                        </View>
                        {healthScore.dataStatus && healthScore.dataStatus !== 'Score based on your complete financial data' && (
                          <Text style={styles.dataStatusText}>{healthScore.dataStatus}</Text>
                        )}
                      </>
                    ) : (
                      <EmptyState
                        icon="analytics-outline"
                        title={t('analytics.noHealthScoreData') || 'Not enough data'}
                        subtitle={healthScore.dataStatus}
                      />
                    )}
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* MONTHLY: Cash Flow Trend - PREMIUM */}
            {!isLoading && (
              <AnimatedSection delay={STAGGER_DELAY * 2} isVisible={dataReady}>
                <SectionHeader title={t('analytics.cashFlowTrend')} />
                <GlassCard variant="default">
                    {cashFlow.length > 0 ? (
                      <>
                        <AreaChart
                          data={areaChartData}
                          height={180}
                          width={chartContainerWidth}
                        />
                        <View style={styles.chartLegendRow}>
                          <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.semantic.income }]} />
                            <Text style={[styles.legendText, { color: Colors.semantic.income }]}>{t('analytics.income')}</Text>
                          </View>
                          <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.semantic.expense }]} />
                            <Text style={[styles.legendText, { color: Colors.semantic.expense }]}>{t('analytics.expenses')}</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <EmptyState
                        icon="trending-up-outline"
                        title={t('analytics.noTransactionData')}
                        subtitle={t('analytics.addTransactionsToSee')}
                      />
                    )}
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* MONTHLY: Spending by Category (Full) */}
            {!isLoading && (
              <AnimatedSection delay={STAGGER_DELAY * 3} isVisible={dataReady}>
                <SectionHeader title={t('analytics.spendingByCategory')} />
                <GlassCard variant="default">
                  {categorySpending.length > 0 ? (
                    <>
                      <View style={styles.donutContainer}>
                        <DonutChart
                          segments={donutSegments}
                          size={180}
                          strokeWidth={20}
                          centerContent={
                            <View style={styles.donutCenter}>
                              <GradientText variant="bronze" style={styles.donutCenterLabel}>{t('analytics.total')}</GradientText>
                              <AnimatedNumber
                                value={totalSpent}
                                style={styles.donutCenterValue}
                                duration={1500}
                              />
                            </View>
                          }
                        />
                      </View>
                      <ChartLegend
                        items={donutSegments.map(seg => ({
                          color: seg.color,
                          label: seg.label,
                          value: formatCurrency(seg.value),
                        }))}
                        style={styles.legend}
                      />
                    </>
                  ) : (
                    <EmptyState
                      icon="pie-chart-outline"
                      title={t('analytics.noSpendingData')}
                      subtitle={t('analytics.categoryBreakdownWillAppear')}
                    />
                  )}
                </GlassCard>
              </AnimatedSection>
            )}

            {/* MONTHLY: Daily Burn Rate - PREMIUM */}
            {burnRate && (
              <AnimatedSection delay={STAGGER_DELAY * 4} isVisible={dataReady}>
                <SectionHeader title={t('analytics.dailyBurnRate')} />
                <GlassCard variant="default">
                    <BurnRateGauge
                      dailyRate={burnRate.dailyRate}
                      projectedMonthEnd={burnRate.projectedMonthEnd}
                      vsBudget={burnRate.vsBudget}
                      currency={currencyCode}
                    />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* MONTHLY: Spending Patterns (Heatmap) - PREMIUM */}
            {heatmap && (
              <AnimatedSection delay={STAGGER_DELAY * 5} isVisible={dataReady}>
                <SectionHeader title={t('analytics.whenYouSpend')} />
                <GlassCard variant="default" style={styles.heatmapCard}>
                    <HeatmapChart
                      data={heatmap.grid}
                      maxValue={heatmap.maxValue}
                      cellSize={36}
                    />
                    <Text style={styles.insightText}>{heatmap.insight}</Text>
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* MONTHLY: Top Merchants */}
            {!isLoading && merchants.length > 0 && (
              <AnimatedSection delay={STAGGER_DELAY * 6} isVisible={dataReady}>
                <SectionHeader title={t('analytics.topMerchants')} />
                <GlassCard variant="default">
                  <MerchantLeaderboard merchants={merchants} currency={currencyCode} />
                </GlassCard>
              </AnimatedSection>
            )}

            {/* MONTHLY: Budget Performance */}
            {!isLoading && (
              <AnimatedSection delay={STAGGER_DELAY * 7} isVisible={dataReady}>
                <SectionHeader
                  title={t('analytics.budgetPerformance')}
                  action={t('common.viewAll')}
                  onAction={handleNavigateToBudgets}
                />
                {budgetPerformance.length > 0 ? (
                  <>
                    <View style={styles.budgetGrid}>
                      {budgetPerformance.slice(0, 4).map((budget) => (
                        <BudgetProgressCard
                          key={budget.budgetId}
                          category={budget.category}
                          spent={budget.spent}
                          budget={budget.limit}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </View>
                    <GlassCard variant="subtle" size="compact" style={styles.efficiencyCard}>
                      <GradientText variant="bronze" style={styles.efficiencyLabel}>
                        {t('analytics.budgetEfficiency')}
                      </GradientText>
                      <AnimatedNumber
                        value={budgetEfficiency}
                        style={[styles.efficiencyValue, { color: getEfficiencyColor(budgetEfficiency) }]}
                        suffix="%"
                        duration={1200}
                      />
                    </GlassCard>
                  </>
                ) : (
                  <GlassCard variant="default">
                    <EmptyState
                      icon="wallet-outline"
                      title={t('analytics.noBudgetsSet')}
                      subtitle={t('analytics.createBudgetsToTrack')}
                    />
                  </GlassCard>
                )}
              </AnimatedSection>
            )}

            {/* MONTHLY: Subscriptions - PREMIUM */}
            {subscriptions && (subscriptions.monthlyTotal > 0 || subscriptions.unusedSubscriptions.length > 0) && (
              <AnimatedSection delay={STAGGER_DELAY * 8} isVisible={dataReady}>
                <SectionHeader
                  title={t('analytics.subscriptions')}
                  action={t('common.viewAll')}
                  onAction={handleNavigateToSubscriptions}
                />
                <GlassCard variant="default">
                    <SubscriptionBurn
                      monthlyTotal={subscriptions.monthlyTotal}
                      yearlyTotal={subscriptions.yearlyTotal}
                      unusedSubscriptions={subscriptions.unusedSubscriptions}
                      upcomingRenewals={subscriptions.upcomingRenewals}
                      currency={currencyCode}
                    />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* MONTHLY ONLY: Goals Progress */}
            {!isLoading && goals.length > 0 && (
              <AnimatedSection delay={STAGGER_DELAY * 10} isVisible={dataReady}>
                <SectionHeader
                  title={t('analytics.goalsProgress')}
                  action={t('common.viewAll')}
                  onAction={handleNavigateToGoals}
                />
                <GlassCard variant="default">
                  <GoalsProgress goals={goals} currency={currencyCode} />
                </GlassCard>
              </AnimatedSection>
            )}
          </>
        )}

        {/* ==================== YEARLY VIEW SECTIONS ==================== */}
        {!error && period === 'year' && (
          <>
            {/* YEARLY: Month by Month Trend - PREMIUM */}
            {yearlyTrend && (
              <AnimatedSection delay={STAGGER_DELAY * 2} isVisible={dataReady}>
                <SectionHeader title={t('analytics.spendingTrend')} />
                <GlassCard variant="default">
                    <MonthByMonthChart
                      data={yearlyTrend.months}
                      highestMonth={yearlyTrend.highestMonth}
                      lowestMonth={yearlyTrend.lowestMonth}
                      averageMonthly={yearlyTrend.averageMonthly}
                      currency={currencyCode}
                    />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* YEARLY: Annual Category Breakdown (Large) */}
            {!isLoading && categorySpending.length > 0 && (
              <AnimatedSection delay={STAGGER_DELAY * 3} isVisible={dataReady}>
                <SectionHeader title={t('analytics.annualSpendingByCategory')} />
                <GlassCard variant="default">
                  <View style={styles.donutContainer}>
                    <DonutChart
                      segments={donutSegments}
                      size={200}
                      strokeWidth={24}
                      centerContent={
                        <View style={styles.donutCenter}>
                          <GradientText variant="bronze" style={styles.donutCenterLabel}>{t('analytics.total')}</GradientText>
                          <AnimatedNumber
                            value={totalSpent}
                            style={styles.donutCenterValue}
                            duration={1500}
                          />
                        </View>
                      }
                    />
                  </View>
                  <ChartLegend
                    items={donutSegments.map(seg => ({
                      color: seg.color,
                      label: seg.label,
                      value: formatCurrency(seg.value),
                    }))}
                    style={styles.legend}
                  />
                </GlassCard>
              </AnimatedSection>
            )}

            {/* YEARLY: Year over Year Comparison - PREMIUM */}
            {yearOverYear && (
              <AnimatedSection delay={STAGGER_DELAY * 4} isVisible={dataReady}>
                <SectionHeader title={t('analytics.yearOverYear')} />
                <GlassCard variant="default">
                    <YearOverYearCard data={yearOverYear} currency={currencyCode} />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* YEARLY: Top Merchants (Top 10) */}
            {!isLoading && merchants.length > 0 && (
              <AnimatedSection delay={STAGGER_DELAY * 5} isVisible={dataReady}>
                <SectionHeader title={t('analytics.topMerchantsYear')} />
                <GlassCard variant="default">
                  <MerchantLeaderboard merchants={merchants} currency={currencyCode} />
                </GlassCard>
              </AnimatedSection>
            )}

            {/* YEARLY: Annual Subscriptions - PREMIUM */}
            {annualSubscriptions && annualSubscriptions.totalAnnual > 0 && (
              <AnimatedSection delay={STAGGER_DELAY * 6} isVisible={dataReady}>
                <SectionHeader
                  title={t('analytics.annualSubscriptions')}
                  action={t('common.viewAll')}
                  onAction={handleNavigateToSubscriptions}
                />
                <GlassCard variant="default">
                    <AnnualSubscriptionsCard
                      totalAnnual={annualSubscriptions.totalAnnual}
                      percentOfExpenses={annualSubscriptions.percentOfExpenses}
                      subscriptions={annualSubscriptions.subscriptions}
                      currency={currencyCode}
                    />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* YEARLY: Debt Progress - PREMIUM */}
            {debtProgress && (
              <AnimatedSection delay={STAGGER_DELAY * 7} isVisible={dataReady}>
                <SectionHeader
                  title={t('analytics.debtProgressYear')}
                  action={t('common.details')}
                  onAction={handleNavigateToDebts}
                />
                <GlassCard variant="default">
                    <DebtProgressCard data={debtProgress} currency={currencyCode} />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* YEARLY ONLY: Net Worth - PREMIUM */}
            {netWorthYearly && (
              <AnimatedSection delay={STAGGER_DELAY * 8} isVisible={dataReady}>
                <SectionHeader
                  title={t('analytics.netWorth')}
                  action={t('common.details')}
                  onAction={handleNavigateToNetWorth}
                />
                <GlassCard variant="default">
                    <NetWorthYearlyCard
                      data={{
                        currentNetWorth: netWorthYearly.currentNetWorth,
                        startOfYearNetWorth: netWorthYearly.startOfYearNetWorth,
                        growth: netWorthYearly.growth,
                        growthPercent: netWorthYearly.growthPercent,
                        totalAssets: netWorthYearly.totalAssets,
                        totalLiabilities: netWorthYearly.totalLiabilities,
                      }}
                      currency={currencyCode}
                    />
                  </GlassCard>
              </AnimatedSection>
            )}

            {/* YEARLY ONLY: Goals Achieved - PREMIUM */}
            {goalsAchieved && (
              <AnimatedSection delay={STAGGER_DELAY * 9} isVisible={dataReady}>
                <SectionHeader
                  title={t('analytics.goalsThisYear')}
                  action={t('common.viewAll')}
                  onAction={handleNavigateToGoals}
                />
                <GlassCard variant="default">
                    <GoalsAchievedCard
                      data={{
                        completedGoals: goalsAchieved.completedGoals.map(g => ({
                          id: g.id,
                          name: g.name,
                          targetAmount: g.targetAmount,
                          currentAmount: g.currentAmount,
                          percentage: g.percentage,
                          status: g.status,
                        })),
                        inProgressGoals: goalsAchieved.inProgressGoals.map(g => ({
                          id: g.id,
                          name: g.name,
                          targetAmount: g.targetAmount,
                          currentAmount: g.currentAmount,
                          percentage: g.percentage,
                          status: g.status,
                        })),
                        totalSavedTowardsGoals: goalsAchieved.totalSavedTowardsGoals,
                      }}
                      currency={currencyCode}
                    />
                  </GlassCard>
              </AnimatedSection>
            )}
          </>
        )}

        <View style={{ height: Spacing.xxl + 60 }} />
      </ScrollView>
    </View>
  );
}

// Helper function for efficiency color
function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 80) return Colors.semantic.income;
  if (efficiency >= 60) return Colors.semantic.warning;
  return Colors.semantic.expense;
}

// Budget Progress Card Component - memoized for performance
const BudgetProgressCard = memo(function BudgetProgressCard({
  category,
  spent,
  budget,
  formatCurrency
}: {
  category: string;
  spent: number;
  budget: number;
  formatCurrency: (amount: number) => string;
}) {
  const percentage = Math.min((spent / budget) * 100, 100);

  return (
    <GlassCard variant="default" size="compact" style={styles.budgetCard}>
      <View style={styles.progressContainer}>
        <ProgressRing progress={percentage} size={60} strokeWidth={6}>
          <GradientText variant="bronze" style={styles.budgetPercentage}>{percentage.toFixed(0)}%</GradientText>
        </ProgressRing>
      </View>
      <GradientText variant="subtle" style={styles.budgetCategory} numberOfLines={1}>{category}</GradientText>
      <Text style={styles.budgetSpentText}>
        <Text style={{ color: Colors.semantic.expense }}>{formatCurrency(spent)}</Text>
        <Text style={{ color: Colors.semantic.neutral }}> / {formatCurrency(budget)}</Text>
      </Text>
    </GlassCard>
  );
});

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
  title: {
    marginBottom: Spacing.md,
  },
  periodSelector: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  periodChip: {
    marginRight: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },

  // Health Score
  healthCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  dataStatusText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },

  // KPIs
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Donut Chart
  donutContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutCenterLabel: {},
  donutCenterValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.semantic.expense,
  },
  legend: {
    marginTop: Spacing.md,
  },

  // Chart legend
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.secondary,
  },

  // Heatmap
  heatmapCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  insightText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    marginTop: Spacing.md,
    textAlign: 'center',
  },

  // Budget Grid
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  budgetCard: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  budgetPercentage: {
    textAlign: 'center',
  },
  budgetCategory: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    width: '100%',
  },
  budgetSpentText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
  },
  efficiencyCard: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  efficiencyLabel: {
    fontSize: FontSize.body,
  },
  efficiencyValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
  },

  // Loading Skeleton
  skeletonContainer: {
    marginTop: Spacing.md,
  },
  skeletonSection: {
    marginBottom: Spacing.xl,
  },
  skeletonCard: {
    backgroundColor: Colors.darker,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.transparent.neon10,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

// Export with memo for performance optimization
export default memo(StatsScreen);
