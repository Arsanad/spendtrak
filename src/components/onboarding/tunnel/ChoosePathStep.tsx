import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientText } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { selectionTap, successBuzz } from '@/utils/haptics';
import type { PlanChoice } from '@/types/onboarding';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const FREE_FEATURES = [
  'All 45 features — unlimited',
  'Budgets, goals & net worth',
  'Behavioral engine',
  'Financial health score',
  'Bills, debts & subscriptions',
  'Household & all exports',
];

const PREMIUM_FEATURES = [
  'Everything in Free',
  'AI Receipt Scanner',
  'Gmail & Outlook Import',
  'QUANTUM AI Consultant',
  'AI Health Recommendations',
];

export function ChoosePathStep({ onNext }: StepProps) {
  const { updateData } = useOnboardingStore();
  const [choice, setChoice] = useState<PlanChoice>('free');

  const handleContinue = () => {
    successBuzz();
    updateData({ planChoice: choice });
    onNext();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GradientText variant="luxury" style={styles.title}>
          Choose Your Path
        </GradientText>
        <Text style={styles.subtitle}>You can always upgrade later</Text>
      </Animated.View>

      <View style={styles.cardsContainer}>
        {/* Free Plan */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.cardWrapper}>
          <Pressable onPress={() => { selectionTap(); setChoice('free'); }}>
            <GlassCard
              variant={choice === 'free' ? 'glow' : 'default'}
              style={styles.planCard}
            >
              <Text style={styles.planName}>Free</Text>
              <GradientText variant="bright" style={styles.planPrice}>
                $0
              </GradientText>
              <Text style={styles.planPeriod}>forever</Text>
              <View style={styles.featureList}>
                {FREE_FEATURES.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.deep} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {choice === 'free' && <View style={styles.selectedBadge}><Text style={styles.selectedText}>Selected</Text></View>}
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Premium Trial */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.cardWrapper}>
          <Pressable onPress={() => { selectionTap(); setChoice('trial'); }}>
            <GlassCard
              variant={choice === 'trial' ? 'glow' : 'default'}
              style={StyleSheet.flatten([styles.planCard, styles.premiumCard, choice === 'trial' ? styles.premiumCardSelected : {}]) as ViewStyle}
            >
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>3-DAY FREE TRIAL</Text>
              </View>
              <Text style={styles.premiumName}>Premium</Text>
              <Text style={styles.premiumPrice}>Free</Text>
              <Text style={styles.premiumPeriod}>then $9.99/mo</Text>
              <View style={styles.featureList}>
                {PREMIUM_FEATURES.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.premium.gold} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {choice === 'trial' && <View style={styles.premiumSelectedBadge}><Text style={styles.premiumSelectedText}>Selected</Text></View>}
            </GlassCard>
          </Pressable>
        </Animated.View>
      </View>

      <View style={styles.buttonContainer}>
        <Button onPress={handleContinue} fullWidth>
          {choice === 'trial' ? 'Start Free Trial' : 'Get Started'}
        </Button>
      </View>
    </View>
  );
}

const GOLD = Colors.premium.gold;
const GOLD_DIM = Colors.premium.goldDim;
const GOLD_BG = 'rgba(255, 215, 0, 0.08)';
const GOLD_BORDER = 'rgba(255, 215, 0, 0.3)';
const GOLD_BADGE_BG = 'rgba(255, 215, 0, 0.15)';

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSize.h2, fontFamily: FontFamily.bold, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.body, fontFamily: FontFamily.regular, color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing.xxl },
  cardsContainer: { flex: 1 },
  cardWrapper: { marginBottom: Spacing.lg },
  planCard: { position: 'relative' as const },
  premiumCard: {
    borderColor: GOLD_DIM,
    borderWidth: 1,
    backgroundColor: GOLD_BG,
  },
  premiumCardSelected: {
    borderColor: GOLD,
  },
  premiumBadge: {
    position: 'absolute' as const,
    top: -1,
    right: Spacing.lg,
    backgroundColor: GOLD,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs,
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  premiumBadgeText: { fontSize: FontSize.tiny, fontFamily: FontFamily.bold, color: Colors.void, letterSpacing: 1 },
  planName: { fontSize: FontSize.h4, fontFamily: FontFamily.bold, color: Colors.text.primary, marginBottom: Spacing.xs },
  premiumName: { fontSize: FontSize.h4, fontFamily: FontFamily.bold, color: GOLD, marginBottom: Spacing.xs },
  planPrice: { fontSize: FontSize.h1, fontFamily: FontFamily.bold },
  premiumPrice: { fontSize: FontSize.h1, fontFamily: FontFamily.bold, color: GOLD },
  planPeriod: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, color: Colors.text.tertiary, marginBottom: Spacing.md },
  premiumPeriod: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, color: GOLD_DIM, marginBottom: Spacing.md },
  featureList: { marginTop: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  featureText: { fontSize: FontSize.bodySmall, fontFamily: FontFamily.regular, color: Colors.text.secondary, marginLeft: Spacing.sm },
  selectedBadge: {
    position: 'absolute' as const,
    top: Spacing.md,
    left: Spacing.lg,
    backgroundColor: Colors.transparent.neon20,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.xs,
  },
  selectedText: { fontSize: FontSize.tiny, fontFamily: FontFamily.semiBold, color: Colors.neon, letterSpacing: 1, textTransform: 'uppercase' as const },
  premiumSelectedBadge: {
    position: 'absolute' as const,
    top: Spacing.md,
    left: Spacing.lg,
    backgroundColor: GOLD_BADGE_BG,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.xs,
  },
  premiumSelectedText: { fontSize: FontSize.tiny, fontFamily: FontFamily.semiBold, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' as const },
  buttonContainer: { paddingVertical: Spacing.lg },
});
