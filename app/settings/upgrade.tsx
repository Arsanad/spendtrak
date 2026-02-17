/**
 * Upgrade Settings Screen
 * Full subscription purchase flow with RevenueCat integration
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { usePurchasesStore } from '@/stores/purchasesStore';
import {
  type SubscriptionTier,
  TIER_CONFIGS,
  FEATURE_METADATA,
  type FeatureName,
} from '@/config/features';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { GradientTitle } from '@/components/ui/GradientText';
import { lightTap, heavyTap, successBuzz, errorBuzz } from '@/utils/haptics';

export default function UpgradeScreen() {
  const params = useLocalSearchParams<{ selectedTier?: string }>();
  const insets = useSafeAreaInsets();
  const { currentTier } = useFeatureAccess();

  // RevenueCat store for real purchases
  const {
    offerings,
    isPurchasing,
    isRestoring,
    fetchOfferings,
    purchasePackage,
    restorePurchases,
    getPackageForPlan,
    isInitialized,
  } = usePurchasesStore();

  const [isYearly, setIsYearly] = useState(true);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);

  // Fetch offerings on mount if not loaded
  useEffect(() => {
    if (isInitialized && !offerings) {
      fetchOfferings();
    }
  }, [isInitialized, offerings, fetchOfferings]);

  const handleBack = () => {
    router.back();
  };

  // Real purchase flow using RevenueCat
  const handlePurchase = async () => {
    if (currentTier === 'premium') return;

    heavyTap();

    try {
      // Get the correct package from RevenueCat offerings
      const billingPeriod = isYearly ? 'yearly' : 'monthly';
      const pkg = getPackageForPlan('premium', billingPeriod);

      if (!pkg) {
        Alert.alert(
          'Subscription Unavailable',
          'Unable to load subscription options. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Call RevenueCat SDK via purchasesStore
      const result = await purchasePackage(pkg);

      if (result.success) {
        successBuzz?.();
        Alert.alert(
          'Welcome to Premium!',
          'Your subscription is now active. Enjoy all premium features!',
          [{ text: "Let's Go!", onPress: () => router.back() }]
        );
      } else if (result.error === 'cancelled' || result.error?.includes('cancelled')) {
        // User cancelled — do nothing, silent return
      } else {
        errorBuzz?.();
        Alert.alert(
          'Purchase Failed',
          result.error || 'Something went wrong. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      errorBuzz?.();
      Alert.alert(
        'Error',
        error?.message || 'Purchase failed. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Real restore purchases using RevenueCat
  const handleRestorePurchases = async () => {
    lightTap();
    setIsRestoreLoading(true);

    try {
      const result = await restorePurchases();

      if (result.success && result.message?.includes('restored')) {
        successBuzz?.();
        Alert.alert(
          'Purchases Restored!',
          result.message || 'Your subscription has been restored.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (result.success) {
        // Success but no purchases found
        Alert.alert(
          'No Purchases Found',
          "We couldn't find any previous purchases associated with your account.",
          [{ text: 'OK' }]
        );
      } else {
        errorBuzz?.();
        Alert.alert(
          'Restore Failed',
          result.message || 'Unable to restore purchases. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      errorBuzz?.();
      Alert.alert(
        'Error',
        error?.message || 'Failed to restore purchases.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoreLoading(false);
    }
  };

  // Get pricing from offerings or fallback to config
  const premiumConfig = TIER_CONFIGS.premium;
  const displayPrice = isYearly ? premiumConfig.yearlyPrice : premiumConfig.monthlyPrice;
  const billingPeriod = isYearly ? 'year' : 'month';
  const isProcessing = isPurchasing || isRestoring || isRestoreLoading;

  // All features for display
  const allFeatures: FeatureName[] = [
    'receipt_scans',
    'ai_messages',
    'budgets',
    'goals',
    'accounts',
    'transaction_history',
    'custom_categories',
    'export_data',
    'advanced_analytics',
    'debt_tracking',
    'bill_calendar',
    'subscriptions_tracking',
    'household_members',
    'investment_tracking',
    'net_worth',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#000000', '#001a0f', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <GradientTitle style={styles.title}>Upgrade</GradientTitle>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current plan indicator */}
        {currentTier !== 'free' && (
          <Animated.View entering={FadeIn.delay(100)} style={styles.currentPlanCard}>
            <Text style={styles.currentPlanLabel}>Current Plan</Text>
            <Text style={styles.currentPlanName}>{TIER_CONFIGS[currentTier].displayName}</Text>
          </Animated.View>
        )}

        {/* Billing toggle */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.billingToggle}>
          <Text style={[styles.billingOption, !isYearly && styles.billingOptionActive]}>Monthly</Text>
          <Switch
            value={isYearly}
            onValueChange={setIsYearly}
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.primary }}
            thumbColor={isYearly ? Colors.neon : '#fff'}
          />
          <View style={styles.yearlyOption}>
            <Text style={[styles.billingOption, isYearly && styles.billingOptionActive]}>Yearly</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save 33%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Premium Plan Card - Single tier (Plus is deprecated) */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.plansContainer}>
          <View style={[styles.planCard, styles.planCardSelected]}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>PREMIUM</Text>
            </View>

            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: premiumConfig.color }]}>
                <Ionicons name="diamond" size={24} color="#000" />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{premiumConfig.displayName}</Text>
                <Text style={styles.planDescription}>{premiumConfig.description}</Text>
              </View>
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.neon} />
              </View>
            </View>

            <View style={styles.planPricing}>
              <Text style={styles.planPrice}>
                ${displayPrice.toFixed(2)}
                <Text style={styles.planPeriod}>/{billingPeriod}</Text>
              </Text>
              {isYearly && (
                <Text style={styles.monthlyEquivalent}>
                  (${(displayPrice / 12).toFixed(2)}/month)
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Features comparison - Premium vs Free */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Premium Features</Text>

          {allFeatures.map((feature) => {
            const meta = FEATURE_METADATA[feature];
            const premiumFeature = TIER_CONFIGS.premium.features[feature];
            const freeFeature = TIER_CONFIGS.free.features[feature];
            const isUpgrade = !freeFeature.enabled || freeFeature.limit === 0 ||
              (premiumFeature.limit === -1 && freeFeature.limit !== -1);

            const limitText = premiumFeature.limit === -1
              ? 'Unlimited'
              : `${premiumFeature.limit}${premiumFeature.period ? ` / ${premiumFeature.period}` : ''}`;

            return (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.featureLeft}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={isUpgrade ? Colors.neon : 'rgba(0,255,136,0.5)'}
                  />
                  <Text style={styles.featureName}>
                    {meta.displayName}
                  </Text>
                </View>
                <Text style={[styles.featureLimit, isUpgrade && styles.featureLimitHighlight]}>
                  {limitText}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Restore purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isRestoreLoading || isRestoring}
        >
          {isRestoreLoading || isRestoring ? (
            <View style={styles.restoreLoading}>
              <ActivityIndicator size="small" color={Colors.neon} />
              <Text style={styles.restoreText}>Restoring...</Text>
            </View>
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        {/* Legal Section - Required by Apple/Google */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            Payment will be charged to your App Store account. Subscription automatically renews
            unless cancelled at least 24 hours before the end of the current period. Manage
            subscriptions in your device Settings.
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://spendtrak.app/terms')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}> • </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://spendtrak.app/privacy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Purchase button */}
      <Animated.View
        entering={FadeIn.delay(500)}
        style={[styles.purchaseContainer, { paddingBottom: insets.bottom + 16 }]}
      >
        <TouchableOpacity
          style={[styles.purchaseButton, isProcessing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isProcessing || currentTier === 'premium'}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={currentTier === 'premium' ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : [Colors.neon, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.purchaseButtonGradient}
          >
            {isProcessing ? (
              <View style={styles.purchaseButtonContent}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={[styles.purchaseButtonText, styles.purchaseButtonTextActive]}>Processing...</Text>
              </View>
            ) : currentTier === 'premium' ? (
              <Text style={styles.purchaseButtonText}>You're Premium!</Text>
            ) : (
              <Text style={[styles.purchaseButtonText, styles.purchaseButtonTextActive]}>
                Subscribe for ${displayPrice.toFixed(2)}/{billingPeriod}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },

  // Current plan
  currentPlanCard: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  currentPlanLabel: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.5)',
  },
  currentPlanName: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.neon,
    marginTop: 4,
  },

  // Billing toggle
  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  billingOption: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.5)',
  },
  billingOptionActive: {
    color: '#fff',
  },
  yearlyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  saveBadge: {
    backgroundColor: Colors.neon,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#000',
  },

  // Plans
  plansContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  planCardSelected: {
    borderColor: Colors.neon,
    backgroundColor: 'rgba(0,255,136,0.05)',
  },
  planCardPremium: {},
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: '#FFD700',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  bestValueText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: '#000',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: FontSize.h5,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  planDescription: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  checkmark: {},
  planPricing: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing.md,
  },
  planPrice: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  planPeriod: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.5)',
  },
  monthlyEquivalent: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: Colors.neon,
    marginTop: 4,
  },

  // Features
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  featuresSectionTitle: {
    fontSize: FontSize.h5,
    fontFamily: FontFamily.semiBold,
    color: '#fff',
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  featureName: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: '#fff',
  },
  featureNameDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  featureLimit: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.medium,
    color: 'rgba(0,255,136,0.6)',
  },
  featureLimitHighlight: {
    color: Colors.neon,
    fontFamily: FontFamily.bold,
  },
  featureLimitDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },

  // Restore
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  restoreLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  restoreText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    color: Colors.neon,
  },

  // Legal Section (Required by Apple/Google)
  legalContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  legalText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  legalLink: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.neon,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.3)',
  },

  // Purchase button
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  purchaseButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  purchaseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  purchaseButtonText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.5)',
  },
  purchaseButtonTextActive: {
    color: '#000',
  },
});
