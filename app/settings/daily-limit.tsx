// SPENDTRAK CINEMATIC EDITION - Daily Limit Screen
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../src/design/cinematic';
import { useTranslation } from '../../src/context/LanguageContext';
import { useCurrency } from '../../src/context/CurrencyContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { AmountInput } from '../../src/components/ui/Input';
import { Toggle } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/navigation';
import { ProgressRing } from '../../src/components/premium';
import { useTransition } from '../../src/context/TransitionContext';
import { getSafeToSpend, getDailyLimit, setDailyLimit, disableDailyLimit } from '../../src/services/dailyLimit';
import { logger } from '../../src/utils/logger';

export default function DailyLimitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const { format: formatCurrency, currencyCode } = useCurrency();
  const [limit, setLimit] = useState('500');
  const [enabled, setEnabled] = useState(true);
  const [spent, setSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const limitNum = parseInt(limit) || 0;
  const percentage = limitNum > 0 ? Math.min((spent / limitNum) * 100, 100) : 0;

  useEffect(() => {
    loadDailyLimitData();
  }, []);

  const loadDailyLimitData = async () => {
    try {
      setLoading(true);
      const [limitData, safeToSpend] = await Promise.all([
        getDailyLimit(),
        getSafeToSpend(),
      ]);

      if (limitData) {
        setLimit(String(limitData.daily_limit));
        setEnabled(limitData.is_active);
      }

      if (safeToSpend) {
        setSpent(safeToSpend.spent_today);
      }
    } catch (error) {
      logger.general.error('Error loading daily limit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (enabled) {
        await setDailyLimit(limitNum, { currency: currencyCode });
      } else {
        await disableDailyLimit();
      }
      triggerBlackout(() => router.back());
    } catch (error) {
      logger.general.error('Error saving daily limit:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('settings.dailyLimit')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        <GlassCard variant="elevated" style={styles.progressCard}>
          <View style={styles.progressContainer}>
            <ProgressRing progress={percentage} size={140} strokeWidth={10}>
              <GradientText variant="luxury" style={styles.progressAmount}>{formatCurrency(spent)}</GradientText>
              <GradientText variant="luxury" style={styles.progressLabel}>{t('settings.spentToday')}</GradientText>
            </ProgressRing>
          </View>
          <GradientText variant="subtle" style={styles.remainingText}>
            {formatCurrency(Math.max(limitNum - spent, 0))} {t('settings.remaining')}
          </GradientText>
        </GlassCard>

        <GlassCard variant="default">
          <View style={styles.settingRow}>
            <GradientText variant="bright">{t('settings.enableDailyLimit')}</GradientText>
            <Toggle value={enabled} onValueChange={setEnabled} />
          </View>
        </GlassCard>

        <GradientText variant="muted" style={styles.sectionLabel}>{t('settings.limitAmount')}</GradientText>
        <AmountInput value={limit} onChangeText={setLimit} currency={currencyCode} placeholder={t('settings.enterDailyLimit')} />

        <Button variant="primary" onPress={handleSave} style={styles.saveButton}>{t('common.save')}</Button>

        <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  progressCard: { alignItems: 'center', marginBottom: Spacing.lg },
  progressContainer: { marginBottom: Spacing.md },
  progressAmount: { fontSize: FontSize.h3 },
  progressLabel: { fontSize: FontSize.caption },
  remainingText: { textAlign: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: FontSize.caption, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, marginTop: Spacing.lg },
  saveButton: { marginTop: Spacing.xxl },
});
