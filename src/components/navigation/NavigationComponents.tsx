// SPENDTRAK CINEMATIC EDITION - Navigation Components
import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows, ComponentHeight } from '../../design/cinematic';
import { lightTap, softTap } from '../../utils/haptics';
import { GradientNavLabel } from '../ui/GradientText';
import { HomeIcon, TransactionsIcon, StatsIcon, SubscriptionsIcon, SettingsIcon, ChevronLeftIcon } from '../icons';

// ==========================================
// BOTTOM TAB BAR
// ==========================================

export interface TabBarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

export interface BottomTabBarProps {
  tabs: TabBarItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  style?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ tabs, activeTab, onTabPress, style }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || Spacing.sm }, style]}>
      {/* Gradient top border */}
      <LinearGradient
        colors={[Colors.transparent.neon20, Colors.transparent.primary10, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.tabBarTopGradient}
      />

      <View style={styles.tabBarContent}>
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            item={tab}
            active={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
          />
        ))}
      </View>
    </View>
  );
};

const TabItem: React.FC<{ item: TabBarItem; active: boolean; onPress: () => void }> = ({ item, active, onPress }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    glowOpacity.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value * 0.3 }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      accessible={true}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      style={styles.tabItem}
    >
      {/* Glow effect */}
      <AnimatedView style={[styles.tabGlow, glowStyle]} />

      <AnimatedView style={iconStyle}>
        {active && item.activeIcon ? item.activeIcon : item.icon}
      </AnimatedView>

      <GradientNavLabel active={active} style={styles.tabLabel}>
        {item.label}
      </GradientNavLabel>
    </Pressable>
  );
};

// Default tabs configuration
export const defaultTabs: TabBarItem[] = [
  { key: 'index', label: 'Home', icon: <HomeIcon size={22} color={Colors.text.tertiary} />, activeIcon: <HomeIcon size={22} color={Colors.neon} /> },
  { key: 'transactions', label: 'Activity', icon: <TransactionsIcon size={22} color={Colors.text.tertiary} />, activeIcon: <TransactionsIcon size={22} color={Colors.neon} /> },
  { key: 'stats', label: 'Stats', icon: <StatsIcon size={22} color={Colors.text.tertiary} />, activeIcon: <StatsIcon size={22} color={Colors.neon} /> },
  { key: 'subscriptions', label: 'Subs', icon: <SubscriptionsIcon size={22} color={Colors.text.tertiary} />, activeIcon: <SubscriptionsIcon size={22} color={Colors.neon} /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon size={22} color={Colors.text.tertiary} />, activeIcon: <SettingsIcon size={22} color={Colors.neon} /> },
];

// ==========================================
// HEADER
// ==========================================

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title, showBack = false, onBack, leftElement, rightElement, transparent = false, style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }, transparent && styles.headerTransparent, style]}>
      <View style={styles.headerContent}>
        {/* Left */}
        <View style={styles.headerLeft}>
          {showBack ? (
            <Pressable
              onPress={onBack}
              style={styles.headerBackButton}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeftIcon size={24} color={Colors.text.primary} />
            </Pressable>
          ) : leftElement}
        </View>

        {/* Title */}
        {title && (
          <View style={styles.headerCenter}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {title}
            </Text>
          </View>
        )}

        {/* Right */}
        <View style={styles.headerRight}>
          {rightElement}
        </View>
      </View>
    </View>
  );
};

// ==========================================
// MODAL HEADER
// ==========================================

export interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title, onClose, onSave, saveLabel = 'Save', saveDisabled = false,
}) => (
  <View style={styles.modalHeader}>
    <Pressable
      onPress={() => { lightTap(); onClose?.(); }}
      style={styles.modalHeaderButton}
      hitSlop={8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Cancel"
      accessibilityHint="Closes the modal without saving"
    >
      <Text
        style={styles.modalHeaderCancel}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        Cancel
      </Text>
    </Pressable>

    <Text
      style={styles.modalHeaderTitle}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      accessible={true}
      accessibilityRole="header"
    >
      {title}
    </Text>

    <Pressable
      onPress={saveDisabled ? undefined : () => { softTap(); onSave?.(); }}
      style={[styles.modalHeaderButton, styles.modalHeaderButtonRight, saveDisabled && styles.modalHeaderButtonDisabled]}
      hitSlop={8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={saveLabel}
      accessibilityHint="Saves your changes"
      accessibilityState={{ disabled: saveDisabled }}
    >
      <Text
        style={[styles.modalHeaderSave, saveDisabled && styles.modalHeaderSaveDisabled]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {saveLabel}
      </Text>
    </Pressable>
  </View>
);

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Tab Bar
  tabBarContainer: {
    backgroundColor: Colors.void,
    borderTopWidth: 0,
    paddingTop: Spacing.sm,
  },
  tabBarTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  tabGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neon,
  },
  tabLabel: {
    marginTop: Spacing.xs,
  },

  // Header
  headerContainer: {
    backgroundColor: Colors.void,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  headerContent: {
    height: ComponentHeight.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headerLeft: {
    minWidth: 60,
    flexShrink: 0,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerRight: {
    minWidth: 60,
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h5,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  headerBackButton: {
    padding: Spacing.xs,
  },

  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  modalHeaderButton: {
    minWidth: 70,
    flexShrink: 0,
  },
  modalHeaderButtonRight: {
    alignItems: 'flex-end',
  },
  modalHeaderButtonDisabled: {
    opacity: 0.5,
  },
  modalHeaderTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h5,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  modalHeaderCancel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
  },
  modalHeaderSave: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.neon,
  },
  modalHeaderSaveDisabled: {
    color: Colors.text.disabled,
  },
});
