/**
 * QuantumFloatingPresence
 * A subtle breathing dot near the bottom of the screen that shows
 * Quantum is alive and watching. Changes color/pulse based on emotion.
 * This gives the app a heartbeat even when Quantum isn't speaking.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/design/cinematic';
import { useQuantumPresenceStore } from '@/stores/quantumPresenceStore';

const EMOTION_COLORS: Record<string, string> = {
  idle: Colors.deep,
  happy: Colors.neon,
  celebrating: Colors.neon,
  alert: Colors.semantic.warning,
  worried: Colors.semantic.warning,
  encouraging: Colors.primary,
  proud: Colors.bright,
  excited: Colors.neon,
  sad: Colors.deep,
  thinking: Colors.medium,
  sleeping: Colors.dark,
};

export const QuantumFloatingPresence: React.FC = () => {
  const currentEmotion = useQuantumPresenceStore((s) => s.currentEmotion);
  const mode = useQuantumPresenceStore((s) => s.mode);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Breathing animation — the heartbeat
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, []);

  // Pulse brighter when Quantum is speaking (toast/celebration)
  useEffect(() => {
    if (mode === 'toast' || mode === 'celebration') {
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      glowOpacity.value = withTiming(0, { duration: 500 });
    }
  }, [mode]);

  const dotColor = EMOTION_COLORS[currentEmotion] || Colors.deep;

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Glow ring (visible when active) */}
      <Animated.View style={[styles.glow, { borderColor: dotColor }, glowStyle]} />
      {/* Core breathing dot */}
      <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dotStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    alignSelf: 'center',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glow: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default QuantumFloatingPresence;
