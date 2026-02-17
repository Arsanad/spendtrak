// SPENDTRAK CINEMATIC EDITION - Add/Edit Investment Modal
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { Input, AmountInput } from '../../src/components/ui/Input';
import { Chip } from '../../src/components/ui/Badge';
import { ModalHeader } from '../../src/components/navigation';
import { SectionHeader } from '../../src/components/dashboard';
import { useInvestmentStore } from '../../src/stores/investmentStore';
import type { InvestmentType } from '../../src/types';
import { logger } from '../../src/utils/logger';

const investmentTypes: { id: InvestmentType; labelKey: string }[] = [
  { id: 'stock', labelKey: 'settings.typeStock' },
  { id: 'etf', labelKey: 'settings.typeETF' },
  { id: 'mutual_fund', labelKey: 'settings.typeMutualFund' },
  { id: 'bond', labelKey: 'settings.typeBond' },
  { id: 'cryptocurrency', labelKey: 'settings.typeCrypto' },
  { id: 'real_estate', labelKey: 'settings.typeRealEstate' },
  { id: 'commodity', labelKey: 'settings.typeCommodity' },
  { id: 'other', labelKey: 'settings.typeOther' },
];

export default function AddInvestmentModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    symbol?: string;
    value?: string;
    shares?: string;
    isEditing?: string;
  }>();

  const isEditing = params.isEditing === 'true';

  const [name, setName] = useState(params.name || '');
  const [symbol, setSymbol] = useState(params.symbol || '');
  const [investmentType, setInvestmentType] = useState<InvestmentType>('stock');
  const [quantity, setQuantity] = useState(params.shares || '');
  const [costBasis, setCostBasis] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [institution, setInstitution] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Connect to Zustand store
  const { createHolding, updateHolding, isLoading } = useInvestmentStore();

  // If editing and we have a value, calculate price per share
  useEffect(() => {
    if (isEditing && params.value && params.shares) {
      const totalValue = parseFloat(params.value);
      const sharesNum = parseFloat(params.shares);
      if (totalValue && sharesNum) {
        setCurrentPrice((totalValue / sharesNum).toFixed(2));
        // Assume cost basis is same as current price for display
        setCostBasis((totalValue / sharesNum).toFixed(2));
      }
    }
  }, [isEditing, params.value, params.shares]);

  const isValid = name && symbol && quantity && costBasis && !isSaving;

  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);

    try {
      const quantityNum = parseFloat(quantity);
      const costBasisNum = parseFloat(costBasis);
      const currentPriceNum = parseFloat(currentPrice) || costBasisNum;

      if (isEditing && params.id) {
        // Update existing holding
        await updateHolding(params.id, {
          quantity: quantityNum,
          cost_basis: costBasisNum * quantityNum,
          current_price: currentPriceNum,
          institution_name: institution || undefined,
          notes: notes || undefined,
        });
      } else {
        // Create new holding
        await createHolding({
          symbol: symbol.toUpperCase().trim(),
          name: name.trim(),
          investment_type: investmentType,
          quantity: quantityNum,
          cost_basis: costBasisNum * quantityNum,
          current_price: currentPriceNum,
          institution_name: institution || undefined,
          notes: notes || undefined,
        });
      }

      router.back();
    } catch (error) {
      logger.investment.error('Failed to save investment:', error);
      Alert.alert(t('common.error'), t('transactions.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={{ paddingTop: insets.top }}>
        <ModalHeader
          title={isEditing ? `${t('common.edit')} ${t('categories.investments')}` : `${t('common.add')} ${t('categories.investments')}`}
          onClose={() => router.back()}
          onSave={handleSave}
          saveDisabled={!isValid}
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
        >
          {/* Investment Name */}
          <View style={styles.section}>
            <Input
              label={t('settings.investmentName')}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.investmentNamePlaceholder')}
            />
          </View>

          {/* Symbol/Ticker */}
          <View style={styles.section}>
            <Input
              label={t('settings.symbolTicker')}
              value={symbol}
              onChangeText={(text) => setSymbol(text.toUpperCase())}
              placeholder={t('settings.symbolPlaceholder')}
              autoCapitalize="characters"
            />
          </View>

          {/* Investment Type */}
          {!isEditing && (
            <View style={styles.section}>
              <SectionHeader title={t('settings.investmentType')} />
              <View style={styles.typeGrid}>
                {investmentTypes.map((type) => (
                  <Chip
                    key={type.id}
                    selected={investmentType === type.id}
                    onPress={() => setInvestmentType(type.id)}
                    style={styles.typeChip}
                  >
                    {t(type.labelKey)}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.section}>
            <Input
              label={t('settings.quantityShares')}
              value={quantity}
              onChangeText={setQuantity}
              placeholder={t('settings.quantityPlaceholder')}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Cost Basis per Share */}
          <View style={styles.section}>
            <AmountInput
              label={t('settings.costBasisPerShare')}
              value={costBasis}
              onChangeText={setCostBasis}
              placeholder="0.00"
              currency={currencyCode}
            />
          </View>

          {/* Current Price per Share (Optional) */}
          <View style={styles.section}>
            <AmountInput
              label={t('settings.currentPricePerShare')}
              value={currentPrice}
              onChangeText={setCurrentPrice}
              placeholder="0.00"
              currency={currencyCode}
            />
          </View>

          {/* Institution (Optional) */}
          <View style={styles.section}>
            <Input
              label={t('settings.institutionBroker')}
              value={institution}
              onChangeText={setInstitution}
              placeholder={t('settings.institutionPlaceholder')}
            />
          </View>

          {/* Notes (Optional) */}
          <View style={styles.section}>
            <Input
              label={t('transactions.notesOptional')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('settings.notesPlaceholder')}
              multiline
              numberOfLines={3}
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
});
