/**
 * GlitchLogo - Premium Cinematic Glitch Assembly
 *
 * Features:
 * - Aggressive RGB chromatic aberration (5-10px offset)
 * - Horizontal slice glitch effect
 * - Digital corruption squares
 * - Hologram scan lines
 * - Multiple glitch bursts
 * - Scale animation 0.5 -> 1.0
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  cancelAnimation,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { GLITCH_CONFIG, COLORS, TIMING } from './constants';
import { easeOutExpo, easeOutCubic, easeInOutCubic } from '../../../config/easingFunctions';

const { logoSize, sliceCount, rgbOffsetMin, rgbOffsetMax, corruptionCount, burstCount, burstIntensity } = GLITCH_CONFIG;

// Generate slice data
interface SliceData {
  id: number;
  top: number;
  height: number;
  direction: 'left' | 'right';
}

const generateSlices = (): SliceData[] => {
  const sliceHeight = logoSize / sliceCount;
  return Array.from({ length: sliceCount }, (_, i) => ({
    id: i,
    top: i * sliceHeight,
    height: sliceHeight + 1,
    direction: i % 2 === 0 ? 'left' : 'right',
  }));
};

// Generate corruption square data
interface CorruptionData {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

const generateCorruption = (): CorruptionData[] => {
  const colors = [COLORS.primary, COLORS.secondary, COLORS.rgbRed, COLORS.rgbBlue, COLORS.rgbCyan];
  return Array.from({ length: corruptionCount }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * logoSize * 1.5,
    y: (Math.random() - 0.5) * logoSize * 1.5,
    size: GLITCH_CONFIG.corruptionMinSize + Math.random() * (GLITCH_CONFIG.corruptionMaxSize - GLITCH_CONFIG.corruptionMinSize),
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 600,
  }));
};

// Horizontal slice component
const LogoSlice: React.FC<{
  slice: SliceData;
  phase: number;
  glitchIntensity: SharedValue<number>;
}> = memo(({ slice, phase, glitchIntensity }) => {
  const offsetX = useSharedValue(slice.direction === 'left' ? -80 : 80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 3) {
      const delay = slice.id * TIMING.sliceStagger;

      offsetX.value = withDelay(
        delay,
        withTiming(0, { duration: 250, easing: easeOutExpo })
      );
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 150 })
      );
    }

    return () => {
      cancelAnimation(offsetX);
      cancelAnimation(opacity);
    };
  }, [phase]);

  const style = useAnimatedStyle(() => {
    // Add glitch offset during bursts
    const glitchOffset = (slice.direction === 'left' ? -1 : 1) *
      glitchIntensity.value * GLITCH_CONFIG.maxSliceOffset * (slice.id % 3 === 0 ? 1 : 0.5);

    return {
      transform: [{ translateX: offsetX.value + glitchOffset }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.sliceContainer,
        { top: slice.top, height: slice.height },
        style,
      ]}
    >
      <View style={[styles.sliceClip, { top: -slice.top }]}>
        <Image
          source={require('../../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
});

// Corruption square component
const CorruptionSquare: React.FC<{
  data: CorruptionData;
  phase: number;
}> = memo(({ data, phase }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (phase >= 3) {
      opacity.value = withDelay(
        data.delay,
        withSequence(
          withTiming(0.9, { duration: 50 }),
          withTiming(0, { duration: 150 }),
          withDelay(200, withSequence(
            withTiming(0.7, { duration: 30 }),
            withTiming(0, { duration: 100 })
          ))
        )
      );
      scale.value = withDelay(
        data.delay,
        withSequence(
          withTiming(1, { duration: 50 }),
          withTiming(0.8, { duration: 150 })
        )
      );
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [phase]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.corruption,
        {
          left: data.x + logoSize / 2,
          top: data.y + logoSize / 2,
          width: data.size,
          height: data.size,
          backgroundColor: data.color,
        },
        style,
      ]}
    />
  );
});

// Hologram scan line
const HologramLine: React.FC<{
  index: number;
  phase: number;
}> = memo(({ index, phase }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (phase >= 3) {
      opacity.value = withDelay(
        300,
        withTiming(GLITCH_CONFIG.scanLineOpacity, { duration: 200 })
      );
      translateY.value = withRepeat(
        withTiming(logoSize, { duration: 2000 + index * 200, easing: Easing.linear }),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [phase]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value % logoSize }],
  }));

  const lineHeight = logoSize / GLITCH_CONFIG.scanLineCount;

  return (
    <Animated.View
      style={[
        styles.hologramLine,
        {
          top: index * lineHeight,
          height: 1,
        },
        style,
      ]}
    />
  );
});

export interface GlitchLogoProps {
  phase: number;
}

export const GlitchLogo: React.FC<GlitchLogoProps> = memo(({ phase }) => {
  const slices = useMemo(() => generateSlices(), []);
  const corruption = useMemo(() => generateCorruption(), []);

  // Main animations
  const containerOpacity = useSharedValue<number>(0);
  const containerScale = useSharedValue<number>(GLITCH_CONFIG.startScale);

  // RGB split
  const redOffsetX = useSharedValue(0);
  const blueOffsetX = useSharedValue(0);
  const rgbOpacity = useSharedValue(0);

  // Glitch intensity for bursts
  const glitchIntensity = useSharedValue(0);

  // Glow
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (phase >= 3) {
      // Container fade & scale
      containerOpacity.value = withTiming(1, { duration: 200 });
      containerScale.value = withTiming(GLITCH_CONFIG.endScale, {
        duration: TIMING.phase3Duration,
        easing: easeOutCubic,
      });

      // Initial RGB split
      rgbOpacity.value = withSequence(
        withTiming(0.7, { duration: 100 }),
        withTiming(0.4, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );

      redOffsetX.value = withSequence(
        withTiming(-rgbOffsetMax, { duration: 100 }),
        withTiming(-rgbOffsetMin, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );

      blueOffsetX.value = withSequence(
        withTiming(rgbOffsetMax, { duration: 100 }),
        withTiming(rgbOffsetMin, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );

      // Multiple glitch bursts
      burstIntensity.forEach((intensity, i) => {
        setTimeout(() => {
          glitchIntensity.value = withSequence(
            withTiming(intensity, { duration: 40 }),
            withTiming(0, { duration: 80 })
          );

          // RGB burst during glitch
          rgbOpacity.value = withSequence(
            withTiming(intensity * 0.6, { duration: 40 }),
            withTiming(0, { duration: 100 })
          );
          redOffsetX.value = withSequence(
            withTiming(-rgbOffsetMax * intensity, { duration: 40 }),
            withTiming(0, { duration: 100 })
          );
          blueOffsetX.value = withSequence(
            withTiming(rgbOffsetMax * intensity, { duration: 40 }),
            withTiming(0, { duration: 100 })
          );
        }, i * TIMING.glitchBurstInterval + 200);
      });

      // Glow effect
      glowOpacity.value = withDelay(
        400,
        withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(0.4, { duration: 400 })
        )
      );
      glowScale.value = withDelay(
        400,
        withSequence(
          withTiming(1.3, { duration: 300 }),
          withTiming(1.1, { duration: 400 })
        )
      );
    }

    return () => {
      cancelAnimation(containerOpacity);
      cancelAnimation(containerScale);
      cancelAnimation(redOffsetX);
      cancelAnimation(blueOffsetX);
      cancelAnimation(rgbOpacity);
      cancelAnimation(glitchIntensity);
      cancelAnimation(glowOpacity);
      cancelAnimation(glowScale);
    };
  }, [phase]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const redStyle = useAnimatedStyle(() => ({
    opacity: rgbOpacity.value,
    transform: [{ translateX: redOffsetX.value }],
  }));

  const blueStyle = useAnimatedStyle(() => ({
    opacity: rgbOpacity.value,
    transform: [{ translateX: blueOffsetX.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  if (phase < 3) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.View style={[styles.innerContainer, logoWrapperStyle]}>
        {/* Glow layers */}
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <View style={styles.glowOuter} />
          <View style={styles.glowMiddle} />
          <View style={styles.glowInner} />
        </Animated.View>

        {/* RGB split - red channel */}
        <Animated.View style={[styles.rgbLayer, redStyle]}>
          <Image
            source={require('../../../../assets/logo.png')}
            style={[styles.logo, { tintColor: COLORS.rgbRed }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* RGB split - blue channel */}
        <Animated.View style={[styles.rgbLayer, blueStyle]}>
          <Image
            source={require('../../../../assets/logo.png')}
            style={[styles.logo, { tintColor: COLORS.rgbBlue }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Sliced logo */}
        <View style={styles.slicesWrapper}>
          {slices.map((slice) => (
            <LogoSlice
              key={slice.id}
              slice={slice}
              phase={phase}
              glitchIntensity={glitchIntensity}
            />
          ))}
        </View>

        {/* Hologram scan lines */}
        <View style={styles.hologramContainer}>
          {Array.from({ length: GLITCH_CONFIG.scanLineCount }).map((_, i) => (
            <HologramLine key={i} index={i} phase={phase} />
          ))}
        </View>

        {/* Corruption squares */}
        {corruption.map((c) => (
          <CorruptionSquare key={c.id} data={c} phase={phase} />
        ))}
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  innerContainer: {
    width: logoSize,
    height: logoSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slicesWrapper: {
    width: logoSize,
    height: logoSize,
    overflow: 'hidden',
  },
  sliceContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  sliceClip: {
    position: 'absolute',
    left: 0,
    width: logoSize,
    height: logoSize,
  },
  logo: {
    width: logoSize,
    height: logoSize,
  },
  rgbLayer: {
    position: 'absolute',
    width: logoSize,
    height: logoSize,
  },
  glowContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: logoSize * 2.5,
    height: logoSize * 2.5,
    borderRadius: logoSize * 1.25,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
  },
  glowMiddle: {
    position: 'absolute',
    width: logoSize * 1.8,
    height: logoSize * 1.8,
    borderRadius: logoSize * 0.9,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  glowInner: {
    position: 'absolute',
    width: logoSize * 1.3,
    height: logoSize * 1.3,
    borderRadius: logoSize * 0.65,
    backgroundColor: COLORS.primary,
    opacity: 0.25,
  },
  hologramContainer: {
    position: 'absolute',
    width: logoSize,
    height: logoSize,
    overflow: 'hidden',
  },
  hologramLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
  },
  corruption: {
    position: 'absolute',
  },
});

export default GlitchLogo;
