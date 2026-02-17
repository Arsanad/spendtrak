// SPENDTRAK CINEMATIC EDITION - Tabs Layout
// Location: app/(tabs)/_layout.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Tabs, usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Spacing, FontFamily, FontSize } from '@/design/cinematic';
import { GradientNavLabel } from '@/components/ui/GradientText';
import { 
  AnimatedHomeIcon, 
  HomeIcon, 
  TransactionsIcon, 
  StatsIcon, 
  SubscriptionsIcon, 
  SettingsIcon,
  AnimatedSettingsIcon,
} from '@/components/icons';

// Custom Tab Bar Component
function CinematicTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { key: 'index', label: 'Home', icon: HomeIcon, activeIcon: AnimatedHomeIcon },
    { key: 'transactions', label: 'Activity', icon: TransactionsIcon, activeIcon: TransactionsIcon },
    { key: 'stats', label: 'Stats', icon: StatsIcon, activeIcon: StatsIcon },
    { key: 'subscriptions', label: 'Subs', icon: SubscriptionsIcon, activeIcon: SubscriptionsIcon },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, activeIcon: AnimatedSettingsIcon },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || Spacing.sm }]}>
      {/* Top gradient line */}
      <LinearGradient
        colors={[Colors.transparent.neon20, Colors.transparent.primary10, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topLine}
      />

      <View style={styles.tabContent}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const tab = tabs.find(t => t.key === route.name) || tabs[0];
          const Icon = isFocused ? tab.activeIcon : tab.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              onPress={onPress}
              isFocused={isFocused}
              label={tab.label}
              Icon={Icon}
            />
          );
        })}
      </View>
    </View>
  );
}

// Tab Button Component
function TabButton({ onPress, isFocused, label, Icon }: any) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1 : 0.95) }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
        {/* Glow background */}
        {isFocused && <View style={styles.glowBg} />}
        
        <Icon 
          size={22} 
          color={isFocused ? Colors.neon : Colors.text.tertiary}
          active={isFocused}
        />
      </Animated.View>
      
      <GradientNavLabel active={isFocused} style={styles.tabLabel}>
        {label}
      </GradientNavLabel>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CinematicTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hidden screen */}
      <Tabs.Screen name="alerts" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.void,
    borderTopWidth: 0,
    paddingTop: Spacing.sm,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowBg: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.transparent.neon20,
  },
  tabLabel: {
    marginTop: Spacing.xs,
  },
});
