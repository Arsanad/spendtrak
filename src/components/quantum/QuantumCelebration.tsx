/**
 * QuantumCelebration
 * Full-screen celebration overlay for major achievements.
 * Triggered by: goal completion, debt payoff, level up, achievement unlocked.
 * Shows a brief celebratory message with particles, then auto-dismisses.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize } from '@/design/cinematic';
import { useQuantumPresenceStore } from '@/stores/quantumPresenceStore';
import { GradientText } from '@/components/ui/GradientText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 12;

// Simple confetti particle
const Particle: React.FC<{ index: number }> = ({ index }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  const particleColor = useMemo(() => {
    const colors = [Colors.neon, Colors.bright, Colors.primary, '#39FF14', '#00e67a'];
    return colors[index % colors.length];
  }, [index]);

  const startX = useMemo(() => (Math.random() - 0.5) * SCREEN_WIDTH * 0.8, []);

  useEffect(() => {
    const delay = index * 80;

    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(2000, withTiming(0, { duration: 800 })),
    ));

    translateY.value = withDelay(delay,
      withTiming(-SCREEN_HEIGHT * 0.3 - Math.random() * 200, {
        duration: 2500,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateX.value = withDelay(delay,
      withTiming(startX + (Math.random() - 0.5) * 100, {
        duration: 2500,
        easing: Easing.out(Easing.cubic),
      })
    );

    rotate.value = withDelay(delay,
      withRepeat(withTiming(360, { duration: 1500 }), 2, false)
    );

    scale.value = withDelay(delay,
      withSequence(
        withSpring(1, { damping: 8 }),
        withDelay(1500, withTiming(0, { duration: 500 })),
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: particleColor },
        animatedStyle,
      ]}
    />
  );
};

export const QuantumCelebration: React.FC = () => {
  const activeCelebration = useQuantumPresenceStore((s) => s.activeCelebration);
  const dismissCelebration = useQuantumPresenceStore((s) => s.dismissCelebration);

  const overlayOpacity = useSharedValue(0);
  const messageScale = useSharedValue(0.5);
  const messageOpacity = useSharedValue(0);

  useEffect(() => {
    if (activeCelebration) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      messageScale.value = withSpring(1, { damping: 12, stiffness: 150 });
      messageOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      messageScale.value = withTiming(0.5, { duration: 200 });
      messageOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [activeCelebration]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const messageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: messageScale.value }],
    opacity: messageOpacity.value,
  }));

  if (!activeCelebration) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="box-only">
      <Pressable style={styles.pressArea} onPress={dismissCelebration}>
        {/* Particles */}
        <View style={styles.particleContainer}>
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}
        </View>

        {/* Message */}
        <Animated.View style={[styles.messageContainer, messageStyle]}>
          <GradientText variant="bright" style={styles.celebrationMessage}>
            {activeCelebration.message}
          </GradientText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.transparent.black70,
    zIndex: 10000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messageContainer: {
    paddingHorizontal: 40,
  },
  celebrationMessage: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h2,
    textAlign: 'center',
    // Glow effect
    textShadowColor: Colors.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});

export default QuantumCelebration;
