// SPENDTRAK CINEMATIC EDITION - Transaction Filter Modal
import React, { useState, useMemo, memo } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../design/cinematic';
import { easeOutQuad, easeInQuad, easeOutCubic, easeInCubic } from '../../config/easingFunctions';
import { useTranslation } from '../../context/LanguageContext';
import { GradientText, GradientTitle } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { Button, IconButton } from '../ui/Button';
import { CloseIcon, CheckIcon } from '../icons';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'all' | 'receipt' | 'manual';
export type FilterTab = 'income' | 'expenses' | 'account';

export interface FilterState {
  type: TransactionType | 'all';
  source: TransactionSource;
  categories: string[];
  accounts: string[];
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  total: number;
  incomeCount: number;
  expenseCount: number;
  receiptCount: number;
  manualCount: number;
}

export interface TransactionFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  stats: TransactionStats;
  categories?: string[];
  accounts?: string[];
  initialFilters?: FilterState;
}

// ==========================================
// FILTER TAB COMPONENT
// ==========================================

interface FilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}

const FilterTabs = memo(function FilterTabs({ activeTab, onTabChange }: FilterTabsProps) {
  const { t } = useTranslation();
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'income', label: t('transactions.income') },
    { key: 'expenses', label: t('transactions.expense') },
    { key: 'account', label: t('transactions.account') },
  ];

  return (
    <View style={styles.tabsContainer} accessibilityRole="tablist">
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onTabChange(tab.key)}
          style={[
            styles.tab,
            activeTab === tab.key && styles.tabActive,
          ]}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: activeTab === tab.key }}
        >
          <GradientText
            variant={activeTab === tab.key ? 'bright' : 'muted'}
            style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
          >
            {tab.label}
          </GradientText>
        </Pressable>
      ))}
    </View>
  );
});

// ==========================================
// CHECKBOX ITEM COMPONENT
// ==========================================

interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  color?: string;
}

const CheckboxItem = memo(function CheckboxItem({
  label,
  checked,
  onToggle,
  color = Colors.neon,
}: CheckboxItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onToggle}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={styles.checkboxItem}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
      >
        <View style={[styles.checkbox, checked && { borderColor: color, backgroundColor: color }]}>
          {checked && <CheckIcon size={14} color={Colors.void} />}
        </View>
        <GradientText variant={checked ? 'bright' : 'muted'} style={styles.checkboxLabel}>
          {label}
        </GradientText>
      </Pressable>
    </Animated.View>
  );
});

// ==========================================
// SOURCE FILTER COMPONENT
// ==========================================

interface SourceFilterProps {
  selectedSource: TransactionSource;
  onSourceChange: (source: TransactionSource) => void;
  receiptCount: number;
  manualCount: number;
}

const SourceFilter = memo(function SourceFilter({
  selectedSource,
  onSourceChange,
  receiptCount,
  manualCount,
}: SourceFilterProps) {
  const { t } = useTranslation();
  const sources: { key: TransactionSource; label: string; count?: number }[] = [
    { key: 'all', label: t('transactions.all') },
    { key: 'receipt', label: t('transactions.receipts'), count: receiptCount },
    { key: 'manual', label: t('transactions.manual'), count: manualCount },
  ];

  return (
    <View style={styles.sourceContainer}>
      {sources.map((source) => (
        <Pressable
          key={source.key}
          onPress={() => onSourceChange(source.key)}
          style={[
            styles.sourceChip,
            selectedSource === source.key && styles.sourceChipActive,
          ]}
        >
          <GradientText
            variant={selectedSource === source.key ? 'bright' : 'muted'}
            style={styles.sourceLabel}
          >
            {source.label}
            {source.count !== undefined && ` (${source.count})`}
          </GradientText>
        </Pressable>
      ))}
    </View>
  );
});

// ==========================================
// MAIN FILTER MODAL COMPONENT
// ==========================================

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  visible,
  onClose,
  onApply,
  stats,
  categories: categoriesProp,
  accounts: accountsProp,
  initialFilters,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const categories = categoriesProp ?? [
    t('categories.groceries'), t('categories.transport'), t('categories.shopping'),
    t('categories.entertainment'), t('categories.health'), t('categories.bills'), t('categories.other'),
  ];
  const accounts = accountsProp ?? [
    t('transactions.mainAccount'), t('transactions.savings'), t('transactions.creditCard'),
  ];

  // Filter state
  const [activeTab, setActiveTab] = useState<FilterTab>('income');
  const [selectedSource, setSelectedSource] = useState<TransactionSource>(initialFilters?.source || 'all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.categories || []);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(initialFilters?.accounts || []);
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);

  // Toggle category
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Toggle account
  const toggleAccount = (account: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(account)
        ? prev.filter((a) => a !== account)
        : [...prev, account]
    );
  };

  // Reset filters
  const handleReset = () => {
    setSelectedSource('all');
    setSelectedCategories([]);
    setSelectedAccounts([]);
    setIncludeIncome(true);
    setIncludeExpenses(true);
    setActiveTab('income');
  };

  // Apply filters
  const handleApply = () => {
    const filterType = includeIncome && includeExpenses
      ? 'all'
      : includeIncome
        ? 'income'
        : 'expense';

    onApply({
      type: filterType,
      source: selectedSource,
      categories: selectedCategories,
      accounts: selectedAccounts,
    });
    onClose();
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedSource !== 'all' ||
      selectedCategories.length > 0 ||
      selectedAccounts.length > 0 ||
      !includeIncome ||
      !includeExpenses
    );
  }, [selectedSource, selectedCategories, selectedAccounts, includeIncome, includeExpenses]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'income':
        return (
          <View style={styles.tabContent}>
            <CheckboxItem
              label={t('transactions.includeAllIncome')}
              checked={includeIncome}
              onToggle={() => setIncludeIncome(!includeIncome)}
              color={Colors.semantic.income}
            />
            <GradientText variant="muted" style={styles.categoryHint}>
              {stats.incomeCount} {t('transactions.incomeTransactions')}
            </GradientText>
          </View>
        );

      case 'expenses':
        return (
          <View style={styles.tabContent}>
            <CheckboxItem
              label={t('transactions.includeAllExpenses')}
              checked={includeExpenses}
              onToggle={() => setIncludeExpenses(!includeExpenses)}
              color={Colors.semantic.expense}
            />
            <GradientText variant="muted" style={styles.sectionSubtitle}>
              {t('transactions.filterByCategory')}
            </GradientText>
            <View style={styles.checkboxGrid}>
              {categories.map((category) => (
                <CheckboxItem
                  key={category}
                  label={category}
                  checked={selectedCategories.includes(category)}
                  onToggle={() => toggleCategory(category)}
                  color={Colors.neon}
                />
              ))}
            </View>
          </View>
        );

      case 'account':
        return (
          <View style={styles.tabContent}>
            <GradientText variant="muted" style={styles.sectionSubtitle}>
              {t('transactions.filterByAccount')}
            </GradientText>
            <View style={styles.checkboxGrid}>
              {accounts.map((account) => (
                <CheckboxItem
                  key={account}
                  label={account}
                  checked={selectedAccounts.includes(account)}
                  onToggle={() => toggleAccount(account)}
                  color={Colors.primary}
                />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop - Luxury slow fade */}
        <Animated.View
          entering={FadeIn.duration(600).easing(easeOutQuad)}
          exiting={FadeOut.duration(400).easing(easeInQuad)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Modal Content - Cinematic smooth fade-in from bottom */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(200).easing(easeOutCubic)}
          exiting={FadeOutDown.duration(500).easing(easeInCubic)}
          style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.md }]}
          accessibilityViewIsModal={true}
          accessibilityLabel={t('common.filter')}
        >
          <LinearGradient
            colors={[Colors.darker, Colors.void]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <GradientTitle style={styles.title}>{t('common.filter')}</GradientTitle>
            <IconButton
              icon={<CloseIcon size={20} color={Colors.text.primary} />}
              onPress={onClose}
              variant="ghost"
            />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section A: Filter by Type Tabs */}
            <GlassCard variant="default" style={styles.filterCard}>
              <GradientText variant="bright" style={styles.sectionTitle}>
                {t('transactions.filterByType')}
              </GradientText>
              <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
              {renderTabContent()}
            </GlassCard>

            {/* Section C: Source Filter */}
            <GlassCard variant="default" style={styles.filterCard}>
              <GradientText variant="bright" style={styles.sectionTitle}>
                {t('transactions.source')}
              </GradientText>
              <SourceFilter
                selectedSource={selectedSource}
                onSourceChange={setSelectedSource}
                receiptCount={stats.receiptCount}
                manualCount={stats.manualCount}
              />
            </GlassCard>
          </ScrollView>

          {/* Section D: Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              variant="secondary"
              onPress={handleReset}
              style={styles.resetButton}
              disabled={!hasActiveFilters}
            >
              {t('transactions.resetFilters')}
            </Button>
            <Button
              variant="primary"
              onPress={handleApply}
              style={styles.applyButton}
            >
              {t('common.apply')}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: Colors.void,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '95%',
    ...Shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.h3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  },

  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },

  // Filter Card
  filterCard: {
    marginBottom: Spacing.md,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darker,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.deepest,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  tabText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  tabTextActive: {
    fontFamily: FontFamily.semiBold,
  },
  tabContent: {
    marginTop: Spacing.sm,
  },

  // Checkbox
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxLabel: {
    fontSize: FontSize.body,
    flex: 1,
  },
  checkboxGrid: {
    marginTop: Spacing.sm,
  },

  // Category hints
  categoryHint: {
    fontSize: FontSize.caption,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xl + Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: FontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },

  // Source Filter
  sourceContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sourceChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darker,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sourceChipActive: {
    borderColor: Colors.neon,
    backgroundColor: Colors.transparent.neon10,
  },
  sourceLabel: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.medium,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});

export default TransactionFilter;
