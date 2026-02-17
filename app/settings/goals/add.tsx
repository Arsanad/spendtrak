// SPENDTRAK CINEMATIC EDITION - Add Goal Screen
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily } from '../../../src/design/cinematic';
import { useCurrency } from '../../../src/context/CurrencyContext';
import { AmountInput, Input } from '../../../src/components/ui/Input';
import { ModalHeader } from '../../../src/components/navigation';
import { SectionHeader } from '../../../src/components/dashboard';
import { saveDevGoal } from '../../../src/services/devStorage';
import { successBuzz, errorBuzz, selectionTap } from '../../../src/utils/haptics';
import { useTranslation } from '../../../src/context/LanguageContext';
import { logger } from '../../../src/utils/logger';
import { eventBus } from '../../../src/services/eventBus';

const GOAL_ICONS = [
  { id: 'wallet-outline', nameKey: 'goals.iconWallet' },
  { id: 'car-outline', nameKey: 'goals.iconCar' },
  { id: 'home-outline', nameKey: 'goals.iconHome' },
  { id: 'airplane-outline', nameKey: 'goals.iconTravel' },
  { id: 'school-outline', nameKey: 'goals.iconEducation' },
  { id: 'medical-outline', nameKey: 'goals.iconHealth' },
  { id: 'gift-outline', nameKey: 'goals.iconGift' },
  { id: 'diamond-outline', nameKey: 'goals.iconLuxury' },
  { id: 'umbrella-outline', nameKey: 'goals.iconEmergency' },
  { id: 'cash-outline', nameKey: 'goals.iconSavings' },
  { id: 'laptop-outline', nameKey: 'goals.iconTech' },
  { id: 'fitness-outline', nameKey: 'goals.iconFitness' },
];

export default function AddGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wallet-outline');
  const [isSaving, setIsSaving] = useState(false);

  const isValid = name.trim() && targetAmount && parseFloat(targetAmount) > 0;

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await saveDevGoal({
        id: `goal_${Date.now()}`,
        user_id: 'dev_user',
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: '', // Optional
        icon: selectedIcon,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
      await successBuzz();

      // Emit event for Quantum Alive Experience
      eventBus.emit('goal:created', { name: name.trim(), target: parseFloat(targetAmount) });

      router.back();
    } catch (error) {
      logger.general.error('Error saving goal:', error);
      await errorBuzz();
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('goals.createGoal')}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid || isSaving}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Goal Name */}
          <View style={styles.section}>
            <Input
              label={t('goals.goalName')}
              value={name}
              onChangeText={setName}
              placeholder={t('goals.goalName')}
              testID="goal-name-input"
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <SectionHeader title={t('goals.icon')} />
            <View style={styles.iconGrid}>
              {GOAL_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon.id;
                return (
                  <TouchableOpacity
                    key={icon.id}
                    onPress={() => { selectionTap(); setSelectedIcon(icon.id); }}
                    style={[
                      styles.iconItem,
                      isSelected && styles.iconItemSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icon.id as any}
                      size={24}
                      color={isSelected ? Colors.neon : Colors.text.tertiary}
                    />
                    <Text style={[
                      styles.iconLabel,
                      isSelected && styles.iconLabelSelected,
                    ]}>
                      {t(icon.nameKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Target Amount */}
          <View style={styles.section}>
            <AmountInput
              label={t('goals.targetAmount')}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0.00"
              currency={currencyCode}
              testID="target-amount-input"
            />
          </View>

          {/* Current Amount (Optional) */}
          <View style={styles.section}>
            <AmountInput
              label={t('goals.currentAmount')}
              value={currentAmount}
              onChangeText={setCurrentAmount}
              placeholder="0.00"
              currency={currencyCode}
              testID="current-amount-input"
            />
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
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.neon}30`,
    backgroundColor: 'transparent',
    gap: 4,
  },
  iconItemSelected: {
    borderColor: Colors.neon,
    backgroundColor: `${Colors.neon}15`,
  },
  iconLabel: {
    fontFamily: FontFamily.medium,
    color: Colors.text.tertiary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: Colors.neon,
  },
});
