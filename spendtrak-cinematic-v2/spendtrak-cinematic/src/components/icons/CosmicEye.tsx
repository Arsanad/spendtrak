// ============================================
// SPENDTRAK CINEMATIC EDITION
// Component: CosmicEye
// Location: src/components/icons/CosmicEye.tsx
// ============================================
//
// Animated AI avatar featuring:
// - Detailed iris with concentric rings
// - Rotating inner pattern
// - Natural blinking animation
// - Pulsing glow effect
// - Multiple size variants
//
// ============================================

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../design/cinematic';

// ==========================================
// TYPES
// ==========================================

export interface CosmicEyeProps {
  size?: number;
  active?: boolean;
  blinking?: boolean;
  glowing?: boolean;
  pulsing?: boolean;
  onPress?: () => void;
  style?: any;
}

// ==========================================
// ANIMATED COMPONENTS
// ==========================================

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedView = Animated.createAnimatedComponent(View);

// ==========================================
// MAIN COMPONENT
// ==========================================

export const CosmicEye: React.FC<CosmicEyeProps> = ({
  size = 64,
  active = true,
  blinking = true,
  glowing = true,
  pulsing = true,
  onPress,
  style,
}) => {
  // Animation shared values
  const irisRotation = useSharedValue(0);
  const innerRingRotation = useSharedValue(0);
  const blinkProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0.2);
  const glowScale = useSharedValue(1);
  const pupilDilation = useSharedValue(1);

  // Start animations
  useEffect(() => {
    if (active) {
      // Slow iris rotation (20 seconds for full rotation)
      irisRotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );

      // Counter-rotating inner ring (15 seconds, opposite direction)
      innerRingRotation.value = withRepeat(
        withTiming(-360, { duration: 15000, easing: Easing.linear }),
        -1,
        false
      );

      // Natural blinking (random interval 3-6 seconds)
      if (blinking) {
        const startBlinking = () => {
          blinkProgress.value = withRepeat(
            withSequence(
              withDelay(
                3000 + Math.random() * 3000,
                withTiming(0, { duration: 0 })
              ),
              withTiming(1, { duration: 100, easing: Easing.out(Easing.ease) }),
              withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) })
            ),
            -1,
            false
          );
        };
        startBlinking();
      }

      // Pulsing glow
      if (pulsing && glowing) {
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      }

      // Subtle pupil dilation
      pupilDilation.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Reset animations when inactive
      irisRotation.value = withTiming(0, { duration: 1000 });
      innerRingRotation.value = withTiming(0, { duration: 1000 });
      blinkProgress.value = 0;
      glowOpacity.value = withTiming(0.1, { duration: 500 });
      glowScale.value = withTiming(1, { duration: 500 });
      pupilDilation.value = 1;
    }
  }, [active, blinking, pulsing, glowing]);

  // Animated props for iris rotation
  const irisAnimatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${irisRotation.value}deg` }],
  }));

  // Animated props for inner ring rotation
  const innerRingAnimatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${innerRingRotation.value}deg` }],
  }));

  // Animated props for eyelid (blinking)
  const eyelidAnimatedProps = useAnimatedProps(() => ({
    ry: interpolate(blinkProgress.value, [0, 1], [0, size * 0.5]),
    opacity: blinkProgress.value,
  }));

  // Animated props for pupil
  const pupilAnimatedProps = useAnimatedProps(() => ({
    r: (size * 0.08) * pupilDilation.value,
  }));

  // Glow animation style
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  // Dimensions
  const viewBox = size;
  const center = size / 2;
  const eyeRadius = size * 0.42;
  const irisRadius = size * 0.3;
  const pupilRadius = size * 0.08;

  // Generate iris detail lines
  const irisLines = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15) * (Math.PI / 180);
    const innerR = irisRadius * 0.35;
    const outerR = irisRadius * 0.92;
    return {
      x1: center + Math.cos(angle) * innerR,
      y1: center + Math.sin(angle) * innerR,
      x2: center + Math.cos(angle) * outerR,
      y2: center + Math.sin(angle) * outerR,
      isEven: i % 2 === 0,
    };
  });

  // Generate inner decorative dots
  const innerDots = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45) * (Math.PI / 180);
    const r = irisRadius * 0.25;
    return {
      cx: center + Math.cos(angle) * r,
      cy: center + Math.sin(angle) * r,
    };
  });

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.container, { width: size, height: size }, style]}>
      {/* Outer glow effect */}
      {glowing && (
        <AnimatedView style={[styles.glowContainer, { width: size * 1.5, height: size * 1.5 }, glowStyle]}>
          <Svg width={size * 1.5} height={size * 1.5}>
            <Defs>
              <RadialGradient id="cosmicGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={Colors.neon} stopOpacity="0.8" />
                <Stop offset="40%" stopColor={Colors.primary} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={Colors.void} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={size * 0.75} cy={size * 0.75} r={size * 0.6} fill="url(#cosmicGlow)" />
          </Svg>
        </AnimatedView>
      )}

      <Svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
        <Defs>
          {/* Iris radial gradient */}
          <RadialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.neon} />
            <Stop offset="35%" stopColor={Colors.primary} />
            <Stop offset="65%" stopColor={Colors.deep} />
            <Stop offset="100%" stopColor={Colors.darker} />
          </RadialGradient>

          {/* Sclera gradient (dark eye white) */}
          <RadialGradient id="scleraGradient" cx="50%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#1a1a1a" />
            <Stop offset="80%" stopColor="#0a0a0a" />
            <Stop offset="100%" stopColor={Colors.void} />
          </RadialGradient>

          {/* Outer ring gradient */}
          <LinearGradient id="outerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.neon} />
            <Stop offset="50%" stopColor={Colors.deep} />
            <Stop offset="100%" stopColor={Colors.neon} />
          </LinearGradient>

          {/* Inner glow */}
          <RadialGradient id="pupilGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.neon} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={Colors.neon} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Outer eye (sclera) */}
        <Circle
          cx={center}
          cy={center}
          r={eyeRadius}
          fill="url(#scleraGradient)"
          stroke={Colors.darker}
          strokeWidth={1}
        />

        {/* Outer decorative ring */}
        <Circle
          cx={center}
          cy={center}
          r={eyeRadius - 1}
          fill="none"
          stroke="url(#outerRingGrad)"
          strokeWidth={1.5}
          strokeDasharray={`${Math.PI * 3} ${Math.PI * 6}`}
        />

        {/* Rotating iris group */}
        <AnimatedG animatedProps={irisAnimatedProps}>
          {/* Main iris circle */}
          <Circle
            cx={center}
            cy={center}
            r={irisRadius}
            fill="url(#irisGradient)"
          />

          {/* Iris detail lines (radial) */}
          {irisLines.map((line, i) => (
            <Path
              key={`iris-line-${i}`}
              d={`M${line.x1} ${line.y1} L${line.x2} ${line.y2}`}
              stroke={line.isEven ? Colors.neon : Colors.deep}
              strokeWidth={0.5}
              opacity={0.4}
            />
          ))}

          {/* Inner iris ring */}
          <Circle
            cx={center}
            cy={center}
            r={irisRadius * 0.55}
            fill="none"
            stroke={Colors.neon}
            strokeWidth={0.5}
            opacity={0.25}
          />
        </AnimatedG>

        {/* Counter-rotating inner decorations */}
        <AnimatedG animatedProps={innerRingAnimatedProps}>
          {innerDots.map((dot, i) => (
            <Circle
              key={`inner-dot-${i}`}
              cx={dot.cx}
              cy={dot.cy}
              r={1}
              fill={Colors.neon}
              opacity={0.5}
            />
          ))}
        </AnimatedG>

        {/* Pupil (animated size) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          animatedProps={pupilAnimatedProps}
          fill={Colors.void}
        />

        {/* Pupil inner glow */}
        <Circle
          cx={center}
          cy={center}
          r={pupilRadius * 0.6}
          fill="url(#pupilGlow)"
        />

        {/* Catchlight reflections */}
        <Circle
          cx={center - irisRadius * 0.3}
          cy={center - irisRadius * 0.3}
          r={size * 0.035}
          fill="#ffffff"
          opacity={0.9}
        />
        <Circle
          cx={center + irisRadius * 0.2}
          cy={center - irisRadius * 0.35}
          r={size * 0.018}
          fill="#ffffff"
          opacity={0.6}
        />

        {/* Eyelid for blinking */}
        <AnimatedEllipse
          cx={center}
          cy={center}
          rx={eyeRadius + 2}
          ry={0}
          animatedProps={eyelidAnimatedProps}
          fill={Colors.void}
        />
      </Svg>
    </Pressable>
  );
};

// ==========================================
// MINI COSMIC EYE (For tab bar, etc.)
// ==========================================

export const MiniCosmicEye: React.FC<{ 
  size?: number; 
  active?: boolean;
  onPress?: () => void;
}> = ({
  size = 24,
  active = false,
  onPress,
}) => {
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (active) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1,
        false
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.2, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 500 });
      glow.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const rotateProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowProps = useAnimatedProps(() => ({
    opacity: glow.value,
  }));

  const center = size / 2;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="miniIrisGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.neon} />
            <Stop offset="60%" stopColor={Colors.deep} />
            <Stop offset="100%" stopColor={Colors.darker} />
          </RadialGradient>
        </Defs>

        {/* Glow */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={size * 0.45}
          fill={Colors.neon}
          animatedProps={glowProps}
        />

        {/* Outer ring */}
        <Circle
          cx={center}
          cy={center}
          r={size * 0.42}
          fill="#0a0a0a"
          stroke={active ? Colors.primary : Colors.darker}
          strokeWidth={1}
        />

        {/* Iris with rotation */}
        <AnimatedG animatedProps={rotateProps}>
          <Circle
            cx={center}
            cy={center}
            r={size * 0.3}
            fill="url(#miniIrisGrad)"
          />
          {/* Simple radial lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const innerR = size * 0.12;
            const outerR = size * 0.28;
            return (
              <Path
                key={i}
                d={`M${center + Math.cos(rad) * innerR} ${center + Math.sin(rad) * innerR} L${center + Math.cos(rad) * outerR} ${center + Math.sin(rad) * outerR}`}
                stroke={Colors.neon}
                strokeWidth={0.3}
                opacity={0.5}
              />
            );
          })}
        </AnimatedG>

        {/* Pupil */}
        <Circle
          cx={center}
          cy={center}
          r={size * 0.08}
          fill={Colors.void}
        />

        {/* Catchlight */}
        <Circle
          cx={center - size * 0.1}
          cy={center - size * 0.1}
          r={size * 0.04}
          fill="#ffffff"
          opacity={0.8}
        />
      </Svg>
    </Pressable>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ==========================================
// EXPORTS
// ==========================================

export { CosmicEye, MiniCosmicEye };
export default CosmicEye;
