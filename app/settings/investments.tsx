// SPENDTRAK CINEMATIC EDITION - Investments Screen with Swipe-to-Delete
// Performance optimized with React.memo and useMemo
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, ScrollView, StyleSheet, Text, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useTranslation } from '../../src/context/LanguageContext';
import { useCurrency } from '../../src/context/CurrencyContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { FAB } from '../../src/components/ui/Button';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { Header } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { EmptyState } from '../../src/components/premium';
import {
  InvestmentIcon,
  PlusIcon,
  TrendUpIcon,
  TrendDownIcon,
  TrashIcon,
} from '../../src/components/icons';
import { useInvestmentStore } from '../../src/stores/investmentStore';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = 100;

// Local investment type for display
interface Investment {
  id: string;
  name: string;
  symbol: string;
  value: number;
  change: number;
  shares: number;
  isFromStore?: boolean;
}

// PRODUCTION: No mock data - start with empty array
// Mock data removed for production builds

// Swipeable Investment Card Component
interface SwipeableInvestmentCardProps {
  investment: Investment;
  onPress: () => void;
  onDeleteRequest: () => void;
  resetSwipe?: boolean;
  formatCurrency: (amount: number) => string;
}

const SwipeableInvestmentCard: React.FC<SwipeableInvestmentCardProps> = memo(({
  investment,
  onPress,
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

  const isPositive = investment.change >= 0;

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
          <GlassCard variant="default" size="compact" onPress={onPress}>
            <View style={styles.investmentContent}>
              <View style={styles.investmentIcon}>
                <InvestmentIcon size={24} color={Colors.neon} />
              </View>
              <View style={styles.investmentInfo}>
                <GradientText variant="bright" style={styles.investmentName}>
                  {investment.name}
                </GradientText>
                <GradientText variant="muted" style={styles.investmentSymbol}>
                  {investment.symbol} • {investment.shares} {t('settings.shares')}
                </GradientText>
              </View>
              {/* Value is neutral (silver), gains are blue, losses are red */}
              <View style={styles.investmentValue}>
                <GradientText variant="bronze" style={styles.value}>
                  {formatCurrency(investment.value)}
                </GradientText>
                <View style={styles.changeRow}>
                  {isPositive ? (
                    <TrendUpIcon size={14} color={Colors.semantic.income} />
                  ) : (
                    <TrendDownIcon size={14} color={Colors.semantic.expense} />
                  )}
                  <GradientText
                    variant={isPositive ? 'income' : 'expense'}
                    style={styles.changeText}
                  >
                    {isPositive ? '+' : ''}
                    {investment.change}%
                  </GradientText>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

// Display name for debugging
SwipeableInvestmentCard.displayName = 'SwipeableInvestmentCard';

export default function InvestmentsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const insets = useSafeAreaInsets();
  const { format: formatCurrency } = useCurrency();

  // Connect to Zustand store
  const {
    holdings: storeHoldings,
    isLoading,
    fetchHoldings,
    deleteHolding,
  } = useInvestmentStore();

  // Local state for any locally-added investments (empty by default in production)
  const [localInvestments, setLocalInvestments] = useState<Investment[]>([]);

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Fetch investments when screen is focused
  useFocusEffect(
    useCallback(() => {
      logger.investment.debug('Investments screen focused - fetching holdings...');
      fetchHoldings();
    }, [])
  );

  // Merge store holdings with local investments - use useMemo instead of useCallback
  const investments = useMemo(() => {
    // Convert store holdings to display format
    const storeItems: Investment[] = storeHoldings.map((holding) => ({
      id: holding.id,
      name: holding.name,
      symbol: holding.symbol,
      value: holding.current_value || 0,
      change: holding.unrealized_gain_percentage || 0,
      shares: holding.quantity,
      isFromStore: true,
    }));

    // Combine store items with any local items
    return [...storeItems, ...localInvestments];
  }, [storeHoldings, localInvestments]);

  // Memoize total calculation
  const totalValue = useMemo(() => investments.reduce((sum, i) => sum + i.value, 0), [investments]);

  // Show delete confirmation modal
  const handleDeleteRequest = useCallback((investment: Investment) => {
    setInvestmentToDelete(investment);
    setDeleteModalVisible(true);
  }, []);

  // Handle cancel - reset swipe position
  const handleDeleteCancel = useCallback(() => {
    if (investmentToDelete) {
      setResetSwipeId(investmentToDelete.id);
      // Clear the reset flag after a short delay
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setInvestmentToDelete(null);
  }, [investmentToDelete]);

  // Actually delete the investment
  const handleDeleteConfirm = useCallback(async () => {
    if (!investmentToDelete) return;

    const id = investmentToDelete.id;
    const isStoreInvestment = investmentToDelete.isFromStore;

    if (isStoreInvestment) {
      try {
        await deleteHolding(id);
        await fetchHoldings();
      } catch (error) {
        logger.investment.error('Failed to delete investment:', error);
      }
    } else {
      // Remove from local state (mock data)
      setLocalInvestments((prev) => prev.filter((inv) => inv.id !== id));
    }

    setDeleteModalVisible(false);
    setInvestmentToDelete(null);
  }, [investmentToDelete, deleteHolding, fetchHoldings]);

  const handleEditInvestment = useCallback(
    (investment: Investment) => {
      router.push({
        pathname: '/(modals)/add-investment',
        params: {
          id: investment.id,
          name: investment.name,
          symbol: investment.symbol,
          value: investment.value.toString(),
          shares: investment.shares.toString(),
          isEditing: 'true',
        },
      });
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <Header title={t('categories.investments')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Portfolio Summary Card */}
        <GlassCard variant="elevated" style={styles.summaryCard}>
          <InvestmentIcon size={40} color={Colors.semantic.bronze} />
          <GradientText variant="bronze" style={styles.summaryLabel}>
            {t('settings.portfolioValue')}
          </GradientText>
          <GradientText variant="balance" style={styles.summaryAmount}>
            {formatCurrency(totalValue)}
          </GradientText>
        </GlassCard>

        {/* Swipe Hint */}
        {investments.length > 0 && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>{t('settings.swipeRightToDelete')}</Text>
          </View>
        )}

        {/* Investments List */}
        <View style={styles.section}>
          <SectionHeader
            title={t('settings.yourInvestments')}
            action={`${investments.length} ${t('settings.holdings')}`}
          />

          {isLoading && investments.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.neon} />
              <Text style={styles.loadingText}>{t('settings.loadingInvestments')}</Text>
            </View>
          ) : investments.length > 0 ? (
            investments.map((investment) => (
              <SwipeableInvestmentCard
                key={investment.id}
                investment={investment}
                onPress={() => handleEditInvestment(investment)}
                onDeleteRequest={() => handleDeleteRequest(investment)}
                resetSwipe={resetSwipeId === investment.id}
                formatCurrency={formatCurrency}
              />
            ))
          ) : (
            <EmptyState
              icon={<InvestmentIcon size={48} color={Colors.text.tertiary} />}
              title={t('settings.noInvestmentsTracked')}
              description={t('settings.addFirstInvestment')}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon={<PlusIcon size={24} color={Colors.void} />}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => triggerBlackout(() => router.push('/(modals)/add-investment'))}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('settings.deleteInvestment')}
        message={t('settings.deleteConfirmMessage').replace('{{name}}', investmentToDelete?.name || '')}
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
    paddingBottom: Spacing.xxl,
  },

  // Summary Card
  summaryCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: FontSize.h1,
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

  // Section
  section: {
    marginBottom: Spacing.lg,
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

  // Investment Card Content
  investmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  investmentIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.transparent.neon10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    marginBottom: Spacing.xs,
  },
  investmentSymbol: {
    fontSize: FontSize.caption,
  },
  investmentValue: {
    alignItems: 'flex-end',
  },
  value: {},
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeText: {
    marginLeft: 4,
    fontSize: FontSize.caption,
  },

  // Loading State
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    fontFamily: FontFamily.medium,
    marginTop: Spacing.md,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
