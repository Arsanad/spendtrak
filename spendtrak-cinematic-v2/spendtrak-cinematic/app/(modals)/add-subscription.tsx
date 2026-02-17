// SPENDTRAK CINEMATIC EDITION - Add Subscription Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { Input, AmountInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';

const frequencies = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
];

export default function AddSubscriptionModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [billingDay, setBillingDay] = useState('');

  const isValid = name && amount;

  const handleSave = () => {
    if (!isValid) return;
    router.back();
  };

  return (
    <View style={styles.container}>
      <SimpleFog height="15%" />

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader title="Add Subscription" onClose={() => router.back()} onSave={handleSave} saveDisabled={!isValid} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Input label="Service Name" value={name} onChangeText={setName} placeholder="e.g. Netflix, Spotify" />
          </View>

          <View style={styles.section}>
            <AmountInput label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" currency="AED" />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Billing Frequency" />
            <View style={styles.frequencyGrid}>
              {frequencies.map((f) => (
                <Chip key={f.id} selected={frequency === f.id} onPress={() => setFrequency(f.id)} style={styles.frequencyChip}>
                  {f.label}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Input label="Billing Day" value={billingDay} onChangeText={setBillingDay} placeholder="1-31" keyboardType="number-pad" maxLength={2} />
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
