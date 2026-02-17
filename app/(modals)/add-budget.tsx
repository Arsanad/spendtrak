// SPENDTRAK CINEMATIC EDITION - Add Budget Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { AmountInput, Input } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { BUDGET_CATEGORIES } from '../../src/constants/categories';
import { saveDevBudget } from '../../src/services/devStorage';
import { successBuzz, errorBuzz } from '../../src/utils/haptics';
import { logger } from '../../src/utils/logger';
import { eventBus } from '../../src/services/eventBus';

export default function AddBudgetModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();

  const periods = [
    { id: 'weekly', label: t('budgets.weekly') },
    { id: 'monthly', label: t('budgets.monthly') },
    { id: 'yearly', label: t('budgets.yearly') },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [isSaving, setIsSaving] = useState(false);

  const isValid = selectedCategory && amount && parseFloat(amount) > 0;

  const handleSave = async () => {
    if (!isValid || !selectedCategory || isSaving) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await saveDevBudget({
        id: `budget_${Date.now()}`,
        user_id: 'dev_user',
        category_id: selectedCategory,
        amount: parseFloat(amount),
        alert_threshold: parseInt(alertThreshold) || 80,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
      await successBuzz();

      // Emit event for Quantum Alive Experience
      eventBus.emit('budget:created', {
        name: selectedCategory || 'Budget',
        amount: parseFloat(amount),
        categoryId: selectedCategory ?? undefined,
      });

      router.back();
    } catch (error) {
      logger.general.error('Error saving budget:', error);
      await errorBuzz();
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader title={t('budgets.createBudget')} onClose={() => router.back()} onSave={handleSave} saveDisabled={!isValid} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Selection - Scrollable Grid */}
          <View style={styles.section}>
            <SectionHeader title={t('transactions.category')} />
            <View style={styles.categoryContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.categoryGrid}
              >
                {BUDGET_CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      testID={`category-${category.id}`}
                      onPress={() => setSelectedCategory(category.id)}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={18}
                        color={isSelected ? Colors.neon : Colors.text.tertiary}
                      />
                      <Text style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextSelected,
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <AmountInput label={t('budgets.budgetAmount')} value={amount} onChangeText={setAmount} placeholder="0.00" currency={currencyCode} />
          </View>

          {/* Period */}
          <View style={styles.section}>
            <SectionHeader title={t('budgets.period')} />
            <View style={styles.grid}>
              {periods.map((p) => (
                <Chip key={p.id} selected={period === p.id} onPress={() => setPeriod(p.id)} style={styles.chip}>
                  {p.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Alert Threshold */}
          <View style={styles.section}>
            <Input label={`${t('budgets.alertAt')} ${t('budgets.percentUsed')}`} value={alertThreshold} onChangeText={setAlertThreshold} placeholder="80" keyboardType="number-pad" maxLength={3} hint={t('budgets.notifications')} />
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -Spacing.xs },
  chip: { marginHorizontal: Spacing.xs, marginBottom: Spacing.sm },

  // Category Grid Styles
  categoryContainer: {
    maxHeight: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.neon}40`,
    backgroundColor: 'transparent',
    gap: 6,
  },
  categoryChipSelected: {
    borderColor: Colors.neon,
    backgroundColor: `${Colors.neon}20`,
  },
  categoryText: {
    fontFamily: FontFamily.medium,
    color: Colors.text.tertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryTextSelected: {
    color: Colors.neon,
  },
});
