// SPENDTRAK CINEMATIC EDITION - Categories Management Screen
// Full category management with add, edit, delete functionality
// Performance optimized with React.memo and useMemo

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
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
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { FAB } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { Header } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import {
  PlusIcon, TrashIcon, ChevronRightIcon, EditIcon,
  FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon,
  HealthIcon, EducationIcon, TravelIcon, HomeIcon,
  UtilitiesIcon, GiftIcon, SubscriptionsIcon, InvestmentIcon,
  StarIcon, TrophyIcon, TargetIcon, DebtIcon, FilterIcon,
} from '../../src/components/icons';
import { useCategoryStore, SYSTEM_CATEGORIES, type Category } from '../../src/stores/categoryStore';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = 100;

// Map icon names to components
const ICON_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  FoodIcon,
  TransportIcon,
  ShoppingIcon,
  EntertainmentIcon,
  HealthIcon,
  EducationIcon,
  TravelIcon,
  HomeIcon,
  UtilitiesIcon,
  GiftIcon,
  SubscriptionsIcon,
  InvestmentIcon,
  StarIcon,
  TrophyIcon,
  TargetIcon,
  DebtIcon,
  FilterIcon,
  // Fallbacks
  GroceriesIcon: FoodIcon,
  IncomeIcon: InvestmentIcon,
  OtherIcon: FilterIcon,
};

// Get icon component by name
const getCategoryIcon = (iconName: string, color: string, size: number = 24) => {
  const IconComponent = ICON_MAP[iconName] || FilterIcon;
  return <IconComponent size={size} color={color} />;
};

// Swipeable Category Card Component (for custom categories)
interface SwipeableCategoryCardProps {
  category: Category;
  onPress: () => void;
  onDeleteRequest: () => void;
  resetSwipe?: boolean;
}

const SwipeableCategoryCard: React.FC<SwipeableCategoryCardProps> = memo(({
  category,
  onPress,
  onDeleteRequest,
  resetSwipe,
}) => {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(68);
  const opacity = useSharedValue(1);

  useEffect(() => {
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

  return (
    <View style={styles.swipeContainer}>
      {/* Delete background */}
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
        <Animated.View style={[styles.deleteIconContainer, deleteIconStyle]}>
          <TrashIcon size={20} color={Colors.void} />
          <Text style={styles.deleteText}>{t('common.delete')}</Text>
        </Animated.View>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <Pressable onPress={onPress} style={styles.categoryItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
              {getCategoryIcon(category.icon, category.color)}
            </View>
            <View style={styles.categoryInfo}>
              <GradientText variant="bright" style={styles.categoryName}>
                {category.name}
              </GradientText>
              <Text style={styles.categoryMeta}>{t('budgets.custom')}</Text>
            </View>
            <ChevronRightIcon size={18} color={Colors.text.tertiary} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// Display name for debugging
SwipeableCategoryCard.displayName = 'SwipeableCategoryCard';

// Static Category Card (for system categories) - memoized
const StaticCategoryCard: React.FC<{ category: Category }> = memo(({ category }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.categoryItem}>
      <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
        {getCategoryIcon(category.icon, category.color)}
      </View>
      <View style={styles.categoryInfo}>
        <GradientText variant="subtle" style={styles.categoryName}>
          {category.name}
        </GradientText>
      </View>
      <Badge variant="default" size="small">{t('settings.systemDefault')}</Badge>
    </View>
  );
});

// Display name for debugging
StaticCategoryCard.displayName = 'StaticCategoryCard';

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  // Store
  const { customCategories, deleteCategory, getAllCategories } = useCategoryStore();

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Handlers
  const handleDeleteRequest = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (categoryToDelete) {
      setResetSwipeId(categoryToDelete.id);
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setCategoryToDelete(null);
  }, [categoryToDelete]);

  const handleDeleteConfirm = useCallback(() => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
    }
    setDeleteModalVisible(false);
    setCategoryToDelete(null);
  }, [categoryToDelete, deleteCategory]);

  const handleEditCategory = useCallback((category: Category) => {
    triggerBlackout(() => router.push({
      pathname: '/(modals)/category-editor',
      params: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
      },
    }));
  }, [router, triggerBlackout]);

  const handleAddCategory = useCallback(() => {
    triggerBlackout(() => router.push('/(modals)/category-editor'));
  }, [router, triggerBlackout]);

  return (
    <View style={styles.container}>

      <Header title={t('categories.title')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <GlassCard variant="outlined" size="compact" style={styles.infoCard}>
          <GradientText variant="muted" style={styles.infoText}>
            {t('categories.systemCategoriesInfo')}
          </GradientText>
        </GlassCard>

        {/* Custom Categories Section */}
        {customCategories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={t('categories.title')}
              action={`${customCategories.length}`}
            />
            <GlassCard variant="default" style={styles.listCard}>
              {customCategories.map((category, index) => (
                <View
                  key={category.id}
                  style={index < customCategories.length - 1 ? styles.itemBorder : undefined}
                >
                  <SwipeableCategoryCard
                    category={category}
                    onPress={() => handleEditCategory(category)}
                    onDeleteRequest={() => handleDeleteRequest(category)}
                    resetSwipe={resetSwipeId === category.id}
                  />
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* System Categories Section */}
        <View style={styles.section}>
          <SectionHeader
            title={t('categories.title')}
            action={`${SYSTEM_CATEGORIES.length}`}
          />
          <GlassCard variant="default" style={styles.listCard}>
            {SYSTEM_CATEGORIES.map((category, index) => (
              <View
                key={category.id}
                style={index < SYSTEM_CATEGORIES.length - 1 ? styles.itemBorder : undefined}
              >
                <StaticCategoryCard category={category} />
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Add Button (alternative to FAB) */}
        <Pressable onPress={handleAddCategory} style={styles.addButton}>
          <LinearGradient
            colors={[Colors.transparent.neon10, Colors.transparent.neon05]}
            style={styles.addButtonGradient}
          >
            <PlusIcon size={20} color={Colors.neon} />
            <GradientText variant="bright" style={styles.addButtonText}>
              {t('common.add')} {t('categories.title')}
            </GradientText>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={<PlusIcon size={24} color={Colors.void} />}
        onPress={handleAddCategory}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`${t('common.delete')} ${t('categories.title')}`}
        message={`${categoryToDelete?.name || ''}`}
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
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Info Card
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: FontSize.caption,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: Spacing.lg,
  },

  // List Card
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },

  // Category Item
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.void,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  categoryMeta: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },

  // Item Border
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },

  // Swipeable
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
    justifyContent: 'center',
    paddingLeft: Spacing.lg,
  },
  deleteIconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  deleteText: {
    color: Colors.void,
    fontSize: FontSize.caption,
    fontFamily: FontFamily.semiBold,
  },

  // Add Button
  addButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.transparent.neon30,
    borderStyle: 'dashed',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  addButtonText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
