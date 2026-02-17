// SPENDTRAK CINEMATIC EDITION - Tabs Layout
// Fade through black transitions between tabs
// Includes auth guard to prevent unauthorized access
import React, { useState, useEffect, useRef, memo } from 'react';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, waitForAuthHydration } from '../../src/stores/authStore';
import { theme } from '../../src/theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/design/cinematic';
import { easeInOutQuad } from '../../src/config/easingFunctions';
import { lightTap, modalFeedback } from '../../src/utils/haptics';
import { HomeIcon, AnalyticsIcon, SettingsIcon, AlertsIcon, PlusIcon, EditIcon, ScanIcon } from '../../src/components/icons';
import { GradientNavLabel, GradientText } from '../../src/components/ui/GradientText';
import { AnimatedAddButton } from '../../src/components/navigation';
import { useTransition } from '../../src/context/TransitionContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { QuantumAliveOverlay } from '../../src/components/quantum/QuantumAliveOverlay';
// Note: GlassCard import removed - using LinearGradient for icon backgrounds

// Reflection/Shine Animation Component - memoized
const ReflectionOverlay: React.FC<{ delay?: number }> = memo(({ delay = 0 }) => {
  const translateX = useSharedValue(-150);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withDelay(2500, withTiming(150, { duration: 700, easing: easeInOutQuad })),
          withTiming(-150, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: '25deg' }],
  }));

  return (
    <Animated.View style={[styles.reflectionOverlay, animatedStyle]} pointerEvents="none">
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.reflectionGradient}
      />
    </Animated.View>
  );
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, isInitialized, initialize } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [authCheckDelay, setAuthCheckDelay] = useState(false);

  // Wait for auth store to be hydrated before checking auth
  useEffect(() => {
    waitForAuthHydration().then(() => setIsHydrated(true));
  }, []);

  // Add a grace period before redirecting - allows auth state to propagate
  // This fixes the race condition where navigation happens before auth store updates
  useEffect(() => {
    if (isHydrated && isInitialized && !user) {
      // Wait 2 seconds before deciding to redirect
      // During this time, re-initialize to pick up any pending session
      const timer = setTimeout(() => {
        // Re-check auth store one more time
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          setAuthCheckDelay(true);
        }
      }, 2000);

      // Also try to re-initialize in case session exists but wasn't picked up
      initialize();

      return () => clearTimeout(timer);
    }
  }, [isHydrated, isInitialized, user, initialize]);

  // Auth Guard: Show loading while checking auth
  if (!isHydrated || !isInitialized) {
    return (
      <View style={styles.authGuardContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  // Auth Guard: Show loading while waiting for auth grace period
  if (!user && !authCheckDelay) {
    return (
      <View style={styles.authGuardContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  // Auth Guard: Redirect to auth if no user (after grace period)
  if (!user && authCheckDelay) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Onboarding guard: new users go through personalization tunnel
  if (user && !user.onboarding_completed) {
    return <Redirect href={'/(onboarding)' as any} />;
  }

  return (
    <>
    <QuantumAliveOverlay />
    <Tabs
      screenOptions={{
        headerShown: false,
        // NO animation - blackout effect handles all transitions
        animation: 'none',
        sceneStyle: { backgroundColor: 'transparent' }, // Allow AnimatedBackground to show through
        // Tab bar styling
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
          title: t('navigation.home'),
          tabBarIcon: ({ focused }) => <HomeIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          href: null, // Hidden - transactions embedded in Home
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('navigation.analytics'),
          tabBarIcon: ({ focused }) => <AnalyticsIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('navigation.add'),
          tabBarIcon: ({ focused }) => <PlusIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default navigation - handled by custom tab bar
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t('navigation.alerts'),
          tabBarIcon: ({ focused }) => <AlertsIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ focused }) => <SettingsIcon size={22} color={focused ? Colors.neon : Colors.text.tertiary} />,
        }}
      />
    </Tabs>
    </>
  );
}

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showAddOptions, setShowAddOptions] = useState(false);
  const { triggerBlackout } = useTransition();
  const { t } = useTranslation();
  const lastTabRef = useRef(state.index);

  const handleManualEntry = () => {
    lightTap();
    setShowAddOptions(false);
    // Trigger blackout for modal navigation
    triggerBlackout(() => {
      router.push('/(modals)/add-expense');
    });
  };

  const handleOCRScan = () => {
    lightTap();
    setShowAddOptions(false);
    // Trigger blackout for modal navigation
    triggerBlackout(() => {
      router.push('/(modals)/camera');
    });
  };

  return (
    <>
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

            // Skip hidden tabs (transactions is embedded in Home)
            if ((options as any).href === null || route.name === 'transactions') return null;

            // Special handling for ADD tab
            const isAddTab = route.name === 'add';

            const onPress = () => {
              if (isAddTab) {
                setShowAddOptions(true);
                return;
              }
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                // Fade through black - app identity
                triggerBlackout(() => {
                  navigation.navigate(route.name);
                });
              }
            };

            // Render AnimatedAddButton for ADD tab
            if (isAddTab) {
              return (
                <View key={route.key} style={styles.addButtonContainer}>
                  <AnimatedAddButton
                    size={44}
                    onPress={() => {
                      modalFeedback();
                      setShowAddOptions(true);
                    }}
                  />
                </View>
              );
            }

            return (
              <TabButton
                key={route.key}
                label={label}
                icon={options.tabBarIcon?.({ focused: isFocused, color: isFocused ? Colors.neon : Colors.text.tertiary, size: 22 })}
                focused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>

      {/* Add Options Bottom Sheet */}
      <Modal
        visible={showAddOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddOptions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddOptions(false)}
        >
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={[Colors.darker, Colors.void]}
              style={styles.bottomSheetGradient}
            >
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Title */}
              <GradientText variant="bright" style={styles.sheetTitle}>
                {t('dashboard.addTransaction')}
              </GradientText>

              {/* Options - Horizontal Layout */}
              <View style={styles.optionsContainerHorizontal}>

                {/* Manual Entry Option */}
                <Pressable
                  style={styles.optionButtonHorizontal}
                  onPress={handleManualEntry}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  android_ripple={{ color: Colors.transparent.neon30, borderless: false }}
                >
                  <View style={styles.optionIconContainerLarge}>
                    <LinearGradient
                      colors={[Colors.transparent.neon10, Colors.transparent.neon05, Colors.transparent.darker60]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconGradientBackground}
                    >
                      <EditIcon size={70} color={Colors.neon} />
                    </LinearGradient>
                    {/* Reflection shine effect */}
                    <ReflectionOverlay delay={0} />
                  </View>
                  <GradientText variant="bright" style={styles.optionLabelHorizontal}>
                    {t('dashboard.manualEntry')}
                  </GradientText>
                </Pressable>

                {/* OCR Scan Option */}
                <Pressable
                  style={styles.optionButtonHorizontal}
                  onPress={handleOCRScan}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  android_ripple={{ color: Colors.transparent.neon30, borderless: false }}
                >
                  <View style={styles.optionIconContainerLarge}>
                    <LinearGradient
                      colors={[Colors.transparent.neon10, Colors.transparent.neon05, Colors.transparent.darker60]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconGradientBackground}
                    >
                      <ScanIcon size={70} color={Colors.neon} />
                    </LinearGradient>
                    {/* Reflection shine effect (delayed) */}
                    <ReflectionOverlay delay={400} />
                  </View>
                  <GradientText variant="bright" style={styles.optionLabelHorizontal}>
                    {t('dashboard.scanReceipt')}
                  </GradientText>
                </Pressable>

              </View>

              {/* Cancel Button */}
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowAddOptions(false)}
              >
                <GradientText variant="muted" style={styles.cancelText}>
                  {t('common.cancel')}
                </GradientText>
              </Pressable>

            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const TabButton = memo(function TabButton({ label, icon, focused, onPress }: { label: string; icon: React.ReactNode; focused: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (focused) {
      glowOpacity.value = withTiming(1, { duration: 250 });
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { lightTap(); scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={styles.tabButton}
    >
      {/* Soft glow behind icon */}
      <Animated.View style={[styles.iconGlow, glowStyle]} />
      <Animated.View style={iconStyle}>{icon}</Animated.View>
      <GradientNavLabel active={focused} style={styles.tabLabel}>{label}</GradientNavLabel>
    </Pressable>
  );
});

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
  addButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  // Subtle glow behind active icon (shadow only, no visible shape)
  iconGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    top: 6,
  },
  tabLabel: {
    marginTop: Spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  bottomSheetGradient: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.deep,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  // Horizontal layout styles
  optionsContainerHorizontal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    paddingHorizontal: Spacing.lg,
  },
  optionButtonHorizontal: {
    alignItems: 'center',
    width: 140,
  },
  optionIconContainerLarge: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: Colors.transparent.darker80,
    borderWidth: 1,
    borderColor: Colors.transparent.neon30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Subtle shadow/glow
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGradientBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabelHorizontal: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  // Reflection animation styles
  reflectionOverlay: {
    position: 'absolute',
    top: -50,
    width: 50,
    height: 220,
  },
  reflectionGradient: {
    width: '100%',
    height: '100%',
  },
  cancelButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  // Auth guard loading container
  authGuardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
