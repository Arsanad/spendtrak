/**
 * Contextual Upgrade Card - Inline card for friction-based upgrade prompts
 * Pattern: GlassCard + Ionicons + Animated (matches existing card components)
 */

import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import { GlassCard } from '@/components/ui/GlassCard';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@/design/cinematic';
import { lightTap } from '@/utils/haptics';
import type { UpgradePromptConfig } from '@/types/upgrade';

const PREMIUM_GOLD = '#ffd700';

interface ContextualUpgradeCardProps {
  prompt: UpgradePromptConfig;
  onDismiss: () => void;
  onTap: () => void;
}

export const ContextualUpgradeCard: React.FC<ContextualUpgradeCardProps> = memo(({
  prompt,
  onDismiss,
  onTap,
}) => {
  const handleTap = () => {
    lightTap();
    onTap();

    // Navigate based on target feature
    switch (prompt.targetFeature) {
      case 'receipt_scanner':
        router.push('/(modals)/camera' as any);
        break;
      case 'email_import':
        router.push('/settings/connect-email' as any);
        break;
      case 'ai_consultant':
        router.push('/(modals)/ai-consultant' as any);
        break;
      default:
        router.push('/settings/subscription' as any);
        break;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20)}
      exiting={FadeOut.duration(200)}
    >
      <GlassCard
        variant="elevated"
        size="compact"
        style={styles.card}
        accessibilityLabel={prompt.title}
        accessibilityHint="Upgrade prompt"
      >
        {/* Gold left border */}
        <View style={styles.goldBorder} />

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons
              name={prompt.icon as any}
              size={20}
              color="#000"
            />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {prompt.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {prompt.body}
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleTap}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={prompt.cta}
          >
            <LinearGradient
              colors={['#00ff88', '#00cc6f']}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{prompt.cta}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Close X */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onDismiss}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.4)" />
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
});

ContextualUpgradeCard.displayName = 'ContextualUpgradeCard';

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  goldBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: PREMIUM_GOLD,
    borderTopLeftRadius: BorderRadius.card,
    borderBottomLeftRadius: BorderRadius.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PREMIUM_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: '#fff',
    marginBottom: 2,
  },
  body: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  ctaButton: {
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
    flexShrink: 0,
  },
  ctaGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
  },
  ctaText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ContextualUpgradeCard;
