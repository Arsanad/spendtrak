// SPENDTRAK CINEMATIC EDITION - Goal Detail Screen
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../../src/design/cinematic';
import { useCurrency } from '../../../src/context/CurrencyContext';
import { GradientText } from '../../../src/components/ui/GradientText';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { Button } from '../../../src/components/ui/Button';
import { AmountInput } from '../../../src/components/ui/Input';
import { Header } from '../../../src/components/navigation';
import { ProgressRing } from '../../../src/components/premium';
import { SectionHeader } from '../../../src/components/dashboard';
import { getDevGoal, addToDevGoal, deleteDevGoal, DevGoal } from '../../../src/services/devStorage';
import { useTranslation } from '../../../src/context/LanguageContext';
import { useTransition } from '../../../src/context/TransitionContext';
import { logger } from '../../../src/utils/logger';
import { eventBus } from '../../../src/services/eventBus';

export default function GoalDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { format: formatCurrency, currencyCode } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [goal, setGoal] = useState<DevGoal | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    if (!id) return;
    try {
      const data = await getDevGoal(id);
      setGoal(data);
    } catch (error) {
      logger.general.error('Error loading goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!id || !addAmount || parseFloat(addAmount) <= 0 || isSaving) return;

    setIsSaving(true);
    try {
      const updatedGoal = await addToDevGoal(id, parseFloat(addAmount));
      setGoal(updatedGoal);
      setAddAmount('');

      // Emit events for Quantum Alive Experience
      const pct = updatedGoal.target_amount > 0
        ? (updatedGoal.current_amount / updatedGoal.target_amount) * 100
        : 0;
      eventBus.emit('goal:progress', { name: updatedGoal.name, percentComplete: pct });
      if (pct >= 100) {
        eventBus.emit('goal:completed', { name: updatedGoal.name });
      }

      Alert.alert(t('common.success'), `${t('goals.addMoney')}: ${formatCurrency(parseFloat(addAmount))}`);
    } catch (error) {
      logger.general.error('Error adding money:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('goals.deleteGoal'),
      t('goals.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await deleteDevGoal(id);
              router.back();
            } catch (error) {
              logger.general.error('Error deleting goal:', error);
              Alert.alert(t('common.error'), t('errors.generic'));
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title={t('goals.title')} showBack onBack={() => triggerBlackout(() => router.back())} />
        <View style={styles.loadingContainer}>
          <GradientText variant="muted">{t('common.loading')}</GradientText>
        </View>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.container}>
        <Header title={t('goals.title')} showBack onBack={() => triggerBlackout(() => router.back())} />
        <View style={styles.loadingContainer}>
          <GradientText variant="muted">{t('errors.notFound')}</GradientText>
        </View>
      </View>
    );
  }

  const percentage = goal.target_amount > 0
    ? (goal.current_amount / goal.target_amount) * 100
    : 0;
  const remaining = goal.target_amount - goal.current_amount;
  const isCompleted = percentage >= 100;

  return (
    <View style={styles.container}>
      <Header title={goal.name} showBack onBack={() => triggerBlackout(() => router.back())} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
        {/* Progress Card */}
        <GlassCard variant="glow" style={styles.progressCard}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={(goal.icon || 'wallet-outline') as any}
              size={32}
              color={Colors.neon}
            />
          </View>
          <ProgressRing progress={Math.min(percentage, 100)} size={140} strokeWidth={12}>
            <View style={styles.progressContent}>
              <GradientText variant="luxury" style={styles.progressPercent}>
                {percentage.toFixed(0)}%
              </GradientText>
              <GradientText variant="luxury" style={styles.progressLabel}>
                {isCompleted ? t('goals.completed') : t('goals.progress').toLowerCase()}
              </GradientText>
            </View>
          </ProgressRing>
          <View style={styles.amountInfo}>
            <GradientText variant="bright" style={styles.amountText}>
              {formatCurrency(goal.current_amount)}
            </GradientText>
            <GradientText variant="bright">
              of {formatCurrency(goal.target_amount)}
            </GradientText>
          </View>
          {remaining > 0 && (
            <GradientText variant="bronze" style={styles.remainingText}>
              {formatCurrency(remaining)} {t('budgets.remaining').toLowerCase()}
            </GradientText>
          )}
        </GlassCard>

        {/* Add Money Section */}
        {!isCompleted && (
          <View style={styles.section}>
            <SectionHeader title={t('goals.addMoney')} />
            <GlassCard variant="default" style={styles.addMoneyCard}>
              <AmountInput
                label={t('goals.addMoney')}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="0.00"
                currency={currencyCode}
              />
              <Button
                variant="primary"
                onPress={handleAddMoney}
                disabled={!addAmount || parseFloat(addAmount) <= 0 || isSaving}
                style={styles.addButton}
              >
                {isSaving ? t('common.loading') : t('goals.addMoney')}
              </Button>
            </GlassCard>
          </View>
        )}

        {/* Delete Button */}
        <View style={styles.section}>
          <Button
            variant="ghost"
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <GradientText style={{ color: Colors.semantic.expense }}>
              {t('goals.deleteGoal')}
            </GradientText>
          </Button>
        </View>

        <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.neon}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  progressContent: {
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 28,
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  amountInfo: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  amountText: {
    fontSize: 20,
    marginBottom: 4,
  },
  remainingText: {
    marginTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  addMoneyCard: {
    padding: Spacing.md,
  },
  addButton: {
    marginTop: Spacing.md,
  },
  deleteButton: {
    borderColor: Colors.semantic.expense,
    borderWidth: 1,
  },
});
