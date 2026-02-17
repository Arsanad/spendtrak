// SPENDTRAK CINEMATIC EDITION - Settings Screen
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { SimpleFog } from '../../src/components/effects/AtmosphericFog';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { SettingsItem } from '../../src/components/premium';
import {
  ProfileIcon, BudgetIcon, TargetIcon, DebtIcon, CalendarIcon, NetWorthIcon, InvestmentIcon, GroupIcon,
  CurrencyIcon, GlobeIcon, TrophyIcon, ExportIcon, EmailIcon, ClockIcon,
  PrivacyIcon, TermsIcon, HelpIcon, LogoutIcon, StarIcon,
} from '../../src/components/icons';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: <ProfileIcon size={20} color={Colors.neon} />, label: 'Profile', route: '/settings/profile' },
        { icon: <StarIcon size={20} color={Colors.primary} />, label: 'Subscription', value: 'Pro', route: '/settings/subscription' },
      ],
    },
    {
      title: 'Finance Management',
      items: [
        { icon: <BudgetIcon size={20} color={Colors.neon} />, label: 'Budgets', route: '/settings/budgets' },
        { icon: <TargetIcon size={20} color={Colors.primary} />, label: 'Goals', route: '/settings/goals' },
        { icon: <DebtIcon size={20} color={Colors.deep} />, label: 'Debts', route: '/settings/debts' },
        { icon: <CalendarIcon size={20} color={Colors.bright} />, label: 'Bills', route: '/settings/bills' },
        { icon: <NetWorthIcon size={20} color={Colors.neon} />, label: 'Net Worth', route: '/settings/net-worth' },
        { icon: <InvestmentIcon size={20} color={Colors.primary} />, label: 'Investments', route: '/settings/investments' },
        { icon: <GroupIcon size={20} color={Colors.deep} />, label: 'Household', route: '/settings/household' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: <CurrencyIcon size={20} color={Colors.neon} />, label: 'Currency', value: 'AED', route: '/settings/currency' },
        { icon: <GlobeIcon size={20} color={Colors.primary} />, label: 'Language', value: 'English', route: '/settings/language' },
        { icon: <ClockIcon size={20} color={Colors.deep} />, label: 'Daily Limit', route: '/settings/daily-limit' },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: <ExportIcon size={20} color={Colors.neon} />, label: 'Export Data', route: '/settings/export' },
        { icon: <EmailIcon size={20} color={Colors.primary} />, label: 'Connect Email', route: '/settings/connect-email' },
        { icon: <TrophyIcon size={20} color={Colors.bright} />, label: 'Achievements', route: '/settings/achievements' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: <HelpIcon size={20} color={Colors.neon} />, label: 'Help & Support', route: '/settings/help' },
        { icon: <PrivacyIcon size={20} color={Colors.primary} />, label: 'Privacy Policy', route: '/settings/privacy' },
        { icon: <TermsIcon size={20} color={Colors.deep} />, label: 'Terms of Service', route: '/settings/terms' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SimpleFog height="20%" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GradientTitle style={styles.title}>Settings</GradientTitle>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <GradientText variant="muted" style={styles.groupTitle}>{group.title}</GradientText>
            <GlassCard variant="default" style={styles.groupCard}>
              {group.items.map((item, index) => (
                <SettingsItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  onPress={() => router.push(item.route as any)}
                  style={index < group.items.length - 1 ? styles.itemWithBorder : undefined}
                />
              ))}
            </GlassCard>
          </View>
        ))}

        {/* Sign Out */}
        <View style={styles.group}>
          <GlassCard variant="default" style={styles.groupCard}>
            <SettingsItem
              icon={<LogoutIcon size={20} color={Colors.neon} />}
              label="Sign Out"
              showArrow={false}
              onPress={() => {/* Handle sign out */}}
            />
          </GlassCard>
        </View>

        {/* Version */}
        <GradientText variant="muted" style={styles.version}>SpendTrak Cinematic Edition v2.0.0</GradientText>

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
  title: {
    marginBottom: Spacing.xl,
  },
  group: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
  },
  itemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    borderRadius: 0,
    marginBottom: 0,
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
