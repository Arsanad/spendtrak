// SPENDTRAK CINEMATIC EDITION - Debts Screen with Swipe to Delete
// Performance optimized with React.memo and useMemo
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Text, Platform, ListRenderItemInfo } from 'react-native';
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
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { FAB } from '../../src/components/ui/Button';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { Header } from '../../src/components/navigation';
import { ProgressRing, EmptyState } from '../../src/components/premium';
import { DebtIcon, PlusIcon, TrashIcon } from '../../src/components/icons';
import { getDevDebts, deleteDevDebt, DevDebt } from '../../src/services/devStorage';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';

const DELETE_THRESHOLD = 100;

// Swipeable Debt Card Component
interface SwipeableDebtCardProps {
  debt: DevDebt;
  onDeleteRequest: () => void;
  resetSwipe?: boolean;
  formatCurrency: (amount: number) => string;
}

const SwipeableDebtCard: React.FC<SwipeableDebtCardProps> = memo(({
  debt,
  onDeleteRequest,
  resetSwipe,
  formatCurrency,
}) => {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(120);
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
    marginBottom: itemHeight.value > 0 ? Spacing.md : 0,
  }));

  // Calculate progress (how much has been paid off)
  // Since DevDebt has 'balance' (remaining), we need to estimate total
  // For now, we'll show balance as the key metric
  const percentage = 0; // No original total available, so we can't calculate payoff %

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
          <GlassCard variant="default">
            <View style={styles.debtContent}>
              <View style={styles.debtIconContainer}>
                <Ionicons
                  name={(debt.icon || 'card-outline') as any}
                  size={28}
                  color={Colors.neon}
                />
              </View>
              <View style={styles.debtInfo}>
                <GradientText variant="bright" style={styles.debtName}>
                  {debt.name}
                </GradientText>
                {/* Debt balance uses expense color (money owed) */}
                <Text style={[styles.debtBalance, { color: Colors.semantic.expense }]}>
                  {formatCurrency(debt.balance)} {t('debts.outstanding')}
                </Text>
                <View style={styles.debtDetails}>
                  {/* Statistics use bronze/neutral */}
                  <Text style={[styles.debtDetail, { color: Colors.semantic.neutral }]}>
                    {debt.interest_rate}% APR
                  </Text>
                  <Text style={[styles.debtDetail, { color: Colors.semantic.expense }]}>
                    Min: {formatCurrency(debt.minimum_payment)}
                  </Text>
                </View>
                <Text style={[styles.debtType, { color: Colors.semantic.neutral }]}>
                  {debt.type}
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
SwipeableDebtCard.displayName = 'SwipeableDebtCard';

export default function DebtsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { format: formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [debts, setDebts] = useState<DevDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<DevDebt | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Load debts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDebts();
    }, [])
  );

  const loadDebts = async () => {
    try {
      const data = await getDevDebts();
      setDebts(data);
    } catch (error) {
      logger.general.error('Error loading debts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show delete confirmation modal
  const handleDeleteRequest = useCallback((debt: DevDebt) => {
    setDebtToDelete(debt);
    setDeleteModalVisible(true);
  }, []);

  // Handle cancel - reset swipe position
  const handleDeleteCancel = useCallback(() => {
    if (debtToDelete) {
      setResetSwipeId(debtToDelete.id);
      // Clear the reset flag after a short delay
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setDebtToDelete(null);
  }, [debtToDelete]);

  // Actually delete the debt
  const handleDeleteConfirm = useCallback(async () => {
    if (!debtToDelete) return;

    try {
      await deleteDevDebt(debtToDelete.id);
      // Refresh the list
      await loadDebts();
    } catch (error) {
      logger.general.error('Failed to delete debt:', error);
    }

    setDeleteModalVisible(false);
    setDebtToDelete(null);
  }, [debtToDelete]);

  // Calculate totals with useMemo
  const { totalDebt, totalMinPayment } = useMemo(() => ({
    totalDebt: debts.reduce((sum, d) => sum + d.balance, 0),
    totalMinPayment: debts.reduce((sum, d) => sum + d.minimum_payment, 0),
  }), [debts]);

  return (
    <View style={styles.container}>
      <Header title={t('debts.title')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Summary */}
        {debts.length > 0 && (
          <GlassCard variant="elevated" style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: Colors.semantic.expense }]}>
              {t('debts.remainingAmount')}
            </Text>
            {/* Total debt uses expense color (money owed) */}
            <Text style={[styles.summaryAmount, { color: Colors.semantic.expense }]}>
              {formatCurrency(totalDebt)}
            </Text>
            {/* Statistics use bronze/neutral */}
            <Text style={[styles.summarySubtext, { color: Colors.semantic.neutral }]}>
              {debts.length} debt{debts.length !== 1 ? 's' : ''} • Min. payment: {formatCurrency(totalMinPayment)}/mo
            </Text>
          </GlassCard>
        )}

        {/* Swipe Hint */}
        {debts.length > 0 && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>{t('alerts.swipeHint')}</Text>
          </View>
        )}

        {/* Debts List */}
        {debts.length > 0 ? (
          <FlatList
            data={debts}
            keyExtractor={(item) => item.id}
            renderItem={({ item: debt }: ListRenderItemInfo<DevDebt>) => (
              <SwipeableDebtCard
                debt={debt}
                onDeleteRequest={() => handleDeleteRequest(debt)}
                resetSwipe={resetSwipeId === debt.id}
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
              length: 128, // Approximate item height including margin
              offset: 128 * index,
              index,
            })}
          />
        ) : (
          <EmptyState
            icon={<DebtIcon size={48} color={Colors.text.tertiary} />}
            title={t('debts.noDebts')}
            description={t('debts.addDebt')}
            actionLabel={t('debts.addDebt')}
            onAction={() => triggerBlackout(() => router.push('/(modals)/add-debt'))}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon={<PlusIcon size={24} color={Colors.void} />}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => triggerBlackout(() => router.push('/(modals)/add-debt'))}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('debts.deleteDebt')}
        message={t('debts.confirmDelete')}
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
  gateContainer: {
    flex: 1,
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
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
  },
  summaryAmount: {
    fontSize: FontSize.h1,
    fontFamily: FontFamily.bold,
  },
  summarySubtext: {
    marginTop: Spacing.sm,
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
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

  // Debt Card Content
  debtContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xxl,
    backgroundColor: `${Colors.neon}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    marginBottom: Spacing.xs,
  },
  debtBalance: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.semiBold,
  },
  debtDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  debtDetail: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
  },
  debtType: {
    fontSize: FontSize.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FontFamily.medium,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
