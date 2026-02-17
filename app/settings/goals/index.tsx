// SPENDTRAK CINEMATIC EDITION - Goals Screen with Swipe to Delete
// Performance optimized with React.memo and useMemo
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
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
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/design/cinematic';
import { useCurrency } from '../../../src/context/CurrencyContext';
import { GradientText } from '../../../src/components/ui/GradientText';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { FAB } from '../../../src/components/ui/Button';
import { ConfirmationModal } from '../../../src/components/ui/ConfirmationModal';
import { Header } from '../../../src/components/navigation';
import { ProgressRing, EmptyState } from '../../../src/components/premium';
import { TargetIcon, PlusIcon, TrashIcon } from '../../../src/components/icons';
import { getDevGoals, deleteDevGoal, DevGoal } from '../../../src/services/devStorage';
import { useTranslation } from '../../../src/context/LanguageContext';
import { useTransition } from '../../../src/context/TransitionContext';
import { logger } from '../../../src/utils/logger';

const DELETE_THRESHOLD = 100;

// Swipeable Goal Card Component
interface SwipeableGoalCardProps {
  goal: DevGoal;
  onPress: () => void;
  onDeleteRequest: () => void;
  resetSwipe?: boolean;
  formatCurrency: (amount: number) => string;
}

const SwipeableGoalCard: React.FC<SwipeableGoalCardProps> = memo(({
  goal,
  onPress,
  onDeleteRequest,
  resetSwipe,
  formatCurrency,
}) => {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(100);
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

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

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
    marginBottom: itemHeight.value > 0 ? Spacing.md : 0,
  }));

  // Calculate progress
  const percentage = goal.target_amount > 0
    ? (goal.current_amount / goal.target_amount) * 100
    : 0;

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
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <GlassCard variant="default">
            <View style={styles.goalContent}>
              <View style={styles.goalIconContainer}>
                <Ionicons
                  name={(goal.icon || 'wallet-outline') as any}
                  size={28}
                  color={Colors.neon}
                />
              </View>
              <ProgressRing progress={Math.min(percentage, 100)} size={60} strokeWidth={5}>
                <GradientText variant="bright" style={styles.percentage}>
                  {percentage.toFixed(0)}%
                </GradientText>
              </ProgressRing>
              <View style={styles.goalInfo}>
                <GradientText variant="bright" style={styles.goalName}>
                  {goal.name}
                </GradientText>
                {/* Saved (income/positive) / Target (neutral) */}
                <Text style={styles.goalAmount}>
                  <Text style={{ color: Colors.semantic.saved }}>{formatCurrency(goal.current_amount)}</Text>
                  <Text style={{ color: Colors.semantic.neutral }}> / {formatCurrency(goal.target_amount)}</Text>
                </Text>
                {/* Remaining to save (neutral target) */}
                <Text style={[styles.remaining, { color: Colors.semantic.neutral }]}>
                  {formatCurrency(goal.target_amount - goal.current_amount)} to go
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

// Display name for debugging
SwipeableGoalCard.displayName = 'SwipeableGoalCard';

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { format: formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [goals, setGoals] = useState<DevGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<DevGoal | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Load goals when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  const loadGoals = async () => {
    try {
      const data = await getDevGoals();
      setGoals(data);
    } catch (error) {
      logger.general.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show delete confirmation modal
  const handleDeleteRequest = useCallback((goal: DevGoal) => {
    setGoalToDelete(goal);
    setDeleteModalVisible(true);
  }, []);

  // Handle cancel - reset swipe position
  const handleDeleteCancel = useCallback(() => {
    if (goalToDelete) {
      setResetSwipeId(goalToDelete.id);
      // Clear the reset flag after a short delay
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setGoalToDelete(null);
  }, [goalToDelete]);

  // Actually delete the goal
  const handleDeleteConfirm = useCallback(async () => {
    if (!goalToDelete) return;

    try {
      await deleteDevGoal(goalToDelete.id);
      // Refresh the list
      await loadGoals();
    } catch (error) {
      logger.general.error('Failed to delete goal:', error);
    }

    setDeleteModalVisible(false);
    setGoalToDelete(null);
  }, [goalToDelete]);

  // Calculate totals with useMemo
  const { totalSaved, totalTarget, overallProgress } = useMemo(() => {
    const saved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const target = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const progress = target > 0 ? (saved / target) * 100 : 0;
    return { totalSaved: saved, totalTarget: target, overallProgress: progress };
  }, [goals]);

  return (
    <View style={styles.container}>
      <Header title={t('goals.title')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Summary */}
        {goals.length > 0 && (
          <GlassCard variant="glow" style={styles.summaryCard}>
            <ProgressRing progress={Math.min(overallProgress, 100)} size={100} strokeWidth={8}>
              <View style={styles.progressContent}>
                <GradientText variant="luxury" style={styles.summaryPercent}>
                  {overallProgress.toFixed(0)}%
                </GradientText>
                <GradientText variant="luxury" style={styles.summaryLabel}>
                  {t('goals.progress').toLowerCase()}
                </GradientText>
              </View>
            </ProgressRing>
            <View style={styles.summaryInfo}>
              <GradientText variant="bright" style={styles.summaryAmount}>
                {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}
              </GradientText>
              <GradientText variant="bright">
                {goals.length} goal{goals.length !== 1 ? 's' : ''}
              </GradientText>
            </View>
          </GlassCard>
        )}

        {/* Swipe Hint */}
        {goals.length > 0 && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>{t('alerts.swipeHint')}</Text>
          </View>
        )}

        {/* Goals List */}
        {goals.length > 0 ? (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            renderItem={({ item: goal }: ListRenderItemInfo<DevGoal>) => (
              <SwipeableGoalCard
                goal={goal}
                onPress={() => triggerBlackout(() => router.push(`/settings/goals/${goal.id}`))}
                onDeleteRequest={() => handleDeleteRequest(goal)}
                resetSwipe={resetSwipeId === goal.id}
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
              length: 108, // Approximate item height including margin
              offset: 108 * index,
              index,
            })}
          />
        ) : (
          <EmptyState
            icon={<TargetIcon size={48} color={Colors.text.tertiary} />}
            title={t('goals.noGoals')}
            description={t('goals.createGoal')}
            actionLabel={t('goals.createGoal')}
            onAction={() => triggerBlackout(() => router.push('/settings/goals/add'))}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon={<PlusIcon size={24} color={Colors.void} />}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => triggerBlackout(() => router.push('/settings/goals/add'))}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('goals.deleteGoal')}
        message={t('goals.confirmDelete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Summary Card
  summaryCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  progressContent: {
    alignItems: 'center',
  },
  summaryPercent: {
    fontSize: 20,
  },
  summaryLabel: {
    fontSize: 10,
  },
  summaryInfo: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  summaryAmount: {
    marginBottom: Spacing.xs,
  },

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

  // Goal Card Content
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.neon}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  goalInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  goalName: {
    marginBottom: Spacing.xs,
  },
  goalAmount: {
    fontSize: 12,
  },
  percentage: {
    fontSize: 12,
  },
  remaining: {
    marginTop: Spacing.xs,
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
