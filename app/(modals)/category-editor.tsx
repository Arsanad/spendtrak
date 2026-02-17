// SPENDTRAK CINEMATIC EDITION - Category Editor Modal
// Add or Edit custom categories

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/design/cinematic';
import { useTranslation } from '../../src/context/LanguageContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button, IconButton } from '../../src/components/ui/Button';
import { Header } from '../../src/components/navigation';
import { useCategoryStore, AVAILABLE_COLORS } from '../../src/stores/categoryStore';
import {
  CloseIcon, CheckIcon,
  FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon,
  HealthIcon, EducationIcon, TravelIcon, HomeIcon,
  UtilitiesIcon, GiftIcon, SubscriptionsIcon, InvestmentIcon,
  StarIcon, TrophyIcon, TargetIcon, DebtIcon,
} from '../../src/components/icons';

// Map icon names to components
const ICON_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  FoodIcon,
  TransportIcon,
  ShoppingIcon,
  EntertainmentIcon,
  HealthIcon,
  EducationIcon,
  TravelIcon,
  HomeIcon,
  UtilitiesIcon,
  GiftIcon,
  SubscriptionsIcon,
  InvestmentIcon,
  StarIcon,
  TrophyIcon,
  TargetIcon,
  DebtIcon,
};

const AVAILABLE_ICON_NAMES = Object.keys(ICON_MAP);

export default function CategoryEditorModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    icon?: string;
    color?: string;
  }>();

  const isEditing = !!params.id;
  const { t } = useTranslation();

  const { addCategory, updateCategory, getCategoryById } = useCategoryStore();

  // Form state
  const [name, setName] = useState(params.name || '');
  const [selectedIcon, setSelectedIcon] = useState(params.icon || 'FoodIcon');
  const [selectedColor, setSelectedColor] = useState(params.color || AVAILABLE_COLORS[0]);

  // Load category data if editing
  useEffect(() => {
    if (isEditing && params.id) {
      const category = getCategoryById(params.id);
      if (category) {
        setName(category.name);
        setSelectedIcon(category.icon);
        setSelectedColor(category.color);
      }
    }
  }, [isEditing, params.id]);

  const handleSave = () => {
    if (!name.trim()) return;

    if (isEditing && params.id) {
      updateCategory(params.id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
    } else {
      addCategory({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
    }

    router.back();
  };

  const canSave = name.trim().length > 0;

  return (
    <View style={styles.container}>

      <Header
        title={isEditing ? t('settings.editCategory') : t('settings.newCategory')}
        showBack
        onBack={() => router.back()}
        rightElement={
          <IconButton
            icon={<CheckIcon size={20} color={canSave ? Colors.neon : Colors.text.disabled} />}
            onPress={handleSave}
            variant="ghost"
            disabled={!canSave}
          />
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        {/* Preview */}
        <View style={styles.previewContainer}>
          <GlassCard variant="glow" style={styles.previewCard}>
            <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}20` }]}>
              {ICON_MAP[selectedIcon] &&
                React.createElement(ICON_MAP[selectedIcon], { size: 32, color: selectedColor })}
            </View>
            <GradientText variant="bright" style={styles.previewName}>
              {name || t('transactions.category')}
            </GradientText>
          </GlassCard>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <GradientText variant="muted" style={styles.sectionTitle}>{t('settings.categoryNameLabel')}</GradientText>
          <GlassCard variant="default" style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.enterCategoryName')}
              placeholderTextColor={Colors.text.disabled}
              maxLength={30}
              autoFocus={!isEditing}
            />
          </GlassCard>
        </View>

        {/* Icon Selection */}
        <View style={styles.section}>
          <GradientText variant="muted" style={styles.sectionTitle}>{t('settings.iconLabel')}</GradientText>
          <GlassCard variant="default" style={styles.gridCard}>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICON_NAMES.map((iconName) => {
                const IconComponent = ICON_MAP[iconName];
                const isSelected = selectedIcon === iconName;
                return (
                  <IconOption
                    key={iconName}
                    isSelected={isSelected}
                    color={selectedColor}
                    onPress={() => setSelectedIcon(iconName)}
                  >
                    <IconComponent size={24} color={isSelected ? selectedColor : Colors.text.secondary} />
                  </IconOption>
                );
              })}
            </View>
          </GlassCard>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <GradientText variant="muted" style={styles.sectionTitle}>{t('settings.colorLabel')}</GradientText>
          <GlassCard variant="default" style={styles.gridCard}>
            <View style={styles.colorGrid}>
              {AVAILABLE_COLORS.map((color) => (
                <ColorOption
                  key={color}
                  color={color}
                  isSelected={selectedColor === color}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Save Button */}
        <Button
          variant="primary"
          fullWidth
          onPress={handleSave}
          disabled={!canSave}
          style={styles.saveButton}
        >
          {isEditing ? t('settings.saveChanges') : t('settings.createCategory')}
        </Button>

        <View style={{ height: insets.bottom + Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Icon Option Component
const IconOption: React.FC<{
  isSelected: boolean;
  color: string;
  onPress: () => void;
  children: React.ReactNode;
}> = ({ isSelected, color, onPress, children }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.9); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.iconOption,
          isSelected && { backgroundColor: `${color}20`, borderColor: color },
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

// Color Option Component
const ColorOption: React.FC<{
  color: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ color, isSelected, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.9); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.colorOption,
          { backgroundColor: color },
          isSelected && styles.colorOptionSelected,
        ]}
      >
        {isSelected && <CheckIcon size={16} color={Colors.void} />}
      </Pressable>
    </Animated.View>
  );
};

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
    paddingTop: Spacing.md,
  },

  // Preview
  previewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minWidth: 200,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  previewName: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: FontSize.caption,
  },

  // Input
  inputCard: {
    padding: 0,
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // Grid Card
  gridCard: {
    padding: Spacing.md,
  },

  // Icon Grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.transparent.dark40,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Color Grid
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.void,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  // Save Button
  saveButton: {
    marginTop: Spacing.lg,
  },
});
