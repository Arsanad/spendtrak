// SPENDTRAK CINEMATIC EDITION - Add Asset Modal
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { Input, AmountInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { saveDevAsset, autoSaveNetWorthSnapshot } from '../../src/services/devStorage';
import { logger } from '../../src/utils/logger';

const ASSET_TYPES = [
  { id: 'savings', labelKey: 'netWorth.typeSavings', icon: 'wallet-outline' },
  { id: 'checking', labelKey: 'netWorth.typeChecking', icon: 'card-outline' },
  { id: 'investment', labelKey: 'netWorth.typeInvestment', icon: 'trending-up-outline' },
  { id: 'property', labelKey: 'netWorth.typeProperty', icon: 'home-outline' },
  { id: 'vehicle', labelKey: 'netWorth.typeVehicle', icon: 'car-outline' },
  { id: 'crypto', labelKey: 'netWorth.typeCrypto', icon: 'logo-bitcoin' },
  { id: 'retirement', labelKey: 'netWorth.typeRetirement', icon: 'umbrella-outline' },
  { id: 'other', labelKey: 'netWorth.typeOther', icon: 'ellipsis-horizontal-outline' },
];

const ASSET_ICONS = [
  { id: 'wallet-outline', nameKey: 'common.iconWallet' },
  { id: 'card-outline', nameKey: 'common.iconCard' },
  { id: 'cash-outline', nameKey: 'common.iconCash' },
  { id: 'trending-up-outline', nameKey: 'common.iconGrowth' },
  { id: 'home-outline', nameKey: 'common.iconHome' },
  { id: 'car-outline', nameKey: 'common.iconCar' },
  { id: 'logo-bitcoin', nameKey: 'common.iconCrypto' },
  { id: 'umbrella-outline', nameKey: 'common.iconRetirement' },
  { id: 'diamond-outline', nameKey: 'common.iconLuxury' },
  { id: 'briefcase-outline', nameKey: 'common.iconBusiness' },
  { id: 'globe-outline', nameKey: 'common.iconForeign' },
  { id: 'stats-chart-outline', nameKey: 'common.iconStocks' },
];

export default function AddAssetModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [selectedType, setSelectedType] = useState('savings');
  const [selectedIcon, setSelectedIcon] = useState('wallet-outline');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isValid = name.trim() && value && parseFloat(value) > 0;

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await saveDevAsset({
        id: `asset_${Date.now()}`,
        user_id: 'dev_user',
        name: name.trim(),
        category: ASSET_TYPES.find(at => at.id === selectedType)?.id || 'other',
        value: parseFloat(value),
        icon: selectedIcon,
        notes: notes.trim() || undefined,
        created_at: now,
        updated_at: now,
      });
      // Auto-save net worth snapshot to track changes over time
      autoSaveNetWorthSnapshot().catch(() => {
        // Silently fail - not critical for UI
      });
      router.back();
    } catch (error) {
      logger.general.error('Error saving asset:', error);
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  // Update icon when type changes
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    const typeInfo = ASSET_TYPES.find(t => t.id === typeId);
    if (typeInfo) {
      setSelectedIcon(typeInfo.icon);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={t('netWorth.addAsset')}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid || isSaving}
          saveLabel={isSaving ? t('common.loading') : t('common.save')}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Asset Name */}
          <View style={styles.section}>
            <Input
              label={t('netWorth.assetName')}
              value={name}
              onChangeText={setName}
              placeholder={t('netWorth.assetNamePlaceholder')}
            />
          </View>

          {/* Asset Type */}
          <View style={styles.section}>
            <SectionHeader title={t('transactions.type')} />
            <View style={styles.typeGrid}>
              {ASSET_TYPES.map((type) => (
                <Chip
                  key={type.id}
                  selected={selectedType === type.id}
                  onPress={() => handleTypeChange(type.id)}
                  style={styles.typeChip}
                >
                  {t(type.labelKey)}
                </Chip>
              ))}
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <SectionHeader title={t('categories.title')} />
            <View style={styles.iconGrid}>
              {ASSET_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon.id;
                return (
                  <TouchableOpacity
                    key={icon.id}
                    onPress={() => setSelectedIcon(icon.id)}
                    style={[
                      styles.iconItem,
                      isSelected && styles.iconItemSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icon.id as any}
                      size={24}
                      color={isSelected ? Colors.neon : Colors.text.tertiary}
                    />
                    <Text style={[
                      styles.iconLabel,
                      isSelected && styles.iconLabelSelected,
                    ]}>
                      {t(icon.nameKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Value */}
          <View style={styles.section}>
            <AmountInput
              label={t('goals.currentAmount')}
              value={value}
              onChangeText={setValue}
              placeholder="0.00"
              currency={currencyCode}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Input
              label={t('transactions.notesOptional')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('transactions.notesPlaceholder')}
              multiline
            />
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  typeChip: {
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.neon}30`,
    backgroundColor: 'transparent',
    gap: 4,
  },
  iconItemSelected: {
    borderColor: Colors.neon,
    backgroundColor: `${Colors.neon}15`,
  },
  iconLabel: {
    fontFamily: FontFamily.medium,
    color: Colors.text.tertiary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: Colors.neon,
  },
});
