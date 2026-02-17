/**
 * Contextual Upgrade Modal - Full modal for high-confidence friction moments
 * Pattern: Wraps existing UpgradePrompt with contextual header
 */

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@/design/cinematic';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useTranslation } from '@/context/LanguageContext';
import { heavyTap } from '@/utils/haptics';
import {
  type FeatureName,
  TIER_CONFIGS,
  FEATURE_METADATA,
  AI_FEATURES,
} from '@/config/features';
import type { UpgradePromptConfig } from '@/types/upgrade';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREMIUM_GOLD = '#ffd700';

interface ContextualUpgradeModalProps {
  visible: boolean;
  prompt: UpgradePromptConfig;
  onDismiss: () => void;
  onTap: () => void;
}

export const ContextualUpgradeModal: React.FC<ContextualUpgradeModalProps> = memo(({
  visible,
  prompt,
  onDismiss,
  onTap,
}) => {
  const { t } = useTranslation();
  const { currentTier } = useFeatureAccess();
  const config = TIER_CONFIGS.premium;

  const featureList = AI_FEATURES.filter(
    (f) => FEATURE_METADATA[f] != null
  ).slice(0, 6);

  const handleUpgrade = useCallback(() => {
    heavyTap();
    onTap();
    router.push({
      pathname: '/settings/upgrade' as any,
      params: { selectedTier: 'premium' },
    });
  }, [onTap]);

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

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.duration(200)}
          style={styles.container}
        >
          {/* Close */}
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Contextual Header */}
          <View style={styles.contextHeader}>
            <View style={styles.contextIconCircle}>
              <Ionicons name={prompt.icon as any} size={28} color="#000" />
            </View>
            <Text style={styles.contextTitle}>{prompt.title}</Text>
            <Text style={styles.contextBody}>{prompt.body}</Text>
          </View>

          {/* Premium Card */}
          <TouchableOpacity
            style={styles.premiumCardWrapper}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#E6A756', '#C4894A', '#E6A756', '#FFD700']}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              {/* Header */}
              <View style={styles.tierHeader}>
                <View style={styles.tierIcon}>
                  <Ionicons name="diamond" size={20} color={PREMIUM_GOLD} />
                </View>
                <View>
                  <Text style={styles.tierName}>{config.displayName}</Text>
                  <Text style={styles.tierDesc}>{config.description}</Text>
                </View>
              </View>

              {/* Price */}
              <Text style={styles.price}>
                ${config.monthlyPrice}
                <Text style={styles.pricePeriod}>/mo</Text>
              </Text>

              {/* Features */}
              <View style={styles.featuresList}>
                {featureList.map((featureKey) => {
                  const info = FEATURE_METADATA[featureKey];
                  const isHighlighted = featureKey === prompt.targetFeature;
                  return (
                    <View
                      key={featureKey}
                      style={[styles.featureItem, isHighlighted && styles.featureHighlighted]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={isHighlighted ? '#000' : 'rgba(0, 0, 0, 0.7)'}
                      />
                      <Text style={[styles.featureText, isHighlighted && styles.featureTextHighlighted]}>
                        {info.displayName}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* CTA */}
              <TouchableOpacity style={styles.ctaButton} onPress={handleUpgrade}>
                <Text style={styles.ctaText}>{t('premium.upgradeToPremium')}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.maybeLater}>{t('premium.maybeLater')}</Text>
            </TouchableOpacity>
            <View style={styles.footerInfo}>
              <Ionicons name="shield-checkmark" size={14} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.footerText}>{t('premium.cancelAnytime')}</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

ContextualUpgradeModal.displayName = 'ContextualUpgradeModal';

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

  // Contextual header
  contextHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  contextIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PREMIUM_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contextTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  contextBody: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Premium card
  premiumCardWrapper: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: PREMIUM_GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  premiumGradient: {
    padding: 24,
    borderRadius: 20,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#000',
  },
  tierDesc: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  price: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    color: '#000',
    marginBottom: 16,
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  featuresList: {
    marginBottom: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureHighlighted: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 6,
    marginHorizontal: -6,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  featureTextHighlighted: {
    color: '#000',
    fontFamily: FontFamily.medium,
  },
  ctaButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: PREMIUM_GOLD,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  maybeLater: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default ContextualUpgradeModal;
