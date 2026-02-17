// SPENDTRAK CINEMATIC EDITION - Add Debt Modal
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
import { saveDevDebt } from '../../src/services/devStorage';
import { logger } from '../../src/utils/logger';

const DEBT_TYPES = [
  { id: 'credit_card', labelKey: 'debts.typeCreditCard', icon: 'card-outline' },
  { id: 'personal_loan', labelKey: 'debts.typePersonalLoan', icon: 'cash-outline' },
  { id: 'car_loan', labelKey: 'debts.typeCarLoan', icon: 'car-outline' },
  { id: 'mortgage', labelKey: 'debts.typeMortgage', icon: 'home-outline' },
  { id: 'student_loan', labelKey: 'debts.typeStudentLoan', icon: 'school-outline' },
  { id: 'medical', labelKey: 'debts.typeMedical', icon: 'medical-outline' },
  { id: 'other', labelKey: 'debts.typeOther', icon: 'ellipsis-horizontal-outline' },
];

const DEBT_ICONS = [
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

export default function AddDebtModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [selectedType, setSelectedType] = useState('credit_card');
  const [selectedIcon, setSelectedIcon] = useState('card-outline');
  const [isSaving, setIsSaving] = useState(false);

  const isValid = name.trim() && balance && parseFloat(balance) > 0;

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const balanceAmount = parseFloat(balance);
      await saveDevDebt({
        id: `debt_${Date.now()}`,
        user_id: 'dev_user',
        name: name.trim(),
        type: DEBT_TYPES.find(dt => dt.id === selectedType)?.id || 'other',
        balance: balanceAmount,
        original_balance: balanceAmount, // Track original balance for progress analytics
        interest_rate: parseFloat(interestRate) || 0,
        minimum_payment: parseFloat(minimumPayment) || 0,
        icon: selectedIcon,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
      router.back();
    } catch (error) {
      logger.general.error('Error saving debt:', error);
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  // Update icon when type changes
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    const typeInfo = DEBT_TYPES.find(t => t.id === typeId);
    if (typeInfo) {
      setSelectedIcon(typeInfo.icon);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('debts.addDebt')}
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
          {/* Debt Name */}
          <View style={styles.section}>
            <Input
              label={t('debts.debtName')}
              value={name}
              onChangeText={setName}
              placeholder={t('debts.debtNamePlaceholder')}
              testID="debt-name-input"
            />
          </View>

          {/* Debt Type */}
          <View style={styles.section}>
            <SectionHeader title={t('transactions.type')} />
            <View style={styles.typeGrid}>
              {DEBT_TYPES.map((type) => (
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
              {DEBT_ICONS.map((icon) => {
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

          {/* Outstanding Balance */}
          <View style={styles.section}>
            <AmountInput
              label={t('debts.remainingAmount')}
              value={balance}
              onChangeText={setBalance}
              placeholder="0.00"
              currency={currencyCode}
              testID="balance-input"
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
              testID="interest-rate-input"
            />
          </View>

          {/* Minimum Payment */}
          <View style={styles.section}>
            <AmountInput
              label={t('debts.minimumPayment')}
              value={minimumPayment}
              onChangeText={setMinimumPayment}
              placeholder="0.00"
              currency={currencyCode}
              testID="minimum-payment-input"
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
