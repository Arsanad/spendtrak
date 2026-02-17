// SPENDTRAK CINEMATIC EDITION - Settings Screen
// Location: app/(tabs)/settings.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize } from '@/design/cinematic';
import { AtmosphericFog } from '@/components/effects';
import { GradientText, GradientLabel } from '@/components/ui/GradientText';
import { SettingsItem } from '@/components/premium';
import {
  ProfileIcon, BudgetIcon, WalletIcon, CalendarIcon, TargetIcon,
  DebtIcon, NetWorthIcon, InvestmentIcon, GroupIcon, TrophyIcon,
  CurrencyIcon, GlobeIcon, NotificationIcon, ExportIcon, EmailIcon,
  PrivacyIcon, TermsIcon, HelpIcon, SecurityIcon, LogoutIcon,
} from '@/components/icons';

interface SettingsSection {
  title: string;
  items: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    route: string;
  }[];
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Account',
    items: [
      { icon: <ProfileIcon size={20} color={Colors.neon} />, label: 'Profile', route: '/settings/profile' },
      { icon: <SecurityIcon size={20} color={Colors.neon} />, label: 'Security', value: 'Enabled', route: '/settings/security' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { icon: <BudgetIcon size={20} color={Colors.neon} />, label: 'Budgets', route: '/settings/budgets' },
      { icon: <TargetIcon size={20} color={Colors.neon} />, label: 'Goals', route: '/settings/goals' },
      { icon: <WalletIcon size={20} color={Colors.neon} />, label: 'Daily Limit', route: '/settings/daily-limit' },
      { icon: <CalendarIcon size={20} color={Colors.neon} />, label: 'Bills', route: '/settings/bills' },
      { icon: <DebtIcon size={20} color={Colors.neon} />, label: 'Debts', route: '/settings/debts' },
      { icon: <NetWorthIcon size={20} color={Colors.neon} />, label: 'Net Worth', route: '/settings/net-worth' },
      { icon: <InvestmentIcon size={20} color={Colors.neon} />, label: 'Investments', route: '/settings/investments' },
      { icon: <GroupIcon size={20} color={Colors.neon} />, label: 'Household', route: '/settings/household' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: <CurrencyIcon size={20} color={Colors.neon} />, label: 'Currency', value: 'AED', route: '/settings/currency' },
      { icon: <GlobeIcon size={20} color={Colors.neon} />, label: 'Language', value: 'English', route: '/settings/language' },
      { icon: <NotificationIcon size={20} color={Colors.neon} />, label: 'Notifications', route: '/settings/notifications' },
    ],
  },
  {
    title: 'Data',
    items: [
      { icon: <ExportIcon size={20} color={Colors.neon} />, label: 'Export Data', route: '/settings/export' },
      { icon: <EmailIcon size={20} color={Colors.neon} />, label: 'Connect Email', route: '/settings/connect-email' },
    ],
  },
  {
    title: 'Achievements',
    items: [
      { icon: <TrophyIcon size={20} color={Colors.neon} />, label: 'Achievements', value: '12/50', route: '/settings/achievements' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: <HelpIcon size={20} color={Colors.neon} />, label: 'Help & Support', route: '/settings/help' },
      { icon: <PrivacyIcon size={20} color={Colors.neon} />, label: 'Privacy Policy', route: '/settings/privacy' },
      { icon: <TermsIcon size={20} color={Colors.neon} />, label: 'Terms of Service', route: '/settings/terms' },
    ],
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    // Implement logout logic
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AtmosphericFog intensity="subtle" showParticles={false} />

      {/* Header */}
      <View style={styles.header}>
        <GradientText variant="bright" style={styles.title}>Settings</GradientText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_SECTIONS.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <GradientLabel style={styles.sectionTitle}>{section.title}</GradientLabel>
            
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <SettingsItem
                  key={itemIndex}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  onPress={() => router.push(item.route as any)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View style={styles.section}>
          <SettingsItem
            icon={<LogoutIcon size={20} color={Colors.neon} />}
            label="Sign Out"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SpendTrak Cinematic Edition</Text>
          <Text style={styles.versionNumber}>Version 2.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    fontSize: FontSize.caption,
  },
  sectionContent: {
    gap: Spacing.xs,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  versionText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.tertiary,
  },
  versionNumber: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.disabled,
    marginTop: Spacing.xs,
  },
});
