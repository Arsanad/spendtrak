// SPENDTRAK CINEMATIC EDITION - Currency Screen
// Uses CurrencyContext for global currency management with real exchange rates
// Performance optimized with FlatList for large lists
import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator, ListRenderItem, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { SearchInput } from '../../src/components/ui/Input';
import { Header } from '../../src/components/navigation';
import { CheckIcon, RefreshIcon } from '../../src/components/icons';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

export default function CurrencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const {
    currency: selectedCurrency,
    supportedCurrencies,
    setCurrency,
    exchangeRates,
    ratesLoading,
    refreshRates,
  } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter currencies based on search
  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return supportedCurrencies;
    const query = searchQuery.toLowerCase();
    return supportedCurrencies.filter(
      currency =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query) ||
        currency.symbol.toLowerCase().includes(query)
    );
  }, [searchQuery, supportedCurrencies]);

  const handleSelectCurrency = async (code: string) => {
    await setCurrency(code);
  };

  // Get exchange rate display for a currency (relative to USD)
  const getExchangeRateDisplay = useCallback((code: string): string => {
    if (code === 'USD') return '1.00';
    const rate = exchangeRates[code];
    if (!rate) return '--';
    return rate.toFixed(rate >= 100 ? 2 : rate >= 1 ? 4 : 6);
  }, [exchangeRates]);

  // Memoized currency item for FlatList
  const CurrencyItem = useCallback(({ item: currency, index }: { item: typeof supportedCurrencies[0]; index: number }) => (
    <Pressable
      onPress={() => handleSelectCurrency(currency.code)}
      style={[
        styles.currencyItem,
        index < filteredCurrencies.length - 1 && styles.itemBorder,
        selectedCurrency.code === currency.code && styles.selectedItem,
      ]}
    >
      <View style={styles.currencyInfo}>
        <View style={styles.currencyHeader}>
          <GradientText variant="bright" style={styles.currencyCode}>
            {currency.code}
          </GradientText>
          <GradientText variant="muted" style={styles.currencySymbol}>
            {currency.symbol}
          </GradientText>
        </View>
        <GradientText variant="subtle" style={styles.currencyName}>
          {currency.name}
        </GradientText>
        <GradientText variant="muted" style={styles.exchangeRate}>
          1 USD = {getExchangeRateDisplay(currency.code)} {currency.code}
        </GradientText>
      </View>
      {selectedCurrency.code === currency.code && (
        <View style={styles.checkIcon}>
          <CheckIcon size={20} color={Colors.neon} />
        </View>
      )}
    </Pressable>
  ), [selectedCurrency.code, filteredCurrencies.length, getExchangeRateDisplay, handleSelectCurrency]);

  // Render item for FlatList
  const renderItem: ListRenderItem<typeof supportedCurrencies[0]> = useCallback(({ item, index }) => (
    <CurrencyItem item={item} index={index} />
  ), [CurrencyItem]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: typeof supportedCurrencies[0]) => item.code, []);

  // Header component for FlatList
  const ListHeader = useMemo(() => (
    <GradientText variant="muted" style={styles.countText}>
      {t('settings.currenciesAvailable', { count: filteredCurrencies.length })}
    </GradientText>
  ), [filteredCurrencies.length]);

  // Empty component for FlatList
  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <GradientText variant="muted" style={styles.emptyText}>
        {t('common.search')}: "{searchQuery}"
      </GradientText>
    </View>
  ), [searchQuery]);

  return (
    <View style={styles.container}>
      <Header
        title={t('settings.currency')}
        showBack
        onBack={() => triggerBlackout(() => router.back())}
        rightElement={
          <Pressable onPress={refreshRates} style={styles.refreshButton}>
            {ratesLoading ? (
              <ActivityIndicator size="small" color={Colors.neon} />
            ) : (
              <RefreshIcon size={20} color={Colors.text.subtle} />
            )}
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.searchContainer}>
        <SearchInput
          placeholder={`${t('common.search')}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Rate info banner */}
      <View style={styles.rateInfoBanner}>
        <GradientText variant="muted" style={styles.rateInfoText}>
          {t('settings.exchangeRatesUpdated')}
        </GradientText>
      </View>

      {/* FIX 12: Exchange rate disclaimer */}
      <View style={styles.disclaimerBanner} accessibilityRole="text">
        <GradientText variant="muted" style={styles.disclaimerText}>
          {t('settings.exchangeRatesDisclaimer')}
        </GradientText>
      </View>

      <GlassCard variant="default" style={styles.listCard}>
        <FlatList
          data={filteredCurrencies}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          windowSize={10}
          initialNumToRender={15}
          getItemLayout={(data, index) => ({
            length: 85,
            offset: 85 * index,
            index,
          })}
          ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
        />
      </GlassCard>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  rateInfoBanner: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  rateInfoText: {
    fontSize: FontSize.caption,
    textAlign: 'center',
    opacity: 0.7,
  },
  disclaimerBanner: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.transparent.orange10,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  countText: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  selectedItem: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  currencyCode: {
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  currencySymbol: {
    fontSize: FontSize.md,
  },
  currencyName: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  exchangeRate: {
    fontSize: FontSize.caption,
    opacity: 0.6,
  },
  checkIcon: {
    marginLeft: Spacing.md,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
