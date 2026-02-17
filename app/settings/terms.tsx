// SPENDTRAK CINEMATIC EDITION - Terms of Service Screen
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Header } from '../../src/components/navigation';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  return (
    <View style={styles.container}>
      <Header title={t('settings.termsOfService')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        <GlassCard variant="default">
          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.acceptanceOfTerms')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.acceptanceOfTermsText')}
          </GradientText>

          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.useOfService')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.useOfServiceText')}
          </GradientText>

          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.disclaimer')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.disclaimerText')}
          </GradientText>

          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.limitationOfLiability')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.limitationOfLiabilityText')}
          </GradientText>
        </GlassCard>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionTitle: { fontSize: 18, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  paragraph: { lineHeight: 22 },
});
