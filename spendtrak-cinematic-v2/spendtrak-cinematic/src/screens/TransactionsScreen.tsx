// SPENDTRAK CINEMATIC EDITION - Transactions Screen
// Location: app/(tabs)/transactions.tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@/design/cinematic';
import { AtmosphericFog } from '@/components/effects';
import { GradientText, GradientLabel } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchInput } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Badge';
import { TransactionItem, EmptyState } from '@/components/premium';
import { Header } from '@/components/navigation';
import { FilterIcon, ScanIcon, PlusIcon, FoodIcon, TransportIcon, ShoppingIcon, UtilitiesIcon, HealthIcon, EntertainmentIcon } from '@/components/icons';

const FILTER_OPTIONS = ['All', 'Receipt', 'Manual', 'Income', 'Expense'];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Mock data
  const transactions = [
    { id: '1', merchant: 'Carrefour', category: 'Groceries', amount: -245.50, date: 'Today, 2:30 PM', source: 'receipt' },
    { id: '2', merchant: 'Uber', category: 'Transport', amount: -32.00, date: 'Today, 11:15 AM', source: 'manual' },
    { id: '3', merchant: 'Amazon', category: 'Shopping', amount: -189.99, date: 'Yesterday', source: 'receipt' },
    { id: '4', merchant: 'DEWA', category: 'Utilities', amount: -450.00, date: 'Jan 15', source: 'manual' },
    { id: '5', merchant: 'Salary', category: 'Income', amount: 8500.00, date: 'Jan 1', source: 'manual' },
    { id: '6', merchant: 'Netflix', category: 'Entertainment', amount: -59.99, date: 'Jan 1', source: 'manual' },
  ];

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      Groceries: <FoodIcon size={20} color={Colors.neon} />,
      Transport: <TransportIcon size={20} color={Colors.neon} />,
      Shopping: <ShoppingIcon size={20} color={Colors.neon} />,
      Utilities: <UtilitiesIcon size={20} color={Colors.neon} />,
      Entertainment: <EntertainmentIcon size={20} color={Colors.neon} />,
      Health: <HealthIcon size={20} color={Colors.neon} />,
      Income: <PlusIcon size={20} color={Colors.neon} />,
    };
    return icons[category] || null;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Receipt') return tx.source === 'receipt';
    if (activeFilter === 'Manual') return tx.source === 'manual';
    if (activeFilter === 'Income') return tx.amount > 0;
    if (activeFilter === 'Expense') return tx.amount < 0;
    return true;
  }).filter((tx) =>
    tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AtmosphericFog intensity="subtle" showParticles={false} />

      {/* Header */}
      <View style={styles.header}>
        <GradientText variant="bright" style={styles.title}>Transactions</GradientText>
        <Pressable onPress={() => router.push('/(modals)/camera')} style={styles.headerButton}>
          <ScanIcon size={24} color={Colors.text.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search transactions..."
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTER_OPTIONS.map((filter) => (
          <Chip
            key={filter}
            selected={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
            style={styles.filterChip}
          >
            {filter}
          </Chip>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Try adjusting your search or filters"
          />
        ) : (
          filteredTransactions.map((tx) => (
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
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 100 }]}>
        <Pressable
          onPress={() => router.push('/(modals)/add-expense')}
          style={styles.fab}
        >
          <PlusIcon size={28} color={Colors.void} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h3,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    marginRight: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  transactionItem: {
    marginBottom: Spacing.sm,
  },
  fabContainer: {
    position: 'absolute',
    right: Spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
