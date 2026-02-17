// SPENDTRAK CINEMATIC EDITION - Add Expense Modal
// Location: app/(modals)/add-expense.tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@/design/cinematic';
import { AtmosphericFog } from '@/components/effects';
import { GradientText, GradientLabel } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, AmountInput, TextArea } from '@/components/ui/Input';
import { Chip, Toggle } from '@/components/ui/Badge';
import { ModalHeader } from '@/components/navigation';
import {
  FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon,
  UtilitiesIcon, HealthIcon, EducationIcon, TravelIcon, GiftIcon, HomeExpenseIcon,
  CameraIcon, CalendarIcon, ClockIcon, CreditCardIcon,
} from '@/components/icons';

interface CategoryOption {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryOption[] = [
  { id: '1', name: 'Food', icon: <FoodIcon size={20} color={Colors.neon} /> },
  { id: '2', name: 'Transport', icon: <TransportIcon size={20} color={Colors.neon} /> },
  { id: '3', name: 'Shopping', icon: <ShoppingIcon size={20} color={Colors.neon} /> },
  { id: '4', name: 'Entertainment', icon: <EntertainmentIcon size={20} color={Colors.neon} /> },
  { id: '5', name: 'Utilities', icon: <UtilitiesIcon size={20} color={Colors.neon} /> },
  { id: '6', name: 'Health', icon: <HealthIcon size={20} color={Colors.neon} /> },
  { id: '7', name: 'Education', icon: <EducationIcon size={20} color={Colors.neon} /> },
  { id: '8', name: 'Travel', icon: <TravelIcon size={20} color={Colors.neon} /> },
  { id: '9', name: 'Gifts', icon: <GiftIcon size={20} color={Colors.neon} /> },
  { id: '10', name: 'Home', icon: <HomeExpenseIcon size={20} color={Colors.neon} /> },
];

export default function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState(new Date().toLocaleDateString());
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const isValid = amount && merchantName && selectedCategory;

  const handleSave = () => {
    if (!isValid) return;

    // Save transaction logic here
    const transaction = {
      amount: parseFloat(amount),
      merchant_name: merchantName,
      category_id: selectedCategory,
      notes,
      is_recurring: isRecurring,
      transaction_date: date,
      transaction_time: time,
    };

    console.log('Saving transaction:', transaction);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AtmosphericFog intensity="subtle" showParticles={false} />

      {/* Header */}
      <ModalHeader
        title="Add Expense"
        onClose={() => router.back()}
        onSave={handleSave}
        saveLabel="Save"
        saveDisabled={!isValid}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <GlassCard variant="glow" style={styles.amountCard}>
          <GradientLabel style={styles.amountLabel}>Amount</GradientLabel>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>AED</Text>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              containerStyle={styles.amountInput}
              inputStyle={styles.amountInputField}
            />
          </View>
        </GlassCard>

        {/* Merchant Name */}
        <Input
          label="Merchant / Store"
          value={merchantName}
          onChangeText={setMerchantName}
          placeholder="Enter merchant name"
          leftIcon={<CreditCardIcon size={18} color={Colors.text.tertiary} />}
          containerStyle={styles.inputContainer}
        />

        {/* Category Selection */}
        <View style={styles.section}>
          <GradientLabel style={styles.sectionLabel}>Category</GradientLabel>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.categoryItemSelected,
                ]}
              >
                <View style={styles.categoryIcon}>{category.icon}</View>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameSelected,
                ]}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            leftIcon={<CalendarIcon size={18} color={Colors.text.tertiary} />}
            containerStyle={styles.dateInput}
          />
          <Input
            label="Time"
            value={time}
            onChangeText={setTime}
            leftIcon={<ClockIcon size={18} color={Colors.text.tertiary} />}
            containerStyle={styles.timeInput}
          />
        </View>

        {/* Recurring Toggle */}
        <View style={styles.toggleRow}>
          <View>
            <GradientText variant="subtle" style={styles.toggleLabel}>Recurring Transaction</GradientText>
            <Text style={styles.toggleHint}>Mark as a recurring expense</Text>
          </View>
          <Toggle value={isRecurring} onValueChange={setIsRecurring} />
        </View>

        {/* Notes */}
        <TextArea
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional notes..."
          rows={3}
          containerStyle={styles.inputContainer}
        />

        {/* Scan Receipt Button */}
        <Button
          variant="outline"
          onPress={() => router.push('/(modals)/camera')}
          icon={<CameraIcon size={20} color={Colors.primary} />}
          fullWidth
          style={styles.scanButton}
        >
          Scan Receipt Instead
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h2,
    color: Colors.text.tertiary,
    marginRight: Spacing.sm,
  },
  amountInput: {
    marginBottom: 0,
  },
  amountInputField: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: FontSize.display,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.transparent.dark30,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  categoryItemSelected: {
    borderColor: Colors.neon,
    backgroundColor: Colors.transparent.neon10,
  },
  categoryIcon: {
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: Colors.neon,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
  },
  toggleHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  scanButton: {
    marginTop: Spacing.md,
  },
});
