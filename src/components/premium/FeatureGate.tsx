/**
 * Feature Gate Component
 * Wraps content that requires specific subscription tier access
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useTranslation } from '@/context/LanguageContext';
import { FEATURE_METADATA, TIER_CONFIGS, isAIFeature, type FeatureName, type SubscriptionTier } from '@/config/features';
import { Colors } from '@/design/cinematic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type FeatureGateVariant = 'block' | 'blur' | 'badge' | 'inline';

interface FeatureGateProps {
  /** The feature to gate */
  feature: FeatureName;

  /** How to display restricted content */
  variant?: FeatureGateVariant;

  /** Content to show when user has access */
  children: React.ReactNode;

  /** Optional fallback content when access is denied */
  fallback?: React.ReactNode;

  /** Whether to check usage limits (not just tier access) */
  checkUsage?: boolean;

  /** Custom message for the upgrade prompt */
  customMessage?: string;

  /** Callback when upgrade is requested */
  onUpgradePress?: () => void;

  /** Style for the container */
  style?: any;
}

// Animated glow border component
const GlowBorder: React.FC = () => {
  const glowOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.glowBorder, animatedStyle]}>
      <LinearGradient
        colors={[Colors.neon, Colors.primary, Colors.neon]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

// Premium badge component
const PremiumBadge: React.FC<{ tier: SubscriptionTier; small?: boolean }> = ({ tier, small }) => {
  const config = TIER_CONFIGS[tier];
  const isPremium = tier === 'premium';

  return (
    <View style={[styles.badge, small && styles.badgeSmall, { backgroundColor: isPremium ? '#FFD700' : Colors.neon }]}>
      <Ionicons
        name={isPremium ? 'diamond' : 'star'}
        size={small ? 10 : 12}
        color="#000"
      />
      <Text style={[styles.badgeText, small && styles.badgeTextSmall]}>
        {config.badge || config.displayName.toUpperCase()}
      </Text>
    </View>
  );
};

// Block variant - shows full paywall
const BlockVariant: React.FC<{
  feature: FeatureName;
  requiredTier: SubscriptionTier;
  customMessage?: string;
  onUpgradePress?: () => void;
}> = ({ feature, requiredTier, customMessage, onUpgradePress }) => {
  const { t } = useTranslation();
  const { showUpgradePrompt, getTierInfo, getFeatureInfo } = useFeatureAccess();
  const featureInfo = getFeatureInfo(feature);
  const tierInfo = getTierInfo(requiredTier);

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      showUpgradePrompt(feature);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.blockContainer}
      accessibilityRole="alert"
      accessibilityLabel={t('premium.requiresSubscription', { tier: tierInfo.displayName })}
    >
      <GlowBorder />

      <View style={styles.blockContent}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[Colors.neon, Colors.primary]}
            style={styles.iconGradient}
          >
            <Ionicons
              name={(featureInfo.icon as any) || 'lock-closed'}
              size={32}
              color="#000"
            />
          </LinearGradient>
        </View>

        <Text style={styles.blockTitle}>{featureInfo.displayName}</Text>
        <Text style={styles.blockDescription}>
          {customMessage || featureInfo.description}
        </Text>

        <PremiumBadge tier={requiredTier} />

        <Text style={styles.tierRequired}>
          {t('premium.requiresSubscription', { tier: tierInfo.displayName })}
        </Text>

        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade} accessibilityRole="button" accessibilityLabel={t('premium.upgradeNow')}>
          <LinearGradient
            colors={[Colors.neon, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeButtonGradient}
          >
            <Ionicons name="arrow-up-circle" size={20} color="#000" />
            <Text style={styles.upgradeButtonText}>{t('premium.upgradeNow')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.priceHint}>
          {t('premium.startingAt', { price: `$${tierInfo.monthlyPrice}` })}
        </Text>
      </View>
    </Animated.View>
  );
};

// Blur variant - shows blurred preview
const BlurVariant: React.FC<{
  children: React.ReactNode;
  feature: FeatureName;
  requiredTier: SubscriptionTier;
  onUpgradePress?: () => void;
}> = ({ children, feature, requiredTier, onUpgradePress }) => {
  const { t } = useTranslation();
  const { showUpgradePrompt, getFeatureInfo } = useFeatureAccess();
  const featureInfo = getFeatureInfo(feature);

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      showUpgradePrompt(feature);
    }
  };

  return (
    <View style={styles.blurContainer}>
      {/* Blurred content preview - with reduced opacity */}
      <View style={styles.blurredContent} pointerEvents="none">
        <View style={styles.blurredContentInner}>
          {children}
        </View>
      </View>

      {/* Dark overlay for platforms where blur doesn't work well */}
      <View style={styles.darkOverlay} />

      {/* Blur overlay */}
      <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
        <View style={styles.blurOverlayContent}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={32} color={Colors.neon} />
          </View>

          <PremiumBadge tier={requiredTier} />

          <Text style={styles.blurTitle}>
            {t('premium.unlockFeature', { feature: featureInfo.displayName })}
          </Text>

          <TouchableOpacity style={styles.blurUpgradeButton} onPress={handleUpgrade} accessibilityRole="button" accessibilityLabel={t('premium.upgradeToAccess')}>
            <Ionicons name="lock-open" size={16} color="#000" />
            <Text style={styles.blurUpgradeText}>{t('premium.upgradeToAccess')}</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
};

// Badge variant - shows content with premium badge overlay
const BadgeVariant: React.FC<{
  children: React.ReactNode;
  requiredTier: SubscriptionTier;
  onUpgradePress?: () => void;
}> = ({ children, requiredTier, onUpgradePress }) => {
  return (
    <TouchableOpacity
      style={styles.badgeContainer}
      onPress={onUpgradePress}
      activeOpacity={0.8}
      disabled={!onUpgradePress}
    >
      {children}
      <View style={styles.badgeOverlay}>
        <PremiumBadge tier={requiredTier} small />
      </View>
    </TouchableOpacity>
  );
};

// Inline variant - shows inline message
const InlineVariant: React.FC<{
  feature: FeatureName;
  requiredTier: SubscriptionTier;
  onUpgradePress?: () => void;
}> = ({ feature, requiredTier, onUpgradePress }) => {
  const { t } = useTranslation();
  const { showUpgradePrompt, getFeatureInfo, getTierInfo } = useFeatureAccess();
  const featureInfo = getFeatureInfo(feature);
  const tierInfo = getTierInfo(requiredTier);

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      showUpgradePrompt(feature);
    }
  };

  return (
    <TouchableOpacity style={styles.inlineContainer} onPress={handleUpgrade} accessibilityRole="button" accessibilityLabel={`${featureInfo.displayName} ${t('premium.requiresSubscription', { tier: tierInfo.displayName })}`}>
      <View style={styles.inlineIcon}>
        <Ionicons name="lock-closed" size={16} color={Colors.neon} />
      </View>
      <View style={styles.inlineContent}>
        <Text style={styles.inlineTitle}>
          {featureInfo.displayName} {t('premium.requiresSubscription', { tier: tierInfo.displayName })}
        </Text>
        <Text style={styles.inlineAction}>{t('premium.tapToUpgrade')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.neon} />
    </TouchableOpacity>
  );
};

// Main FeatureGate component
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  variant = 'block',
  children,
  fallback,
  checkUsage = false,
  customMessage,
  onUpgradePress,
  style,
}) => {
  const { getFeatureAccess } = useFeatureAccess();

  const accessResult = useMemo(() => {
    return getFeatureAccess(feature);
  }, [feature, getFeatureAccess]);

  // Non-AI features are always accessible (free tier gets everything non-AI)
  if (!isAIFeature(feature)) {
    return <View style={style}>{children}</View>;
  }

  // Determine if user should see the content
  const shouldShowContent = checkUsage
    ? accessResult.canAccess
    : accessResult.isEnabled && !accessResult.needsUpgrade;

  // User has access - show content
  if (shouldShowContent) {
    return <View style={style}>{children}</View>;
  }

  // User doesn't have access - show appropriate variant
  const requiredTier = accessResult.requiredTier;

  // If custom fallback provided, use it
  if (fallback) {
    return <View style={style}>{fallback}</View>;
  }

  switch (variant) {
    case 'block':
      return (
        <View style={[styles.container, style]}>
          <BlockVariant
            feature={feature}
            requiredTier={requiredTier}
            customMessage={customMessage}
            onUpgradePress={onUpgradePress}
          />
        </View>
      );

    case 'blur':
      return (
        <View style={[styles.container, style]}>
          <BlurVariant
            feature={feature}
            requiredTier={requiredTier}
            onUpgradePress={onUpgradePress}
          >
            {children}
          </BlurVariant>
        </View>
      );

    case 'badge':
      return (
        <View style={style}>
          <BadgeVariant requiredTier={requiredTier} onUpgradePress={onUpgradePress}>
            {children}
          </BadgeVariant>
        </View>
      );

    case 'inline':
      return (
        <View style={style}>
          <InlineVariant
            feature={feature}
            requiredTier={requiredTier}
            onUpgradePress={onUpgradePress}
          />
        </View>
      );

    default:
      return null;
  }
};

// Usage limit gate - specifically for checking usage limits
export const UsageLimitGate: React.FC<{
  feature: FeatureName;
  children: React.ReactNode;
  onLimitReached?: () => void;
}> = ({ feature, children, onLimitReached }) => {
  const { t } = useTranslation();
  const { getFeatureAccess, showUpgradePrompt, getFeatureInfo } = useFeatureAccess();
  const accessResult = getFeatureAccess(feature);
  const featureInfo = getFeatureInfo(feature);

  if (accessResult.isAtLimit) {
    return (
      <TouchableOpacity
        style={styles.limitReachedContainer}
        onPress={() => {
          if (onLimitReached) {
            onLimitReached();
          } else {
            showUpgradePrompt(feature);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={t('premium.limitReached', { feature: featureInfo.displayName, limit: String(accessResult.limit) })}
      >
        <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
        <Text style={styles.limitReachedText}>
          {t('premium.limitReached', { feature: featureInfo.displayName, limit: String(accessResult.limit) })}
        </Text>
        <Text style={styles.limitReachedAction}>{t('premium.upgradeForMore')}</Text>
      </TouchableOpacity>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Block variant styles
  blockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 16,
  },
  blockContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTitle: {
    fontSize: 24,
    fontFamily: 'Cinzel_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  blockDescription: {
    fontSize: 14,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  tierRequired: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    marginBottom: 20,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Cinzel_700Bold',
    color: '#000',
  },
  priceHint: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
  },

  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  badgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Cinzel_700Bold',
    color: '#000',
    letterSpacing: 1,
  },
  badgeTextSmall: {
    fontSize: 8,
  },

  // Blur variant styles
  blurContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 150,
    overflow: 'hidden',
    borderRadius: 16,
  },
  blurredContent: {
    flex: 1,
    opacity: 0.3,
  },
  blurredContentInner: {
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurOverlayContent: {
    alignItems: 'center',
    padding: 24,
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  blurTitle: {
    fontSize: 18,
    fontFamily: 'Cinzel_600SemiBold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  blurUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neon,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  blurUpgradeText: {
    fontSize: 14,
    fontFamily: 'Cinzel_600SemiBold',
    color: '#000',
  },

  // Badge variant styles
  badgeContainer: {
    position: 'relative',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Inline variant styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  inlineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inlineContent: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: 14,
    fontFamily: 'Cinzel_500Medium',
    color: '#fff',
  },
  inlineAction: {
    fontSize: 12,
    fontFamily: 'Cinzel_400Regular',
    color: Colors.neon,
    marginTop: 2,
  },

  // Limit reached styles
  limitReachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    gap: 8,
  },
  limitReachedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Cinzel_400Regular',
    color: '#fff',
  },
  limitReachedAction: {
    fontSize: 12,
    fontFamily: 'Cinzel_500Medium',
    color: Colors.neon,
  },
});

export default FeatureGate;
