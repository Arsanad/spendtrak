// SPENDTRAK - Welcome Screen
import React from 'react';
import { View, ScrollView, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText, GradientTitle, GradientHeading } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { ScanIcon, EditIcon, BudgetIcon, TrendUpIcon, RobotIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const features = [
    { icon: <ScanIcon size={20} color={Colors.neon} />, text: t('welcome.scanReceipts') },
    { icon: <EditIcon size={20} color={Colors.primary} />, text: t('welcome.easyExpenseTracking') },
    { icon: <BudgetIcon size={20} color={Colors.deep} />, text: t('welcome.smartBudgetManagement') },
    { icon: <TrendUpIcon size={20} color={Colors.bright} />, text: t('welcome.financialInsights') },
    { icon: <RobotIcon size={20} color={Colors.neon} />, text: t('welcome.aiConsultant') },
  ];

  // Responsive sizing
  const logoSize = isLandscape ? 100 : 120;
  const contentPadding = isLandscape ? { paddingHorizontal: Spacing.xxl } : {};

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + (isLandscape ? Spacing.md : Spacing.sm) },
          contentPadding,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLandscape ? (
          // Landscape: Two-column layout
          <View style={styles.landscapeContainer}>
            {/* Left side: Logo + Hero */}
            <View style={styles.landscapeLeft}>
              <View style={styles.header}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={[styles.logoImage, { width: logoSize, height: logoSize }]}
                  resizeMode="contain"
                />
                <GradientTitle style={styles.appName}>SpendTrak</GradientTitle>
              </View>
              <View style={styles.heroSection}>
                <GradientHeading style={[styles.heroTitle, { fontSize: 18 }]}>
                  {t('welcome.heroTitle')}
                </GradientHeading>
                <GradientTitle style={[styles.heroHighlight, { fontSize: 16 }]}>
                  {t('welcome.heroHighlight')}
                </GradientTitle>
              </View>
            </View>

            {/* Right side: Features + CTA */}
            <View style={styles.landscapeRight}>
              <View style={[styles.features, { marginBottom: Spacing.md }]}>
                {features.map((feature, index) => (
                  <GlassCard key={index} variant="default" size="compact" style={styles.featureCard}>
                    <View style={styles.featureContent}>
                      <View style={styles.featureIcon}>{feature.icon}</View>
                      <GradientText variant="subtle" style={styles.featureText}>{feature.text}</GradientText>
                    </View>
                  </GlassCard>
                ))}
              </View>
              <Button
                variant="primary"
                size="large"
                fullWidth
                onPress={() => triggerBlackout(() => router.push('/(auth)/signin'))}
              >
                {t('onboarding.getStarted')}
              </Button>
              <GradientText variant="muted" style={styles.terms}>
                {t('auth.agreeToTerms')}
              </GradientText>
            </View>
          </View>
        ) : (
          // Portrait: Stack layout
          <>
            {/* Logo & Title */}
            <View style={styles.header}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <GradientTitle style={styles.appName}>SpendTrak</GradientTitle>
            </View>

            {/* Hero Text */}
            <View style={styles.heroSection}>
              <GradientHeading style={styles.heroTitle}>
                {t('welcome.heroTitle')}
              </GradientHeading>
              <GradientTitle style={styles.heroHighlight}>
                {t('welcome.heroHighlight')}
              </GradientTitle>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {features.map((feature, index) => (
                <GlassCard key={index} variant="default" size="compact" style={styles.featureCard}>
                  <View style={styles.featureContent}>
                    <View style={styles.featureIcon}>{feature.icon}</View>
                    <GradientText variant="subtle" style={styles.featureText}>{feature.text}</GradientText>
                  </View>
                </GlassCard>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* CTA Buttons - only in portrait */}
      {!isLandscape && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={() => triggerBlackout(() => router.push('/(auth)/signin'))}
          >
            {t('onboarding.getStarted')}
          </Button>
          <GradientText variant="muted" style={styles.terms}>
            {t('auth.agreeToTerms')}
          </GradientText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Allow AnimatedBackground to show through
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 0,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroHighlight: {},
  features: {
    marginBottom: Spacing.lg,
  },
  featureCard: {
    marginBottom: Spacing.sm,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  terms: {
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  // Landscape styles
  landscapeContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  landscapeLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: Spacing.lg,
  },
  landscapeRight: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: Spacing.lg,
  },
});
