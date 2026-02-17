// SPENDTRAK CINEMATIC EDITION - Stats Screen
// Location: app/(tabs)/stats.tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@/design/cinematic';
import { AtmosphericFog } from '@/components/effects';
import { GradientText, GradientLabel } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Chip } from '@/components/ui/Badge';
import { DonutChart, BarChart, ChartLegend } from '@/components/charts';
import { SectionHeader } from '@/components/dashboard';
import { ProgressRing, AnimatedNumber } from '@/components/premium';

const TIME_PERIODS = ['Week', 'Month', 'Year'];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('Month');

  // Mock data
  const spendingByCategory = [
    { value: 1250, color: Colors.category.food, label: 'Food' },
    { value: 850, color: Colors.category.transport, label: 'Transport' },
    { value: 650, color: Colors.category.shopping, label: 'Shopping' },
    { value: 450, color: Colors.category.utilities, label: 'Utilities' },
    { value: 350, color: Colors.category.entertainment, label: 'Entertainment' },
  ];

  const weeklySpending = [
    { label: 'Mon', value: 245 },
    { label: 'Tue', value: 180 },
    { label: 'Wed', value: 320 },
    { label: 'Thu', value: 150 },
    { label: 'Fri', value: 420 },
    { label: 'Sat', value: 280 },
    { label: 'Sun', value: 190 },
  ];

  const totalSpent = spendingByCategory.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AtmosphericFog intensity="subtle" showParticles={false} />

      {/* Header */}
      <View style={styles.header}>
        <GradientText variant="bright" style={styles.title}>Analytics</GradientText>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {TIME_PERIODS.map((p) => (
          <Chip
            key={p}
            selected={period === p}
            onPress={() => setPeriod(p)}
            style={styles.periodChip}
          >
            {p}
          </Chip>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Spending Card */}
        <GlassCard variant="glow" style={styles.totalCard}>
          <GradientLabel style={styles.totalLabel}>Total Spent This {period}</GradientLabel>
          <AnimatedNumber
            value={totalSpent}
            prefix="AED "
            decimals={2}
            variant="luxury"
            style={styles.totalAmount}
          />
          <View style={styles.trendRow}>
            <Text style={styles.trendText}>↓ 12% from last {period.toLowerCase()}</Text>
          </View>
        </GlassCard>

        {/* Category Breakdown */}
        <SectionHeader title="Spending by Category" style={styles.sectionHeader} />
        
        <GlassCard style={styles.chartCard}>
          <View style={styles.donutContainer}>
            <DonutChart
              segments={spendingByCategory}
              size={180}
              strokeWidth={20}
              centerContent={
                <View style={styles.donutCenter}>
                  <GradientLabel style={styles.donutLabel}>Total</GradientLabel>
                  <GradientText variant="luxury" style={styles.donutValue}>
                    AED {totalSpent.toLocaleString()}
                  </GradientText>
                </View>
              }
            />
          </View>
          
          <ChartLegend
            items={spendingByCategory.map(cat => ({
              color: cat.color,
              label: cat.label,
              value: `AED ${cat.value.toLocaleString()}`,
            }))}
            style={styles.legend}
          />
        </GlassCard>

        {/* Daily Spending */}
        <SectionHeader title="Daily Spending" style={styles.sectionHeader} />
        
        <GlassCard style={styles.chartCard}>
          <BarChart
            data={weeklySpending}
            height={180}
            barWidth={28}
            barGap={12}
            showLabels
            showValues
          />
        </GlassCard>

        {/* Budget Progress */}
        <SectionHeader title="Budget Progress" style={styles.sectionHeader} />
        
        <View style={styles.budgetGrid}>
          <GlassCard style={styles.budgetCard}>
            <ProgressRing progress={75} size={80} strokeWidth={8}>
              <GradientText variant="bright" style={styles.budgetPercent}>75%</GradientText>
            </ProgressRing>
            <GradientLabel style={styles.budgetName}>Food</GradientLabel>
            <Text style={styles.budgetDetails}>AED 750 / 1,000</Text>
          </GlassCard>

          <GlassCard style={styles.budgetCard}>
            <ProgressRing progress={45} size={80} strokeWidth={8}>
              <GradientText variant="bright" style={styles.budgetPercent}>45%</GradientText>
            </ProgressRing>
            <GradientLabel style={styles.budgetName}>Transport</GradientLabel>
            <Text style={styles.budgetDetails}>AED 225 / 500</Text>
          </GlassCard>
        </View>

        <View style={{ height: 120 }} />
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
    paddingVertical: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h3,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  periodChip: {
    marginRight: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display,
  },
  trendRow: {
    marginTop: Spacing.sm,
  },
  trendText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySmall,
    color: Colors.neon,
  },
  sectionHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutLabel: {
    fontSize: FontSize.caption,
  },
  donutValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body,
  },
  legend: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  budgetGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  budgetCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  budgetPercent: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body,
  },
  budgetName: {
    marginTop: Spacing.sm,
    fontSize: FontSize.bodySmall,
  },
  budgetDetails: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
});
