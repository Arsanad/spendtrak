// SPENDTRAK CINEMATIC EDITION - Features Drawer
// Fade through black transitions to feature pages
// Integrated with Feature Gating System
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Dimensions, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../design/cinematic';
import { GradientText, GradientTitle } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CloseIcon,
  BudgetIcon,
  SubscriptionsIcon,
  TargetIcon,
  DebtIcon,
  NetWorthIcon,
  InvestmentIcon,
  CalendarIcon,
  GroupIcon,
  TrophyIcon,
  ChevronRightIcon,
} from '../icons';
import { useTranslation } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useUpgradePrompt } from './UpgradePrompt';
import { type FeatureName, TIER_CONFIGS } from '../../config/features';
import { lightTap, deleteBuzz } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

interface FeatureItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  route: string;
  isPro?: boolean;
  featureName?: FeatureName; // Maps to feature gating system
}

// Flat list of features - no section headers
// Order: Budgets, Goals, Subscriptions, Debts, Bills, NetWorth, Investments, Household, Achievements
const features: FeatureItem[] = [
  {
    id: 'budgets',
    labelKey: 'budgets.title',
    icon: <BudgetIcon size={22} color={Colors.neon} />,
    route: '/settings/budgets',
    isPro: false,
    featureName: 'budgets',
  },
  {
    id: 'goals',
    labelKey: 'goals.title',
    icon: <TargetIcon size={22} color={Colors.neon} />,
    route: '/settings/goals',
    isPro: false,
    featureName: 'goals',
  },
  {
    id: 'subscriptions',
    labelKey: 'subscriptions.title',
    icon: <SubscriptionsIcon size={22} color={Colors.neon} />,
    route: '/settings/subscriptions',
    isPro: false,
    featureName: 'subscriptions_tracking',
  },
  {
    id: 'debts',
    labelKey: 'settings.debtManagement',
    icon: <DebtIcon size={22} color={Colors.neon} />,
    route: '/settings/debts',
    isPro: false,
    featureName: 'debt_tracking',
  },
  {
    id: 'bills',
    labelKey: 'settings.billCalendar',
    icon: <CalendarIcon size={22} color={Colors.neon} />,
    route: '/settings/bills',
    isPro: false,
    featureName: 'bill_calendar',
  },
  {
    id: 'networth',
    labelKey: 'netWorth.title',
    icon: <NetWorthIcon size={22} color={Colors.neon} />,
    route: '/settings/net-worth',
    isPro: false,
    featureName: 'net_worth',
  },
  {
    id: 'investments',
    labelKey: 'categories.investments',
    icon: <InvestmentIcon size={22} color={Colors.neon} />,
    route: '/settings/investments',
    isPro: false,
    featureName: 'investment_tracking',
  },
  {
    id: 'household',
    labelKey: 'settings.household',
    icon: <GroupIcon size={22} color={Colors.neon} />,
    route: '/settings/household',
    isPro: false,
    featureName: 'household_members',
  },
  {
    id: 'achievements',
    labelKey: 'settings.achievements',
    icon: <TrophyIcon size={22} color={Colors.neon} />,
    route: '/settings/achievements',
    isPro: false,
    // No featureName - achievements are free
  },
];

export interface FeatureDrawerProps {
  visible: boolean;
  onClose: () => void;
}

// PERFORMANCE OPTIMIZED: Fast, snappy animations
const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_EXPO = Easing.bezier(0.7, 0, 0.84, 0);
// Reduced durations for instant feel
const OPEN_DURATION = 150;
const CLOSE_DURATION = 120;

// Faster spring for snappy drawer animation
const DRAWER_SPRING_CONFIG = {
  damping: 20,
  stiffness: 400,
  mass: 0.4,
  overshootClamping: true,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
};

export const FeatureDrawer: React.FC<FeatureDrawerProps> = React.memo(({ visible, onClose }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const { canAccess, currentTier, getFeatureAccess } = useFeatureAccess();
  const { showPrompt, UpgradePromptComponent } = useUpgradePrompt();
  const progress = useSharedValue(0); // 0 = closed, 1 = open

  // PERFORMANCE: Use timing for both open/close - faster than spring
  useEffect(() => {
    if (visible) {
      // Fast timing for instant feel
      progress.value = withTiming(1, {
        duration: OPEN_DURATION,
        easing: EASE_OUT_EXPO,
      });
    } else {
      // Snappy close
      progress.value = withTiming(0, {
        duration: CLOSE_DURATION,
        easing: EASE_IN_EXPO,
      });
    }
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => {
    // PERFORMANCE: Simplified animation - just translateX (GPU accelerated)
    const translateX = interpolate(progress.value, [0, 1], [-DRAWER_WIDTH, 0]);

    return {
      transform: [{ translateX }],
      // No opacity change - reduces compositing work
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    // PERFORMANCE: Simpler opacity transition
    const opacity = interpolate(progress.value, [0, 1], [0, 0.8]);
    return {
      opacity,
      pointerEvents: progress.value > 0.01 ? 'auto' as const : 'none' as const,
    };
  });

  // PERFORMANCE: Simplified header animation
  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  });

  // PERFORMANCE: Simplified divider animation
  const dividerStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  });

  const handleFeaturePress = useCallback((feature: FeatureItem) => {
    // Check if feature requires premium access
    if (feature.featureName) {
      const access = getFeatureAccess(feature.featureName);

      if (!access.isEnabled || access.needsUpgrade) {
        // Show upgrade prompt instead of navigating
        // IMPORTANT: Don't close drawer - show modal on top of it
        // Closing drawer first caused modal to appear and disappear immediately
        deleteBuzz();
        showPrompt(feature.featureName);
        return;
      }
    }

    // User has access - navigate to feature
    onClose();
    // Fade through black transition - app identity
    setTimeout(() => {
      triggerBlackout(() => {
        router.push(feature.route as Parameters<typeof router.push>[0]);
      });
    }, 100); // Small delay for drawer to start closing
  }, [getFeatureAccess, onClose, showPrompt, triggerBlackout, router]);

  // Check if a feature is locked based on tier
  const isFeatureLocked = useCallback((feature: FeatureItem): boolean => {
    if (!feature.featureName) return false;
    const access = getFeatureAccess(feature.featureName);
    return !access.isEnabled || access.needsUpgrade;
  }, [getFeatureAccess]);

  // PERFORMANCE: Always render, use opacity/transform to hide
  // This avoids expensive mount/unmount cycles
  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { width: DRAWER_WIDTH }, drawerStyle]}>
          <LinearGradient
            colors={[Colors.darker, Colors.void]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Gradient border on right edge */}
          <LinearGradient
            colors={[Colors.neon, Colors.deep, Colors.darker]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.rightBorder}
          />

          <View style={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
            {/* Header */}
            <Animated.View style={[styles.header, headerStyle]}>
              <GradientTitle style={styles.title}>{t('navigation.features')}</GradientTitle>
              <IconButton
                icon={<CloseIcon size={20} color={Colors.text.primary} />}
                onPress={onClose}
                variant="ghost"
              />
            </Animated.View>

            {/* Divider */}
            <Animated.View style={dividerStyle}>
              <LinearGradient
                colors={['transparent', Colors.neon, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.divider}
              />
            </Animated.View>

            {/* Features List */}
            <ScrollView
              style={styles.featuresList}
              contentContainerStyle={styles.featuresContent}
              showsVerticalScrollIndicator={false}
            >
              {features.map((feature, index) => (
                <FeatureListItem
                  key={feature.id}
                  feature={feature}
                  label={t(feature.labelKey)}
                  premiumText={t('common.premium')}
                  onPress={() => handleFeaturePress(feature)}
                  index={index}
                  drawerVisible={visible}
                  isLocked={isFeatureLocked(feature)}
                  currentTier={currentTier}
                />
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      {/* Upgrade Prompt Modal */}
      <UpgradePromptComponent />
    </>
  );
});

// Feature List Item Component - Horizontal Row Layout with fast staggered reveal
// PERFORMANCE: Reduced delays for instant feel
const STAGGER_DELAY = 15; // ms between each item (was 50)
const ITEM_BASE_DELAY = 30; // ms base delay (was 120)
const ITEM_SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
};

// PERFORMANCE: Memoized to prevent unnecessary re-renders
const FeatureListItem = React.memo<{
  feature: FeatureItem;
  label: string;
  premiumText: string;
  onPress: () => void;
  index: number;
  drawerVisible: boolean;
  isLocked?: boolean;
  currentTier?: string;
}>(({ feature, label, premiumText, onPress, index, drawerVisible, isLocked = false, currentTier }) => {
  const itemProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (drawerVisible) {
      // PERFORMANCE: Faster stagger with reduced delays
      itemProgress.value = withDelay(
        ITEM_BASE_DELAY + index * STAGGER_DELAY,
        withTiming(1, { duration: 120, easing: EASE_OUT_EXPO })
      );
    } else {
      // Instant fade out on close
      itemProgress.value = withTiming(0, { duration: 80, easing: EASE_IN_EXPO });
    }
  }, [drawerVisible, index]);

  const animatedStyle = useAnimatedStyle(() => {
    // Simplified entrance - just slide and fade (faster than rotate + scale)
    const translateX = interpolate(itemProgress.value, [0, 1], [-20, 0]);

    return {
      transform: [
        { translateX },
        { scale: pressScale.value },
      ],
      opacity: itemProgress.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }}
        style={styles.featureItem}
      >
        <GlassCard
          variant="default"
          size="compact"
          style={[styles.featureCard, isLocked && styles.featureCardLocked]}
        >
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, isLocked && styles.featureIconLocked]}>
              {feature.icon}
            </View>
            <GradientText
              variant={isLocked ? 'subtle' : 'bright'}
              style={isLocked ? [styles.featureLabel, styles.featureLabelLocked] : styles.featureLabel}
            >
              {label}
            </GradientText>
            {isLocked ? (
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={10} color="#FFD700" />
                <Text style={styles.lockBadgeText}>UPGRADE</Text>
              </View>
            ) : feature.isPro && currentTier === 'free' && (
              <Badge variant="warning" size="small" style={styles.premiumBadge}>
                {premiumText}
              </Badge>
            )}
            {isLocked ? (
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            ) : (
              <ChevronRightIcon size={18} color={Colors.text.tertiary} />
            )}
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: Colors.void,
    ...Shadows.lg,
  },
  rightBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {},
  divider: {
    height: 1,
    marginBottom: Spacing.lg,
  },
  featuresList: {
    flex: 1,
  },
  featuresContent: {
    paddingBottom: Spacing.xxl,
  },
  featureItem: {
    marginBottom: Spacing.sm,
  },
  featureCard: {
    // Minimal padding - the row handles internal spacing
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.transparent.deep20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureLabel: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  premiumBadge: {
    marginHorizontal: Spacing.sm,
  },
  featureCardLocked: {
    opacity: 0.7,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIconLocked: {
    opacity: 0.5,
  },
  featureLabelLocked: {
    opacity: 0.6,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 'auto',
    marginRight: Spacing.sm,
    gap: 4,
  },
  lockBadgeText: {
    fontFamily: FontFamily.bold, // Cinzel_700Bold
    fontSize: 10,
    color: '#FFD700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default FeatureDrawer;
