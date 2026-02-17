import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientText } from '@/components/ui/GradientText';
import { Button } from '@/components/ui/Button';
import { Input, AmountInput } from '@/components/ui/Input';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { selectionTap } from '@/utils/haptics';
import type { GoalType } from '@/types/onboarding';
import { GOAL_TYPE_CONFIG } from '@/types/onboarding';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const GOAL_TYPES = Object.entries(GOAL_TYPE_CONFIG) as [GoalType, { icon: string; label: string }][];

export function GoalStep({ onNext }: StepProps) {
  const { data, updateData } = useOnboardingStore();
  const [goalType, setGoalType] = useState<GoalType | null>((data.goalType as GoalType) || null);
  const [goalName, setGoalName] = useState(data.goalName || '');
  const [goalAmount, setGoalAmount] = useState(data.goalAmount?.toString() || '');

  const currencySymbol = data.currencySymbol || 'USD';

  const handleSelectType = (type: GoalType) => {
    selectionTap();
    setGoalType(type);
    if (!goalName) {
      setGoalName(GOAL_TYPE_CONFIG[type].label);
    }
  };

  const handleContinue = () => {
    if (!goalType) return;
    const amount = parseFloat(goalAmount);
    updateData({
      goalType,
      goalName: goalName.trim() || GOAL_TYPE_CONFIG[goalType].label,
      goalAmount: isNaN(amount) ? 0 : amount,
      goalTargetDate: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
    onNext();
  };

  const handleSkip = () => {
    updateData({ goalType: undefined, goalName: '', goalAmount: 0 });
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GradientText variant="bright" style={styles.title}>
          Set a Goal
        </GradientText>
        <Text style={styles.subtitle}>What are you saving for?</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.typeGrid}>
        {GOAL_TYPES.map(([type, config]) => {
          const isSelected = goalType === type;
          return (
            <Pressable
              key={type}
              onPress={() => handleSelectType(type)}
              style={[styles.typeCard, isSelected && styles.typeCardSelected]}
            >
              <Ionicons
                name={config.icon as any}
                size={28}
                color={isSelected ? Colors.neon : Colors.text.tertiary}
              />
              <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {goalType && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.detailsSection}>
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Fund"
            value={goalName}
            onChangeText={setGoalName}
          />
          <AmountInput
            label="Target Amount"
            placeholder="0"
            value={goalAmount}
            onChangeText={setGoalAmount}
            currency={currencySymbol}
          />
        </Animated.View>
      )}

      <View style={styles.buttonContainer}>
        <Button onPress={handleContinue} fullWidth disabled={!goalType}>
          Continue
        </Button>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSize.h2, fontFamily: FontFamily.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.body, fontFamily: FontFamily.regular, color: Colors.text.tertiary, marginBottom: Spacing.lg },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeCard: {
    width: '47%' as any,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.tertiary,
  },
  typeCardSelected: {
    borderColor: Colors.neon,
    backgroundColor: Colors.transparent.neon10,
  },
  typeLabel: { fontSize: FontSize.bodySmall, fontFamily: FontFamily.medium, color: Colors.text.secondary, marginTop: Spacing.sm, textAlign: 'center' },
  typeLabelSelected: { color: Colors.neon },
  detailsSection: { marginBottom: Spacing.lg },
  buttonContainer: { paddingVertical: Spacing.lg, paddingBottom: Spacing.huge },
  skipButton: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { fontSize: FontSize.body, fontFamily: FontFamily.medium, color: Colors.text.tertiary },
});
