import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientText } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AmountInput } from '@/components/ui/Input';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { selectionTap } from '@/utils/haptics';
import type { IncomeFrequency, FinancialSituation } from '@/types/onboarding';
import { FINANCIAL_SITUATION_CONFIG } from '@/types/onboarding';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const SITUATION_OPTIONS: { value: FinancialSituation; label: string; desc: string }[] = [
  { value: 'comfortable', label: 'Comfortable', desc: 'I save easily each month' },
  { value: 'stable', label: 'Stable', desc: 'I cover my expenses with some left over' },
  { value: 'tight', label: 'Tight', desc: 'I make ends meet but saving is hard' },
  { value: 'struggling', label: 'Struggling', desc: 'I often run short before payday' },
];

export function FinancialSnapshotStep({ onNext }: StepProps) {
  const { data, updateData } = useOnboardingStore();
  const [income, setIncome] = useState(data.monthlyIncome?.toString() || '');
  const [frequency, setFrequency] = useState<IncomeFrequency>(data.incomeFrequency || 'monthly');
  const [situation, setSituation] = useState<FinancialSituation | null>(data.financialSituation || null);

  const currencySymbol = data.currencySymbol || 'USD';

  const handleContinue = () => {
    const amount = parseFloat(income);
    if (isNaN(amount) || amount <= 0 || !situation) return;
    updateData({
      monthlyIncome: amount,
      incomeFrequency: frequency,
      financialSituation: situation,
    });
    onNext();
  };

  const isValid = parseFloat(income) > 0 && situation !== null;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GradientText variant="bright" style={styles.title}>
          Your Finances
        </GradientText>
        <Text style={styles.subtitle}>This helps us build your budget</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
        <AmountInput
          label="Income"
          placeholder="0"
          value={income}
          onChangeText={setIncome}
          currency={currencySymbol}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
        <Text style={styles.sectionLabel}>Pay Frequency</Text>
        <View style={styles.chipRow}>
          {FREQUENCY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => { selectionTap(); setFrequency(opt.value); }}
              style={[styles.chip, frequency === opt.value && styles.chipSelected]}
            >
              <Text style={[styles.chipText, frequency === opt.value && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
        <Text style={styles.sectionLabel}>Financial Situation</Text>
        {SITUATION_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => { selectionTap(); setSituation(opt.value); }}
            style={[styles.situationItem, situation === opt.value && styles.situationItemSelected]}
          >
            <Text style={[styles.situationLabel, situation === opt.value && styles.situationLabelSelected]}>
              {opt.label}
            </Text>
            <Text style={styles.situationDesc}>{opt.desc}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <View style={styles.buttonContainer}>
        <Button onPress={handleContinue} fullWidth disabled={!isValid}>
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSize.h2, fontFamily: FontFamily.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.body, fontFamily: FontFamily.regular, color: Colors.text.tertiary, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionLabel: { fontSize: FontSize.caption, fontFamily: FontFamily.medium, color: Colors.text.secondary, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.tertiary,
  },
  chipSelected: {
    borderColor: Colors.neon,
    backgroundColor: Colors.transparent.neon10,
  },
  chipText: { fontSize: FontSize.bodySmall, fontFamily: FontFamily.medium, color: Colors.text.secondary },
  chipTextSelected: { color: Colors.neon },
  situationItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: Spacing.sm,
  },
  situationItemSelected: {
    borderColor: Colors.neon,
    backgroundColor: Colors.transparent.neon10,
  },
  situationLabel: { fontSize: FontSize.body, fontFamily: FontFamily.semiBold, color: Colors.text.primary },
  situationLabelSelected: { color: Colors.neon },
  situationDesc: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, color: Colors.text.tertiary, marginTop: Spacing.xxs },
  buttonContainer: { paddingVertical: Spacing.lg },
});
