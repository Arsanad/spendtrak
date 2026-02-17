// SPENDTRAK CINEMATIC EDITION - Dashboard Screen
// Location: app/(tabs)/index.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontFamily, FontSize } from '@/design/cinematic';
import { AtmosphericFog, SimpleFog } from '@/components/effects';
import { CosmicEye, MiniCosmicEye } from '@/components/icons/CosmicEye';
import { GradientText, GradientBalance, GradientLabel } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { BalanceCard, QuickActions, SpendingSummary, SectionHeader } from '@/components/dashboard';
import { TransactionItem } from '@/components/premium';
import { FoodIcon, TransportIcon, ShoppingIcon } from '@/components/icons';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  // Mock data - replace with real store data
  const balance = 12450.75;
  const income = 8500;
  const expenses = 3250.25;

  const recentTransactions = [
    { id: '1', merchant: 'Carrefour', category: 'Groceries', amount: -245.50, date: 'Today' },
    { id: '2', merchant: 'Uber', category: 'Transport', amount: -32.00, date: 'Today' },
    { id: '3', merchant: 'Amazon', category: 'Shopping', amount: -189.99, date: 'Yesterday' },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Groceries': return <FoodIcon size={20} color={Colors.neon} />;
      case 'Transport': return <TransportIcon size={20} color={Colors.neon} />;
      case 'Shopping': return <ShoppingIcon size={20} color={Colors.neon} />;
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background */}
      <View style={styles.backgroundLayer}>
        <AtmosphericFog intensity="subtle" showParticles particleCount={25} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Evening</Text>
            <GradientText variant="bright" style={styles.userName}>Abdelrahman</GradientText>
          </View>

          {/* AI Button */}
          <Pressable
            onPress={() => router.push('/(modals)/ai-consultant')}
            style={styles.aiButton}
          >
            <CosmicEye size={48} active blinking glowing />
          </Pressable>
        </View>

        {/* Balance Card */}
        <BalanceCard
          balance={balance}
          currency="AED"
          income={income}
          expenses={expenses}
          style={styles.balanceCard}
        />

        {/* Quick Actions */}
        <QuickActions
          onScan={() => router.push('/(modals)/camera')}
          onAdd={() => router.push('/(modals)/add-expense')}
          onBudgets={() => router.push('/settings/budgets')}
          onGoals={() => router.push('/settings/goals')}
          style={styles.quickActions}
        />

        {/* Spending Summary */}
        <SpendingSummary
          todaySpent={245.50}
          weeklySpent={1250.00}
          monthlySpent={3250.25}
          currency="AED"
          safeToSpend={4500}
          style={styles.spendingSummary}
        />

        {/* Recent Transactions */}
        <SectionHeader
          title="Recent Activity"
          action="See All"
          onAction={() => router.push('/(tabs)/transactions')}
          style={styles.sectionHeader}
        />

        {recentTransactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            merchantName={tx.merchant}
            category={tx.category}
            amount={tx.amount}
            currency="AED"
            date={tx.date}
            icon={getCategoryIcon(tx.category)}
            onPress={() => router.push(`/transaction/${tx.id}`)}
            style={styles.transactionItem}
          />
        ))}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom fog overlay */}
      <SimpleFog height="20%" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  greeting: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  userName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h4,
  },
  aiButton: {
    padding: Spacing.xs,
  },
  balanceCard: {
    marginBottom: Spacing.lg,
  },
  quickActions: {
    marginBottom: Spacing.xl,
  },
  spendingSummary: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    marginTop: Spacing.md,
  },
  transactionItem: {
    marginBottom: Spacing.sm,
  },
});
