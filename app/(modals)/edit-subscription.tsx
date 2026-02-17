// SPENDTRAK CINEMATIC EDITION - Edit Subscription Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontFamily } from '../../src/design/cinematic';
import { useTranslation } from '../../src/context/LanguageContext';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { Input, AmountInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { TrashIcon, CheckIcon } from '../../src/components/icons';

const frequencies = [
  { id: 'weekly', labelKey: 'subscriptions.weekly' },
  { id: 'monthly', labelKey: 'subscriptions.monthly' },
  { id: 'quarterly', labelKey: 'settings.quarterly' },
  { id: 'yearly', labelKey: 'subscriptions.yearly' },
];

const statuses = [
  { id: 'active', labelKey: 'subscriptions.active' },
  { id: 'paused', labelKey: 'subscriptions.paused' },
  { id: 'cancelled', labelKey: 'subscriptions.cancelled' },
];

export default function EditSubscriptionModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    amount: string;
    frequency: string;
    billingDay: string;
    status: string;
  }>();

  const { updateSubscription, cancelSubscription, markAsUsed, subscriptions } = useSubscriptionStore();

  const [name, setName] = useState(params.name || '');
  const [amount, setAmount] = useState(params.amount || '');
  const [frequency, setFrequency] = useState(params.frequency || 'monthly');
  const [billingDay, setBillingDay] = useState(params.billingDay || '');
  const [status, setStatus] = useState(params.status || 'active');
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingUsed, setIsMarkingUsed] = useState(false);

  // Get current subscription data from store for last_used_at and usage_count
  const currentSubscription = subscriptions.find(s => s.id === params.id);
  const lastUsedAt = currentSubscription?.last_used_at;
  const usageCount = currentSubscription?.usage_count || 0;

  // Calculate days since last used
  const getLastUsedText = () => {
    if (!lastUsedAt) return t('subscriptions.lastUsedNever');
    const lastUsedDate = new Date(lastUsedAt);
    const today = new Date();
    const diffTime = today.getTime() - lastUsedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('subscriptions.lastUsedToday');
    return t('subscriptions.lastUsedDaysAgo', { days: diffDays.toString() });
  };

  const isValid = name && amount;

  const handleSave = async () => {
    if (!isValid || !params.id) return;

    setIsLoading(true);
    try {
      await updateSubscription(params.id, {
        merchant_name: name,
        amount: parseFloat(amount),
        frequency: frequency as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        billing_day: billingDay ? parseInt(billingDay, 10) : null,
        status: status as 'active' | 'paused' | 'cancelled',
      });
      router.back();
    } catch (error) {
      Alert.alert(t('common.error'), t('subscriptions.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!params.id || isMarkingUsed) return;

    setIsMarkingUsed(true);
    try {
      await markAsUsed(params.id);
      // Show success feedback - the store will update automatically
    } catch (error) {
      Alert.alert(t('common.error'), t('subscriptions.updateFailed'));
    } finally {
      setIsMarkingUsed(false);
    }
  };

  const handleDelete = () => {
    if (!params.id) return;

    Alert.alert(
      t('subscriptions.deleteSubscription'),
      t('settings.deleteConfirmMessage').replace('{{name}}', name),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await cancelSubscription(params.id);
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), t('subscriptions.deleteFailed'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('subscriptions.editSubscription')}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid || isLoading}
        />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Input
              label={t('settings.serviceName')}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.serviceNamePlaceholder')}
            />
          </View>

          <View style={styles.section}>
            <AmountInput
              label={t('subscriptions.amount')}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              currency={currencyCode}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('settings.billingFrequency')} />
            <View style={styles.chipGrid}>
              {frequencies.map((f) => (
                <Chip
                  key={f.id}
                  selected={frequency === f.id}
                  onPress={() => setFrequency(f.id)}
                  style={styles.chip}
                >
                  {t(f.labelKey as any)}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Input
              label={t('settings.billingDay')}
              value={billingDay}
              onChangeText={setBillingDay}
              placeholder="1-31"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('settings.status')} />
            <View style={styles.chipGrid}>
              {statuses.map((s) => (
                <Chip
                  key={s.id}
                  selected={status === s.id}
                  onPress={() => setStatus(s.id)}
                  style={styles.chip}
                >
                  {t(s.labelKey as any)}
                </Chip>
              ))}
            </View>
          </View>

          {/* Usage Tracking Section */}
          <View style={styles.usageSection}>
            <SectionHeader title={t('subscriptions.usageTracking')} />
            <View style={styles.usageCard}>
              <View style={styles.usageInfo}>
                <Text style={styles.usageLabel}>{t('subscriptions.lastUsed')}</Text>
                <Text style={styles.usageValue}>{getLastUsedText()}</Text>
                {usageCount > 0 && (
                  <Text style={styles.usageCount}>
                    {t('subscriptions.usageCount', { count: usageCount.toString() })}
                  </Text>
                )}
              </View>
              <Button
                variant="primary"
                size="small"
                onPress={handleMarkAsUsed}
                disabled={isMarkingUsed}
                style={styles.markUsedButton}
              >
                <View style={styles.markUsedContent}>
                  <CheckIcon size={16} color={Colors.void} />
                  <Text style={styles.markUsedText}>
                    {isMarkingUsed ? t('common.loading') : t('subscriptions.markAsUsed')}
                  </Text>
                </View>
              </Button>
            </View>
          </View>

          {/* Delete Button */}
          <View style={styles.deleteSection}>
            <Button
              variant="outline"
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              <View style={styles.deleteButtonContent}>
                <TrashIcon size={18} color={Colors.semantic.error} />
                <Text style={styles.deleteText}>{t('subscriptions.deleteSubscription')}</Text>
              </View>
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  chip: {
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  deleteSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  deleteButton: {
    borderColor: Colors.semantic.error,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Colors.semantic.error,
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    marginLeft: Spacing.sm,
  },
  usageSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  usageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.transparent.dark10,
    borderRadius: 12,
    padding: Spacing.md,
  },
  usageInfo: {
    flex: 1,
  },
  usageLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: FontFamily.medium,
  },
  usageCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  markUsedButton: {
    minWidth: 120,
  },
  markUsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markUsedText: {
    color: Colors.void,
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    marginLeft: Spacing.xs,
  },
});
