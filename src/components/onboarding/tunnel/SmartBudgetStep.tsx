import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientText } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { calculateBudgets } from '@/services/budgetCalculator';
import { lightTap } from '@/utils/haptics';
import type { BudgetSuggestion } from '@/types/onboarding';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SmartBudgetStep({ onNext }: StepProps) {
  const { data, updateData } = useOnboardingStore();
  const [budgets, setBudgets] = useState<BudgetSuggestion[]>(data.budgets || []);

  const currencySymbol = data.currencySymbol || 'USD';

  useEffect(() => {
    if (budgets.length === 0 && data.monthlyIncome && data.financialSituation && data.painPoints) {
      const suggestions = calculateBudgets(
        data.monthlyIncome,
        data.incomeFrequency || 'monthly',
        data.financialSituation,
        data.painPoints,
      );
      setBudgets(suggestions);
    }
  }, []);

  const adjustBudget = (index: number, delta: number) => {
    lightTap();
    setBudgets((prev) => {
      const updated = [...prev];
      const newAmount = Math.max(5, updated[index].amount + delta);
      updated[index] = { ...updated[index], amount: newAmount };
      return updated;
    });
  };

  const total = budgets.reduce((s, b) => s + b.amount, 0);

  const handleContinue = () => {
    updateData({ budgets });
    onNext();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GradientText variant="bright" style={styles.title}>
          Smart Budgets
        </GradientText>
        <Text style={styles.subtitle}>
          We calculated budgets based on your income. Adjust as needed.
        </Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {budgets.map((budget, index) => (
          <Animated.View
            key={budget.categoryId}
            entering={FadeInDown.delay(200 + index * 80).duration(400)}
          >
            <GlassCard variant="default" size="compact" style={styles.budgetCard}>
              <View style={styles.budgetRow}>
                <View style={styles.budgetInfo}>
                  <Ionicons name={budget.categoryIcon as any} size={20} color={Colors.neon} />
                  <Text style={styles.budgetName}>{budget.categoryName}</Text>
                </View>
                <View style={styles.budgetControls}>
                  <Pressable onPress={() => adjustBudget(index, -25)} style={styles.adjustButton}>
                    <Ionicons name="remove" size={18} color={Colors.text.secondary} />
                  </Pressable>
                  <Text style={styles.budgetAmount}>
                    {currencySymbol} {budget.amount.toLocaleString()}
                  </Text>
                  <Pressable onPress={() => adjustBudget(index, 25)} style={styles.adjustButton}>
                    <Ionicons name="add" size={18} color={Colors.text.secondary} />
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(200 + budgets.length * 80).duration(400)}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Monthly Total</Text>
            <GradientText variant="bright" style={styles.totalAmount}>
              {currencySymbol} {total.toLocaleString()}
            </GradientText>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button onPress={handleContinue} fullWidth>
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
  scrollView: { flex: 1 },
  budgetCard: { marginBottom: Spacing.sm },
  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  budgetInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  budgetName: { fontSize: FontSize.body, fontFamily: FontFamily.medium, color: Colors.text.primary, marginLeft: Spacing.sm },
  budgetControls: { flexDirection: 'row', alignItems: 'center' },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.transparent.dark40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetAmount: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: Colors.neon,
    marginHorizontal: Spacing.md,
    minWidth: 80,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    marginTop: Spacing.md,
  },
  totalLabel: { fontSize: FontSize.body, fontFamily: FontFamily.medium, color: Colors.text.secondary },
  totalAmount: { fontSize: FontSize.h4, fontFamily: FontFamily.bold },
  buttonContainer: { paddingVertical: Spacing.lg },
});
