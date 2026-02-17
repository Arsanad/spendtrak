/**
 * TypewriterTitle - Premium Typewriter Text Reveal
 *
 * Features:
 * - Letter-by-letter reveal with glow flash
 * - Camera shake on each letter
 * - Blinking cursor during typing
 * - Blur-to-sharp tagline
 * - Final glitch effect
 * - Vintage random vertical offset
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { TEXT_CONFIG, COLORS, TIMING } from './constants';
import { Colors, FontFamily } from '../../../design/cinematic';
import { easeOutExpo, easeOutCubic, easeInOutCubic } from '../../../config/easingFunctions';

const { title, tagline, letterGlowRadius, shakeIntensity, shakeDuration, maxVerticalOffset } = TEXT_CONFIG;

// Individual letter component with glow effect
const AnimatedLetter: React.FC<{
  letter: string;
  index: number;
  phase: number;
  totalLetters: number;
  onReveal: () => void;
}> = memo(({ letter, index, phase, totalLetters, onReveal }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const glowIntensity = useSharedValue(0);
  const verticalOffset = useMemo(() => (Math.random() - 0.5) * maxVerticalOffset * 2, []);

  useEffect(() => {
    if (phase >= 5) {
      const delay = index * TIMING.letterInterval;

      // Reveal animation
      opacity.value = withDelay(delay, withTiming(1, { duration: 80 }));

      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.3, { duration: 80, easing: easeOutExpo }),
          withTiming(1, { duration: 120, easing: easeOutCubic })
        )
      );

      // Glow flash
      glowIntensity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0.3, { duration: TIMING.letterGlowDuration })
        )
      );

      // Trigger reveal callback
      setTimeout(() => onReveal(), delay + 40);
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(glowIntensity);
    };
  }, [phase, index, onReveal]);

  const letterStyle = useAnimatedStyle(() => {
    const glowRadius = interpolate(glowIntensity.value, [0, 1], [0, letterGlowRadius]);

    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: verticalOffset },
      ],
      textShadowRadius: glowRadius,
      textShadowColor: COLORS.primary,
    };
  });

  return (
    <Animated.Text style={[styles.letter, letterStyle]}>
      {letter}
    </Animated.Text>
  );
});

// Blinking cursor component
const Cursor: React.FC<{
  visible: boolean;
  position: number;
}> = memo(({ visible, position }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: TIMING.cursorBlinkInterval / 2 }),
          withTiming(0, { duration: TIMING.cursorBlinkInterval / 2 })
        ),
        -1,
        false
      );
    } else {
      opacity.value = withTiming(0, { duration: 100 });
    }

    return () => cancelAnimation(opacity);
  }, [visible]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.cursor, cursorStyle]} />
  );
});

// Tagline with blur-to-sharp effect
const Tagline: React.FC<{
  phase: number;
}> = memo(({ phase }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.15);
  const translateY = useSharedValue(15);

  useEffect(() => {
    if (phase >= 5) {
      const delay = title.length * TIMING.letterInterval + 200;

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 500, easing: easeOutCubic })
      );

      scale.value = withDelay(
        delay,
        withTiming(1, { duration: 500, easing: easeOutCubic })
      );

      translateY.value = withDelay(
        delay,
        withTiming(0, { duration: 500, easing: easeOutCubic })
      );
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(translateY);
    };
  }, [phase]);

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.taglineContainer, taglineStyle]}>
      <Text style={styles.tagline}>{tagline}</Text>
    </Animated.View>
  );
});

export interface TypewriterTitleProps {
  phase: number;
}

export const TypewriterTitle: React.FC<TypewriterTitleProps> = memo(({ phase }) => {
  const letters = useMemo(() => title.split(''), []);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Container shake
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  // Final glitch
  const glitchX = useSharedValue(0);
  const glitchOpacity = useSharedValue(1);

  const handleLetterReveal = () => {
    setRevealedCount((prev) => prev + 1);

    // Camera shake on each letter
    shakeX.value = withSequence(
      withTiming(shakeIntensity, { duration: shakeDuration / 4 }),
      withTiming(-shakeIntensity, { duration: shakeDuration / 4 }),
      withTiming(shakeIntensity / 2, { duration: shakeDuration / 4 }),
      withTiming(0, { duration: shakeDuration / 4 })
    );

    shakeY.value = withSequence(
      withTiming(-shakeIntensity / 2, { duration: shakeDuration / 4 }),
      withTiming(shakeIntensity / 2, { duration: shakeDuration / 4 }),
      withTiming(0, { duration: shakeDuration / 2 })
    );
  };

  useEffect(() => {
    if (phase >= 5) {
      // Hide cursor after all letters revealed
      const cursorTimeout = setTimeout(() => {
        setShowCursor(false);
      }, letters.length * TIMING.letterInterval + 300);

      // Final glitch effect
      const glitchTimeout = setTimeout(() => {
        glitchX.value = withSequence(
          withTiming(8, { duration: 30 }),
          withTiming(-6, { duration: 30 }),
          withTiming(4, { duration: 30 }),
          withTiming(0, { duration: 30 })
        );
        glitchOpacity.value = withSequence(
          withTiming(0.5, { duration: 30 }),
          withTiming(1, { duration: 50 }),
          withTiming(0.7, { duration: 30 }),
          withTiming(1, { duration: 50 })
        );
      }, letters.length * TIMING.letterInterval + 100);

      return () => {
        clearTimeout(cursorTimeout);
        clearTimeout(glitchTimeout);
      };
    }
  }, [phase, letters.length]);

  useEffect(() => {
    return () => {
      cancelAnimation(shakeX);
      cancelAnimation(shakeY);
      cancelAnimation(glitchX);
      cancelAnimation(glitchOpacity);
    };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value + glitchX.value },
      { translateY: shakeY.value },
    ],
    opacity: glitchOpacity.value,
  }));

  if (phase < 5) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Title with letters */}
      <View style={styles.titleContainer}>
        {letters.map((letter, index) => (
          <AnimatedLetter
            key={`${letter}-${index}`}
            letter={letter}
            index={index}
            phase={phase}
            totalLetters={letters.length}
            onReveal={handleLetterReveal}
          />
        ))}
        <Cursor visible={showCursor && revealedCount < letters.length} position={revealedCount} />
      </View>

      {/* Tagline */}
      <Tagline phase={phase} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 180,
    zIndex: 25,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letter: {
    fontSize: 34,
    fontFamily: FontFamily.bold,
    color: COLORS.primary,
    letterSpacing: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  cursor: {
    width: TEXT_CONFIG.cursorWidth,
    height: TEXT_CONFIG.cursorHeight,
    backgroundColor: COLORS.primary,
    marginLeft: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  taglineContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.text.tertiary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default TypewriterTitle;
