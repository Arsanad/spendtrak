// SPENDTRAK CINEMATIC EDITION - Subscription Screen
// Real RevenueCat integration for in-app purchases

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withDelay,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { PurchasesPackage } from 'react-native-purchases';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { easeInOutQuad } from '../../src/config/easingFunctions';
import { useTranslation } from '../../src/context/LanguageContext';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/navigation';
import { StarIcon, CheckIcon, CloseIcon, ChevronRightIcon, DiamondIcon } from '../../src/components/icons';
import {
  usePurchasesStore,
  openSubscriptionManagement,
  getTrialDurationString,
  TIER_CONFIGS,
  type SubscriptionTier,
  type BillingPeriod,
} from '../../src/stores/purchasesStore';
import { PRODUCTS } from '../../src/config/revenuecat';
import { successBuzz, errorBuzz } from '../../src/utils/haptics';
import { useTransition } from '../../src/context/TransitionContext';

// Premium branding colors - use Colors.premium.gold from theme
const PREMIUM_GOLD = Colors.premium.gold;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// PLAN FEATURES - What each tier includes
// ============================================

interface PlanFeatureItem {
  text: string;
  free: boolean | string;
  premium: boolean | string; // string for 'Unlimited' or other text
}

const PLAN_FEATURES: PlanFeatureItem[] = [
  // === ALL NON-AI FEATURES: FREE & UNLIMITED ===
  { text: 'Expense & income tracking', free: true, premium: true },
  { text: 'Multi-currency support', free: true, premium: true },
  { text: 'Unlimited budgets', free: true, premium: true },
  { text: 'Unlimited savings goals', free: true, premium: true },
  { text: 'Unlimited custom categories', free: true, premium: true },
  { text: 'Full transaction history', free: true, premium: true },
  { text: 'Advanced analytics', free: true, premium: true },
  { text: 'Subscription tracking', free: true, premium: true },
  { text: 'Bill calendar & reminders', free: true, premium: true },
  { text: 'Debt management', free: true, premium: true },
  { text: 'Investment tracking', free: true, premium: true },
  { text: 'Net worth dashboard', free: true, premium: true },
  { text: 'Household sharing', free: true, premium: true },
  { text: 'Data export (CSV, PDF, JSON)', free: true, premium: true },
  { text: 'Behavioral intelligence', free: true, premium: true },
  { text: 'Achievements & gamification', free: true, premium: true },

  // === AI FEATURES: PREMIUM ONLY ===
  { text: 'AI receipt scanning', free: false, premium: 'Unlimited' },
  { text: 'AI Financial Consultant (QUANTUM)', free: false, premium: 'Unlimited' },
  { text: 'AI health recommendations', free: false, premium: true },
  { text: 'Gmail auto-import', free: false, premium: true },
  { text: 'Outlook auto-import', free: false, premium: true },
  { text: 'iCloud email forwarding', free: false, premium: true },
];

// Fallback prices if RevenueCat not loaded
const FALLBACK_PRICES = {
  premium: { monthly: '$9.99', yearly: '$79.99', savingsPercent: 33 },
};

// ============================================
// MIRROR SHINE EFFECT
// ============================================

const MirrorShine: React.FC<{ width: number; height: number; delay?: number; color?: string }> = ({
  width,
  height,
  delay = 3000,
  color = PREMIUM_GOLD,
}) => {
  const translateX = useSharedValue(-width * 0.6);

  useEffect(() => {
    const startAnimation = () => {
      translateX.value = -width * 0.6;
      translateX.value = withDelay(
        delay,
        withTiming(width * 1.5, { duration: 1200, easing: easeInOutQuad })
      );
    };

    startAnimation();
    const interval = setInterval(startAnimation, delay + 1500);
    return () => clearInterval(interval);
  }, [width, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { skewX: '-25deg' }],
  }));

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: -20, left: 0, width: width * 0.5, height: height + 40, zIndex: 10 },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          'transparent',
          `rgba(${r}, ${g}, ${b}, 0.03)`,
          `rgba(${r}, ${g}, ${b}, 0.08)`,
          'rgba(255, 255, 255, 0.15)',
          'rgba(255, 255, 255, 0.4)',
          'rgba(255, 255, 255, 0.15)',
          `rgba(${r}, ${g}, ${b}, 0.08)`,
          `rgba(${r}, ${g}, ${b}, 0.03)`,
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
};

// ============================================
// MAIN SUBSCRIPTION SCREEN
// ============================================

export default function SubscriptionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const insets = useSafeAreaInsets();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<'premium' | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Purchases Store
  const {
    subscriptionStatus,
    offerings,
    isLoading,
    isPurchasing,
    isRestoring,
    error,
    initialize,
    purchasePackage,
    restorePurchases,
    getPackageForPlan,
    clearError,
  } = usePurchasesStore();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, []);

  // Get pricing info
  const getPricing = useCallback(() => {
    const pricing = offerings?.premiumPricing;
    const fallback = FALLBACK_PRICES.premium;

    return {
      monthly: pricing?.monthlyPrice || fallback.monthly,
      yearly: pricing?.yearlyPrice || fallback.yearly,
      savingsPercent: pricing?.yearlySavingsPercent || fallback.savingsPercent,
    };
  }, [offerings]);

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    const pkg = getPackageForPlan('premium', billingPeriod);

    if (!pkg) {
      // Provide more detailed error for debugging
      let errorMessage = 'This plan is not available. ';
      if (!offerings) {
        errorMessage += 'RevenueCat offerings not loaded. Please check your API keys and network connection.';
      } else if (!offerings.premiumMonthly && !offerings.premiumYearly) {
        errorMessage += 'No premium packages found. Please verify your RevenueCat product configuration.';
      } else {
        errorMessage += `The ${billingPeriod} plan is not configured.`;
      }

      Alert.alert(
        t('common.error'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
      return;
    }

    const result = await purchasePackage(pkg);

    if (result.success) {
      successBuzz();
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } else if (result.error && result.error !== 'cancelled') {
      errorBuzz();
      Alert.alert(t('common.error'), result.error, [{ text: t('common.ok') }]);
    }
  }, [billingPeriod, getPackageForPlan, purchasePackage, t]);

  // Handle restore
  const handleRestore = useCallback(async () => {
    const result = await restorePurchases();

    if (result.success && result.message?.includes('restored')) {
      successBuzz();
      Alert.alert(t('common.success'), result.message, [{ text: t('common.ok') }]);
    } else {
      Alert.alert(
        result.success ? 'Restore Complete' : t('common.error'),
        result.message || 'No active subscriptions found.',
        [{ text: t('common.ok') }]
      );
    }
  }, [restorePurchases, t]);

  // Get trial info for a package
  const getTrialInfo = useCallback((): string | null => {
    const pkg = getPackageForPlan('premium', billingPeriod);
    if (!pkg) return null;
    return getTrialDurationString(pkg);
  }, [billingPeriod, getPackageForPlan]);

  // Check if user is on a specific tier
  const isCurrentTier = (tier: SubscriptionTier) => subscriptionStatus.tier === tier;
  const hasActiveSubscription = subscriptionStatus.tier !== 'free';

  // Format expiration date
  const formatExpirationDate = () => {
    if (!subscriptionStatus.expirationDate) return null;
    return format(subscriptionStatus.expirationDate, 'MMMM d, yyyy');
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('settings.subscription')}
        showBack
        onBack={() => triggerBlackout(() => router.back())}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Subscription Status */}
        {hasActiveSubscription && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <GlassCard variant="glow" style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={styles.statusBadge}>
                  <StarIcon size={16} color={Colors.void} />
                  <Text style={styles.statusBadgeText}>
                    {subscriptionStatus.tier.toUpperCase()}
                  </Text>
                </View>
                {subscriptionStatus.isTrialActive && (
                  <View style={styles.trialBadge}>
                    <Text style={styles.trialBadgeText}>TRIAL</Text>
                  </View>
                )}
              </View>

              <Text style={styles.statusTitle}>
                Premium Member
              </Text>

              {subscriptionStatus.expirationDate && (
                <Text style={styles.statusExpiry}>
                  {subscriptionStatus.willRenew ? 'Renews' : 'Expires'} {formatExpirationDate()}
                </Text>
              )}

              <Pressable
                style={styles.manageButton}
                onPress={openSubscriptionManagement}
              >
                <Text style={styles.manageButtonText}>Manage Subscription</Text>
                <ChevronRightIcon size={16} color={Colors.text.secondary} />
              </Pressable>
            </GlassCard>
          </Animated.View>
        )}

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <StarIcon size={48} color={Colors.neon} />
          </View>
          <GradientTitle style={styles.heroTitle}>
            {hasActiveSubscription ? 'Manage Your Plan' : t('settings.chooseYourPlan')}
          </GradientTitle>
          <GradientText variant="muted" style={styles.heroSubtitle}>
            {hasActiveSubscription
              ? 'Change or upgrade your subscription'
              : t('settings.unlockFullExperience')}
          </GradientText>
        </Animated.View>

        {/* Billing Period Toggle */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.toggleContainer}>
          <GlassCard variant="default" style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggleButton, billingPeriod === 'monthly' && styles.toggleButtonActive]}
                onPress={() => setBillingPeriod('monthly')}
              >
                <Text style={[styles.toggleText, billingPeriod === 'monthly' && styles.toggleTextActive]}>
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleButton, billingPeriod === 'yearly' && styles.toggleButtonActive]}
                onPress={() => setBillingPeriod('yearly')}
              >
                <Text style={[styles.toggleText, billingPeriod === 'yearly' && styles.toggleTextActive]}>
                  Yearly
                </Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>SAVE 33%</Text>
                </View>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Plan Cards - Side by Side */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.plansRow}>
          {/* Free Plan Card */}
          <View style={styles.planCardOuter}>
          <View style={styles.freePlanCard}>
            <View style={styles.planIconCircle}>
              <StarIcon size={24} color={Colors.neon} />
            </View>
            <Text style={styles.planLabel}>FREE</Text>
            <Text style={styles.freePlanPrice}>$0</Text>
            <Text style={styles.freePlanPeriod}>Forever</Text>
            {isCurrentTier('free') && (
              <View style={styles.currentBadgeSmall}>
                <Text style={styles.currentBadgeSmallText}>CURRENT</Text>
              </View>
            )}
          </View>
          </View>

          {/* Premium Plan Card */}
          <View style={styles.planCardOuter}>
          <View style={styles.premiumPlanCardWrapper}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FFD700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumPlanCard}
            >
              <MirrorShine width={(SCREEN_WIDTH - 48 - 12) / 2} height={200} delay={2500} color="#FFFFFF" />
              <View style={styles.premiumIconCircle}>
                <DiamondIcon size={24} color={PREMIUM_GOLD} />
              </View>
              <Text style={styles.premiumLabel}>PREMIUM</Text>
              <View style={styles.premiumPriceRow}>
                <Text style={styles.premiumDollarSign}>$</Text>
                <Text style={styles.premiumPlanPrice}>
                  {billingPeriod === 'monthly' ? '9.99' : '79.99'}
                </Text>
              </View>
              <Text style={styles.premiumPlanPeriod}>
                /{billingPeriod === 'monthly' ? 'month' : 'year'}
              </Text>
              {getTrialInfo() && !isCurrentTier('premium') && (
                <Text style={styles.premiumTrialText}>{getTrialInfo()} free</Text>
              )}
              {isCurrentTier('premium') ? (
                <View style={styles.currentBadgePremium}>
                  <Text style={styles.currentBadgePremiumText}>CURRENT</Text>
                </View>
              ) : (
                <Pressable
                  style={styles.subscribeButton}
                  onPress={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color={PREMIUM_GOLD} />
                  ) : (
                    <Text style={styles.subscribeButtonText}>
                      {getTrialInfo() ? 'START TRIAL' : 'SUBSCRIBE'}
                    </Text>
                  )}
                </Pressable>
              )}
            </LinearGradient>
          </View>
          </View>
        </Animated.View>

        {/* Feature Comparison */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.comparisonSection}>
          <GradientText variant="bright" style={styles.comparisonTitle}>
            {t('settings.featureComparison')}
          </GradientText>

          <GlassCard variant="default" style={styles.comparisonCard} noPadding>
            <View style={styles.tableWrapper}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.featureColumnWide}>
                  <Text style={styles.tableHeaderText}>Feature</Text>
                </View>
                <View style={styles.planColumn}>
                  <Text style={styles.tableHeaderText}>Free</Text>
                </View>
                <View style={styles.planColumn}>
                  <Text style={[styles.tableHeaderText, { color: PREMIUM_GOLD }]}>Premium</Text>
                </View>
              </View>

              {/* Table Rows */}
              {PLAN_FEATURES.map((feature, index) => (
                <View
                  key={feature.text}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowAlt,
                    index === PLAN_FEATURES.length - 1 && styles.tableRowLast,
                  ]}
                >
                  <View style={styles.featureColumnWide}>
                    <Text style={styles.featureText} numberOfLines={2}>{feature.text}</Text>
                  </View>
                  <View style={styles.planColumn}>
                    {typeof feature.free === 'string' ? (
                      <Text style={styles.limitValueText}>{feature.free}</Text>
                    ) : feature.free ? (
                      <CheckIcon size={14} color={Colors.semantic.success} />
                    ) : (
                      <CloseIcon size={14} color={Colors.text.tertiary} />
                    )}
                  </View>
                  <View style={styles.planColumn}>
                    {typeof feature.premium === 'string' ? (
                      <Text style={feature.premium === 'Unlimited' ? styles.unlimitedText : styles.limitValueText}>
                        {feature.premium}
                      </Text>
                    ) : feature.premium ? (
                      <CheckIcon size={14} color={PREMIUM_GOLD} />
                    ) : (
                      <CloseIcon size={14} color={Colors.text.tertiary} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Restore Purchases */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.restoreSection}>
          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.neon} />
            ) : (
              <Text style={styles.restoreText}>{t('premium.restorePurchases')}</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <Pressable
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://spendtrak.app/terms')}
          >
            <Text style={styles.legalText}>{t('settings.termsOfService')}</Text>
          </Pressable>
          <Text style={styles.legalDivider}>•</Text>
          <Pressable
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://spendtrak.app/privacy')}
          >
            <Text style={styles.legalText}>{t('settings.privacyPolicy')}</Text>
          </Pressable>
        </View>

        {/* Subscription Terms (Required by Apple) */}
        <Text style={styles.subscriptionTerms}>
          {t('settings.cancelAnytime')} Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions in your App Store account settings.
        </Text>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.successModalContent}
          >
            <LinearGradient
              colors={[PREMIUM_GOLD, '#E6A756']}
              style={styles.successGradient}
            >
              <View style={styles.successIconCircle}>
                <CheckIcon size={48} color={Colors.void} />
              </View>
              <Text style={styles.successTitle}>{t('settings.welcomeToPremium')}</Text>
              <Text style={styles.successMessage}>
                {t('settings.premiumActivated')}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isPurchasing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.neon} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

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
  // Status Card (for active subscribers)
  statusCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PREMIUM_GOLD,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.tiny,
    color: Colors.void,
    letterSpacing: 1,
  },
  trialBadge: {
    backgroundColor: Colors.semantic.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  trialBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.tiny,
    color: Colors.void,
    letterSpacing: 1,
  },
  statusTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statusExpiry: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.transparent.white10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  manageButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.transparent.neon10,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  // Toggle
  toggleContainer: {
    marginBottom: Spacing.xl,
  },
  toggleCard: {
    padding: Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  toggleButtonActive: {
    backgroundColor: Colors.transparent.neon20,
  },
  toggleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.tertiary,
  },
  toggleTextActive: {
    color: Colors.neon,
  },
  savingsBadge: {
    backgroundColor: Colors.semantic.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  savingsText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.void,
    letterSpacing: 0.5,
  },
  // Plan Cards - Side by Side
  planCardOuter: {
    flex: 1,
  },
  plansRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  // Free Plan Card
  freePlanCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 50, 30, 0.6)',
    borderWidth: 1,
    borderColor: Colors.neon,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  planIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.transparent.neon20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  planLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: Colors.neon,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  freePlanPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: Colors.neon,
    marginBottom: 4,
  },
  freePlanPeriod: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(0, 255, 136, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentBadgeSmall: {
    backgroundColor: Colors.transparent.neon30,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  currentBadgeSmallText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.neon,
    letterSpacing: 0.5,
  },
  // Premium Plan Card
  premiumPlanCardWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: PREMIUM_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  premiumPlanCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    overflow: 'hidden',
  },
  premiumIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  premiumLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#1a1a1a',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  premiumPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  premiumDollarSign: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: '#1a1a1a',
    marginTop: 4,
  },
  premiumPlanPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: '#1a1a1a',
  },
  premiumPlanPeriod: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  premiumTrialText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#1a1a1a',
    marginBottom: Spacing.sm,
  },
  subscribeButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: PREMIUM_GOLD,
    letterSpacing: 1,
  },
  currentBadgePremium: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  currentBadgePremiumText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  // Comparison Table
  comparisonSection: {
    marginBottom: Spacing.xl,
  },
  comparisonTitle: {
    fontSize: FontSize.h3,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  comparisonCard: {
    overflow: 'hidden',
  },
  tableWrapper: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.transparent.deep20,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  featureColumn: {
    flex: 2,
  },
  featureColumnWide: {
    flex: 2.5,
  },
  planColumn: {
    flex: 1,
    alignItems: 'center',
  },
  planColumnSmall: {
    flex: 1,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: Colors.transparent.white10,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  featureText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.text.primary,
  },
  featureLimitText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  unlimitedText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: PREMIUM_GOLD,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  limitValueText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.semantic.success,
    textAlign: 'center',
  },
  // Restore
  restoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  restoreButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  restoreText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    textDecorationLine: 'underline',
  },
  // Legal
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  legalLink: {
    padding: Spacing.xs,
  },
  legalText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  legalDivider: {
    color: Colors.text.tertiary,
    marginHorizontal: Spacing.xs,
  },
  subscriptionTerms: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: Spacing.md,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  successModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  successGradient: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h2,
    color: Colors.void,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successMessage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.void,
    textAlign: 'center',
    opacity: 0.9,
  },
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
});
