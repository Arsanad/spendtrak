/**
 * FlareEffect - Cinematic Lens Flare Animation
 *
 * Features:
 * - Main bright flare spot
 * - Secondary flare elements (hexagons, circles)
 * - Horizontal streak
 * - Moves across screen during logo reveal
 * - Smooth fade in/out
 */

import React, { memo, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  cancelAnimation,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { FLARE_CONFIG, COLORS, TIMING } from './constants';
import { easeOutCubic, easeInOutCubic } from '../../../config/easingFunctions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Main flare spot component
const MainFlare: React.FC<{
  translateX: SharedValue<number>;
  opacity: SharedValue<number>;
}> = memo(({ translateX, opacity }) => {
  const flareStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.mainFlare, flareStyle]}>
      {/* Core bright spot */}
      <View style={styles.flareCore} />
      {/* Outer glow */}
      <View style={styles.flareGlow} />
      {/* Extra large soft glow */}
      <View style={styles.flareSoftGlow} />
    </Animated.View>
  );
});

// Secondary flare element
const SecondaryFlare: React.FC<{
  offsetRatio: number; // Position relative to main flare (0-1)
  size: number;
  opacity: number;
  translateX: SharedValue<number>;
  mainOpacity: SharedValue<number>;
}> = memo(({ offsetRatio, size, opacity, translateX, mainOpacity }) => {
  const flareStyle = useAnimatedStyle(() => {
    // Secondary flares move opposite to main flare
    const x = translateX.value * offsetRatio;
    return {
      transform: [{ translateX: x }],
      opacity: mainOpacity.value * opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.secondaryFlare,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        flareStyle,
      ]}
    />
  );
});

// Horizontal streak/anamorphic flare
const HorizontalStreak: React.FC<{
  translateX: SharedValue<number>;
  opacity: SharedValue<number>;
}> = memo(({ translateX, opacity }) => {
  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value * 0.6,
  }));

  return (
    <Animated.View style={[styles.streak, streakStyle]} />
  );
});

// Hexagonal flare element
const HexFlare: React.FC<{
  offsetRatio: number;
  size: number;
  translateX: SharedValue<number>;
  mainOpacity: SharedValue<number>;
}> = memo(({ offsetRatio, size, translateX, mainOpacity }) => {
  const hexStyle = useAnimatedStyle(() => {
    const x = translateX.value * offsetRatio;
    return {
      transform: [
        { translateX: x },
        { rotate: '30deg' },
      ],
      opacity: mainOpacity.value * 0.3,
    };
  });

  return (
    <Animated.View
      style={[
        styles.hexFlare,
        {
          width: size,
          height: size * 0.866, // Hexagon ratio
          borderRadius: size * 0.1,
        },
        hexStyle,
      ]}
    />
  );
});

export interface FlareEffectProps {
  phase: number;
}

export const FlareEffect: React.FC<FlareEffectProps> = memo(({ phase }) => {
  const translateX = useSharedValue<number>(FLARE_CONFIG.startX);
  const opacity = useSharedValue<number>(0);

  useEffect(() => {
    // Flare starts during logo reveal (phase 3)
    if (phase >= 3) {
      const delay = TIMING.flareStart - TIMING.phase3Start;

      // Fade in
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(FLARE_CONFIG.opacity, { duration: 200, easing: easeOutCubic }),
          withDelay(TIMING.flareDuration - 400, withTiming(0, { duration: 200 }))
        )
      );

      // Move across screen
      translateX.value = withDelay(
        delay,
        withTiming(FLARE_CONFIG.endX, {
          duration: TIMING.flareDuration,
          easing: easeInOutCubic,
        })
      );
    }

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(opacity);
    };
  }, [phase]);

  // Container opacity
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 3) {
      containerOpacity.value = withDelay(
        TIMING.flareStart - TIMING.phase3Start,
        withTiming(1, { duration: 100 })
      );
    }
    if (phase >= 5) {
      containerOpacity.value = withTiming(0, { duration: 300 });
    }

    return () => cancelAnimation(containerOpacity);
  }, [phase]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (!FLARE_CONFIG.enabled || phase < 3) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Horizontal streak */}
      <HorizontalStreak translateX={translateX} opacity={opacity} />

      {/* Secondary flares (opposite side of screen) */}
      <SecondaryFlare
        offsetRatio={-0.3}
        size={20}
        opacity={0.4}
        translateX={translateX}
        mainOpacity={opacity}
      />
      <SecondaryFlare
        offsetRatio={-0.5}
        size={12}
        opacity={0.3}
        translateX={translateX}
        mainOpacity={opacity}
      />
      <SecondaryFlare
        offsetRatio={-0.7}
        size={30}
        opacity={0.2}
        translateX={translateX}
        mainOpacity={opacity}
      />

      {/* Hexagonal flares */}
      <HexFlare offsetRatio={-0.4} size={25} translateX={translateX} mainOpacity={opacity} />
      <HexFlare offsetRatio={-0.6} size={15} translateX={translateX} mainOpacity={opacity} />

      {/* Main flare */}
      <MainFlare translateX={translateX} opacity={opacity} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainFlare: {
    position: 'absolute',
    top: FLARE_CONFIG.y - FLARE_CONFIG.size / 2,
    width: FLARE_CONFIG.size,
    height: FLARE_CONFIG.size,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flareCore: {
    position: 'absolute',
    width: FLARE_CONFIG.size * 0.15,
    height: FLARE_CONFIG.size * 0.15,
    borderRadius: FLARE_CONFIG.size * 0.075,
    backgroundColor: '#ffffff',
  },
  flareGlow: {
    position: 'absolute',
    width: FLARE_CONFIG.size * 0.5,
    height: FLARE_CONFIG.size * 0.5,
    borderRadius: FLARE_CONFIG.size * 0.25,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
  },
  flareSoftGlow: {
    position: 'absolute',
    width: FLARE_CONFIG.size,
    height: FLARE_CONFIG.size,
    borderRadius: FLARE_CONFIG.size / 2,
    backgroundColor: COLORS.glowSubtle,
    opacity: 0.3,
  },
  secondaryFlare: {
    position: 'absolute',
    top: FLARE_CONFIG.y,
    backgroundColor: COLORS.accent,
  },
  hexFlare: {
    position: 'absolute',
    top: FLARE_CONFIG.y,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  streak: {
    position: 'absolute',
    top: FLARE_CONFIG.y - 1,
    left: -SCREEN_WIDTH,
    width: SCREEN_WIDTH * 3,
    height: 2,
    backgroundColor: COLORS.glowStrong,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});

export default FlareEffect;
