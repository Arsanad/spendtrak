// SPENDTRAK CINEMATIC EDITION - Consumer Subscriptions Screen (Netflix, Spotify, etc.)
// Performance optimized with React.memo and useMemo
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Text, Pressable, Dimensions, ActivityIndicator, Platform, ListRenderItemInfo } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Badge } from '../../src/components/ui/Badge';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { Header } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { ProgressRing } from '../../src/components/premium';
import {
  PlusIcon,
  SubscriptionsIcon,
  EntertainmentIcon,
  StarIcon,
  CloudIcon,
  GlobeIcon,
  TrashIcon,
} from '../../src/components/icons';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = 100;

// Subscription type
interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextBilling: string;
  billingDay: string;
  status: 'active' | 'paused' | 'cancelled';
  iconType: 'entertainment' | 'star' | 'cloud' | 'globe';
  iconColor: string;
}

// Initial mock subscription data
const initialSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    amount: 55,
    frequency: 'monthly',
    nextBilling: 'Jan 25',
    billingDay: '25',
    status: 'active',
    iconType: 'entertainment',
    iconColor: '#E50914',
  },
  {
    id: '2',
    name: 'Spotify',
    amount: 26,
    frequency: 'monthly',
    nextBilling: 'Jan 28',
    billingDay: '28',
    status: 'active',
    iconType: 'star',
    iconColor: '#1DB954',
  },
  {
    id: '3',
    name: 'ChatGPT Plus',
    amount: 73,
    frequency: 'monthly',
    nextBilling: 'Feb 1',
    billingDay: '1',
    status: 'active',
    iconType: 'cloud',
    iconColor: Colors.neon,
  },
  {
    id: '4',
    name: 'iCloud+',
    amount: 11,
    frequency: 'monthly',
    nextBilling: 'Feb 5',
    billingDay: '5',
    status: 'active',
    iconType: 'globe',
    iconColor: Colors.text.primary,
  },
];

// Helper to get icon component
const getSubscriptionIcon = (iconType: string, color: string, size: number = 24) => {
  switch (iconType) {
    case 'entertainment':
      return <EntertainmentIcon size={size} color={color} />;
    case 'star':
      return <StarIcon size={size} color={color} />;
    case 'cloud':
      return <CloudIcon size={size} color={color} />;
    case 'globe':
      return <GlobeIcon size={size} color={color} />;
    default:
      return <SubscriptionsIcon size={size} color={color} />;
  }
};

// Swipeable Subscription Card Component
interface SwipeableSubscriptionCardProps {
  subscription: Subscription;
  onPress: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirmed: () => void;
  resetSwipe?: boolean;
  formatCurrency: (amount: number) => string;
}

const SwipeableSubscriptionCard: React.FC<SwipeableSubscriptionCardProps> = memo(({
  subscription,
  onPress,
  onDeleteRequest,
  onDeleteConfirmed,
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

  // Animate out and delete
  const animateDelete = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
    itemHeight.value = withTiming(0, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDeleteConfirmed)();
    });
  }, [onDeleteConfirmed]);

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
          <GlassCard
            variant="default"
            size="compact"
            onPress={onPress}
          >
            <View style={styles.subscriptionRow}>
              <View style={styles.subscriptionIcon}>
                {getSubscriptionIcon(subscription.iconType, subscription.iconColor)}
              </View>
              <View style={styles.subscriptionInfo}>
                <View style={styles.subscriptionHeader}>
                  <GradientText variant="bright" style={styles.subscriptionName}>
                    {subscription.name}
                  </GradientText>
                  <Badge
                    variant={subscription.status === 'active' ? 'success' : subscription.status === 'paused' ? 'warning' : 'error'}
                    size="small"
                  >
                    {t(`subscriptions.${subscription.status}` as any)}
                  </Badge>
                </View>
                <Text style={styles.subscriptionFrequency}>
                  {t(`subscriptions.${subscription.frequency}` as any)} · {t('subscriptions.nextBilling')}: {subscription.nextBilling}
                </Text>
              </View>
              <View style={styles.subscriptionAmount}>
                <Text style={styles.amountValue}>
                  {formatCurrency(subscription.amount)}
                </Text>
                <Text style={styles.amountPeriod}>{t('analytics.perMo')}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

// Display name for debugging
SwipeableSubscriptionCard.displayName = 'SwipeableSubscriptionCard';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { format: formatCurrency } = useCurrency();
  const { t, languageCode } = useTranslation();
  const { triggerBlackout } = useTransition();

  // Connect to Zustand store
  const {
    subscriptions: storeSubscriptions,
    isLoading,
    fetchSubscriptions,
    cancelSubscription,
  } = useSubscriptionStore();

  // Convert store subscriptions to local format + include mock data for demo
  const [localSubscriptions, setLocalSubscriptions] = useState<Subscription[]>(initialSubscriptions);

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Fetch subscriptions when screen is focused
  useFocusEffect(
    useCallback(() => {
      logger.general.debug('Subscriptions screen focused - fetching subscriptions...');
      fetchSubscriptions();
    }, [])
  );

  // Merge store subscriptions with local mock data - use useMemo instead of useCallback
  const subscriptions = useMemo(() => {
    // Convert store subscriptions to display format
    const storeItems: Subscription[] = storeSubscriptions.map((sub) => ({
      id: sub.id,
      name: sub.display_name || sub.merchant_name,
      amount: sub.amount,
      frequency: sub.frequency || 'monthly',
      nextBilling: sub.next_billing_date
        ? new Date(sub.next_billing_date).toLocaleDateString(languageCode, { month: 'short', day: 'numeric' })
        : 'N/A',
      billingDay: sub.billing_day?.toString() || '1',
      status: sub.status as 'active' | 'paused' | 'cancelled',
      iconType: 'entertainment' as const,
      iconColor: Colors.neon,
    }));

    // Combine store items with local mock items (local items for demo)
    return [...storeItems, ...localSubscriptions];
  }, [storeSubscriptions, localSubscriptions]);

  // Memoize calculations
  const { totalMonthly, activeCount, yearlyTotal } = useMemo(() => ({
    totalMonthly: subscriptions.reduce((sum, sub) => sum + sub.amount, 0),
    activeCount: subscriptions.filter((s) => s.status === 'active').length,
    yearlyTotal: subscriptions.reduce((sum, sub) => sum + sub.amount, 0) * 12,
  }), [subscriptions]);

  // Show delete confirmation modal
  const handleDeleteRequest = useCallback((subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteModalVisible(true);
  }, []);

  // Handle cancel - reset swipe position
  const handleDeleteCancel = useCallback(() => {
    if (subscriptionToDelete) {
      setResetSwipeId(subscriptionToDelete.id);
      // Clear the reset flag after a short delay
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setSubscriptionToDelete(null);
  }, [subscriptionToDelete]);

  // Actually delete the subscription
  const handleDeleteConfirm = useCallback(async () => {
    if (!subscriptionToDelete) return;

    const id = subscriptionToDelete.id;
    // Check if it's a store subscription or local mock
    const isStoreSubscription = storeSubscriptions.some((sub) => sub.id === id);

    if (isStoreSubscription) {
      try {
        await cancelSubscription(id, 'User deleted');
        await fetchSubscriptions();
      } catch (error) {
        logger.general.error('Failed to delete subscription:', error);
      }
    } else {
      // Remove from local state (mock data)
      setLocalSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    }

    setDeleteModalVisible(false);
    setSubscriptionToDelete(null);
  }, [subscriptionToDelete, storeSubscriptions, cancelSubscription, fetchSubscriptions]);

  const handleEditSubscription = useCallback((subscription: Subscription) => {
    router.push({
      pathname: '/(modals)/edit-subscription',
      params: {
        id: subscription.id,
        name: subscription.name,
        amount: subscription.amount.toString(),
        frequency: subscription.frequency,
        billingDay: subscription.billingDay,
        status: subscription.status,
      },
    });
  }, [router]);

  return (
    <View style={styles.container}>

      <Header title={t('subscriptions.title')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <GlassCard variant="glow" style={styles.summaryCard}>
          <LinearGradient
            colors={[Colors.transparent.neon10, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.summaryGlow}
          />

          <View style={styles.summaryContent}>
            <ProgressRing progress={(activeCount / 10) * 100} size={100} strokeWidth={8}>
              <View style={styles.ringContent}>
                <Text style={styles.ringNumber}>
                  {activeCount}
                </Text>
                <Text style={styles.ringLabel}>{t('subscriptions.active').toLowerCase()}</Text>
              </View>
            </ProgressRing>

            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('subscriptions.monthly')}</Text>
                <Text style={styles.statValueExpense}>
                  {formatCurrency(totalMonthly)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('subscriptions.yearly')}</Text>
                <Text style={styles.statValueExpense}>
                  {formatCurrency(yearlyTotal)}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Swipe Hint */}
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>{t('subscriptions.swipeRightToDelete')}</Text>
        </View>

        {/* Subscriptions List */}
        <View style={styles.section}>
          <SectionHeader
            title={t('subscriptions.yourSubscriptions')}
            action={t('subscriptions.activeCount', { count: activeCount })}
          />

          {isLoading && subscriptions.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.neon} />
              <Text style={styles.loadingText}>{t('subscriptions.loadingSubscriptions')}</Text>
            </View>
          ) : subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <SubscriptionsIcon size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>{t('subscriptions.noSubscriptionsYet')}</Text>
              <Text style={styles.emptySubtext}>{t('subscriptions.tapToAddFirst')}</Text>
            </View>
          ) : (
            <FlatList
              data={subscriptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item: subscription }: ListRenderItemInfo<Subscription>) => (
                <SwipeableSubscriptionCard
                  subscription={subscription}
                  onPress={() => handleEditSubscription(subscription)}
                  onDeleteRequest={() => handleDeleteRequest(subscription)}
                  onDeleteConfirmed={() => {}}
                  resetSwipe={resetSwipeId === subscription.id}
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

        {/* Upcoming Renewals */}
        {subscriptions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={t('subscriptions.upcomingThisWeek')} />
            <GlassCard variant="outlined" size="compact">
              <View style={styles.upcomingRow}>
                <View style={styles.upcomingIcon}>
                  {getSubscriptionIcon(subscriptions[0]?.iconType || 'entertainment', subscriptions[0]?.iconColor || Colors.neon, 20)}
                </View>
                <View style={styles.upcomingInfo}>
                  <GradientText variant="subtle" style={styles.upcomingName}>
                    {subscriptions[0]?.name || t('analytics.noUpcoming')}
                  </GradientText>
                  <Text style={styles.upcomingDate}>{t('subscriptions.renews', { date: subscriptions[0]?.nextBilling || '-' })}</Text>
                </View>
                <Text style={styles.upcomingAmount}>
                  {formatCurrency(subscriptions[0]?.amount || 0)}
                </Text>
              </View>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon={<PlusIcon size={24} color={Colors.void} />}
        onPress={() => triggerBlackout(() => router.push('/(modals)/add-subscription'))}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('subscriptions.deleteSubscription')}
        message={t('subscriptions.deleteConfirmMessage', { name: subscriptionToDelete?.name || '' })}
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
    paddingBottom: Spacing.xxl,
  },

  // Summary Card
  summaryCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  summaryGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  ringContent: {
    alignItems: 'center',
  },
  ringNumber: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: Colors.semantic.statistic,
  },
  ringLabel: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },
  summaryStats: {
    flex: 1,
    marginLeft: Spacing.xl,
  },
  statItem: {
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
  },
  statValueExpense: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.semantic.expense,
  },
  statDivider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: Spacing.sm,
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

  // Subscription Card
  subscriptionCard: {
    marginBottom: Spacing.sm,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.transparent.dark30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  subscriptionName: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
  },
  subscriptionFrequency: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },
  subscriptionAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: FontSize.h5,
    fontFamily: FontFamily.bold,
    color: Colors.semantic.expense,
  },
  amountPeriod: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
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

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    fontFamily: FontFamily.medium,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.xs,
  },

  // Upcoming
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  upcomingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.transparent.dark30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingName: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  upcomingDate: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },
  upcomingAmount: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: Colors.semantic.expense,
  },

  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
