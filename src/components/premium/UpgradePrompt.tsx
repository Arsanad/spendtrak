/**
 * Upgrade Prompt Modal
 * Shows upgrade options when user tries to access premium features
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useTranslation } from '@/context/LanguageContext';
import {
  type FeatureName,
  type SubscriptionTier,
  TIER_CONFIGS,
  FEATURE_METADATA,
  AI_FEATURES,
} from '@/config/features';
import { Colors, Spacing, BorderRadius } from '@/design/cinematic';
import { lightTap, heavyTap, deleteBuzz } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Premium branding color
const PREMIUM_GOLD = '#ffd700';

interface UpgradePromptProps {
  /** Whether the modal is visible */
  visible: boolean;

  /** The feature that triggered the prompt */
  feature?: FeatureName;

  /** Callback when modal is dismissed */
  onDismiss: () => void;

  /** Callback when upgrade is selected */
  onUpgrade?: (tier: SubscriptionTier) => void;
}

// Animated background particles
const AnimatedParticles: React.FC = () => {
  return (
    <View style={styles.particlesContainer} pointerEvents="none">
      {[...Array(20)].map((_, i) => (
        <ParticleEffect key={i} index={i} />
      ))}
    </View>
  );
};

const ParticleEffect: React.FC<{ index: number }> = ({ index }) => {
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.sin) })
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

// Premium tier card component with gold gradient design
const PremiumTierCard: React.FC<{
  onSelect: () => void;
  currentTier: SubscriptionTier;
  highlightedFeature?: FeatureName;
}> = ({ onSelect, currentTier, highlightedFeature }) => {
  const { t } = useTranslation();
  const config = TIER_CONFIGS.premium;
  const isCurrentTier = currentTier === 'premium';

  // Show only AI features in upgrade prompt (non-AI features are all free)
  const featureList = AI_FEATURES.filter(
    (f) => FEATURE_METADATA[f] != null
  ).slice(0, 6);

  const cardContent = (
    <View style={styles.premiumCardContent}>
      {/* Recommended Badge */}
      {!isCurrentTier && (
        <View style={styles.premiumRecommendedBadge}>
          <Text style={styles.premiumRecommendedText}>{t('premium.recommended')}</Text>
        </View>
      )}

      {/* Card header */}
      <View style={styles.tierHeader}>
        <View style={[styles.tierIcon, { backgroundColor: '#000' }]}>
          <Ionicons name="diamond" size={20} color={PREMIUM_GOLD} />
        </View>
        <View>
          <Text style={styles.premiumTierName}>{config.displayName}</Text>
          <Text style={styles.premiumTierDescription}>{config.description}</Text>
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.pricingContainer}>
        <Text style={styles.premiumPrice}>
          ${config.monthlyPrice}
          <Text style={styles.premiumPricePeriod}>/mo</Text>
        </Text>
        {config.yearlyPrice > 0 && (
          <Text style={styles.premiumYearlyPrice}>
            or ${config.yearlyPrice}/year ({t('premium.savePercent', { percent: Math.round((1 - config.yearlyPrice / (config.monthlyPrice * 12)) * 100).toString() })})
          </Text>
        )}
      </View>

      {/* Features list */}
      <View style={styles.featuresList}>
        {featureList.map((featureKey) => {
          const featureInfo = FEATURE_METADATA[featureKey];
          const isHighlighted = featureKey === highlightedFeature;

          return (
            <View
              key={featureKey}
              style={[styles.featureItem, isHighlighted && styles.premiumFeatureItemHighlighted]}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isHighlighted ? '#000' : 'rgba(0, 0, 0, 0.7)'}
              />
              <Text
                style={[
                  styles.premiumFeatureText,
                  isHighlighted && styles.premiumFeatureTextHighlighted,
                ]}
              >
                {featureInfo.displayName}
              </Text>
            </View>
          );
        })}
      </View>

      {/* CTA Button */}
      {isCurrentTier ? (
        <View style={styles.premiumCurrentTierButton}>
          <Text style={styles.premiumCurrentTierText}>{t('premium.currentPlan')}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.premiumSelectButton}
          onPress={() => {
            heavyTap();
            onSelect();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('premium.upgradeToPremium')}
        >
          <Text style={styles.premiumSelectButtonText}>{t('premium.upgradeToPremium')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={styles.premiumCardWrapper}
      onPress={() => {
        if (!isCurrentTier) {
          lightTap();
          onSelect();
        }
      }}
      activeOpacity={isCurrentTier ? 1 : 0.8}
      disabled={isCurrentTier}
    >
      <LinearGradient
        colors={['#FFD700', '#E6A756', '#C4894A', '#E6A756', '#FFD700']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumGradientCard}
      >
        <MirrorShine width={SCREEN_WIDTH * 0.75} height={350} />
        {cardContent}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  feature,
  onDismiss,
  onUpgrade,
}) => {
  const { t } = useTranslation();
  const { currentTier, getFeatureInfo } = useFeatureAccess();

  const featureInfo = feature ? getFeatureInfo(feature) : null;

  const handleSelectTier = useCallback((tier: SubscriptionTier) => {
    if (tier === 'free') {
      onDismiss();
      return;
    }

    if (onUpgrade) {
      onUpgrade(tier);
    } else {
      // Navigate to subscription purchase screen
      router.push({
        pathname: '/settings/upgrade' as any,
        params: { selectedTier: tier },
      });
      onDismiss();
    }
  }, [onDismiss, onUpgrade]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <AnimatedParticles />

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.duration(200)}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
              <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              {featureInfo && (
                <View style={styles.featureIcon}>
                  <LinearGradient
                    colors={[Colors.neon, Colors.primary]}
                    style={styles.featureIconGradient}
                  >
                    <Ionicons name={(featureInfo.icon as any) || 'lock-closed'} size={28} color="#000" />
                  </LinearGradient>
                </View>
              )}

              <Text style={styles.title}>
                {featureInfo ? `Unlock ${featureInfo.displayName}` : 'Upgrade Your Plan'}
              </Text>

              {featureInfo && (
                <Text style={styles.subtitle}>{featureInfo.description}</Text>
              )}
            </View>
          </View>

          {/* Premium Tier Card */}
          <View style={styles.tiersContainer}>
            <PremiumTierCard
              onSelect={() => handleSelectTier('premium')}
              currentTier={currentTier}
              highlightedFeature={feature}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel={t('premium.maybeLater')}>
              <Text style={styles.maybeLaterText}>{t('premium.maybeLater')}</Text>
            </TouchableOpacity>

            <View style={styles.footerInfo}>
              <Ionicons name="shield-checkmark" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.footerInfoText}>{t('premium.cancelAnytime')}</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Hook for using upgrade prompt
export const useUpgradePrompt = () => {
  const [visible, setVisible] = React.useState(false);
  const [feature, setFeature] = React.useState<FeatureName | undefined>();

  const showPrompt = useCallback((featureName?: FeatureName) => {
    setFeature(featureName);
    setVisible(true);
    deleteBuzz();
  }, []);

  const hidePrompt = useCallback(() => {
    setVisible(false);
    setFeature(undefined);
  }, []);

  const UpgradePromptComponent = useCallback(() => (
    <UpgradePrompt
      visible={visible}
      feature={feature}
      onDismiss={hidePrompt}
    />
  ), [visible, feature, hidePrompt]);

  return {
    showPrompt,
    hidePrompt,
    UpgradePromptComponent,
    isVisible: visible,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: 40,
  },

  // Header
  header: {
    padding: 20,
    paddingTop: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Cinzel_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
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

  // Tier cards
  tiersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  // Premium card styles
  premiumCardWrapper: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: PREMIUM_GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  premiumGradientCard: {
    padding: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  premiumCardContent: {
    width: '100%',
  },
  premiumRecommendedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  premiumRecommendedText: {
    fontSize: 10,
    fontFamily: 'Cinzel_700Bold',
    color: PREMIUM_GOLD,
    letterSpacing: 1,
  },
  premiumTierName: {
    fontSize: 20,
    fontFamily: 'Cinzel_700Bold',
    color: '#000',
  },
  premiumTierDescription: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  premiumPrice: {
    fontSize: 36,
    fontFamily: 'Cinzel_700Bold',
    color: '#000',
  },
  premiumPricePeriod: {
    fontSize: 14,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  premiumYearlyPrice: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(0, 0, 0, 0.8)',
    marginTop: 4,
  },
  premiumFeatureText: {
    fontSize: 13,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(0, 0, 0, 0.8)',
  },
  premiumFeatureItemHighlighted: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 6,
    marginHorizontal: -6,
    borderRadius: 6,
  },
  premiumFeatureTextHighlighted: {
    color: '#000',
    fontFamily: 'Cinzel_500Medium',
  },
  premiumSelectButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumSelectButtonText: {
    fontSize: 16,
    fontFamily: 'Cinzel_600SemiBold',
    color: PREMIUM_GOLD,
  },
  premiumCurrentTierButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  premiumCurrentTierText: {
    fontSize: 14,
    fontFamily: 'Cinzel_500Medium',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  // Legacy styles kept for compatibility
  tierCard: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  tierCardRecommended: {
    borderColor: Colors.neon,
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  tierCardCurrent: {
    opacity: 0.6,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: Colors.neon,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    fontFamily: 'Cinzel_700Bold',
    color: '#000',
    letterSpacing: 1,
  },

  // Tier header
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 18,
    fontFamily: 'Cinzel_700Bold',
    color: '#fff',
  },
  tierDescription: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Pricing
  pricingContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontFamily: 'Cinzel_700Bold',
    color: '#fff',
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  yearlyPrice: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: Colors.neon,
    marginTop: 4,
  },

  // Features list
  featuresList: {
    marginBottom: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItemHighlighted: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    padding: 6,
    marginHorizontal: -6,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featureTextHighlighted: {
    color: Colors.neon,
    fontFamily: 'Cinzel_500Medium',
  },

  // Buttons
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectButtonRecommended: {},
  selectButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Cinzel_600SemiBold',
    color: '#fff',
  },
  selectButtonTextRecommended: {
    color: '#000',
  },
  currentTierButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  currentTierText: {
    fontSize: 14,
    fontFamily: 'Cinzel_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  maybeLaterText: {
    fontSize: 14,
    fontFamily: 'Cinzel_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerInfoText: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default UpgradePrompt;
