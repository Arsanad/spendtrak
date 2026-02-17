// SPENDTRAK CINEMATIC EDITION - Bills Screen
// Performance optimized with useMemo and swipe-to-delete
import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Text, Dimensions, Platform, ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
import { SectionHeader } from '../../src/components/dashboard';
import { EmptyState } from '../../src/components/premium';
import { UtilitiesIcon, HomeExpenseIcon, PlusIcon, CalendarIcon, TrashIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = 100;

// Bill type
interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  iconType: 'utilities' | 'home';
  status: 'upcoming' | 'paid';
}

// Initial mock bills data
const initialBills: Bill[] = [
  { id: '1', name: 'Electricity', amount: 450, dueDate: '25', iconType: 'utilities', status: 'upcoming' },
  { id: '2', name: 'Internet', amount: 350, dueDate: '15', iconType: 'home', status: 'paid' },
  { id: '3', name: 'Rent', amount: 5000, dueDate: '1', iconType: 'home', status: 'upcoming' },
];

// Helper to get icon component
const getBillIcon = (iconType: string, color: string, size: number = 24) => {
  switch (iconType) {
    case 'utilities':
      return <UtilitiesIcon size={size} color={color} />;
    case 'home':
    default:
      return <HomeExpenseIcon size={size} color={color} />;
  }
};

// Swipeable Bill Card Component
interface SwipeableBillCardProps {
  bill: Bill;
  onPress?: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirmed: () => void;
  resetSwipe?: boolean;
  formatCurrency: (amount: number) => string;
}

const SwipeableBillCard: React.FC<SwipeableBillCardProps> = memo(({
  bill,
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
    marginBottom: itemHeight.value > 0 ? Spacing.md : 0,
  }));

  const isPaid = bill.status === 'paid';

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
          <GlassCard variant="default" onPress={onPress}>
            <View style={styles.billContent}>
              <View style={[styles.billIcon, isPaid && styles.billIconPaid]}>
                {getBillIcon(bill.iconType, isPaid ? Colors.text.tertiary : Colors.neon)}
              </View>
              <View style={styles.billInfo}>
                <GradientText variant={isPaid ? 'muted' : 'bright'} style={styles.billName}>{bill.name}</GradientText>
                <View style={styles.dueDateRow}>
                  <CalendarIcon size={14} color={Colors.text.tertiary} />
                  <GradientText variant="muted" style={styles.dueDate}>{t('bills.due')} {bill.dueDate}{t('bills.daySuffix')}</GradientText>
                </View>
              </View>
              {/* Bills are outgoing - red for unpaid, muted for paid */}
              <View style={styles.billAmount}>
                <GradientText variant={isPaid ? 'muted' : 'expense'} style={styles.amount}>
                  {formatCurrency(bill.amount)}
                </GradientText>
                {isPaid && <GradientText variant="muted" style={styles.paidLabel}>{t('common.done')}</GradientText>}
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

// Display name for debugging
SwipeableBillCard.displayName = 'SwipeableBillCard';

export default function BillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { format: formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  // Local bills state (for deletion)
  const [bills, setBills] = useState<Bill[]>(initialBills);

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Memoize filtered and calculated values
  const { upcomingBills, totalUpcoming } = useMemo(() => {
    const upcoming = bills.filter(b => b.status === 'upcoming');
    const total = upcoming.reduce((sum, b) => sum + b.amount, 0);
    return { upcomingBills: upcoming, totalUpcoming: total };
  }, [bills]);

  // Show delete confirmation modal
  const handleDeleteRequest = useCallback((bill: Bill) => {
    setBillToDelete(bill);
    setDeleteModalVisible(true);
  }, []);

  // Handle cancel - reset swipe position
  const handleDeleteCancel = useCallback(() => {
    if (billToDelete) {
      setResetSwipeId(billToDelete.id);
      // Clear the reset flag after a short delay
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setBillToDelete(null);
  }, [billToDelete]);

  // Actually delete the bill
  const handleDeleteConfirm = useCallback(() => {
    if (!billToDelete) return;

    setBills((prev) => prev.filter((bill) => bill.id !== billToDelete.id));
    setDeleteModalVisible(false);
    setBillToDelete(null);
  }, [billToDelete]);

  const handleEditBill = useCallback((bill: Bill) => {
    // Future: navigate to edit bill screen
    logger.general.debug('Edit bill:', bill.id);
  }, []);

  const renderBillItem = useCallback(({ item: bill }: ListRenderItemInfo<Bill>) => (
    <SwipeableBillCard
      bill={bill}
      onPress={() => handleEditBill(bill)}
      onDeleteRequest={() => handleDeleteRequest(bill)}
      onDeleteConfirmed={() => {}}
      resetSwipe={resetSwipeId === bill.id}
      formatCurrency={formatCurrency}
    />
  ), [handleEditBill, handleDeleteRequest, resetSwipeId, formatCurrency]);

  return (
    <View style={styles.container}>
      <Header title={t('settings.bills')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        {/* Bills are OUTGOING - use expense red */}
        <GlassCard variant="elevated" style={styles.summaryCard}>
          <GradientText variant="expense" style={styles.summaryLabel}>{t('settings.bills')}</GradientText>
          <GradientText variant="expense" style={styles.summaryAmount}>{formatCurrency(totalUpcoming)}</GradientText>
          <GradientText variant="muted" style={styles.summaryCount}>{upcomingBills.length} {t('bills.upcoming').toLowerCase()}</GradientText>
        </GlassCard>

        {/* Swipe Hint */}
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>{t('bills.swipeRightToDelete')}</Text>
        </View>

        {/* Bills List */}
        <View style={styles.section}>
          <SectionHeader title={t('bills.yourBills')} action={`${bills.length} ${t('common.total').toLowerCase()}`} />

          {bills.length > 0 ? (
            <FlatList
              data={bills}
              keyExtractor={(item) => item.id}
              renderItem={renderBillItem}
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
          ) : (
            <EmptyState
              icon={<UtilitiesIcon size={48} color={Colors.text.tertiary} />}
              title={t('bills.noBillsYet')}
              description={t('bills.tapToAddFirst')}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon={<PlusIcon size={24} color={Colors.void} />} style={styles.fab} onPress={() => triggerBlackout(() => router.push('/(modals)/add-bill'))} />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('bills.deleteBill')}
        message={t('bills.deleteConfirmMessage', { name: billToDelete?.name || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  gateContainer: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  summaryCard: { alignItems: 'center', marginBottom: Spacing.md },
  summaryLabel: { marginBottom: Spacing.xs },
  summaryAmount: { fontSize: FontSize.h1 },
  summaryCount: { marginTop: Spacing.xs },

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

  // Bill Card
  billContent: { flexDirection: 'row', alignItems: 'center' },
  billIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.transparent.neon10, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  billIconPaid: { backgroundColor: Colors.transparent.dark20 },
  billInfo: { flex: 1 },
  billName: { marginBottom: Spacing.xs },
  dueDateRow: { flexDirection: 'row', alignItems: 'center' },
  dueDate: { marginLeft: Spacing.xs, fontSize: FontSize.caption },
  billAmount: { alignItems: 'flex-end' },
  amount: {},
  paidLabel: { fontSize: FontSize.xs, marginTop: 2 },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.xxl },
});
