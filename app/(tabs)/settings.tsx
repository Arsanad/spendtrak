// SPENDTRAK CINEMATIC EDITION - Settings Screen
// Fade through black transitions to feature pages
import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, ScrollView, StyleSheet, InteractionManager, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { SettingsItem } from '../../src/components/premium';
import {
  ProfileIcon,
  CurrencyIcon, GlobeIcon, ClockIcon,
  ExportIcon, EmailIcon,
  PrivacyIcon, TermsIcon, HelpIcon, LogoutIcon, StarIcon,
  FilterIcon,
  StatsIcon,
} from '../../src/components/icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useLanguage, useTranslation } from '../../src/context/LanguageContext';
import { clearAllDevData, getDevDataDebugInfo } from '../../src/services/devStorage';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useTierStore } from '../../src/stores/tierStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { TrashIcon } from '../../src/components/icons';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';
import { useIsDevMode } from '../../src/utils/devMode';

function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthStore();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { fetchTransactions } = useTransactionStore();
  const { tier, setTier } = useTierStore();
  const { triggerBlackout } = useTransition();
  const isDevMode = useIsDevMode();

  // FIX 10: Analytics opt-out toggle
  const analyticsEnabled = useSettingsStore(state => state.analyticsEnabled);
  const setAnalyticsEnabled = useSettingsStore(state => state.setAnalyticsEnabled);

  // Dev mode plan toggle handler
  const handleToggleDevPlan = useCallback(() => {
    const newTier = tier === 'free' ? 'premium' : 'free';
    setTier(newTier);
    logger.auth.debug(`Dev mode: Switched to ${newTier} plan`);
  }, [tier, setTier]);

  // Cinematic fade-through-black navigation
  const navigateToFeature = useCallback((route: string) => {
    triggerBlackout(() => {
      router.push(route as any);
    });
  }, [router, triggerBlackout]);

  const handleSignOut = useCallback(async () => {
    try {
      // Sign out clears all stores automatically
      await signOut();

      // Navigate to welcome/auth screen with blackout
      // Use InteractionManager to ensure state is flushed before navigation
      InteractionManager.runAfterInteractions(() => {
        triggerBlackout(() => {
          router.replace('/(auth)/welcome');
        });
      });
    } catch (error) {
      logger.auth.error('Sign out error:', error);
      // Still try to navigate even if sign out fails
      InteractionManager.runAfterInteractions(() => {
        triggerBlackout(() => {
          router.replace('/(auth)/welcome');
        });
      });
    }
  }, [signOut, triggerBlackout, router]);

  const handleClearData = useCallback(async () => {
    try {
      // Log current data before clearing
      const debugInfo = await getDevDataDebugInfo();
      logger.storage.debug('Data before clear:', debugInfo);

      // Clear all dev data
      await clearAllDevData();

      // Refresh transactions store
      await fetchTransactions();

      logger.storage.debug('All data cleared successfully');
      setShowClearDataModal(false);
    } catch (error) {
      logger.storage.error('Clear data error:', error);
    }
  }, [fetchTransactions]);

  // Memoize settings groups to prevent re-creation on each render
  const settingsGroups = useMemo(() => [
    {
      title: t('settings.account'),
      items: [
        { icon: <ProfileIcon size={20} color={Colors.neon} />, label: t('settings.profile'), route: '/settings/profile' },
        { icon: <StarIcon size={20} color={Colors.primary} />, label: t('settings.subscription'), value: tier === 'premium' ? t('premium.title') : t('settings.free'), route: '/settings/subscription' },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        { icon: <FilterIcon size={20} color={Colors.neon} />, label: t('categories.title'), value: t('common.manage'), route: '/settings/categories' },
        { icon: <CurrencyIcon size={20} color={Colors.primary} />, label: t('settings.currency'), value: currency.code, route: '/settings/currency' },
        { icon: <GlobeIcon size={20} color={Colors.deep} />, label: t('settings.language'), value: language.name, route: '/settings/language' },
        { icon: <ClockIcon size={20} color={Colors.medium} />, label: t('settings.dailyLimit'), route: '/settings/daily-limit' },
      ],
    },
    {
      title: t('settings.data'),
      items: [
        { icon: <ExportIcon size={20} color={Colors.neon} />, label: t('settings.exportData'), route: '/settings/export' },
        { icon: <EmailIcon size={20} color={Colors.primary} />, label: t('settings.connectEmail'), route: '/settings/connect-email' },
      ],
    },
    {
      title: t('settings.privacySection'),
      items: [
        {
          icon: <StatsIcon size={20} color={Colors.primary} />,
          label: t('settings.analyticsTracking'),
          route: '',
          rightElement: (
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: Colors.darker, true: Colors.transparent.neon30 }}
              thumbColor={analyticsEnabled ? Colors.neon : Colors.text.tertiary}
              accessibilityLabel={t('settings.analyticsTracking')}
              accessibilityHint={t('settings.analyticsHint')}
            />
          ),
          showArrow: false,
        },
      ],
    },
    {
      title: t('settings.support'),
      items: [
        { icon: <HelpIcon size={20} color={Colors.neon} />, label: t('settings.helpCenter'), route: '/settings/help' },
        { icon: <PrivacyIcon size={20} color={Colors.primary} />, label: t('settings.privacyPolicy'), route: '/settings/privacy' },
        { icon: <TermsIcon size={20} color={Colors.deep} />, label: t('settings.termsOfService'), route: '/settings/terms' },
      ],
    },
    // Dev Mode options - only show when in dev mode
    ...(isDevMode ? [{
      title: t('settings.developerOptions') || 'Developer Options',
      items: [
        {
          icon: <StarIcon size={20} color={Colors.semantic.warning} />,
          label: t('settings.testPlan') || 'Test Plan',
          value: tier === 'premium' ? t('premium.title') || 'Premium' : t('settings.free') || 'Free',
          route: '',
          action: handleToggleDevPlan,
        },
        { icon: <TrashIcon size={20} color={Colors.semantic.expense} />, label: t('settings.clearData') || 'Clear All Data', route: '', action: () => setShowClearDataModal(true) },
      ],
    }] : []),
  ], [currency.code, language.name, tier, t, isDevMode, handleToggleDevPlan, analyticsEnabled, setAnalyticsEnabled]);

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GradientTitle style={styles.title}>{t('settings.title')}</GradientTitle>

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
                  value={(item as { value?: string }).value}
                  labelColor={'action' in item ? Colors.semantic.expense : undefined}
                  onPress={'action' in item && item.action ? item.action : item.route ? () => navigateToFeature(item.route) : undefined}
                  rightElement={'rightElement' in item ? (item as any).rightElement : undefined}
                  showArrow={'showArrow' in item ? (item as any).showArrow : true}
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
              icon={<LogoutIcon size={20} color={Colors.semantic.expense} />}
              label={t('common.signOut')}
              labelColor={Colors.semantic.expense}
              showArrow={false}
              onPress={() => setShowSignOutModal(true)}
            />
          </GlassCard>
        </View>

        {/* Version */}
        <GradientText variant="muted" style={styles.version}>{t('settings.versionNumber', { version: '2.0.0' })}</GradientText>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        title={t('common.signOut')}
        message={t('settings.confirmSignOut')}
        confirmText={t('common.signOut')}
        cancelText={t('common.cancel')}
        variant="warning"
      />

      {/* Clear Data Confirmation Modal */}
      <ConfirmationModal
        visible={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        onConfirm={handleClearData}
        title={t('settings.clearData') || 'Clear All Data'}
        message={t('settings.confirmClearData') || 'This will permanently delete all your transactions, budgets, goals, and other data. This action cannot be undone.'}
        confirmText={t('common.delete') || 'Clear'}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Allow AnimatedBackground to show through
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

// Export with memo for performance optimization
export default memo(SettingsScreen);
