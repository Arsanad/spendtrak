import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientText } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const AI_FEATURES = [
  {
    icon: 'analytics',
    title: 'Smart Insights',
    description: 'AI analyzes your spending patterns and suggests improvements',
  },
  {
    icon: 'chatbubbles',
    title: 'QUANTUM Advisor',
    description: 'Chat with your personal AI financial consultant anytime',
  },
  {
    icon: 'scan',
    title: 'Receipt Scanner',
    description: 'Snap a photo and we extract all transaction details automatically',
  },
  {
    icon: 'notifications',
    title: 'Smart Alerts',
    description: 'Get nudged before you overspend with behavioral intelligence',
  },
];

export function AIPreviewStep({ onNext }: StepProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GradientText variant="luxury" style={styles.title}>
          Powered by AI
        </GradientText>
        <Text style={styles.subtitle}>
          SpendTrak uses AI to help you make smarter financial decisions
        </Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {AI_FEATURES.map((feature, index) => (
          <Animated.View
            key={feature.title}
            entering={FadeInDown.delay(250 + index * 120).duration(500)}
          >
            <GlassCard variant="default" style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name={feature.icon as any} size={24} color={Colors.neon} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button onPress={onNext} fullWidth>
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSize.h2, fontFamily: FontFamily.bold, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.body, fontFamily: FontFamily.regular, color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing.xxl },
  scrollView: { flex: 1 },
  featureCard: { marginBottom: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.transparent.neon10,
    borderWidth: 1,
    borderColor: Colors.transparent.neon20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, marginLeft: Spacing.lg },
  featureTitle: { fontSize: FontSize.body, fontFamily: FontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing.xxs },
  featureDesc: { fontSize: FontSize.bodySmall, fontFamily: FontFamily.regular, color: Colors.text.tertiary },
  buttonContainer: { paddingVertical: Spacing.lg },
});
