// SPENDTRAK CINEMATIC EDITION - Household Shared Categories Screen
import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, Switch, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/navigation';
import { FilterIcon, CheckIcon } from '../../src/components/icons';
import { useHouseholdStore } from '../../src/stores/householdStore';
import { useCategoryStore, SYSTEM_CATEGORIES } from '../../src/stores/categoryStore';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';

// Define which categories are shared by default
const DEFAULT_SHARED_CATEGORIES = ['food', 'groceries', 'utilities', 'transport', 'entertainment'];

export default function HouseholdCategoriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  const { currentHousehold, updateHousehold } = useHouseholdStore();
  const { customCategories, getAllCategories } = useCategoryStore();

  // Get all categories
  const allCategories = getAllCategories();

  // Get shared categories from household settings
  const householdSettings = currentHousehold?.settings as { sharedCategories?: string[] } || {};
  const [sharedCategories, setSharedCategories] = useState<string[]>(
    householdSettings.sharedCategories || DEFAULT_SHARED_CATEGORIES
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle category sharing
  const toggleCategory = (categoryId: string) => {
    setSharedCategories((prev) => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
      setHasChanges(true);
      return newCategories;
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
          sharedCategories,
        },
      });
      setHasChanges(false);
      Alert.alert(t('common.success'), t('settings.sharedCategoriesUpdated'));
    } catch (err) {
      Alert.alert(t('common.error'), t('settings.failedToSaveChanges'));
    } finally {
      setIsSaving(false);
    }
  };

  // Select all
  const selectAll = () => {
    setSharedCategories(allCategories.map((c) => c.id));
    setHasChanges(true);
  };

  // Deselect all
  const deselectAll = () => {
    setSharedCategories([]);
    setHasChanges(true);
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('settings.sharedCategories')}
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
          <FilterIcon size={24} color={Colors.neon} />
          <GradientText variant="muted" style={styles.infoText}>
            {t('settings.sharedCategoriesInfo')}
          </GradientText>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable onPress={selectAll} style={styles.quickAction}>
            <GradientText variant="neon" style={styles.quickActionText}>
              {t('settings.selectAll')}
            </GradientText>
          </Pressable>
          <Text style={styles.quickActionDivider}>|</Text>
          <Pressable onPress={deselectAll} style={styles.quickAction}>
            <GradientText variant="subtle" style={styles.quickActionText}>
              {t('settings.deselectAll')}
            </GradientText>
          </Pressable>
        </View>

        {/* System Categories */}
        <GradientText variant="muted" style={styles.sectionLabel}>
          {t('settings.systemCategories')}
        </GradientText>

        <GlassCard variant="default" style={styles.listCard}>
          {SYSTEM_CATEGORIES.map((category, index) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryItem,
                index < SYSTEM_CATEGORIES.length - 1 && styles.itemBorder,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              </View>
              <GradientText variant="bright" style={styles.categoryName}>
                {category.name}
              </GradientText>
              <View
                style={[
                  styles.checkbox,
                  sharedCategories.includes(category.id) && styles.checkboxActive,
                ]}
              >
                {sharedCategories.includes(category.id) && (
                  <CheckIcon size={14} color={Colors.void} />
                )}
              </View>
            </Pressable>
          ))}
        </GlassCard>

        {/* Custom Categories */}
        {customCategories.length > 0 && (
          <>
            <GradientText variant="muted" style={styles.sectionLabel}>
              {t('settings.customCategories')}
            </GradientText>

            <GlassCard variant="default" style={styles.listCard}>
              {customCategories.map((category, index) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    index < customCategories.length - 1 && styles.itemBorder,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  </View>
                  <GradientText variant="bright" style={styles.categoryName}>
                    {category.name}
                  </GradientText>
                  <View
                    style={[
                      styles.checkbox,
                      sharedCategories.includes(category.id) && styles.checkboxActive,
                    ]}
                  >
                    {sharedCategories.includes(category.id) && (
                      <CheckIcon size={14} color={Colors.void} />
                    )}
                  </View>
                </Pressable>
              ))}
            </GlassCard>
          </>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <GradientText variant="muted" style={styles.summaryText}>
            {t('settings.categoriesShared', { shared: sharedCategories.length, total: allCategories.length })}
          </GradientText>
        </View>

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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.neon,
    borderColor: Colors.neon,
  },
  summary: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  summaryText: {
    fontSize: FontSize.caption,
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
