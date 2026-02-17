// SPENDTRAK CINEMATIC EDITION - Tabs Layout
import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing } from '../../src/design/cinematic';
import { HomeIcon, TransactionsIcon, StatsIcon, SubscriptionsIcon, SettingsIcon } from '../../src/components/icons';
import { GradientNavLabel } from '../../src/components/ui/GradientText';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.void,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: Spacing.sm,
        },
        tabBarActiveTintColor: Colors.neon,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: FontSize.label,
          marginTop: 2,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <HomeIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => <TransactionsIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <StatsIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Subs',
          tabBarIcon: ({ focused }) => <SubscriptionsIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <SettingsIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen name="alerts" options={{ href: null }} />
    </Tabs>
  );
}

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || Spacing.sm }]}>
      {/* Top gradient line */}
      <LinearGradient
        colors={[Colors.transparent.neon20, Colors.transparent.primary10, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topGradient}
      />

      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          // Skip hidden tabs
          if (options.href === null) return null;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              label={label}
              icon={options.tabBarIcon?.({ focused: isFocused })}
              focused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({ label, icon, focused, onPress }: { label: string; icon: React.ReactNode; focused: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(focused ? 0.3 : 0);

  React.useEffect(() => {
    glowOpacity.value = withTiming(focused ? 0.3 : 0, { duration: 200 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabGlow, glowStyle]} />
      <Animated.View style={iconStyle}>{icon}</Animated.View>
      <GradientNavLabel active={focused} style={styles.tabLabel}>{label}</GradientNavLabel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.void,
    paddingTop: Spacing.sm,
  },
  topGradient: {
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
  tabButton: {
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
});
