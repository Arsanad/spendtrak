import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientText } from '@/components/ui/GradientText';
import { Button } from '@/components/ui/Button';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { DEFAULT_CATEGORIES } from '@/config/categories';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { selectionTap } from '@/utils/haptics';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

// Exclude 'other' and 'housing' from selectable pain points
const SELECTABLE_CATEGORIES = DEFAULT_CATEGORIES.filter(
  (c) => c.id !== 'other' && c.id !== 'housing'
);

export function PainPointsStep({ onNext }: StepProps) {
  const { data, updateData } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(data.painPoints || []);

  const toggle = (id: string) => {
    selectionTap();
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    updateData({ painPoints: selected });
    onNext();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GradientText variant="bright" style={styles.title}>
          Where Do You Spend?
        </GradientText>
        <Text style={styles.subtitle}>
          Select categories you want to track (pick at least 2)
        </Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {SELECTABLE_CATEGORIES.map((cat, index) => {
            const isSelected = selected.includes(cat.id);
            return (
              <Animated.View
                key={cat.id}
                entering={FadeInDown.delay(150 + index * 50).duration(400)}
                style={styles.gridItem}
              >
                <Pressable
                  onPress={() => toggle(cat.id)}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                >
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color={Colors.void} />
                    </View>
                  )}
                  <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <Ionicons
                      name={cat.icon as any}
                      size={26}
                      color={isSelected ? Colors.neon : Colors.text.tertiary}
                    />
                  </View>
                  <Text
                    style={[styles.categoryName, isSelected && styles.categoryNameSelected]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Text style={styles.selectedCount}>
          {selected.length} selected
        </Text>
        <Button onPress={handleContinue} fullWidth disabled={selected.length < 2}>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.xs },
  gridItem: { width: '19%' as any, marginBottom: Spacing.md },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.tertiary,
    position: 'relative' as const,
  },
  categoryCardSelected: {
    borderColor: Colors.neon,
    backgroundColor: Colors.transparent.neon10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.transparent.dark40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  iconContainerSelected: {
    backgroundColor: Colors.transparent.neon20,
  },
  categoryName: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
  },
  categoryNameSelected: { color: Colors.neon },
  checkBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  selectedCount: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.medium,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  buttonContainer: { paddingVertical: Spacing.lg },
});
