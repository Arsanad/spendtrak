// SPENDTRAK CINEMATIC EDITION - Language Screen
// Uses LanguageContext for global language management with RTL support
// Performance optimized with FlatList for large lists
import React, { useMemo, useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Pressable, ListRenderItem, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { SearchInput } from '../../src/components/ui/Input';
import { Header } from '../../src/components/navigation';
import { CheckIcon } from '../../src/components/icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { Language } from '../../src/config/languages';
import { useTransition } from '../../src/context/TransitionContext';

export default function LanguageScreen() {
  const router = useRouter();
  const { triggerBlackout } = useTransition();
  const {
    language: selectedLanguage,
    setLanguage,
    supportedLanguages,
    t,
    isRTL,
  } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return supportedLanguages;
    const query = searchQuery.toLowerCase();
    return supportedLanguages.filter(
      lang =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [searchQuery, supportedLanguages]);

  const handleSelectLanguage = useCallback(async (lang: Language) => {
    const currentIsRTL = selectedLanguage.direction === 'rtl';
    const newIsRTL = lang.direction === 'rtl';

    // Warn user if RTL change requires restart
    if (currentIsRTL !== newIsRTL) {
      Alert.alert(
        t('settings.language'),
        'Changing to this language requires the app to restart. Continue?',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () => setLanguage(lang.code),
          },
        ]
      );
    } else {
      await setLanguage(lang.code);
    }
  }, [selectedLanguage, setLanguage, t]);

  // Render item for FlatList
  const renderItem: ListRenderItem<Language> = useCallback(({ item: lang, index }) => {
    const isSelected = selectedLanguage.code === lang.code;

    return (
      <Pressable
        onPress={() => handleSelectLanguage(lang)}
        style={[
          styles.langItem,
          index < filteredLanguages.length - 1 && styles.itemBorder,
          isSelected && styles.selectedItem,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={[styles.langInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <GradientText variant="bright" style={styles.langNative}>
            {lang.nativeName}
          </GradientText>
          <GradientText variant="muted" style={styles.langName}>
            {lang.name}
          </GradientText>
          {lang.direction === 'rtl' && (
            <GradientText variant="muted" style={styles.rtlBadge}>
              RTL
            </GradientText>
          )}
        </View>
        {isSelected && (
          <View style={styles.checkIcon}>
            <CheckIcon size={20} color={Colors.neon} />
          </View>
        )}
      </Pressable>
    );
  }, [selectedLanguage, filteredLanguages.length, handleSelectLanguage, isRTL]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: Language) => item.code, []);

  // Header component for FlatList
  const ListHeader = useMemo(() => (
    <GradientText variant="muted" style={styles.countText}>
      {filteredLanguages.length} {t('settings.language').toLowerCase()}s available
    </GradientText>
  ), [filteredLanguages.length, t]);

  // Empty component for FlatList
  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <GradientText variant="muted" style={styles.emptyText}>
        No languages found matching "{searchQuery}"
      </GradientText>
    </View>
  ), [searchQuery]);

  return (
    <View style={styles.container}>
      <Header title={t('settings.language')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.searchContainer}>
        <SearchInput
          placeholder={t('settings.searchLanguages')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Info banner about RTL */}
      <View style={styles.infoBanner}>
        <GradientText variant="muted" style={styles.infoText}>
          {t('settings.rtlSupportInfo')}
        </GradientText>
      </View>

      <GlassCard variant="default" style={styles.listCard}>
        <FlatList
          data={filteredLanguages}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  infoBanner: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.caption,
    textAlign: 'center',
    opacity: 0.7,
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
    flex: 1,
    marginHorizontal: Spacing.lg,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  selectedItem: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  langInfo: {
    flex: 1,
  },
  langNative: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  langName: {
    fontSize: FontSize.sm,
  },
  rtlBadge: {
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
    color: Colors.neon,
    opacity: 0.8,
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
