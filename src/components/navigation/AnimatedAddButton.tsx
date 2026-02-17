// SPENDTRAK CINEMATIC EDITION - Animated Add Button
// Premium animated button with glow, shine, and sparkle effects

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { easeInOutQuad, easeOutQuad, easeInQuad } from '../../config/easingFunctions';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../design/cinematic';

const AnimatedView = Animated.View;

interface AnimatedAddButtonProps {
  size?: number;
  onPress: () => void;
}

export const AnimatedAddButton: React.FC<AnimatedAddButtonProps> = ({
  size = 48,
  onPress,
}) => {
  // Animation values
  const glowOpacity = useSharedValue(0.6);
  const glowScale = useSharedValue(1);
  const shineRotation = useSharedValue(0);
  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);
  const sparkle3Opacity = useSharedValue(0);
  const sparkle4Opacity = useSharedValue(0);
  const sparkle5Opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Pulsing glow effect - breathes in and out
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750, easing: easeInOutQuad }),
        withTiming(0.5, { duration: 750, easing: easeInOutQuad })
      ),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 750, easing: easeInOutQuad }),
        withTiming(1, { duration: 750, easing: easeInOutQuad })
      ),
      -1,
      true
    );

    // Rotating shine effect - continuous rotation
    shineRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Sparkle animations - staggered timing for natural effect
    const createSparkleAnimation = (delay: number) =>
      withRepeat(
        withSequence(
          withDelay(delay, withTiming(0, { duration: 0 })),
          withTiming(1, { duration: 200, easing: easeOutQuad }),
          withTiming(0, { duration: 400, easing: easeInQuad }),
          withDelay(2000, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      );

    sparkle1Opacity.value = createSparkleAnimation(0);
    sparkle2Opacity.value = createSparkleAnimation(500);
    sparkle3Opacity.value = createSparkleAnimation(1000);
    sparkle4Opacity.value = createSparkleAnimation(1500);
    sparkle5Opacity.value = createSparkleAnimation(2000);
  }, []);

  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shineRotation.value}deg` }],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1Opacity.value,
    transform: [{ scale: interpolate(sparkle1Opacity.value, [0, 1], [0.5, 1]) }],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2Opacity.value,
    transform: [{ scale: interpolate(sparkle2Opacity.value, [0, 1], [0.5, 1]) }],
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3Opacity.value,
    transform: [{ scale: interpolate(sparkle3Opacity.value, [0, 1], [0.5, 1]) }],
  }));

  const sparkle4Style = useAnimatedStyle(() => ({
    opacity: sparkle4Opacity.value,
    transform: [{ scale: interpolate(sparkle4Opacity.value, [0, 1], [0.5, 1]) }],
  }));

  const sparkle5Style = useAnimatedStyle(() => ({
    opacity: sparkle5Opacity.value,
    transform: [{ scale: interpolate(sparkle5Opacity.value, [0, 1], [0.5, 1]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconSize = size * 0.5;
  const sparkleSize = 6;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.9, { duration: 100 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 150 });
      }}
      style={styles.pressable}
    >
      <AnimatedView style={[styles.container, { width: size * 1.5, height: size * 1.5 }, buttonStyle]}>
        {/* Outer glow layer */}
        <AnimatedView style={[styles.glowOuter, glowStyle]}>
          <View style={[styles.glowCircle, { width: size * 1.3, height: size * 1.3, borderRadius: size * 0.65 }]} />
        </AnimatedView>

        {/* Rotating shine effect */}
        <AnimatedView style={[styles.shineContainer, { width: size, height: size }, shineStyle]}>
          <ExpoLinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.shineLine, { width: size * 1.2, height: 3 }]}
          />
        </AnimatedView>

        {/* Main button circle */}
        <View style={[styles.buttonCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <ExpoLinearGradient
            colors={[Colors.neon, Colors.primary, Colors.deep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buttonGradient, { borderRadius: size / 2 }]}
          >
            {/* Plus icon */}
            <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
              <Path
                d="M12 5v14M5 12h14"
                stroke={Colors.void}
                strokeWidth={3}
                strokeLinecap="round"
              />
            </Svg>
          </ExpoLinearGradient>
        </View>

        {/* Sparkle particles */}
        <AnimatedView style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>
          <Sparkle size={sparkleSize} />
        </AnimatedView>
        <AnimatedView style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>
          <Sparkle size={sparkleSize * 0.8} />
        </AnimatedView>
        <AnimatedView style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>
          <Sparkle size={sparkleSize * 0.7} />
        </AnimatedView>
        <AnimatedView style={[styles.sparkle, styles.sparkle4, sparkle4Style]}>
          <Sparkle size={sparkleSize * 0.9} />
        </AnimatedView>
        <AnimatedView style={[styles.sparkle, styles.sparkle5, sparkle5Style]}>
          <Sparkle size={sparkleSize * 0.6} />
        </AnimatedView>
      </AnimatedView>
    </Pressable>
  );
};

// Diamond/star sparkle component
const Sparkle: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 10 10">
    <Defs>
      <LinearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" />
        <Stop offset="100%" stopColor={Colors.neon} />
      </LinearGradient>
    </Defs>
    {/* 4-point star/diamond shape */}
    <Path
      d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z"
      fill="url(#sparkleGrad)"
    />
  </Svg>
);

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    backgroundColor: Colors.neon,
    opacity: 0.3,
  },
  shineContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shineLine: {
    position: 'absolute',
  },
  buttonCircle: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: '10%',
    right: '15%',
  },
  sparkle2: {
    top: '25%',
    left: '10%',
  },
  sparkle3: {
    bottom: '20%',
    right: '10%',
  },
  sparkle4: {
    bottom: '15%',
    left: '20%',
  },
  sparkle5: {
    top: '5%',
    left: '30%',
  },
});

export default AnimatedAddButton;
