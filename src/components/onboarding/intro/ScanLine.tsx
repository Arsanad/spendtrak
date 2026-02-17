/**
 * ScanLine - Premium Multiple Scan Lines with Grid Effect
 *
 * Features:
 * - 3 horizontal scan lines with different speeds
 * - Glowing effect on each line
 * - Subtle grid overlay effect
 * - Staggered timing for depth
 */

import React, { memo, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { SCANLINE_CONFIG, COLORS, TIMING, DIMENSIONS as DIMS } from './constants';
import { easeInOutCubic } from '../../../config/easingFunctions';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Individual scan line component
const SingleScanLine: React.FC<{
  index: number;
  phase: number;
  speed: number;
  baseOpacity: number;
}> = memo(({ index, phase, speed, baseOpacity }) => {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.6);

  useEffect(() => {
    if (phase >= 1) {
      const delay = TIMING.scanLineStart + index * 150;

      // Start above screen
      translateY.value = -20;

      // Sweep down
      translateY.value = withDelay(
        delay,
        withTiming(SCREEN_HEIGHT + 20, {
          duration: TIMING.scanLineDuration / speed,
          easing: easeInOutCubic,
        })
      );

      // Fade in
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(baseOpacity, { duration: 50 }),
          withDelay(TIMING.scanLineDuration / speed - 150, withTiming(0, { duration: 100 }))
        )
      );

      // Glow pulse
      glowPulse.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0.6, { duration: 100 })
          ),
          Math.floor((TIMING.scanLineDuration / speed) / 200),
          true
        )
      );
    }

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(glowPulse);
    };
  }, [phase, index, speed, baseOpacity]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    shadowOpacity: glowPulse.value,
  }));

  return (
    <Animated.View style={[styles.scanLine, lineStyle]}>
      <View style={styles.lineCore} />
      <View style={styles.lineGlowTop} />
      <View style={styles.lineGlowBottom} />
    </Animated.View>
  );
});

// Grid line component
const GridLine: React.FC<{
  index: number;
  isHorizontal: boolean;
  phase: number;
}> = memo(({ index, isHorizontal, phase }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 1 && SCANLINE_CONFIG.gridEnabled) {
      opacity.value = withDelay(
        200 + index * 30,
        withSequence(
          withTiming(SCANLINE_CONFIG.gridOpacity, { duration: 300 }),
          withDelay(TIMING.phase1Duration - 500, withTiming(0, { duration: 200 }))
        )
      );
    }

    return () => cancelAnimation(opacity);
  }, [phase, index]);

  const gridStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (isHorizontal) {
    const spacing = SCREEN_HEIGHT / SCANLINE_CONFIG.gridLineCount;
    return (
      <Animated.View
        style={[
          styles.gridLine,
          styles.gridLineHorizontal,
          { top: index * spacing },
          gridStyle,
        ]}
      />
    );
  } else {
    const spacing = SCREEN_WIDTH / SCANLINE_CONFIG.gridLineCount;
    return (
      <Animated.View
        style={[
          styles.gridLine,
          styles.gridLineVertical,
          { left: index * spacing },
          gridStyle,
        ]}
      />
    );
  }
});

export interface ScanLineProps {
  visible: boolean;
  phase?: number;
}

export const ScanLine: React.FC<ScanLineProps> = memo(({ visible, phase = 1 }) => {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Grid effect */}
      {SCANLINE_CONFIG.gridEnabled && (
        <>
          {Array.from({ length: SCANLINE_CONFIG.gridLineCount }).map((_, i) => (
            <GridLine key={`h-${i}`} index={i} isHorizontal={true} phase={phase} />
          ))}
          {Array.from({ length: SCANLINE_CONFIG.gridLineCount }).map((_, i) => (
            <GridLine key={`v-${i}`} index={i} isHorizontal={false} phase={phase} />
          ))}
        </>
      )}

      {/* Multiple scan lines */}
      {SCANLINE_CONFIG.horizontalSpeeds.map((speed, i) => (
        <SingleScanLine
          key={i}
          index={i}
          phase={phase}
          speed={speed}
          baseOpacity={SCANLINE_CONFIG.horizontalOpacities[i]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: SCANLINE_CONFIG.glowRadius,
    elevation: 5,
  },
  lineCore: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.primary,
  },
  lineGlowTop: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
  },
  lineGlowBottom: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
  },
  gridLineHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
});

export default ScanLine;
