// SPENDTRAK CINEMATIC EDITION - Privacy Policy Screen
import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, FontFamily } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Header } from '../../src/components/navigation';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  return (
    <View style={styles.container}>
      <Header title={t('settings.privacyPolicy')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        <GlassCard variant="default">
          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.dataCollection')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.dataCollectionText')}
          </GradientText>

          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.dataStorage')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.dataStorageText')}
          </GradientText>

          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.dataSharing')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.dataSharingText')}
          </GradientText>

          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.yourRights')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.yourRightsText')}
          </GradientText>
        </GlassCard>

        {/* Third-Party Services Disclosure (LEGAL REQUIREMENT) */}
        <GlassCard variant="default" style={styles.thirdPartyCard}>
          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.thirdPartyServicesTitle')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.thirdPartyServicesText')}
          </GradientText>

          <View style={styles.servicesList}>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={styles.serviceText}>{t('settings.thirdPartySupabase')}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={styles.serviceText}>{t('settings.thirdPartyGemini')}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={styles.serviceText}>{t('settings.thirdPartyRevenueCat')}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={styles.serviceText}>{t('settings.thirdPartySentry')}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={styles.serviceText}>{t('settings.thirdPartyGoogleOAuth')}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={styles.serviceText}>{t('settings.thirdPartyAppleOAuth')}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Data Retention */}
        <GlassCard variant="default">
          <GradientText variant="bright" style={styles.sectionTitle}>{t('settings.dataRetentionTitle')}</GradientText>
          <GradientText variant="muted" style={styles.paragraph}>
            {t('settings.dataRetentionText')}
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
  thirdPartyCard: { marginTop: Spacing.lg },
  servicesList: { marginTop: Spacing.md },
  serviceItem: { flexDirection: 'row', marginBottom: Spacing.md, paddingRight: Spacing.md },
  serviceBullet: { color: Colors.neon, fontSize: FontSize.body, marginRight: Spacing.sm, fontFamily: FontFamily.bold },
  serviceText: { flex: 1, color: Colors.text.secondary, fontSize: FontSize.sm, lineHeight: 20, fontFamily: FontFamily.regular },
});
