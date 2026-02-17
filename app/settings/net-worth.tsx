// SPENDTRAK CINEMATIC EDITION - Net Worth Screen
// Performance optimized with React.memo and useMemo
import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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
import { useTranslation } from '../../src/context/LanguageContext';
import { useCurrency } from '../../src/context/CurrencyContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { FAB } from '../../src/components/ui/Button';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { Header } from '../../src/components/navigation';
import { NetWorthIcon, TrendUpIcon, PlusIcon, TrashIcon } from '../../src/components/icons';
import {
  getDevAssets,
  getDevLiabilities,
  deleteDevAsset,
  deleteDevLiability,
  autoSaveNetWorthSnapshot,
  DevAsset,
  DevLiability,
} from '../../src/services/devStorage';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';

const DELETE_THRESHOLD = 100;

// Swipeable Item Component
interface SwipeableItemProps {
  item: DevAsset | DevLiability;
  type: 'asset' | 'liability';
  onDeleteRequest: () => void;
  resetSwipe?: boolean;
  formatCurrency: (amount: number) => string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = memo(({
  item,
  type,
  onDeleteRequest,
  resetSwipe,
  formatCurrency,
}) => {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (resetSwipe) {
      translateX.value = withSpring(0);
    }
  }, [resetSwipe]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > DELETE_THRESHOLD) {
        runOnJS(onDeleteRequest)();
      } else {
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
    return { opacity: deleteOpacity };
  });

  const deleteIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD / 2, DELETE_THRESHOLD],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const isLiability = type === 'liability';
  const iconColor = isLiability ? Colors.semantic.expense : Colors.semantic.bronze;
  const textVariant = isLiability ? 'expense' : 'silver';

  return (
    <View style={styles.swipeContainer}>
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
          <View style={styles.listItem}>
            <View style={[styles.itemIcon, isLiability && styles.liabilityIcon]}>
              <Ionicons name={(item.icon || 'wallet-outline') as any} size={20} color={iconColor} />
            </View>
            <GradientText variant={isLiability ? 'expense' : 'subtle'} style={styles.itemName}>
              {item.name}
            </GradientText>
            <GradientText variant={textVariant} style={styles.itemValue}>
              {formatCurrency(item.value)}
            </GradientText>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// Display name for debugging
SwipeableItem.displayName = 'SwipeableItem';

export default function NetWorthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const { format: formatCurrency } = useCurrency();
  const [assets, setAssets] = useState<DevAsset[]>([]);
  const [liabilities, setLiabilities] = useState<DevLiability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ item: DevAsset | DevLiability; type: 'asset' | 'liability' } | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [assetsData, liabilitiesData] = await Promise.all([
        getDevAssets(),
        getDevLiabilities(),
      ]);
      setAssets(assetsData);
      setLiabilities(liabilitiesData);

      // Auto-save snapshot when viewing net worth (tracks changes over time)
      // This runs in background - don't await
      autoSaveNetWorthSnapshot().catch(() => {
        // Silently fail - not critical for UI
      });
    } catch (error) {
      logger.general.error('Error loading net worth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = useCallback((item: DevAsset | DevLiability, type: 'asset' | 'liability') => {
    setItemToDelete({ item, type });
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (itemToDelete) {
      setResetSwipeId(itemToDelete.item.id);
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setItemToDelete(null);
  }, [itemToDelete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'asset') {
        await deleteDevAsset(itemToDelete.item.id);
      } else {
        await deleteDevLiability(itemToDelete.item.id);
      }
      await loadData();
    } catch (error) {
      logger.general.error('Failed to delete item:', error);
    }

    setDeleteModalVisible(false);
    setItemToDelete(null);
  }, [itemToDelete]);

  // Calculate totals with useMemo
  const { totalAssets, totalLiabilities, netWorth } = useMemo(() => {
    const assetsTotal = assets.reduce((sum, a) => sum + a.value, 0);
    const liabilitiesTotal = liabilities.reduce((sum, l) => sum + l.value, 0);
    return {
      totalAssets: assetsTotal,
      totalLiabilities: liabilitiesTotal,
      netWorth: assetsTotal - liabilitiesTotal,
    };
  }, [assets, liabilities]);

  return (
    <View style={styles.container}>
      <Header title={t('netWorth.title')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        {/* Net Worth Hero Card */}
        <GlassCard variant="elevated" style={styles.heroCard}>
          <NetWorthIcon size={40} color={Colors.semantic.bronze} />
          <GradientText variant="bronze" style={styles.heroLabel}>{t('settings.totalNetWorth')}</GradientText>
          <GradientText variant="balance" style={styles.heroAmount}>{formatCurrency(netWorth)}</GradientText>
          {netWorth > 0 && (
            <View style={styles.changeRow}>
              <TrendUpIcon size={16} color={Colors.semantic.income} />
              <GradientText variant="income" style={styles.changeText}>{t('settings.positiveNetWorth')}</GradientText>
            </View>
          )}
        </GlassCard>

        {/* Swipe Hint */}
        {(assets.length > 0 || liabilities.length > 0) && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>{t('settings.swipeRightToDelete')}</Text>
          </View>
        )}

        {/* Assets Section */}
        <View style={styles.sectionHeader}>
          <GradientText variant="bronze" style={styles.sectionLabel}>{t('netWorth.assets')}</GradientText>
          <Pressable onPress={() => triggerBlackout(() => router.push('/(modals)/add-asset' as any))} style={styles.addButton}>
            <PlusIcon size={16} color={Colors.neon} />
            <Text style={styles.addButtonText}>{t('common.add')}</Text>
          </Pressable>
        </View>
        <GlassCard variant="default" style={styles.listCard}>
          {assets.length === 0 ? (
            <View style={styles.emptyState}>
              <GradientText variant="muted">{t('settings.noAssetsYet')}</GradientText>
            </View>
          ) : (
            assets.map((asset, index) => (
              <View key={asset.id} style={index < assets.length - 1 ? styles.itemBorder : undefined}>
                <SwipeableItem
                  item={asset}
                  type="asset"
                  onDeleteRequest={() => handleDeleteRequest(asset, 'asset')}
                  resetSwipe={resetSwipeId === asset.id}
                  formatCurrency={formatCurrency}
                />
              </View>
            ))
          )}
          {assets.length > 0 && (
            <View style={styles.totalRow}>
              <GradientText variant="bronze">{t('netWorth.totalAssets')}</GradientText>
              <GradientText variant="bronze">{formatCurrency(totalAssets)}</GradientText>
            </View>
          )}
        </GlassCard>

        {/* Liabilities Section */}
        <View style={styles.sectionHeader}>
          <GradientText variant="expense" style={styles.sectionLabel}>{t('netWorth.liabilities')}</GradientText>
          <Pressable onPress={() => triggerBlackout(() => router.push('/(modals)/add-liability' as any))} style={styles.addButton}>
            <PlusIcon size={16} color={Colors.neon} />
            <Text style={styles.addButtonText}>{t('common.add')}</Text>
          </Pressable>
        </View>
        <GlassCard variant="default" style={styles.listCard}>
          {liabilities.length === 0 ? (
            <View style={styles.emptyState}>
              <GradientText variant="muted">{t('settings.noLiabilitiesYet')}</GradientText>
            </View>
          ) : (
            liabilities.map((liability, index) => (
              <View key={liability.id} style={index < liabilities.length - 1 ? styles.itemBorder : undefined}>
                <SwipeableItem
                  item={liability}
                  type="liability"
                  onDeleteRequest={() => handleDeleteRequest(liability, 'liability')}
                  resetSwipe={resetSwipeId === liability.id}
                  formatCurrency={formatCurrency}
                />
              </View>
            ))
          )}
          {liabilities.length > 0 && (
            <View style={styles.totalRow}>
              <GradientText variant="expense">{t('netWorth.totalLiabilities')}</GradientText>
              <GradientText variant="expense">{formatCurrency(totalLiabilities)}</GradientText>
            </View>
          )}
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={itemToDelete?.type === 'asset' ? t('settings.deleteAsset') : t('settings.deleteLiability')}
        message={t('settings.deleteConfirmMessage').replace('{{name}}', itemToDelete?.item.name || '')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  gateContainer: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  heroCard: { alignItems: 'center', marginBottom: Spacing.lg },
  heroLabel: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  heroAmount: { fontSize: 36 },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  changeText: { marginLeft: Spacing.xs },

  swipeHint: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  swipeHintText: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.transparent.neon10,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: Colors.neon,
    fontSize: FontSize.caption,
    fontFamily: FontFamily.medium,
    marginLeft: Spacing.xs,
  },

  listCard: { padding: 0, overflow: 'hidden' },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },

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
    borderRadius: 0,
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

  listItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: 'transparent' },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  itemIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.transparent.neon10, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  liabilityIcon: { backgroundColor: Colors.transparent.dark20 },
  itemName: { flex: 1, marginRight: Spacing.md },
  itemValue: { textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.lg, backgroundColor: Colors.transparent.dark20 },
});
