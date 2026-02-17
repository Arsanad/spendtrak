// SPENDTRAK CINEMATIC EDITION - Household Notification Preferences Screen
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/navigation';
import { NotificationIcon, EmailIcon, AlertsIcon } from '../../src/components/icons';
import { useHouseholdStore } from '../../src/stores/householdStore';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

interface NotificationSetting {
  id: string;
  labelKey: string;
  descriptionKey: string;
  key: string;
}

const notificationSettingKeys: NotificationSetting[] = [
  {
    id: 'member_spending',
    labelKey: 'settings.memberSpendingAlerts',
    descriptionKey: 'settings.memberSpendingAlertsDesc',
    key: 'alertMemberSpending',
  },
  {
    id: 'budget_updates',
    labelKey: 'settings.sharedBudgetUpdates',
    descriptionKey: 'settings.sharedBudgetUpdatesDesc',
    key: 'alertBudgetUpdates',
  },
  {
    id: 'goal_progress',
    labelKey: 'settings.sharedGoalProgress',
    descriptionKey: 'settings.sharedGoalProgressDesc',
    key: 'alertGoalProgress',
  },
  {
    id: 'new_transactions',
    labelKey: 'settings.newSharedTransactions',
    descriptionKey: 'settings.newSharedTransactionsDesc',
    key: 'alertNewTransactions',
  },
  {
    id: 'member_joined',
    labelKey: 'settings.memberActivity',
    descriptionKey: 'settings.memberActivityDesc',
    key: 'alertMemberActivity',
  },
  {
    id: 'weekly_summary',
    labelKey: 'settings.weeklySummary',
    descriptionKey: 'settings.weeklySummaryDesc',
    key: 'sendWeeklySummary',
  },
];

export default function HouseholdNotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  const { currentHousehold, updateHousehold } = useHouseholdStore();

  // Get notification preferences from household settings
  const householdSettings = currentHousehold?.settings as Record<string, any> || {};
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    alertMemberSpending: householdSettings.alertMemberSpending ?? true,
    alertBudgetUpdates: householdSettings.alertBudgetUpdates ?? true,
    alertGoalProgress: householdSettings.alertGoalProgress ?? true,
    alertNewTransactions: householdSettings.alertNewTransactions ?? false,
    alertMemberActivity: householdSettings.alertMemberActivity ?? true,
    sendWeeklySummary: householdSettings.sendWeeklySummary ?? true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle preference
  const togglePreference = (key: string) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return newPrefs;
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!currentHousehold) return;

    setIsSaving(true);
    try {
      await updateHousehold(currentHousehold.id, {
        settings: {
          ...householdSettings,
          ...preferences,
        },
      });
      setHasChanges(false);
      Alert.alert(t('common.success'), t('settings.notificationPreferencesUpdated'));
    } catch (err) {
      Alert.alert(t('common.error'), t('settings.failedToSaveChanges'));
    } finally {
      setIsSaving(false);
    }
  };

  // Enable all
  const enableAll = () => {
    const allEnabled: Record<string, boolean> = {};
    notificationSettingKeys.forEach((s) => {
      allEnabled[s.key] = true;
    });
    setPreferences(allEnabled);
    setHasChanges(true);
  };

  // Disable all
  const disableAll = () => {
    const allDisabled: Record<string, boolean> = {};
    notificationSettingKeys.forEach((s) => {
      allDisabled[s.key] = false;
    });
    setPreferences(allDisabled);
    setHasChanges(true);
  };

  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <Header
        title={t('settings.notifications')}
        showBack
        onBack={() => triggerBlackout(() => router.back())}
        rightElement={
          hasChanges ? (
            <Pressable onPress={handleSave} disabled={isSaving}>
              <GradientText variant="neon" style={styles.saveButton}>
                {isSaving ? t('settings.saving') : t('common.save')}
              </GradientText>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <GlassCard variant="outlined" style={styles.infoCard}>
          <NotificationIcon size={24} color={Colors.neon} />
          <GradientText variant="muted" style={styles.infoText}>
            {t('settings.notificationsInfo')}
          </GradientText>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable onPress={enableAll} style={styles.quickAction}>
            <GradientText variant="neon" style={styles.quickActionText}>
              {t('settings.enableAll')}
            </GradientText>
          </Pressable>
          <Text style={styles.quickActionDivider}>|</Text>
          <Pressable onPress={disableAll} style={styles.quickAction}>
            <GradientText variant="subtle" style={styles.quickActionText}>
              {t('settings.disableAll')}
            </GradientText>
          </Pressable>
        </View>

        {/* Notification Settings */}
        <GradientText variant="muted" style={styles.sectionLabel}>
          {t('settings.notificationSettings')}
        </GradientText>

        <GlassCard variant="default" style={styles.listCard}>
          {notificationSettingKeys.map((setting, index) => (
            <Pressable
              key={setting.id}
              style={[
                styles.settingItem,
                index < notificationSettingKeys.length - 1 && styles.itemBorder,
              ]}
              onPress={() => togglePreference(setting.key)}
            >
              <View style={styles.settingInfo}>
                <GradientText variant="bright" style={styles.settingLabel}>
                  {t(setting.labelKey)}
                </GradientText>
                <GradientText variant="muted" style={styles.settingDescription}>
                  {t(setting.descriptionKey)}
                </GradientText>
              </View>
              <Switch
                value={preferences[setting.key]}
                onValueChange={() => togglePreference(setting.key)}
                trackColor={{ false: Colors.border.default, true: Colors.transparent.neon40 }}
                thumbColor={preferences[setting.key] ? Colors.neon : Colors.text.disabled}
              />
            </Pressable>
          ))}
        </GlassCard>

        {/* Summary */}
        <View style={styles.summary}>
          <GradientText variant="muted" style={styles.summaryText}>
            {t('settings.notificationsEnabled', { enabled: enabledCount, total: notificationSettingKeys.length })}
          </GradientText>
        </View>

        {/* Email Preferences Section */}
        <GradientText variant="muted" style={styles.sectionLabel}>
          {t('settings.emailDigest')}
        </GradientText>

        <GlassCard variant="default" style={styles.listCard}>
          <View style={styles.emailItem}>
            <View style={styles.emailIcon}>
              <EmailIcon size={20} color={Colors.primary} />
            </View>
            <View style={styles.emailInfo}>
              <GradientText variant="bright" style={styles.emailLabel}>
                {t('settings.weeklyEmailSummary')}
              </GradientText>
              <GradientText variant="muted" style={styles.emailDescription}>
                {t('settings.weeklyEmailSummaryDesc')}
              </GradientText>
            </View>
            <Switch
              value={preferences.sendWeeklySummary}
              onValueChange={() => togglePreference('sendWeeklySummary')}
              trackColor={{ false: Colors.border.default, true: Colors.transparent.neon40 }}
              thumbColor={preferences.sendWeeklySummary ? Colors.neon : Colors.text.disabled}
            />
          </View>
        </GlassCard>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Save Button (Fixed at bottom when there are changes) */}
      {hasChanges && (
        <View style={styles.saveButtonContainer}>
          <Button
            variant="primary"
            fullWidth
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('settings.savingChanges') : t('settings.saveChanges')}
          </Button>
        </View>
      )}
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
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  saveButton: {
    fontFamily: FontFamily.semiBold,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.caption,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  quickAction: {
    padding: Spacing.sm,
  },
  quickActionText: {
    fontFamily: FontFamily.medium,
  },
  quickActionDivider: {
    color: Colors.text.tertiary,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: FontSize.caption,
    lineHeight: 16,
  },
  summary: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  summaryText: {
    fontSize: FontSize.caption,
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.transparent.deep20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  emailInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  emailLabel: {
    marginBottom: 4,
  },
  emailDescription: {
    fontSize: FontSize.caption,
    lineHeight: 16,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.void,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
});
