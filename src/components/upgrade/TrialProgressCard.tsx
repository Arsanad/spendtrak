/**
 * Trial Progress Card - Shows trial value metrics for trial users
 * Pattern: GlassCard variant "glow" with gold border
 */

import React, { memo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { GlassCard } from '@/components/ui/GlassCard';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@/design/cinematic';
import { useTranslation } from '@/context/LanguageContext';
import { useTierStore } from '@/stores/tierStore';
import { lightTap, heavyTap } from '@/utils/haptics';

const PREMIUM_GOLD = '#ffd700';

interface TrialProgressCardProps {
  daysRemaining: number;
  totalTrialDays?: number;
}

export const TrialProgressCard: React.FC<TrialProgressCardProps> = memo(({
  daysRemaining,
  totalTrialDays = 7,
}) => {
  const { t } = useTranslation();
  const usage = useTierStore((s) => s.usage);
  const isTrialing = useTierStore((s) => s.isTrialing);

  if (!isTrialing) return null;

  const currentDay = totalTrialDays - daysRemaining;
  const progress = Math.min(1, currentDay / totalTrialDays);

  // Get usage metrics
  const scansUsed = usage.receipt_scans?.count ?? 0;
  const aiChatsUsed = usage.ai_messages?.count ?? 0;

  const handleUpgrade = () => {
    heavyTap();
    router.push('/settings/subscription' as any);
  };

  return (
    <Animated.View entering={FadeInDown.springify().damping(20).delay(200)}>
      <GlassCard
        variant="glow"
        style={styles.card}
        accessibilityLabel={t('contextualUpgrade.trialProgress')}
      >
        {/* Gold top border */}
        <View style={styles.goldTopBorder} />

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="diamond" size={18} color={PREMIUM_GOLD} />
          <Text style={styles.headerText}>{t('contextualUpgrade.trialProgress')}</Text>
          <Text style={styles.daysText}>
            {t('contextualUpgrade.daysRemaining', { days: String(daysRemaining) })}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Day {currentDay} of {totalTrialDays}
          </Text>
        </View>

        {/* Value Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{scansUsed}</Text>
            <Text style={styles.metricLabel}>{t('contextualUpgrade.aiScansUsed')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{aiChatsUsed}</Text>
            <Text style={styles.metricLabel}>{t('contextualUpgrade.aiChatsUsed')}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleUpgrade}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('contextualUpgrade.keepAIFeatures')}
        >
          <LinearGradient
            colors={[PREMIUM_GOLD, '#E6A756']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>{t('contextualUpgrade.keepAIFeatures')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
});

TrialProgressCard.displayName = 'TrialProgressCard';

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderColor: PREMIUM_GOLD,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  goldTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: PREMIUM_GOLD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: PREMIUM_GOLD,
    flex: 1,
  },
  daysText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PREMIUM_GOLD,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  metricLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctaButton: {
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.button,
  },
  ctaText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: '#000',
  },
});

export default TrialProgressCard;
