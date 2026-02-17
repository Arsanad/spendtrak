// SPENDTRAK CINEMATIC EDITION - Budgets Screen
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { FAB } from '../../src/components/ui/Button';
import { Header } from '../../src/components/navigation';
import { ProgressRing, EmptyState } from '../../src/components/premium';
import { SectionHeader } from '../../src/components/dashboard';
import { PlusIcon, BudgetIcon, FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon } from '../../src/components/icons';

const mockBudgets = [
  { id: '1', category: 'Food & Dining', spent: 1200, budget: 1500, icon: <FoodIcon size={24} color={Colors.neon} /> },
  { id: '2', category: 'Transport', spent: 800, budget: 1000, icon: <TransportIcon size={24} color={Colors.primary} /> },
  { id: '3', category: 'Shopping', spent: 600, budget: 800, icon: <ShoppingIcon size={24} color={Colors.deep} /> },
  { id: '4', category: 'Entertainment', spent: 400, budget: 500, icon: <EntertainmentIcon size={24} color={Colors.bright} /> },
];

export default function BudgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalBudget = mockBudgets.reduce((sum, b) => sum + b.budget, 0);
  const overallProgress = (totalSpent / totalBudget) * 100;

  return (
    <View style={styles.container}>
      <SimpleFog height="20%" />

      <Header title="Budgets" showBack onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Summary */}
        <GlassCard variant="glow" style={styles.summaryCard}>
          <ProgressRing progress={overallProgress} size={120} strokeWidth={10}>
            <View style={styles.progressContent}>
              <GradientText variant="luxury" style={styles.progressPercent}>{overallProgress.toFixed(0)}%</GradientText>
              <GradientText variant="muted" style={styles.progressLabel}>used</GradientText>
            </View>
          </ProgressRing>
          <View style={styles.summaryInfo}>
            <GradientText variant="bright" style={styles.summaryAmount}>
              AED {totalSpent.toLocaleString()} / {totalBudget.toLocaleString()}
            </GradientText>
            <GradientText variant="muted" style={styles.summaryRemaining}>
              AED {(totalBudget - totalSpent).toLocaleString()} remaining
            </GradientText>
          </View>
        </GlassCard>

        {/* Budget List */}
        <View style={styles.section}>
          <SectionHeader title="Category Budgets" action={`${mockBudgets.length} total`} />
          {mockBudgets.map((budget) => {
            const progress = (budget.spent / budget.budget) * 100;
            return (
              <GlassCard key={budget.id} variant="default" size="compact" style={styles.budgetCard}>
                <View style={styles.budgetIcon}>{budget.icon}</View>
                <View style={styles.budgetInfo}>
                  <GradientText variant="bright" style={styles.budgetCategory}>{budget.category}</GradientText>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <GradientText variant="muted" style={styles.budgetAmount}>
                    AED {budget.spent.toLocaleString()} / {budget.budget.toLocaleString()}
                  </GradientText>
                </View>
                <GradientText variant={progress > 90 ? 'luxury' : 'subtle'} style={styles.budgetPercent}>
                  {progress.toFixed(0)}%
                </GradientText>
              </GlassCard>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon={<PlusIcon size={24} color={Colors.void} />} onPress={() => router.push('/(modals)/add-budget')} style={[styles.fab, { bottom: insets.bottom + 16 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg },
  summaryCard: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.xl },
  progressContent: { alignItems: 'center' },
  progressPercent: {},
  progressLabel: {},
  summaryInfo: { marginTop: Spacing.lg, alignItems: 'center' },
  summaryAmount: {},
  summaryRemaining: { marginTop: Spacing.xs },
  section: { marginBottom: Spacing.lg },
  budgetCard: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  budgetIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.transparent.deep20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  budgetInfo: { flex: 1 },
  budgetCategory: { marginBottom: Spacing.xs },
  progressBar: { height: 4, backgroundColor: Colors.darker, borderRadius: 2, marginBottom: Spacing.xs },
  progressFill: { height: '100%', backgroundColor: Colors.neon, borderRadius: 2 },
  budgetAmount: {},
  budgetPercent: { marginLeft: Spacing.md },
  fab: { position: 'absolute', right: Spacing.lg },
});
