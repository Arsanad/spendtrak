// SPENDTRAK CINEMATIC EDITION - Transactions Screen
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { AtmosphericFog, SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GradientText, GradientTitle, GradientHeading } from '../../src/components/ui/GradientText';
import { SearchInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { TransactionItem, EmptyState } from '../../src/components/premium';
import { SectionHeader } from '../../src/components/dashboard';
import { FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon, HealthIcon, ScanIcon, EditIcon, TransactionsIcon } from '../../src/components/icons';

// Mock data
const mockTransactions = [
  { id: '1', merchantName: 'Carrefour Market', category: 'Groceries', amount: -125.50, date: 'Jan 17', source: 'receipt', icon: <FoodIcon size={20} color={Colors.neon} /> },
  { id: '2', merchantName: 'Uber Technologies', category: 'Transport', amount: -45.00, date: 'Jan 17', source: 'manual', icon: <TransportIcon size={20} color={Colors.primary} /> },
  { id: '3', merchantName: 'Amazon.ae', category: 'Shopping', amount: -299.99, date: 'Jan 16', source: 'receipt', icon: <ShoppingIcon size={20} color={Colors.deep} /> },
  { id: '4', merchantName: 'Netflix', category: 'Entertainment', amount: -55.00, date: 'Jan 15', source: 'manual', icon: <EntertainmentIcon size={20} color={Colors.bright} /> },
  { id: '5', merchantName: 'Dubai Pharmacy', category: 'Health', amount: -89.00, date: 'Jan 14', source: 'receipt', icon: <HealthIcon size={20} color={Colors.neon} /> },
];

type FilterType = 'all' | 'receipt' | 'manual';

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesSearch = tx.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || tx.source === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const date = tx.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, typeof mockTransactions>);

  return (
    <View style={styles.container}>
      <SimpleFog height="30%" />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <GradientTitle>Transactions</GradientTitle>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchInput
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <Chip
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={activeFilter === 'receipt'}
            onPress={() => setActiveFilter('receipt')}
            icon={<ScanIcon size={14} color={activeFilter === 'receipt' ? Colors.neon : Colors.text.secondary} />}
            style={styles.filterChip}
          >
            Receipts
          </Chip>
          <Chip
            selected={activeFilter === 'manual'}
            onPress={() => setActiveFilter('manual')}
            icon={<EditIcon size={14} color={activeFilter === 'manual' ? Colors.neon : Colors.text.secondary} />}
            style={styles.filterChip}
          >
            Manual
          </Chip>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, transactions]) => (
            <View key={date} style={styles.dateGroup}>
              <GradientText variant="muted" style={styles.dateLabel}>{date}</GradientText>
              {transactions.map((tx) => (
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
          ))
        ) : (
          <EmptyState
            icon={<TransactionsIcon size={48} color={Colors.text.tertiary} />}
            title="No transactions found"
            description="Try adjusting your search or filters"
          />
        )}

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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    marginTop: Spacing.lg,
  },
  filtersContainer: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  filterChip: {
    marginRight: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  dateGroup: {
    marginBottom: Spacing.lg,
  },
  dateLabel: {
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transactionItem: {
    marginBottom: Spacing.sm,
  },
});
