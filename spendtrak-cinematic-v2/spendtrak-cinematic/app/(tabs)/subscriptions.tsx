// SPENDTRAK CINEMATIC EDITION - Subscriptions Screen
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GradientText, GradientTitle, GradientBalance } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button, FAB } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { SubscriptionCard, EmptyState } from '../../src/components/premium';
import { SectionHeader } from '../../src/components/dashboard';
import { PlusIcon, SubscriptionsIcon, RefreshIcon, CalendarIcon } from '../../src/components/icons';

// Mock data
const mockSubscriptions = [
  { id: '1', name: 'Netflix', amount: 55, frequency: 'Monthly', nextBilling: 'Jan 22', status: 'active' },
  { id: '2', name: 'Spotify Premium', amount: 26, frequency: 'Monthly', nextBilling: 'Jan 25', status: 'active' },
  { id: '3', name: 'ChatGPT Plus', amount: 73, frequency: 'Monthly', nextBilling: 'Feb 1', status: 'active' },
  { id: '4', name: 'iCloud+ 200GB', amount: 11, frequency: 'Monthly', nextBilling: 'Feb 5', status: 'active' },
  { id: '5', name: 'YouTube Premium', amount: 44, frequency: 'Monthly', nextBilling: 'Feb 10', status: 'paused' },
];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activeSubscriptions = mockSubscriptions.filter(s => s.status === 'active');
  const pausedSubscriptions = mockSubscriptions.filter(s => s.status === 'paused');
  const totalMonthly = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);
  const totalYearly = totalMonthly * 12;

  return (
    <View style={styles.container}>
      <SimpleFog height="25%" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GradientTitle style={styles.title}>Subscriptions</GradientTitle>

        {/* Summary Card */}
        <GlassCard variant="glow" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <GradientText variant="muted" style={styles.summaryLabel}>Monthly</GradientText>
              <GradientBalance amount={totalMonthly.toLocaleString()} currency="AED" style={styles.summaryAmount} />
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <GradientText variant="muted" style={styles.summaryLabel}>Yearly</GradientText>
              <GradientText variant="luxury" style={styles.summaryYearly}>
                AED {totalYearly.toLocaleString()}
              </GradientText>
            </View>
          </View>
          <View style={styles.summaryFooter}>
            <View style={styles.summaryStats}>
              <GradientText variant="subtle" style={styles.statText}>
                {activeSubscriptions.length} active
              </GradientText>
              {pausedSubscriptions.length > 0 && (
                <GradientText variant="muted" style={styles.statText}>
                  • {pausedSubscriptions.length} paused
                </GradientText>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Upcoming Renewals */}
        <View style={styles.section}>
          <SectionHeader title="Upcoming Renewals" />
          {activeSubscriptions.slice(0, 3).map((sub) => (
            <GlassCard key={sub.id} variant="default" size="compact" style={styles.renewalCard}>
              <View style={styles.renewalInfo}>
                <GradientText variant="bright" style={styles.renewalName}>{sub.name}</GradientText>
                <View style={styles.renewalDate}>
                  <CalendarIcon size={14} color={Colors.text.tertiary} />
                  <GradientText variant="muted" style={styles.renewalDateText}>{sub.nextBilling}</GradientText>
                </View>
              </View>
              <GradientText variant="luxury" style={styles.renewalAmount}>
                AED {sub.amount}
              </GradientText>
            </GlassCard>
          ))}
        </View>

        {/* Active Subscriptions */}
        <View style={styles.section}>
          <SectionHeader title="Active Subscriptions" action={`${activeSubscriptions.length} total`} />
          {activeSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              name={sub.name}
              amount={sub.amount}
              currency="AED"
              frequency={sub.frequency}
              nextBillingDate={sub.nextBilling}
              icon={<RefreshIcon size={24} color={Colors.neon} />}
              style={styles.subscriptionCard}
            />
          ))}
        </View>

        {/* Paused Subscriptions */}
        {pausedSubscriptions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Paused" />
            {pausedSubscriptions.map((sub) => (
              <GlassCard key={sub.id} variant="default" size="compact" style={styles.pausedCard}>
                <View style={styles.pausedInfo}>
                  <GradientText variant="muted" style={styles.pausedName}>{sub.name}</GradientText>
                  <Badge variant="warning" size="small">Paused</Badge>
                </View>
                <GradientText variant="muted" style={styles.pausedAmount}>
                  AED {sub.amount}/mo
                </GradientText>
              </GlassCard>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <FAB
        icon={<PlusIcon size={24} color={Colors.void} />}
        onPress={() => router.push('/(modals)/add-subscription')}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
      />
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
  title: {
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border.subtle,
  },
  summaryLabel: {
    marginBottom: Spacing.xs,
  },
  summaryAmount: {},
  summaryYearly: {},
  summaryFooter: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statText: {
    marginHorizontal: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  renewalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  renewalInfo: {},
  renewalName: {},
  renewalDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  renewalDateText: {
    marginLeft: Spacing.xs,
  },
  renewalAmount: {},
  subscriptionCard: {
    marginBottom: Spacing.md,
  },
  pausedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    opacity: 0.7,
  },
  pausedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pausedName: {
    marginRight: Spacing.sm,
  },
  pausedAmount: {},
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
