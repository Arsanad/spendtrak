// SPENDTRAK CINEMATIC EDITION - Dashboard Screen
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { AtmosphericFog } from '../../src/components/effects/AtmosphericFog';
import { CosmicEye } from '../../src/components/effects/CosmicEye';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { BalanceCard, QuickActions, SpendingSummary, SectionHeader } from '../../src/components/dashboard';
import { TransactionItem } from '../../src/components/premium';
import { FoodIcon, TransportIcon, ShoppingIcon } from '../../src/components/icons';

// Mock data - replace with store data
const mockBalance = 12450.75;
const mockIncome = 8500;
const mockExpenses = 3250;
const mockTransactions = [
  { id: '1', merchantName: 'Carrefour', category: 'Groceries', amount: -125.50, date: 'Today', icon: <FoodIcon size={20} color={Colors.neon} /> },
  { id: '2', merchantName: 'Uber', category: 'Transport', amount: -45.00, date: 'Today', icon: <TransportIcon size={20} color={Colors.primary} /> },
  { id: '3', merchantName: 'Amazon', category: 'Shopping', amount: -299.99, date: 'Yesterday', icon: <ShoppingIcon size={20} color={Colors.deep} /> },
];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AtmosphericFog intensity="subtle" showParticles />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <GradientText variant="muted" style={styles.greeting}>Welcome back</GradientText>
            <GradientTitle>Abdelrahman</GradientTitle>
          </View>
          <Pressable onPress={() => router.push('/(modals)/ai-consultant')} style={styles.aiButton}>
            <CosmicEye size={48} active blinking glowing />
          </Pressable>
        </View>

        {/* Balance Card */}
        <BalanceCard
          balance={mockBalance}
          currency="AED"
          income={mockIncome}
          expenses={mockExpenses}
          style={styles.balanceCard}
        />

        {/* Quick Actions */}
        <View style={styles.section}>
          <QuickActions
            onScan={() => router.push('/(modals)/camera')}
            onAdd={() => router.push('/(modals)/add-expense')}
            onBudgets={() => router.push('/settings/budgets')}
            onGoals={() => router.push('/settings/goals')}
          />
        </View>

        {/* Spending Summary */}
        <View style={styles.section}>
          <SpendingSummary
            todaySpent={170.50}
            weeklySpent={875.25}
            monthlySpent={3250}
            currency="AED"
            safeToSpend={450}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <SectionHeader
            title="Recent Activity"
            action="See All"
            onAction={() => router.push('/(tabs)/transactions')}
          />
          {mockTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              merchantName={tx.merchantName}
              category={tx.category}
              amount={tx.amount}
              currency="AED"
              date={tx.date}
              icon={tx.icon}
              onPress={() => router.push(`/transaction/${tx.id}`)}
              style={styles.transactionItem}
            />
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: Spacing.xxl }} />
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  aiButton: {
    padding: Spacing.xs,
  },
  balanceCard: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  transactionItem: {
    marginBottom: Spacing.sm,
  },
});
