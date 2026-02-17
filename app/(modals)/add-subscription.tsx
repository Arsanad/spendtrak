// SPENDTRAK CINEMATIC EDITION - Add Subscription Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { Input, AmountInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { logger } from '../../src/utils/logger';

export default function AddSubscriptionModal() {
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
  const [frequency, setFrequency] = useState('monthly');
  const [billingDay, setBillingDay] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Connect to Zustand store
  const { createSubscription, isLoading } = useSubscriptionStore();

  const isValid = name && amount && !isSaving;

  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);

    try {
      // Calculate next billing date based on billing day
      const today = new Date();
      const billingDayNum = parseInt(billingDay) || today.getDate();
      let nextBillingDate = new Date(today.getFullYear(), today.getMonth(), billingDayNum);

      // If billing day has passed this month, move to next period
      if (nextBillingDate <= today) {
        if (frequency === 'weekly') {
          nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        } else if (frequency === 'monthly') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        } else if (frequency === 'quarterly') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
        } else if (frequency === 'yearly') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }
      }

      // Create subscription data - use correct field names expected by service
      const subscriptionData = {
        merchant_name: name.trim(),
        display_name: name.trim(),
        amount: parseFloat(amount),
        frequency: frequency as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        billing_day: billingDayNum,
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        status: 'active' as const,
        currency: currencyCode,
      };

      await createSubscription(subscriptionData);

      router.back();
    } catch (error) {
      logger.general.error('Failed to save subscription:', error);
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('subscriptions.addSubscription')}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid}
          saveLabel={isSaving ? t('common.loading') : t('common.save')}
        />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Input label={t('subscriptions.serviceName')} value={name} onChangeText={setName} placeholder={t('subscriptions.serviceNamePlaceholder')} />
          </View>

          <View style={styles.section}>
            <AmountInput label={t('transactions.amount')} value={amount} onChangeText={setAmount} placeholder="0.00" currency={currencyCode} />
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('subscriptions.billingCycle')} />
            <View style={styles.frequencyGrid}>
              {frequencies.map((f) => (
                <Chip key={f.id} selected={frequency === f.id} onPress={() => setFrequency(f.id)} style={styles.frequencyChip}>
                  {f.label}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Input label={t('subscriptions.nextBilling')} value={billingDay} onChangeText={setBillingDay} placeholder="1-31" keyboardType="number-pad" maxLength={2} />
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
});
