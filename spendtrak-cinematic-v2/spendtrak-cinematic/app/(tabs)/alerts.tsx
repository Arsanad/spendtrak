// SPENDTRAK CINEMATIC EDITION - Alerts Screen (Hidden Tab)
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Badge } from '../../src/components/ui/Badge';
import { EmptyState } from '../../src/components/premium';
import { SectionHeader } from '../../src/components/dashboard';
import { AlertsIcon, WarningIcon, InfoIcon, TrendUpIcon, CalendarIcon } from '../../src/components/icons';

// Mock data
const mockAlerts = [
  { id: '1', type: 'budget_warning', title: 'Budget Alert', message: 'You\'ve spent 85% of your Food budget', severity: 'warning', time: '2h ago', read: false },
  { id: '2', type: 'subscription_renewal', title: 'Upcoming Renewal', message: 'Netflix will renew in 5 days', severity: 'info', time: '5h ago', read: false },
  { id: '3', type: 'unusual_spending', title: 'Unusual Activity', message: 'Higher than normal spending on Transport', severity: 'warning', time: '1d ago', read: true },
  { id: '4', type: 'goal_milestone', title: 'Goal Progress', message: 'You\'re 75% towards your Emergency Fund goal!', severity: 'info', time: '2d ago', read: true },
];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();

  const unreadAlerts = mockAlerts.filter(a => !a.read);
  const readAlerts = mockAlerts.filter(a => a.read);

  const getAlertIcon = (type: string, severity: string) => {
    const color = severity === 'warning' ? Colors.neon : Colors.primary;
    switch (type) {
      case 'budget_warning': return <WarningIcon size={20} color={color} />;
      case 'subscription_renewal': return <CalendarIcon size={20} color={color} />;
      case 'unusual_spending': return <TrendUpIcon size={20} color={color} />;
      case 'goal_milestone': return <TrendUpIcon size={20} color={color} />;
      default: return <InfoIcon size={20} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <SimpleFog height="20%" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <GradientTitle>Alerts</GradientTitle>
          {unreadAlerts.length > 0 && (
            <Badge variant="success" size="medium">{unreadAlerts.length} new</Badge>
          )}
        </View>

        {mockAlerts.length > 0 ? (
          <>
            {/* Unread Alerts */}
            {unreadAlerts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="New" />
                {unreadAlerts.map((alert) => (
                  <GlassCard key={alert.id} variant="outlined" size="compact" style={styles.alertCard}>
                    <View style={styles.alertIcon}>{getAlertIcon(alert.type, alert.severity)}</View>
                    <View style={styles.alertContent}>
                      <View style={styles.alertHeader}>
                        <GradientText variant="bright" style={styles.alertTitle}>{alert.title}</GradientText>
                        <GradientText variant="muted" style={styles.alertTime}>{alert.time}</GradientText>
                      </View>
                      <GradientText variant="subtle" style={styles.alertMessage}>{alert.message}</GradientText>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}

            {/* Read Alerts */}
            {readAlerts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Earlier" />
                {readAlerts.map((alert) => (
                  <GlassCard key={alert.id} variant="default" size="compact" style={[styles.alertCard, styles.readAlert]}>
                    <View style={styles.alertIcon}>{getAlertIcon(alert.type, alert.severity)}</View>
                    <View style={styles.alertContent}>
                      <View style={styles.alertHeader}>
                        <GradientText variant="muted" style={styles.alertTitle}>{alert.title}</GradientText>
                        <GradientText variant="muted" style={styles.alertTime}>{alert.time}</GradientText>
                      </View>
                      <GradientText variant="muted" style={styles.alertMessage}>{alert.message}</GradientText>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={<AlertsIcon size={48} color={Colors.text.tertiary} />}
            title="No alerts"
            description="You're all caught up! We'll notify you when something needs your attention."
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  alertCard: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  readAlert: {
    opacity: 0.7,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.transparent.deep20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  alertTitle: {},
  alertTime: {},
  alertMessage: {},
});
