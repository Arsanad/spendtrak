/**
 * Upgrade Modal Screen
 * Shows subscription upgrade options for premium features
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Dimensions,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { HapticTouchableOpacity } from '@/components/ui/HapticPressable';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import {
  type FeatureName,
  type SubscriptionTier,
  TIER_CONFIGS,
  FEATURE_METADATA,
  getUpgradeBenefits,
} from '@/config/features';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { triggerHaptic } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function UpgradeModal() {
  const params = useLocalSearchParams<{
    feature?: string;
    requiredTier?: string;
    featureName?: string;
  }>();

  const insets = useSafeAreaInsets();
  const { currentTier, getTierInfo, getFeatureInfo } = useFeatureAccess();

  const feature = params.feature as FeatureName | undefined;
  const featureInfo = feature ? getFeatureInfo(feature) : null;

  // Get upgrade benefits for premium
  const benefits = useMemo(() => {
    return getUpgradeBenefits(currentTier, 'premium');
  }, [currentTier]);

  const handleUpgrade = (tier: SubscriptionTier) => {
    triggerHaptic('medium');
    // In a real app, this would initiate the purchase flow
    // For now, navigate to the subscription settings
    router.replace({
      pathname: '/settings/upgrade',
      params: { selectedTier: tier },
    });
  };

  const handleDismiss = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#000000', '#001a0f', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      {/* Particles Background */}
      <AnimatedParticles />

      {/* Header */}
      <View style={styles.header}>
        <HapticTouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
        </HapticTouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Feature Icon */}
        {featureInfo && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.featureHeader}>
            <LinearGradient
              colors={[Colors.neon, Colors.primary]}
              style={styles.featureIconContainer}
            >
              <Ionicons
                name={(featureInfo.icon as any) || 'lock-closed'}
                size={32}
                color="#000"
              />
            </LinearGradient>
            <Text style={styles.featureTitle}>Unlock {featureInfo.displayName}</Text>
            <Text style={styles.featureDescription}>{featureInfo.description}</Text>
          </Animated.View>
        )}

        {!featureInfo && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.featureHeader}>
            <LinearGradient
              colors={[Colors.neon, Colors.primary]}
              style={styles.featureIconContainer}
            >
              <Ionicons name="rocket" size={32} color="#000" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Upgrade Your Plan</Text>
            <Text style={styles.featureDescription}>
              Unlock advanced features to take control of your finances
            </Text>
          </Animated.View>
        )}

        {/* Current Plan Badge */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.currentPlanBadge}>
          <Text style={styles.currentPlanText}>
            Current Plan: <Text style={styles.currentPlanTier}>{TIER_CONFIGS[currentTier].displayName}</Text>
          </Text>
        </Animated.View>

        {/* Premium Tier Card */}
        {currentTier !== 'premium' && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <PremiumTierCard
              benefits={getUpgradeBenefits(currentTier, 'premium')}
              highlightedFeature={feature}
              onSelect={() => handleUpgrade('premium')}
            />
          </Animated.View>
        )}

        {/* Footer */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.footerText}>Cancel anytime</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.footerText}>Secure payment</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.footerText}>Restore purchase</Text>
          </View>
        </Animated.View>

        {/* Legal Links - Required by Apple/Google */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://spendtrak.app/terms')}>
            <Text style={styles.legalLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}> • </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://spendtrak.app/privacy')}>
            <Text style={styles.legalLink}>Privacy</Text>
          </TouchableOpacity>
        </View>

        {/* Maybe Later */}
        <HapticTouchableOpacity style={styles.maybeLater} onPress={handleDismiss}>
          <Text style={styles.maybeLaterText}>Maybe Later</Text>
        </HapticTouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Animated particles component
const AnimatedParticles: React.FC = () => {
  return (
    <View style={styles.particlesContainer} pointerEvents="none">
      {[...Array(15)].map((_, i) => (
        <ParticleEffect key={i} index={i} />
      ))}
    </View>
  );
};

const ParticleEffect: React.FC<{ index: number }> = ({ index }) => {
  const opacity = useSharedValue(0.2);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 + index * 100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.2, { duration: 1500 + index * 100, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2000 + index * 150, easing: Easing.inOut(Easing.sin) }),
        withTiming(15, { duration: 2000 + index * 150, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const size = 2 + Math.random() * 4;
  const left = Math.random() * 100;
  const top = Math.random() * 100;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: `${left}%`,
          top: `${top}%`,
        },
        animatedStyle,
      ]}
    />
  );
};

// Premium branding color
const PREMIUM_GOLD = '#ffd700';

// Mirror shine effect for Premium card
const MirrorShine: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const translateX = useSharedValue(-width * 0.6);

  useEffect(() => {
    const startAnimation = () => {
      translateX.value = -width * 0.6;
      translateX.value = withRepeat(
        withSequence(
          withTiming(width * 1.5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-width * 0.6, { duration: 0 })
        ),
        -1,
        false
      );
    };
    const timeout = setTimeout(startAnimation, 2000);
    return () => clearTimeout(timeout);
  }, [width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { skewX: '-25deg' }],
  }));

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
          'rgba(255, 215, 0, 0.03)',
          'rgba(255, 215, 0, 0.08)',
          'rgba(255, 255, 255, 0.15)',
          'rgba(255, 255, 255, 0.4)',
          'rgba(255, 255, 255, 0.15)',
          'rgba(255, 215, 0, 0.08)',
          'rgba(255, 215, 0, 0.03)',
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
};

// Premium tier card component with gold gradient
interface PremiumTierCardProps {
  benefits: ReturnType<typeof getUpgradeBenefits>;
  highlightedFeature?: FeatureName;
  onSelect: () => void;
}

const PremiumTierCard: React.FC<PremiumTierCardProps> = ({
  benefits,
  highlightedFeature,
  onSelect,
}) => {
  const config = TIER_CONFIGS.premium;
  const displayBenefits = benefits.slice(0, 6);

  return (
    <View style={styles.premiumCardWrapper}>
      <LinearGradient
        colors={['#FFD700', '#E6A756', '#C4894A', '#E6A756', '#FFD700']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumGradientCard}
      >
        <MirrorShine width={SCREEN_WIDTH - 48} height={350} />

        <View style={styles.premiumRecommendedBadge}>
          <Text style={styles.premiumRecommendedText}>RECOMMENDED</Text>
        </View>

        <View style={styles.tierHeader}>
          <View style={[styles.tierIcon, { backgroundColor: '#000' }]}>
            <Ionicons name="diamond" size={24} color={PREMIUM_GOLD} />
          </View>
          <View style={styles.tierInfo}>
            <Text style={styles.premiumTierName}>{config.displayName}</Text>
            <Text style={styles.premiumTierDescription}>{config.description}</Text>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <Text style={styles.premiumPrice}>
            ${config.monthlyPrice}
            <Text style={styles.premiumPricePeriod}>/month</Text>
          </Text>
          {config.yearlyPrice > 0 && (
            <Text style={styles.premiumYearlyPrice}>
              or ${config.yearlyPrice}/year (save {Math.round((1 - config.yearlyPrice / (config.monthlyPrice * 12)) * 100)}%)
            </Text>
          )}
        </View>

        <View style={styles.benefitsList}>
          {displayBenefits.map((benefit) => {
            const featureMeta = FEATURE_METADATA[benefit.feature];
            const isHighlighted = benefit.feature === highlightedFeature;

            return (
              <View
                key={benefit.feature}
                style={[styles.benefitItem, isHighlighted && styles.premiumBenefitItemHighlighted]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={isHighlighted ? '#000' : 'rgba(0,0,0,0.7)'}
                />
                <View style={styles.benefitContent}>
                  <Text style={[styles.premiumBenefitName, isHighlighted && styles.premiumBenefitNameHighlighted]}>
                    {featureMeta.displayName}
                  </Text>
                  <Text style={styles.premiumBenefitLimit}>
                    {benefit.currentLimit} → {benefit.newLimit}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <HapticTouchableOpacity
          style={styles.premiumSelectButton}
          onPress={onSelect}
          activeOpacity={0.8}
        >
          <Text style={styles.premiumSelectButtonText}>Upgrade to Premium</Text>
        </HapticTouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },

  // Particles
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: Colors.neon,
  },

  // Feature header
  featureHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  featureIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  featureDescription: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // Current plan badge
  currentPlanBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    marginBottom: Spacing.lg,
  },
  currentPlanText: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.6)',
  },
  currentPlanTier: {
    fontFamily: FontFamily.semiBold,
    color: '#fff',
  },

  // Premium tier card
  premiumCardWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  premiumGradientCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  premiumRecommendedBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    zIndex: 20,
  },
  premiumRecommendedText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#FFD700',
    letterSpacing: 1,
  },
  premiumTierName: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#000',
  },
  premiumTierDescription: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(0,0,0,0.7)',
    marginTop: 2,
  },
  premiumPrice: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    color: '#000',
  },
  premiumPricePeriod: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: 'rgba(0,0,0,0.7)',
  },
  premiumYearlyPrice: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(0,0,0,0.8)',
    marginTop: 4,
  },
  premiumBenefitName: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    color: 'rgba(0,0,0,0.8)',
  },
  premiumBenefitNameHighlighted: {
    color: '#000',
  },
  premiumBenefitItemHighlighted: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  premiumBenefitLimit: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 1,
  },
  premiumSelectButton: {
    backgroundColor: '#000',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  premiumSelectButtonText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: '#FFD700',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  tierDescription: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },

  // Pricing
  pricingSection: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  price: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  pricePeriod: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.5)',
  },
  yearlyPrice: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: Colors.neon,
    marginTop: 4,
  },

  // Benefits
  benefitsList: {
    marginBottom: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  benefitItemHighlighted: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  benefitContent: {
    flex: 1,
  },
  benefitName: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  benefitNameHighlighted: {
    color: Colors.neon,
  },
  benefitLimit: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },

  // Select button
  selectButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  selectButtonRecommended: {},
  selectButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: '#fff',
  },
  selectButtonTextRecommended: {
    color: '#000',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.4)',
  },

  // Legal links
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  legalLink: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.neon,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.3)',
  },

  // Maybe later
  maybeLater: {
    alignSelf: 'center',
    paddingVertical: Spacing.md,
  },
  maybeLaterText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.4)',
  },
});
