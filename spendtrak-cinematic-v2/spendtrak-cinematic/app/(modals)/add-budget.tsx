// SPENDTRAK CINEMATIC EDITION - Add Budget Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { AmountInput, Input } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon, HealthIcon, UtilitiesIcon } from '../../src/components/icons';

const categories = [
  { id: '1', name: 'Food', icon: <FoodIcon size={20} color={Colors.neon} /> },
  { id: '2', name: 'Transport', icon: <TransportIcon size={20} color={Colors.primary} /> },
  { id: '3', name: 'Shopping', icon: <ShoppingIcon size={20} color={Colors.deep} /> },
  { id: '4', name: 'Entertainment', icon: <EntertainmentIcon size={20} color={Colors.bright} /> },
  { id: '5', name: 'Health', icon: <HealthIcon size={20} color={Colors.neon} /> },
  { id: '6', name: 'Utilities', icon: <UtilitiesIcon size={20} color={Colors.primary} /> },
];

const periods = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export default function AddBudgetModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [alertThreshold, setAlertThreshold] = useState('80');

  const isValid = selectedCategory && amount;

  const handleSave = () => {
    if (!isValid) return;
    router.back();
  };

  return (
    <View style={styles.container}>
      <SimpleFog height="15%" />

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader title="Add Budget" onClose={() => router.back()} onSave={handleSave} saveDisabled={!isValid} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Selection */}
          <View style={styles.section}>
            <SectionHeader title="Category" />
            <View style={styles.grid}>
              {categories.map((cat) => (
                <Chip key={cat.id} selected={selectedCategory === cat.id} onPress={() => setSelectedCategory(cat.id)} icon={cat.icon} style={styles.chip}>
                  {cat.name}
                </Chip>
              ))}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <AmountInput label="Budget Amount" value={amount} onChangeText={setAmount} placeholder="0.00" currency="AED" />
          </View>

          {/* Period */}
          <View style={styles.section}>
            <SectionHeader title="Period" />
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
            <Input label="Alert at % spent" value={alertThreshold} onChangeText={setAlertThreshold} placeholder="80" keyboardType="number-pad" maxLength={3} hint="Get notified when spending reaches this percentage" />
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
});
