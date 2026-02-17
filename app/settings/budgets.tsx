// SPENDTRAK CINEMATIC EDITION - Budgets Screen
// Performance optimized with React.memo and useMemo
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Text, Dimensions, Platform, ListRenderItemInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { FAB } from '../../src/components/ui/Button';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { Header } from '../../src/components/navigation';
import { ProgressRing, EmptyState } from '../../src/components/premium';
import { SectionHeader } from '../../src/components/dashboard';
import { PlusIcon, BudgetIcon, TrashIcon } from '../../src/components/icons';
import { getDevBudgets, deleteDevBudget, DevBudget, getDevTransactions } from '../../src/services/devStorage';
import { TransactionWithCategory } from '../../src/types/database';
import { BUDGET_CATEGORIES, getCategoryById } from '../../src/constants/categories';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';
import { useUpgradePromptStore } from '../../src/stores';
import { eventBus } from '../../src/services/eventBus';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = 100;

// Swipeable Budget Card Component
interface SwipeableBudgetCardProps {
  budget: DevBudget;
  spent: number;
  onDeleteRequest: () => void;
  resetSwipe?: boolean;
  formatCurrency: (amount: number) => string;
}

const SwipeableBudgetCard: React.FC<SwipeableBudgetCardProps> = memo(({
  budget,
  spent,
  onDeleteRequest,
  resetSwipe,
  formatCurrency,
}) => {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(80);
  const opacity = useSharedValue(1);

  // Reset swipe position when resetSwipe changes
  useEffect(() => {
    if (resetSwipe) {
      translateX.value = withSpring(0);
    }
  }, [resetSwipe]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Only allow swiping to the right
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > DELETE_THRESHOLD) {
        // Trigger delete confirmation modal
        runOnJS(onDeleteRequest)();
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => {
    const deleteOpacity = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: deleteOpacity,
    };
  });

  const deleteIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD / 2, DELETE_THRESHOLD],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
    marginBottom: itemHeight.value > 0 ? Spacing.sm : 0,
  }));

  // Calculate budget display info
  const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const categoryInfo = getCategoryById(budget.category_id);

  // Traffic light colors based on budget usage
  const getProgressColor = () => {
    if (progress >= 100) return Colors.semantic.budgetDanger;  // Red - over budget
    if (progress >= 80) return Colors.semantic.budgetWarning;   // Orange - approaching limit
    return Colors.semantic.budgetSafe;                          // Green - safe
  };
  const progressColor = getProgressColor();

  return (
    <Animated.View style={[styles.swipeContainer, containerStyle]}>
      {/* Delete background */}
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
        <Animated.View style={[styles.deleteIconContainer, deleteIconStyle]}>
          <TrashIcon size={24} color={Colors.void} />
          <Text style={styles.deleteText}>{t('common.delete')}</Text>
        </Animated.View>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <GlassCard variant="default" size="compact">
            <View style={styles.budgetRow}>
              <View style={styles.budgetIcon}>
                <Ionicons
                  name={(categoryInfo?.icon || 'ellipsis-horizontal-outline') as any}
                  size={24}
                  color={Colors.neon}
                />
              </View>
              <View style={styles.budgetInfo}>
                <GradientText variant="bright" style={styles.budgetCategory}>
                  {categoryInfo?.name || budget.category?.name || 'Unknown'}
                </GradientText>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }]} />
                </View>
                <GradientText variant="muted" style={styles.budgetAmount}>
                  {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                </GradientText>
              </View>
              <View style={[styles.budgetPercentBadge, { backgroundColor: `${progressColor}20`, borderColor: `${progressColor}40` }]}>
                <GradientText style={[styles.budgetPercent, { color: progressColor }]}>
                  {progress.toFixed(0)}%
                </GradientText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

// Display name for debugging
SwipeableBudgetCard.displayName = 'SwipeableBudgetCard';

export default function BudgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { format: formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [budgets, setBudgets] = useState<DevBudget[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<DevBudget | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Contextual Upgrade Engine - track budget edits
  const budgetEditCount = React.useRef(0);
  const upgradeStore = useUpgradePromptStore;

  // Load budgets when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [])
  );

  const loadBudgets = async () => {
    try {
      const [budgetData, txData] = await Promise.all([
        getDevBudgets(),
        getDevTransactions(),
      ]);
      setBudgets(budgetData);
      setTransactions(txData);

      // Emit budget status events for Quantum Alive Experience
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      budgetData.forEach((b) => {
        const spent = txData
          .filter((tx: any) => tx.category_id === b.category_id && tx.transaction_date?.startsWith(currentMonth))
          .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);
        const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        const cat = getCategoryById(b.category_id);
        if (pct > 100) {
          eventBus.emit('budget:exceeded', { name: cat?.name || b.category_id, percentUsed: pct });
        } else if (pct >= 80) {
          eventBus.emit('budget:warning', { name: cat?.name || b.category_id, percentUsed: pct });
        }
      });

      // Track budget edit for Contextual Upgrade Engine
      budgetEditCount.current += 1;
      if (budgetEditCount.current >= 3) {
        upgradeStore.getState().evaluateFriction('COMPLEX_BUDGET_SETUP', { editCount: budgetEditCount.current });
      }
    } catch (error) {
      logger.general.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show delete confirmation modal
  const handleDeleteRequest = useCallback((budget: DevBudget) => {
    setBudgetToDelete(budget);
    setDeleteModalVisible(true);
  }, []);

  // Handle cancel - reset swipe position
  const handleDeleteCancel = useCallback(() => {
    if (budgetToDelete) {
      setResetSwipeId(budgetToDelete.id);
      // Clear the reset flag after a short delay
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setBudgetToDelete(null);
  }, [budgetToDelete]);

  // Actually delete the budget
  const handleDeleteConfirm = useCallback(async () => {
    if (!budgetToDelete) return;

    try {
      await deleteDevBudget(budgetToDelete.id);
      // Refresh the list
      await loadBudgets();
    } catch (error) {
      logger.general.error('Failed to delete budget:', error);
    }

    setDeleteModalVisible(false);
    setBudgetToDelete(null);
  }, [budgetToDelete]);

  // Calculate spent per category for the current month
  const spentByCategory = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const map: Record<string, number> = {};

    for (const t of transactions) {
      if (
        (t as any).type === 'expense' ||
        t.transaction_type === 'purchase'
      ) {
        const txDate = new Date(t.transaction_date);
        if (txDate >= startOfMonth && txDate <= now && t.category_id) {
          map[t.category_id] = (map[t.category_id] || 0) + Math.abs(t.amount);
        }
      }
    }

    return map;
  }, [transactions]);

  // Calculate totals with useMemo
  const { totalSpent, totalBudget, overallProgress } = useMemo(() => {
    const spent = budgets.reduce((sum, b) => sum + (spentByCategory[b.category_id] || 0), 0);
    const total = budgets.reduce((sum, b) => sum + b.amount, 0);
    const progress = total > 0 ? (spent / total) * 100 : 0;
    return { totalSpent: spent, totalBudget: total, overallProgress: progress };
  }, [budgets, spentByCategory]);

  return (
    <View style={styles.container}>

      <Header title={t('budgets.title')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Summary */}
        <GlassCard variant="glow" style={styles.summaryCard}>
          <ProgressRing progress={overallProgress} size={120} strokeWidth={10}>
            <View style={styles.progressContent}>
              <GradientText variant="luxury" style={styles.progressPercent}>{overallProgress.toFixed(0)}%</GradientText>
              <GradientText variant="luxury" style={styles.progressLabel}>{t('budgets.spent')}</GradientText>
            </View>
          </ProgressRing>
          <View style={styles.summaryInfo}>
            {/* Spent (expense) / Budget (neutral) */}
            <Text style={styles.summaryAmount}>
              <Text style={{ color: Colors.semantic.expense }}>{formatCurrency(totalSpent)}</Text>
              <Text style={{ color: Colors.semantic.neutral }}> / {formatCurrency(totalBudget)}</Text>
            </Text>
            {/* Remaining (income/positive) */}
            <Text style={[styles.summaryRemaining, { color: Colors.semantic.remaining }]}>
              {formatCurrency(totalBudget - totalSpent)} {t('budgets.remaining').toLowerCase()}
            </Text>
          </View>
        </GlassCard>

        {/* Swipe Hint */}
        {budgets.length > 0 && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>{t('common.delete')}</Text>
          </View>
        )}

        {/* Budget List */}
        <View style={styles.section}>
          <SectionHeader title={t('budgets.title')} action={`${budgets.length} ${t('analytics.total').toLowerCase()}`} />
          {budgets.length === 0 ? (
            <EmptyState
              icon={<BudgetIcon size={48} color={Colors.text.tertiary} />}
              title={t('budgets.noBudgets')}
              description={t('analytics.createBudgetsToTrack')}
              actionLabel={t('budgets.createBudget')}
              onAction={() => router.push('/(modals)/add-budget')}
            />
          ) : (
            <FlatList
              data={budgets}
              keyExtractor={(item) => item.id}
              renderItem={({ item: budget }: ListRenderItemInfo<DevBudget>) => (
                <SwipeableBudgetCard
                  budget={budget}
                  spent={spentByCategory[budget.category_id] || 0}
                  onDeleteRequest={() => handleDeleteRequest(budget)}
                  resetSwipe={resetSwipeId === budget.id}
                  formatCurrency={formatCurrency}
                />
              )}
              scrollEnabled={false}
              // Performance optimizations
              removeClippedSubviews={Platform.OS !== 'web'}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={10}
              getItemLayout={(_, index) => ({
                length: 88, // Approximate item height
                offset: 88 * index,
                index,
              })}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon={<PlusIcon size={24} color={Colors.void} />} onPress={() => triggerBlackout(() => router.push('/(modals)/add-budget'))} style={{ ...styles.fab, bottom: insets.bottom + 16 }} />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('budgets.deleteBudget')}
        message={`${t('budgets.confirmDelete')}`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg },
  summaryCard: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.xl },
  progressContent: { alignItems: 'center', justifyContent: 'center' },
  progressPercent: { textAlign: 'center' },
  progressLabel: { textAlign: 'center' },
  summaryInfo: { marginTop: Spacing.lg, alignItems: 'center' },
  summaryAmount: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  summaryRemaining: { marginTop: Spacing.xs, fontFamily: FontFamily.regular, fontSize: FontSize.body },

  // Swipe Hint
  swipeHint: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  swipeHintText: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },

  section: { marginBottom: Spacing.lg },

  // Swipeable Container
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DELETE_THRESHOLD + 20,
    backgroundColor: Colors.semantic.error,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    paddingLeft: Spacing.lg,
  },
  deleteIconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteText: {
    color: Colors.void,
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
  },

  budgetCard: { marginBottom: Spacing.sm },
  budgetRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  budgetIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.transparent.deep20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  budgetInfo: { flex: 1 },
  budgetCategory: { marginBottom: Spacing.xs },
  progressBar: { height: 4, backgroundColor: Colors.darker, borderRadius: 2, marginBottom: Spacing.xs },
  progressFill: { height: '100%', backgroundColor: Colors.neon, borderRadius: 2 },
  budgetAmount: {},
  budgetPercentBadge: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  budgetPercent: { fontWeight: '600' },
  fab: { position: 'absolute', right: Spacing.lg },
});
