// SPENDTRAK CINEMATIC EDITION - Add Bill Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { Input, AmountInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { Toggle } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { useBillStore } from '../../src/stores/billStore';
import { logger } from '../../src/utils/logger';

export default function AddBillModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();

  const frequencies = [
    { id: 'weekly', label: t('subscriptions.weekly') },
    { id: 'monthly', label: t('subscriptions.monthly') },
    { id: 'quarterly', label: t('subscriptions.quarterly') },
    { id: 'yearly', label: t('subscriptions.yearly') },
  ];

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dueDay, setDueDay] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [isEssential, setIsEssential] = useState(false);
  const [autoPay, setAutoPay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Connect to Zustand store
  const { createBill, isLoading } = useBillStore();

  const isValid = name && amount && !isSaving;

  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);

    try {
      const dueDayNum = parseInt(dueDay) || 1;
      const today = new Date();

      // Create bill data
      const billData = {
        name: name.trim(),
        amount: parseFloat(amount),
        currency: currencyCode,
        frequency: frequency,
        due_day: dueDayNum,
        start_date: today.toISOString(),
        payee_name: payeeName.trim() || null,
        is_essential: isEssential,
        auto_pay: autoPay,
        reminder_days: 3,
        is_active: true,
        household_id: null,
        category_id: null,
        end_date: null,
        notes: null,
      };

      await createBill(billData);

      router.back();
    } catch (error) {
      logger.general.error('Failed to save bill:', error);
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('settings.addBill') || 'Add Bill'}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid}
          saveLabel={isSaving ? t('common.loading') : t('common.save')}
        />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Input
              label={t('settings.billName') || 'Bill Name'}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.billNamePlaceholder') || 'e.g., Electricity, Rent'}
            />
          </View>

          <View style={styles.section}>
            <AmountInput
              label={t('transactions.amount')}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              currency={currencyCode}
            />
          </View>

          <View style={styles.section}>
            <Input
              label={t('settings.payee') || 'Payee (Optional)'}
              value={payeeName}
              onChangeText={setPayeeName}
              placeholder={t('settings.payeePlaceholder') || 'e.g., Electric Company'}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('subscriptions.billingCycle')} />
            <View style={styles.frequencyGrid}>
              {frequencies.map((f) => (
                <Chip
                  key={f.id}
                  selected={frequency === f.id}
                  onPress={() => setFrequency(f.id as typeof frequency)}
                  style={styles.frequencyChip}
                >
                  {f.label}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Input
              label={t('settings.dueDay') || 'Due Day of Month'}
              value={dueDay}
              onChangeText={setDueDay}
              placeholder="1-31"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <SectionHeader title={t('settings.essential') || 'Essential Bill'} />
              <Toggle value={isEssential} onValueChange={setIsEssential} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <SectionHeader title={t('settings.autoPay') || 'Auto-Pay Enabled'} />
              <Toggle value={autoPay} onValueChange={setAutoPay} />
            </View>
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
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -Spacing.xs },
  frequencyChip: { marginHorizontal: Spacing.xs, marginBottom: Spacing.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
