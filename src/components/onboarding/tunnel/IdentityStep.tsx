import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientText } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input, SearchInput } from '@/components/ui/Input';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { SUPPORTED_CURRENCIES } from '@/config/currencies';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { lightTap, selectionTap } from '@/utils/haptics';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function IdentityStep({ onNext }: StepProps) {
  const { data, updateData } = useOnboardingStore();
  const [name, setName] = useState(data.displayName || '');
  const [selectedCurrency, setSelectedCurrency] = useState(data.currencyCode || 'USD');
  const [search, setSearch] = useState('');

  const filteredCurrencies = useMemo(() => {
    if (!search) return SUPPORTED_CURRENCIES;
    const q = search.toLowerCase();
    return SUPPORTED_CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [search]);

  const handleContinue = () => {
    const currency = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency);
    updateData({
      displayName: name.trim(),
      currencyCode: selectedCurrency,
      currencySymbol: currency?.symbolEn || selectedCurrency,
    });
    onNext();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GradientText variant="bright" style={styles.title}>
          About You
        </GradientText>
        <Text style={styles.subtitle}>What should we call you?</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.inputSection}>
        <Input
          label="Your Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoFocus
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.currencySection}>
        <Text style={styles.sectionLabel}>Your Currency</Text>
        <SearchInput
          placeholder="Search currencies..."
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
        />
        <View style={styles.currencyList}>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            style={styles.flatList}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCurrency;
              return (
                <Pressable
                  onPress={() => {
                    selectionTap();
                    setSelectedCurrency(item.code);
                  }}
                  style={[styles.currencyItem, isSelected && styles.currencyItemSelected]}
                >
                  <Text
                    style={[styles.currencyCode, isSelected && styles.currencyCodeSelected]}
                    numberOfLines={1}
                  >
                    {item.symbolEn}
                  </Text>
                  <View style={styles.currencyInfo}>
                    <Text style={[styles.currencyName, isSelected && styles.currencyNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.currencyCodeSmall}>{item.code}</Text>
                  </View>
                  {isSelected && <View style={styles.checkMark} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <Button onPress={handleContinue} fullWidth disabled={!name.trim()}>
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSize.h2, fontFamily: FontFamily.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.body, fontFamily: FontFamily.regular, color: Colors.text.tertiary, marginBottom: Spacing.lg },
  inputSection: { marginBottom: Spacing.lg },
  currencySection: { flex: 1 },
  sectionLabel: { fontSize: FontSize.caption, fontFamily: FontFamily.medium, color: Colors.text.secondary, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: Spacing.sm },
  currencyList: { flex: 1, marginTop: Spacing.sm },
  flatList: { flex: 1 },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  currencyItemSelected: {
    backgroundColor: Colors.transparent.neon10,
    borderWidth: 1,
    borderColor: Colors.transparent.neon30,
  },
  currencyCode: { fontSize: FontSize.h4, fontFamily: FontFamily.semiBold, color: Colors.text.secondary, minWidth: 60, flexShrink: 0 },
  currencyCodeSelected: { color: Colors.neon },
  currencyInfo: { flex: 1, marginLeft: Spacing.md },
  currencyName: { fontSize: FontSize.body, fontFamily: FontFamily.regular, color: Colors.text.primary },
  currencyNameSelected: { color: Colors.neon },
  currencyCodeSmall: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, color: Colors.text.tertiary },
  checkMark: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.neon },
  buttonContainer: { paddingVertical: Spacing.lg },
});
