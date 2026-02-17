/**
 * Transaction Detail Screen
 * Deep link: spendtrak://transaction/:id
 * Universal link: https://spendtrak.app/transaction/:id
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { PremiumPressable } from '../../src/components/ui/PremiumPressable';
import { AnimatedScreen } from '../../src/components/ui/AnimatedScreen';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useCurrency } from '../../src/context/CurrencyContext';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction } from '../../src/types';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction, isLoading } = useTransactionStore();
  const { format: formatAmount } = useCurrency();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Find transaction in store
      const found = transactions.find(t => t.id === id);
      setTransaction(found || null);
      setLoading(false);
    }
  }, [id, transactions]);

  const handleEdit = () => {
    router.push({
      pathname: '/(modals)/add-expense',
      params: { editId: id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteTransaction(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (loading || isLoading) {
    return (
      <AnimatedScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <GradientText variant="subtle" style={styles.loadingText}>
            Loading transaction...
          </GradientText>
        </View>
      </AnimatedScreen>
    );
  }

  if (!transaction) {
    return (
      <AnimatedScreen>
        <View style={styles.container}>
          <View style={styles.header}>
            <PremiumPressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </PremiumPressable>
          </View>
          <View style={styles.notFoundContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={Colors.expense} />
            <GradientText variant="subtle" style={styles.notFoundText}>
              Transaction not found
            </GradientText>
            <PremiumPressable onPress={handleBack} style={styles.goBackButton}>
              <GradientText>Go Back</GradientText>
            </PremiumPressable>
          </View>
        </View>
      </AnimatedScreen>
    );
  }

  // Expenses are purchase, payment, atm; refunds are income-like
  const isExpense = ['purchase', 'payment', 'atm'].includes(transaction.transaction_type);
  const amountColor = isExpense ? Colors.expense : Colors.income;

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <PremiumPressable onPress={handleBack} style={styles.backButton} testID="back-button">
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            <GradientText style={styles.backText}>Back</GradientText>
          </PremiumPressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Amount Card */}
          <GlassCard style={styles.amountCard}>
            <GradientText
              variant={isExpense ? 'expense' : 'income'}
              style={styles.amount}
              testID="detail-amount"
            >
              {isExpense ? '-' : '+'}{formatAmount(transaction.amount)}
            </GradientText>
            <View style={styles.typeContainer}>
              <Ionicons
                name={isExpense ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={20}
                color={amountColor}
              />
              <GradientText variant="subtle" style={styles.typeText}>
                {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
              </GradientText>
            </View>
          </GlassCard>

          {/* Details Card */}
          <GlassCard style={styles.detailsCard}>
            {/* Merchant */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="storefront-outline" size={20} color={Colors.text.secondary} />
              </View>
              <View style={styles.detailContent}>
                <GradientText variant="subtle" style={styles.detailLabel}>
                  Merchant
                </GradientText>
                <GradientText style={styles.detailValue} testID="detail-merchant">
                  {transaction.merchant_name || 'Unknown'}
                </GradientText>
              </View>
            </View>

            {/* Category */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="pricetag-outline" size={20} color={Colors.text.secondary} />
              </View>
              <View style={styles.detailContent}>
                <GradientText variant="subtle" style={styles.detailLabel}>
                  Category
                </GradientText>
                <View style={styles.categoryBadge} testID="detail-category">
                  <GradientText style={styles.categoryText}>
                    {transaction.category_id || 'Uncategorized'}
                  </GradientText>
                </View>
              </View>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.text.secondary} />
              </View>
              <View style={styles.detailContent}>
                <GradientText variant="subtle" style={styles.detailLabel}>
                  Date & Time
                </GradientText>
                <GradientText style={styles.detailValue} testID="detail-date">
                  {format(new Date(transaction.transaction_date), 'MMMM d, yyyy • h:mm a')}
                </GradientText>
              </View>
            </View>

            {/* Notes */}
            {transaction.notes && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.text.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <GradientText variant="subtle" style={styles.detailLabel}>
                    Notes
                  </GradientText>
                  <GradientText style={styles.detailValue}>
                    {transaction.notes}
                  </GradientText>
                </View>
              </View>
            )}

            {/* Receipt */}
            {transaction.receipt_image_url && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="receipt-outline" size={20} color={Colors.text.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <GradientText variant="subtle" style={styles.detailLabel}>
                    Receipt
                  </GradientText>
                  <GradientText style={[styles.detailValue, styles.receiptLink]}>
                    View Receipt
                  </GradientText>
                </View>
              </View>
            )}
          </GlassCard>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <PremiumPressable onPress={handleEdit} style={styles.editButton}>
              <Ionicons name="pencil" size={20} color={Colors.text.primary} />
              <GradientText style={styles.buttonText}>Edit</GradientText>
            </PremiumPressable>
            <PremiumPressable onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash" size={20} color={Colors.expense} />
              <GradientText variant="expense" style={styles.buttonText}>Delete</GradientText>
            </PremiumPressable>
          </View>
        </ScrollView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.void,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.md,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  amount: {
    fontSize: FontSize.display2,
    fontWeight: '700',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  typeText: {
    fontSize: FontSize.body,
  },
  detailsCard: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.transparent.white05,
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.caption,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FontSize.md,
  },
  categoryBadge: {
    backgroundColor: Colors.transparent.neon10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: FontSize.body,
  },
  receiptLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.transparent.white05,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.transparent.red10,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    fontSize: FontSize.md,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  notFoundText: {
    fontSize: FontSize.lg,
  },
  goBackButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.transparent.white05,
    borderRadius: BorderRadius.md,
  },
});
