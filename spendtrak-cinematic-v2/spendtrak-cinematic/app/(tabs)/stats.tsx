// SPENDTRAK CINEMATIC EDITION - Stats Screen
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GradientText, GradientTitle, GradientBalance } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Chip } from '../../src/components/ui/Badge';
import { DonutChart, BarChart, ChartLegend } from '../../src/components/charts';
import { SectionHeader } from '../../src/components/dashboard';
import { ProgressRing } from '../../src/components/premium';

// Mock data
const categoryBreakdown = [
  { value: 1200, color: Colors.neon, label: 'Food & Dining' },
  { value: 800, color: Colors.primary, label: 'Transport' },
  { value: 600, color: Colors.deep, label: 'Shopping' },
  { value: 400, color: Colors.bright, label: 'Entertainment' },
  { value: 250, color: Colors.dark, label: 'Other' },
];

const weeklySpending = [
  { label: 'Mon', value: 450 },
  { label: 'Tue', value: 320 },
  { label: 'Wed', value: 580 },
  { label: 'Thu', value: 220 },
  { label: 'Fri', value: 680 },
  { label: 'Sat', value: 890 },
  { label: 'Sun', value: 110 },
];

type PeriodType = 'week' | 'month' | 'year';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<PeriodType>('month');

  const totalSpent = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0);
  const budgetLimit = 5000;
  const budgetPercentage = (totalSpent / budgetLimit) * 100;

  return (
    <View style={styles.container}>
      <SimpleFog height="25%" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GradientTitle style={styles.title}>Analytics</GradientTitle>

        {/* Period Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelector}>
          <Chip selected={period === 'week'} onPress={() => setPeriod('week')} style={styles.periodChip}>This Week</Chip>
          <Chip selected={period === 'month'} onPress={() => setPeriod('month')} style={styles.periodChip}>This Month</Chip>
          <Chip selected={period === 'year'} onPress={() => setPeriod('year')} style={styles.periodChip}>This Year</Chip>
        </ScrollView>

        {/* Total Spent Card */}
        <GlassCard variant="glow" style={styles.totalCard}>
          <GradientText variant="muted" style={styles.totalLabel}>Total Spent</GradientText>
          <GradientBalance amount={totalSpent.toLocaleString()} currency="AED" />
          <View style={styles.budgetInfo}>
            <GradientText variant="subtle" style={styles.budgetText}>
              {budgetPercentage.toFixed(0)}% of AED {budgetLimit.toLocaleString()} budget
            </GradientText>
          </View>
        </GlassCard>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <SectionHeader title="Spending by Category" />
          <GlassCard variant="default">
            <View style={styles.donutContainer}>
              <DonutChart
                segments={categoryBreakdown}
                size={180}
                strokeWidth={20}
                centerContent={
                  <View style={styles.donutCenter}>
                    <GradientText variant="muted" style={styles.donutCenterLabel}>Total</GradientText>
                    <GradientText variant="luxury" style={styles.donutCenterValue}>
                      {totalSpent.toLocaleString()}
                    </GradientText>
                  </View>
                }
              />
            </View>
            <ChartLegend
              items={categoryBreakdown.map(cat => ({
                color: cat.color,
                label: cat.label,
                value: `AED ${cat.value.toLocaleString()}`,
              }))}
              style={styles.legend}
            />
          </GlassCard>
        </View>

        {/* Weekly Trend */}
        <View style={styles.section}>
          <SectionHeader title="Daily Spending" />
          <GlassCard variant="default">
            <BarChart
              data={weeklySpending}
              height={160}
              barWidth={28}
              barGap={12}
            />
          </GlassCard>
        </View>

        {/* Budget Progress */}
        <View style={styles.section}>
          <SectionHeader title="Budget Progress" action="View All" />
          <View style={styles.budgetGrid}>
            <BudgetProgressCard category="Food & Dining" spent={1200} budget={1500} color={Colors.neon} />
            <BudgetProgressCard category="Transport" spent={800} budget={1000} color={Colors.primary} />
            <BudgetProgressCard category="Shopping" spent={600} budget={800} color={Colors.deep} />
            <BudgetProgressCard category="Entertainment" spent={400} budget={500} color={Colors.bright} />
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

// Budget Progress Card Component
function BudgetProgressCard({ category, spent, budget, color }: { category: string; spent: number; budget: number; color: string }) {
  const percentage = Math.min((spent / budget) * 100, 100);

  return (
    <GlassCard variant="default" size="compact" style={styles.budgetCard}>
      <ProgressRing progress={percentage} size={60} strokeWidth={6}>
        <GradientText variant="bright" style={styles.budgetPercentage}>{percentage.toFixed(0)}%</GradientText>
      </ProgressRing>
      <GradientText variant="subtle" style={styles.budgetCategory} numberOfLines={1}>{category}</GradientText>
      <GradientText variant="muted" style={styles.budgetSpent}>
        {spent.toLocaleString()} / {budget.toLocaleString()}
      </GradientText>
    </GlassCard>
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
  title: {
    marginBottom: Spacing.md,
  },
  periodSelector: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  periodChip: {
    marginRight: Spacing.sm,
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  totalLabel: {
    marginBottom: Spacing.xs,
  },
  budgetInfo: {
    marginTop: Spacing.md,
  },
  budgetText: {},
  section: {
    marginBottom: Spacing.xl,
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutCenterLabel: {},
  donutCenterValue: {},
  legend: {
    marginTop: Spacing.md,
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  budgetCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  budgetPercentage: {},
  budgetCategory: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  budgetSpent: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
