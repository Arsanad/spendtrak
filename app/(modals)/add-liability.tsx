// SPENDTRAK CINEMATIC EDITION - Add Liability Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { Input, AmountInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { saveDevLiability, autoSaveNetWorthSnapshot } from '../../src/services/devStorage';
import { logger } from '../../src/utils/logger';

const LIABILITY_TYPES = [
  { id: 'credit_card', labelKey: 'debts.typeCreditCard', icon: 'card-outline' },
  { id: 'personal_loan', labelKey: 'debts.typePersonalLoan', icon: 'cash-outline' },
  { id: 'car_loan', labelKey: 'debts.typeCarLoan', icon: 'car-outline' },
  { id: 'mortgage', labelKey: 'debts.typeMortgage', icon: 'home-outline' },
  { id: 'student_loan', labelKey: 'debts.typeStudentLoan', icon: 'school-outline' },
  { id: 'medical', labelKey: 'debts.typeMedical', icon: 'medical-outline' },
  { id: 'business', labelKey: 'debts.typeBusiness', icon: 'business-outline' },
  { id: 'other', labelKey: 'debts.typeOther', icon: 'ellipsis-horizontal-outline' },
];

const LIABILITY_ICONS = [
  { id: 'card-outline', nameKey: 'common.iconCard' },
  { id: 'cash-outline', nameKey: 'common.iconCash' },
  { id: 'car-outline', nameKey: 'common.iconCar' },
  { id: 'home-outline', nameKey: 'common.iconHome' },
  { id: 'school-outline', nameKey: 'common.iconEducation' },
  { id: 'medical-outline', nameKey: 'common.iconMedical' },
  { id: 'business-outline', nameKey: 'common.iconBusiness' },
  { id: 'wallet-outline', nameKey: 'common.iconWallet' },
  { id: 'trending-down-outline', nameKey: 'common.iconDebt' },
  { id: 'document-text-outline', nameKey: 'common.iconDocument' },
  { id: 'calculator-outline', nameKey: 'common.iconFinance' },
  { id: 'storefront-outline', nameKey: 'common.iconStore' },
];

export default function AddLiabilityModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [selectedType, setSelectedType] = useState('credit_card');
  const [selectedIcon, setSelectedIcon] = useState('card-outline');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isValid = name.trim() && value && parseFloat(value) > 0;

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await saveDevLiability({
        id: `liability_${Date.now()}`,
        user_id: 'dev_user',
        name: name.trim(),
        category: LIABILITY_TYPES.find(lt => lt.id === selectedType)?.id || 'other',
        value: parseFloat(value),
        icon: selectedIcon,
        interest_rate: parseFloat(interestRate) || undefined,
        notes: notes.trim() || undefined,
        created_at: now,
        updated_at: now,
      });
      // Auto-save net worth snapshot to track changes over time
      autoSaveNetWorthSnapshot().catch(() => {
        // Silently fail - not critical for UI
      });
      router.back();
    } catch (error) {
      logger.general.error('Error saving liability:', error);
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  // Update icon when type changes
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    const typeInfo = LIABILITY_TYPES.find(t => t.id === typeId);
    if (typeInfo) {
      setSelectedIcon(typeInfo.icon);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('netWorth.addLiability')}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid || isSaving}
          saveLabel={isSaving ? t('common.loading') : t('common.save')}
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
          {/* Liability Name */}
          <View style={styles.section}>
            <Input
              label={t('netWorth.liabilityName')}
              value={name}
              onChangeText={setName}
              placeholder={t('netWorth.liabilityNamePlaceholder')}
            />
          </View>

          {/* Liability Type */}
          <View style={styles.section}>
            <SectionHeader title={t('transactions.type')} />
            <View style={styles.typeGrid}>
              {LIABILITY_TYPES.map((type) => (
                <Chip
                  key={type.id}
                  selected={selectedType === type.id}
                  onPress={() => handleTypeChange(type.id)}
                  style={styles.typeChip}
                >
                  {t(type.labelKey)}
                </Chip>
              ))}
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <SectionHeader title={t('categories.title')} />
            <View style={styles.iconGrid}>
              {LIABILITY_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon.id;
                return (
                  <TouchableOpacity
                    key={icon.id}
                    onPress={() => setSelectedIcon(icon.id)}
                    style={[
                      styles.iconItem,
                      isSelected && styles.iconItemSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icon.id as any}
                      size={24}
                      color={isSelected ? Colors.semantic.expense : Colors.text.tertiary}
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

          {/* Value */}
          <View style={styles.section}>
            <AmountInput
              label={t('debts.remainingAmount')}
              value={value}
              onChangeText={setValue}
              placeholder="0.00"
              currency={currencyCode}
            />
          </View>

          {/* Interest Rate */}
          <View style={styles.section}>
            <Input
              label={t('debts.interestRate')}
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder={t('debts.interestRatePlaceholder')}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Input
              label={t('transactions.notesOptional')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('transactions.notesPlaceholder')}
              multiline
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  typeChip: {
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
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
    borderColor: `${Colors.semantic.expense}30`,
    backgroundColor: 'transparent',
    gap: 4,
  },
  iconItemSelected: {
    borderColor: Colors.semantic.expense,
    backgroundColor: `${Colors.semantic.expense}15`,
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
    color: Colors.semantic.expense,
  },
});
