/**
 * BackgroundGrid - Tron-Style Perspective Grid Animation
 *
 * Features:
 * - Perspective grid lines receding into distance
 * - Subtle pulse/flow animation
 * - Horizontal and vertical lines
 * - Depth-based opacity (farther = dimmer)
 * - Smooth fade in/out with phase
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { GRID_CONFIG, COLORS, TIMING } from './constants';
import { easeOutCubic, easeInOutSine } from '../../../config/easingFunctions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Horizontal perspective line
const HorizontalLine: React.FC<{
  index: number;
  totalLines: number;
  phase: number;
  pulseProgress: SharedValue<number>;
}> = memo(({ index, totalLines, phase, pulseProgress }) => {
  const opacity = useSharedValue(0);

  // Calculate perspective position (lines closer together at horizon)
  const normalizedIndex = index / totalLines;
  const perspectiveY = SCREEN_HEIGHT * 0.5 + (normalizedIndex * SCREEN_HEIGHT * 0.5 * GRID_CONFIG.perspective);
  const lineOpacity = GRID_CONFIG.opacity * (1 - normalizedIndex * 0.6); // Fade with distance

  useEffect(() => {
    if (phase >= 1) {
      opacity.value = withDelay(
        100 + index * 40,
        withTiming(lineOpacity, { duration: 300, easing: easeOutCubic })
      );
    }
    if (phase >= 6) {
      opacity.value = withDelay(200, withTiming(0, { duration: 400 }));
    }

    return () => cancelAnimation(opacity);
  }, [phase, index, lineOpacity]);

  const lineStyle = useAnimatedStyle(() => {
    // Subtle pulse effect
    const pulseOpacity = GRID_CONFIG.pulseEnabled
      ? interpolate(pulseProgress.value, [0, 0.5, 1], [1, 1.3, 1])
      : 1;

    return {
      opacity: opacity.value * pulseOpacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.horizontalLine,
        {
          top: perspectiveY,
          // Scale width for perspective (wider at bottom)
          transform: [{ scaleX: 1 + normalizedIndex * 0.3 }],
        },
        lineStyle,
      ]}
    />
  );
});

// Vertical perspective line
const VerticalLine: React.FC<{
  index: number;
  totalLines: number;
  phase: number;
  pulseProgress: SharedValue<number>;
}> = memo(({ index, totalLines, phase, pulseProgress }) => {
  const opacity = useSharedValue(0);

  // Calculate perspective position (lines converge at center horizon)
  const centerX = SCREEN_WIDTH / 2;
  const normalizedIndex = (index - totalLines / 2) / (totalLines / 2);
  const baseX = centerX + normalizedIndex * (SCREEN_WIDTH / 2);

  // Line angles toward horizon point
  const horizonY = SCREEN_HEIGHT * 0.35;

  useEffect(() => {
    if (phase >= 1) {
      opacity.value = withDelay(
        50 + Math.abs(index - totalLines / 2) * 30,
        withTiming(GRID_CONFIG.opacity * 0.7, { duration: 400 })
      );
    }
    if (phase >= 6) {
      opacity.value = withDelay(200, withTiming(0, { duration: 400 }));
    }

    return () => cancelAnimation(opacity);
  }, [phase, index]);

  const lineStyle = useAnimatedStyle(() => {
    const pulseOpacity = GRID_CONFIG.pulseEnabled
      ? interpolate(pulseProgress.value, [0, 0.5, 1], [1, 1.2, 1])
      : 1;

    return {
      opacity: opacity.value * pulseOpacity,
    };
  });

  // Calculate rotation for perspective
  const rotation = normalizedIndex * 15; // Degrees

  return (
    <Animated.View
      style={[
        styles.verticalLine,
        {
          left: baseX,
          top: horizonY,
          height: SCREEN_HEIGHT - horizonY,
          transform: [
            { rotateZ: `${rotation}deg` },
            { scaleY: 1 + Math.abs(normalizedIndex) * 0.2 },
          ],
          transformOrigin: 'top center',
        },
        lineStyle,
      ]}
    />
  );
});

// Horizon glow line
const HorizonGlow: React.FC<{
  phase: number;
}> = memo(({ phase }) => {
  const opacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (phase >= 1) {
      opacity.value = withDelay(300, withTiming(0.4, { duration: 500 }));
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: easeInOutSine }),
          withTiming(0, { duration: 1500, easing: easeInOutSine })
        ),
        -1,
        true
      );
    }
    if (phase >= 6) {
      opacity.value = withTiming(0, { duration: 400 });
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(glowPulse);
    };
  }, [phase]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * (0.8 + glowPulse.value * 0.2),
    shadowOpacity: 0.5 + glowPulse.value * 0.5,
  }));

  return (
    <Animated.View style={[styles.horizonGlow, glowStyle]} />
  );
});

export interface BackgroundGridProps {
  phase: number;
}

export const BackgroundGrid: React.FC<BackgroundGridProps> = memo(({ phase }) => {
  // Shared pulse animation
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    if (GRID_CONFIG.pulseEnabled && phase >= 1) {
      pulseProgress.value = withRepeat(
        withTiming(1, {
          duration: 2000 / GRID_CONFIG.animationSpeed,
          easing: easeInOutSine,
        }),
        -1,
        true
      );
    }

    return () => cancelAnimation(pulseProgress);
  }, [phase]);

  // Container opacity
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 1) {
      containerOpacity.value = withTiming(1, { duration: 400 });
    }
    if (phase >= 6) {
      containerOpacity.value = withDelay(100, withTiming(0, { duration: 500 }));
    }

    return () => cancelAnimation(containerOpacity);
  }, [phase]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (!GRID_CONFIG.enabled || phase < 1) return null;

  const horizontalLines = Array.from({ length: GRID_CONFIG.lineCount });
  const verticalLines = Array.from({ length: GRID_CONFIG.lineCount + 1 });

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Horizon glow */}
      <HorizonGlow phase={phase} />

      {/* Vertical perspective lines */}
      {verticalLines.map((_, i) => (
        <VerticalLine
          key={`v-${i}`}
          index={i}
          totalLines={GRID_CONFIG.lineCount + 1}
          phase={phase}
          pulseProgress={pulseProgress}
        />
      ))}

      {/* Horizontal perspective lines */}
      {horizontalLines.map((_, i) => (
        <HorizontalLine
          key={`h-${i}`}
          index={i}
          totalLines={GRID_CONFIG.lineCount}
          phase={phase}
          pulseProgress={pulseProgress}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    overflow: 'hidden',
  },
  horizontalLine: {
    position: 'absolute',
    left: -50,
    right: -50,
    height: 1,
    backgroundColor: GRID_CONFIG.color,
  },
  verticalLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: GRID_CONFIG.color,
  },
  horizonGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT * 0.35 - 20,
    height: 40,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 5,
  },
});

export default BackgroundGrid;
