// SPENDTRAK CINEMATIC EDITION - Add Expense Modal
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Text, Alert, Image } from 'react-native';
import { HapticTouchableOpacity } from '../../src/components/ui/HapticPressable';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, BorderRadius } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Input, AmountInput, TextArea } from '../../src/components/ui/Input';
import { Chip, Toggle } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { BUDGET_CATEGORIES } from '../../src/constants/categories';
// Transaction Store - SINGLE SOURCE OF TRUTH
import { useTransactionStore, useReceiptStore } from '../../src/stores';
import { useCurrency } from '../../src/context/CurrencyContext';
import { successBuzz, errorBuzz, selectionTap } from '../../src/utils/haptics';
import { useTranslation } from '../../src/context/LanguageContext';
import { logger } from '../../src/utils/logger';
import { useUpgradePromptStore } from '../../src/stores';

export default function AddExpenseModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ receiptUri?: string }>();

  // Transaction Store
  const { createTransaction, isLoading } = useTransactionStore();
  const { currencyCode } = useCurrency();

  // Contextual Upgrade Engine - screen time tracking
  const screenEntryTime = React.useRef(Date.now());
  const upgradeStore = useUpgradePromptStore;

  // Track screen time on unmount
  React.useEffect(() => {
    return () => {
      const elapsedMs = Date.now() - screenEntryTime.current;
      upgradeStore.getState().trackScreenTime(elapsedMs);
      // Evaluate time-spent friction if > 5 min
      if (elapsedMs > 5 * 60 * 1000) {
        upgradeStore.getState().evaluateFriction('TIME_SPENT_TRACKING');
      }
    };
  }, []);

  // Receipt Store - for scanned data
  const { lastScanResult, clearLastResult } = useReceiptStore();

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cardLastFour, setCardLastFour] = useState('');
  const [showReceiptImage, setShowReceiptImage] = useState(false);

  // Pre-fill form with scanned receipt data
  useEffect(() => {
    if (lastScanResult) {
      // Pre-fill amount from payment.total
      if (lastScanResult.payment?.total) {
        setAmount(lastScanResult.payment.total.toString());
      }

      // Pre-fill merchant from merchant.name
      if (lastScanResult.merchant?.name) {
        setMerchant(lastScanResult.merchant.name);
      }

      // Pre-fill category if detected from first item's category
      const firstItemCategory = lastScanResult.items?.[0]?.category;
      if (firstItemCategory) {
        // Map receipt category to transaction category
        const categoryMapping: Record<string, string> = {
          'food': 'food-dining',
          'grocery': 'shopping',
          'transport': 'transportation',
          'entertainment': 'entertainment',
          'utilities': 'bills-utilities',
          'healthcare': 'health',
          'shopping': 'shopping',
          'other': 'other',
        };
        const mappedCategoryId = categoryMapping[firstItemCategory] || firstItemCategory;
        const matchedCategory = BUDGET_CATEGORIES.find(
          cat => cat.id === mappedCategoryId
        );
        if (matchedCategory) {
          setSelectedCategory(matchedCategory.id);
        }
      }

      // Add scanned items to notes
      if (lastScanResult.items && lastScanResult.items.length > 0) {
        const itemsList = lastScanResult.items
          .map(item => `${item.name}: ${item.total_price}`)
          .join('\n');
        setNotes(itemsList);
      }

      // Pre-fill card last four if available
      if (lastScanResult.payment?.card_last_four) {
        setCardLastFour(lastScanResult.payment.card_last_four);
      }

      logger.receipt.info('Pre-filled form with scanned data:', lastScanResult);
    }

    // Cleanup on unmount
    return () => {
      clearLastResult();
    };
  }, [lastScanResult]);

  const isValid = amount && merchant && selectedCategory && parseFloat(amount) > 0;

  const handleSave = async () => {
    if (!isValid || isLoading) return;

    try {
      // Create the transaction via the store
      await createTransaction({
        amount: parseFloat(amount),
        currency: currencyCode,
        merchant_name: merchant.trim(),
        category_id: selectedCategory!,
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: 'purchase',
        source: 'manual',
        notes: notes.trim() || null,
        is_recurring: isRecurring,
        card_last_four: cardLastFour || null,
      });

      // Track manual entry for Contextual Upgrade Engine (fire-and-forget)
      upgradeStore.getState().trackManualEntry(merchant.trim(), selectedCategory!);

      // Success - go back (Dashboard will auto-update from store)
      successBuzz();
      router.back();
    } catch (error) {
      // Show error alert with details
      await errorBuzz();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        t('common.error'),
        `${t('transactions.failedToSave')}: ${errorMessage}`,
        [{ text: 'OK' }]
      );
      logger.transaction.error('Failed to create transaction:', error);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('dashboard.addExpense')}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid || isLoading}
        />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Receipt Image Preview (if scanned) */}
          {params.receiptUri && (
            <HapticTouchableOpacity
              onPress={() => setShowReceiptImage(!showReceiptImage)}
              style={styles.receiptPreviewContainer}
              accessible={true}
              accessibilityLabel="Receipt image preview"
              accessibilityHint="Tap to expand or collapse"
            >
              <View style={styles.receiptPreviewHeader}>
                <Ionicons name="receipt-outline" size={18} color={Colors.neon} />
                <GradientText variant="bright" style={styles.receiptPreviewLabel}>
                  {t('camera.scannedReceipt') || 'Scanned Receipt'}
                </GradientText>
                <Ionicons
                  name={showReceiptImage ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.text.tertiary}
                />
              </View>
              {showReceiptImage && (
                <Image
                  source={{ uri: params.receiptUri }}
                  style={styles.receiptImage}
                  resizeMode="contain"
                />
              )}
            </HapticTouchableOpacity>
          )}

          {/* Amount */}
          <GlassCard variant="glow" style={styles.amountCard}>
            <GradientText variant="muted" style={styles.amountLabel}>{t('transactions.amount')}</GradientText>
            <View style={styles.amountInputWrapper}>
              <AmountInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                currency={currencyCode}
                containerStyle={styles.amountInput}
                accessibilityLabel={t('transactions.amount')}
                accessibilityHint="Enter the expense amount"
              />
            </View>
          </GlassCard>

          {/* Merchant */}
          <View style={styles.section}>
            <Input
              label={t('transactions.merchantStore')}
              value={merchant}
              onChangeText={setMerchant}
              placeholder={t('transactions.merchantPlaceholder')}
            />
          </View>

          {/* Category - Scrollable Grid */}
          <View style={styles.section}>
            <SectionHeader title={t('transactions.category')} />
            <View style={styles.categoryContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.categoriesGrid}
              >
                {BUDGET_CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <HapticTouchableOpacity
                      key={category.id}
                      testID={`category-${category.id}`}
                      onPress={() => { selectionTap(); setSelectedCategory(category.id); }}
                      style={[
                        styles.categoryChipItem,
                        isSelected && styles.categoryChipSelected,
                      ]}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`${category.name} category`}
                      accessibilityState={{ selected: isSelected }}
                      accessibilityHint={isSelected ? t('common.selected') : t('common.tapToSelect')}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={18}
                        color={isSelected ? Colors.neon : Colors.text.tertiary}
                      />
                      <Text style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextSelected,
                      ]}>
                        {category.name}
                      </Text>
                    </HapticTouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Card Last Four */}
          <View style={styles.section}>
            <Input
              label={t('transactions.cardLastFour')}
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
              label={t('transactions.notesOptional')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('transactions.notesPlaceholder')}
              rows={3}
            />
          </View>

          {/* Recurring Toggle */}
          <GlassCard variant="default" size="compact" style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <GradientText variant="subtle">{t('transactions.markAsRecurring')}</GradientText>
              <Toggle
                value={isRecurring}
                onValueChange={setIsRecurring}
                accessibilityLabel={t('transactions.markAsRecurring')}
                accessibilityHint="Toggle to mark this as a recurring expense"
              />
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
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  amountInputWrapper: {
    width: '100%',
  },
  amountInput: {
    marginBottom: 0,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  categoryContainer: {
    maxHeight: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  categoryChipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.neon}40`,
    backgroundColor: 'transparent',
    gap: 6,
  },
  categoryChipSelected: {
    borderColor: Colors.neon,
    backgroundColor: `${Colors.neon}20`,
  },
  categoryText: {
    fontFamily: FontFamily.medium,
    color: Colors.text.tertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryTextSelected: {
    color: Colors.neon,
  },
  toggleCard: {
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptPreviewContainer: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  receiptPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  receiptPreviewLabel: {
    flex: 1,
    fontSize: 14,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.background.secondary,
  },
});
