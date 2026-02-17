// SPENDTRAK CINEMATIC EDITION - Achievements Screen
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Header } from '../../src/components/navigation';
import { ProgressRing } from '../../src/components/premium';
import { TrophyIcon, StarIcon, TargetIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  const achievements = [
    { id: '1', name: t('settings.firstSteps'), description: t('settings.firstStepsDesc'), progress: 100, unlocked: true, icon: StarIcon },
    { id: '2', name: t('settings.budgetMaster'), description: t('settings.budgetMasterDesc'), progress: 75, unlocked: false, icon: TargetIcon },
    { id: '3', name: t('settings.savingsPro'), description: t('settings.savingsProDesc'), progress: 40, unlocked: false, icon: TrophyIcon },
    { id: '4', name: t('settings.consistentTracker'), description: t('settings.consistentTrackerDesc'), progress: 60, unlocked: false, icon: StarIcon },
    { id: '5', name: t('settings.goalCrusher'), description: t('settings.goalCrusherDesc'), progress: 0, unlocked: false, icon: TargetIcon },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <View style={styles.container}>
      <Header title={t('settings.achievements')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        <GlassCard variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <TrophyIcon size={40} color={Colors.neon} />
            <GradientText variant="luxury" style={styles.summaryCount}>{unlockedCount}/{achievements.length}</GradientText>
            <GradientText variant="muted">{t('settings.achievementsUnlocked')}</GradientText>
          </View>
        </GlassCard>

        {achievements.map((achievement) => {
          const IconComponent = achievement.icon;
          return (
            <GlassCard key={achievement.id} variant={achievement.unlocked ? 'elevated' : 'default'} style={styles.achievementCard}>
              <View style={styles.achievementContent}>
                <ProgressRing progress={achievement.progress} size={60} strokeWidth={5}>
                  <IconComponent size={24} color={achievement.unlocked ? Colors.neon : Colors.text.tertiary} />
                </ProgressRing>
                <View style={styles.achievementInfo}>
                  <GradientText variant={achievement.unlocked ? 'bright' : 'muted'} style={styles.achievementName}>
                    {achievement.name}
                  </GradientText>
                  <GradientText variant="muted" style={styles.achievementDesc}>
                    {achievement.description}
                  </GradientText>
                  {!achievement.unlocked && achievement.progress > 0 && (
                    <GradientText variant="subtle" style={styles.achievementProgress}>
                      {t('settings.percentComplete', { progress: achievement.progress })}
                    </GradientText>
                  )}
                </View>
              </View>
            </GlassCard>
          );
        })}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  summaryCard: { alignItems: 'center', marginBottom: Spacing.lg },
  summaryContent: { alignItems: 'center' },
  summaryCount: { fontSize: FontSize.display3, marginVertical: Spacing.sm },
  achievementCard: { marginBottom: Spacing.md },
  achievementContent: { flexDirection: 'row', alignItems: 'center' },
  achievementInfo: { flex: 1, marginLeft: Spacing.lg },
  achievementName: { marginBottom: Spacing.xs },
  achievementDesc: { fontSize: FontSize.sm },
  achievementProgress: { fontSize: FontSize.caption, marginTop: Spacing.xs },
});
