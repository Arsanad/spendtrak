// SPENDTRAK CINEMATIC EDITION - Add Expense Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Input, AmountInput, TextArea } from '../../src/components/ui/Input';
import { Chip, Toggle } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon, HealthIcon, UtilitiesIcon, EducationIcon, TravelIcon } from '../../src/components/icons';

const categories = [
  { id: '1', name: 'Food', icon: <FoodIcon size={20} color={Colors.neon} /> },
  { id: '2', name: 'Transport', icon: <TransportIcon size={20} color={Colors.primary} /> },
  { id: '3', name: 'Shopping', icon: <ShoppingIcon size={20} color={Colors.deep} /> },
  { id: '4', name: 'Entertainment', icon: <EntertainmentIcon size={20} color={Colors.bright} /> },
  { id: '5', name: 'Health', icon: <HealthIcon size={20} color={Colors.neon} /> },
  { id: '6', name: 'Utilities', icon: <UtilitiesIcon size={20} color={Colors.primary} /> },
  { id: '7', name: 'Education', icon: <EducationIcon size={20} color={Colors.deep} /> },
  { id: '8', name: 'Travel', icon: <TravelIcon size={20} color={Colors.bright} /> },
];

export default function AddExpenseModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cardLastFour, setCardLastFour] = useState('');

  const isValid = amount && merchant && selectedCategory;

  const handleSave = () => {
    if (!isValid) return;
    // Save transaction logic here
    router.back();
  };

  return (
    <View style={styles.container}>
      <SimpleFog height="15%" />

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title="Add Expense"
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid}
        />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount */}
          <GlassCard variant="glow" style={styles.amountCard}>
            <GradientText variant="muted" style={styles.amountLabel}>Amount</GradientText>
            <AmountInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              currency="AED"
              style={styles.amountInput}
            />
          </GlassCard>

          {/* Merchant */}
          <View style={styles.section}>
            <Input
              label="Merchant / Store"
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g. Carrefour, Uber, Amazon"
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <SectionHeader title="Category" />
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  selected={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  icon={cat.icon}
                  style={styles.categoryChip}
                >
                  {cat.name}
                </Chip>
              ))}
            </View>
          </View>

          {/* Card Last Four */}
          <View style={styles.section}>
            <Input
              label="Card (Last 4 digits)"
              value={cardLastFour}
              onChangeText={setCardLastFour}
              placeholder="1234"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <TextArea
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional details..."
              rows={3}
            />
          </View>

          {/* Recurring Toggle */}
          <GlassCard variant="default" size="compact" style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <GradientText variant="subtle">Mark as Recurring</GradientText>
              <Toggle value={isRecurring} onValueChange={setIsRecurring} />
            </View>
          </GlassCard>

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
  amountCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    marginBottom: Spacing.sm,
  },
  amountInput: {
    marginBottom: 0,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  categoryChip: {
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  toggleCard: {
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
