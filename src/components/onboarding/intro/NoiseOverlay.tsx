/**
 * NoiseOverlay - Premium Animated Digital Noise Effect
 *
 * Features:
 * - Animated grain/static texture
 * - Subtle green tint like old CRT
 * - Flicker effect for authenticity
 * - Performant implementation using opacity shifts
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { COLORS, TIMING } from './constants';

// Generate static noise pattern positions (computed once)
const generateNoiseGrid = (count: number) => {
  const grid = [];
  for (let i = 0; i < count; i++) {
    grid.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      baseOpacity: 0.1 + Math.random() * 0.2,
    });
  }
  return grid;
};

// Single noise dot that flickers
const NoiseDot: React.FC<{
  left: string;
  top: string;
  size: number;
  baseOpacity: number;
  flickerOffset: number;
}> = memo(({ left, top, size, baseOpacity, flickerOffset }) => {
  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    // Random flicker pattern
    opacity.value = withRepeat(
      withSequence(
        withTiming(baseOpacity * 0.3, { duration: 50 + flickerOffset }),
        withTiming(baseOpacity, { duration: 80 + flickerOffset }),
        withTiming(baseOpacity * 0.6, { duration: 60 + flickerOffset }),
        withTiming(baseOpacity, { duration: 70 + flickerOffset })
      ),
      -1,
      true
    );

    return () => cancelAnimation(opacity);
  }, [baseOpacity, flickerOffset]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.noiseDot,
        {
          left: left as any,
          top: top as any,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        dotStyle,
      ]}
    />
  );
});

// Scanline overlay for CRT effect
const ScanlineOverlay: React.FC<{
  visible: boolean;
}> = memo(({ visible }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(0.03, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
    }

    return () => cancelAnimation(opacity);
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.scanlineOverlay, overlayStyle]} />;
});

export interface NoiseOverlayProps {
  visible: boolean;
  intensity?: number;
  phase?: number;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = memo(({
  visible,
  intensity = 0.04,
  phase = 1,
}) => {
  // Generate noise grid once
  const noiseGrid = useMemo(() => generateNoiseGrid(40), []);

  // Main container opacity
  const containerOpacity = useSharedValue(0);

  // Green tint overlay
  const tintOpacity = useSharedValue(0);

  // Flicker effect for the whole overlay
  const flickerOpacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Fade in
      containerOpacity.value = withTiming(intensity, { duration: TIMING.noiseIn });

      // Green tint
      tintOpacity.value = withTiming(0.015, { duration: 400 });

      // Subtle flicker
      flickerOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0.92, { duration: 50 }),
          withTiming(1, { duration: 80 }),
          withTiming(0.95, { duration: 120 })
        ),
        -1,
        true
      );
    } else {
      containerOpacity.value = withTiming(0, { duration: 150 });
      tintOpacity.value = withTiming(0, { duration: 150 });
      cancelAnimation(flickerOpacity);
    }

    return () => {
      cancelAnimation(containerOpacity);
      cancelAnimation(tintOpacity);
      cancelAnimation(flickerOpacity);
    };
  }, [visible, intensity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value * flickerOpacity.value,
  }));

  const tintStyle = useAnimatedStyle(() => ({
    opacity: tintOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base noise layer */}
      <Animated.View style={[styles.noiseLayer, containerStyle]}>
        {noiseGrid.map((dot, i) => (
          <NoiseDot
            key={dot.id}
            left={dot.left}
            top={dot.top}
            size={dot.size}
            baseOpacity={dot.baseOpacity}
            flickerOffset={i * 10}
          />
        ))}
      </Animated.View>

      {/* Green tint overlay */}
      <Animated.View style={[styles.greenTint, tintStyle]} />

      {/* CRT scanline effect */}
      <ScanlineOverlay visible={visible} />

      {/* Vignette effect */}
      <View style={styles.vignette} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  noiseLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  noiseDot: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  greenTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Using a repeating pattern via opacity modulation
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Simulated vignette using border
    borderWidth: 60,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    opacity: 0.5,
  },
});

export default NoiseOverlay;
