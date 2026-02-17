/**
 * QuantumToast
 * A subtle pill-shaped toast that slides in from the top.
 * Shows Quantum's micro-responses to user actions.
 * Auto-dismisses after duration. Tap to dismiss early.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize } from '@/design/cinematic';
import { useQuantumPresenceStore } from '@/stores/quantumPresenceStore';
import { GradientText } from '@/components/ui/GradientText';

export const QuantumToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const activeToast = useQuantumPresenceStore((s) => s.activeToast);
  const dismissToast = useQuantumPresenceStore((s) => s.dismissToast);

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (activeToast) {
      // Slide in
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      // Slide out
      translateY.value = withSpring(-100, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [activeToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!activeToast) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8 },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.pill}
        onPress={dismissToast}
        accessibilityRole="alert"
        accessibilityLabel={activeToast.message}
      >
        <GradientText variant="bright" style={styles.message}>
          {activeToast.message}
        </GradientText>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  pill: {
    backgroundColor: Colors.transparent.darker80,
    borderWidth: 1,
    borderColor: Colors.transparent.neon20,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    // Subtle glow
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
});

export default QuantumToast;
