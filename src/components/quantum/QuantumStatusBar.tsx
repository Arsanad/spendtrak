/**
 * QuantumStatusBar
 * Compact horizontal bar showing streak count, level, and points.
 * Makes gamification data visible on the dashboard.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { GradientText } from '@/components/ui/GradientText';
import { useGamificationStore, useCurrentStreak, useUserLevel, useTotalPoints } from '@/stores';
import { useTranslation } from '@/context/LanguageContext';

export const QuantumStatusBar: React.FC = () => {
  const streak = useCurrentStreak();
  const level = useUserLevel();
  const points = useTotalPoints();
  const { t } = useTranslation();

  // Don't show if no gamification data yet
  if (streak === 0 && level <= 1 && points === 0) return null;

  return (
    <View style={styles.container}>
      {/* Streak */}
      {streak > 0 && (
        <View style={styles.badge}>
          <GradientText variant="bright" style={styles.icon}>
            {streak >= 7 ? '\u{1F525}' : '\u{26A1}'}
          </GradientText>
          <GradientText variant="bright" style={styles.value}>
            {streak}
          </GradientText>
          <GradientText variant="muted" style={styles.label}>
            {t('quantum.streakDays')}
          </GradientText>
        </View>
      )}

      {/* Level */}
      {level > 1 && (
        <View style={styles.badge}>
          <GradientText variant="bright" style={styles.value}>
            {t('quantum.levelPrefix')}{level}
          </GradientText>
        </View>
      )}

      {/* Points */}
      {points > 0 && (
        <View style={styles.badge}>
          <GradientText variant="muted" style={styles.value}>
            {points.toLocaleString()}
          </GradientText>
          <GradientText variant="muted" style={styles.label}>
            {t('quantum.points')}
          </GradientText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.transparent.darker60,
    borderWidth: 1,
    borderColor: Colors.transparent.neon10,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  icon: {
    fontSize: FontSize.body,
  },
  value: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySmall,
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
});

export default QuantumStatusBar;
