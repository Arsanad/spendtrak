// AlienQuantumIcon.tsx
// Ultra Complex Alien Entity - AI Consultant Icon for SpendTrak
// ENHANCED: Bigger core, more glow layers, double the particles

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Ellipse,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { easeInOutQuad } from '../../config/easingFunctions';
import { GlassSphere } from './GlassSphere';

const NEON_GREEN = '#00ff88';
const NEON_CYAN = '#00ffcc';
const NEON_AQUA = '#00ffaa';
const NEON_WHITE = '#ccffee';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AlienQuantumIconProps {
  size?: number;
  showGlow?: boolean;
  /** Wrap icon in a premium glass sphere effect */
  inGlassSphere?: boolean;
  /** Glass sphere glow intensity */
  sphereGlowIntensity?: 'subtle' | 'medium' | 'strong';
  /** Use simplified static version for faster initial render */
  simplified?: boolean;
}

interface OrbitRingProps {
  size: number;
  rx: number;
  ry: number;
  rotation: number;
  strokeColor: string;
  strokeWidth: number;
  duration: number;
  reverse?: boolean;
  particles?: { angle: number; r: number; fill: string }[];
}

// Single orbit ring with its own rotation animation
const OrbitRing: React.FC<OrbitRingProps> = ({
  size,
  rx,
  ry,
  rotation,
  strokeColor,
  strokeWidth,
  duration,
  reverse = false,
  particles = [],
}) => {
  const rotationValue = useSharedValue(0);

  useEffect(() => {
    rotationValue.value = withRepeat(
      withTiming(reverse ? -360 : 360, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation + rotationValue.value}deg` }],
  }));

  // Calculate particle positions based on ellipse
  const particleElements = particles.map((p, i) => {
    const angleRad = (p.angle * Math.PI) / 180;
    const px = 100 + rx * Math.cos(angleRad);
    const py = 100 + ry * Math.sin(angleRad);
    return (
      <Circle key={i} cx={px} cy={py} r={p.r} fill={p.fill} />
    );
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Ellipse
          cx="100"
          cy="100"
          rx={rx}
          ry={ry}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        {particleElements}
      </Svg>
    </Animated.View>
  );
};

// Pulsing particle component
const PulsingParticle: React.FC<{
  cx: number;
  cy: number;
  r: number;
  fill: string;
  delay?: number;
  pulseScale?: number;
}> = ({ cx, cy, r, fill, delay = 0, pulseScale = 1.4 }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: easeInOutQuad }),
          withTiming(0, { duration: 1000, easing: easeInOutQuad })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    r: r * interpolate(pulse.value, [0, 1], [0.7, pulseScale]),
    opacity: interpolate(pulse.value, [0, 1], [0.3, 1]),
  }));

  return <AnimatedCircle cx={cx} cy={cy} fill={fill} animatedProps={animatedProps} />;
};

// Animated outer glow ring that pulses
const OuterGlowRing: React.FC<{ iconSize: number }> = ({ iconSize }) => {
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: easeInOutQuad }),
        withTiming(0, { duration: 2500, easing: easeInOutQuad })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const s = interpolate(glowPulse.value, [0, 1], [1, 1.12]);
    const o = interpolate(glowPulse.value, [0, 1], [0.4, 0.8]);
    return {
      transform: [{ scale: s }],
      opacity: o,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize / 2,
          shadowColor: NEON_GREEN,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: iconSize * 0.35,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

// Simplified static icon for fast initial render
const SimplifiedIcon: React.FC<{ size: number; showGlow: boolean }> = ({ size, showGlow }) => (
  <View
    style={[
      styles.container,
      { width: size, height: size },
      showGlow && {
        shadowColor: NEON_GREEN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: size * 0.4,
      },
    ]}
  >
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="simpleCoreGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ffffff" />
          <Stop offset="15%" stopColor={NEON_WHITE} />
          <Stop offset="35%" stopColor="#00ffee" />
          <Stop offset="65%" stopColor={NEON_GREEN} />
          <Stop offset="100%" stopColor="#00aa55" />
        </RadialGradient>
        <RadialGradient id="simpleGlowField" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={NEON_GREEN} stopOpacity={0.35} />
          <Stop offset="30%" stopColor={NEON_GREEN} stopOpacity={0.18} />
          <Stop offset="60%" stopColor={NEON_AQUA} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={NEON_GREEN} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* Background glow */}
      <Circle cx="100" cy="100" r="98" fill="url(#simpleGlowField)" />
      {/* Static orbit rings - just 3 for visual effect */}
      <Ellipse cx="100" cy="100" rx="75" ry="30" fill="none" stroke={`${NEON_GREEN}50`} strokeWidth="1.2" transform="rotate(0 100 100)" />
      <Ellipse cx="100" cy="100" rx="55" ry="45" fill="none" stroke={`${NEON_CYAN}55`} strokeWidth="1.0" transform="rotate(45 100 100)" />
      <Ellipse cx="100" cy="100" rx="40" ry="18" fill="none" stroke={`${NEON_AQUA}65`} strokeWidth="1.4" transform="rotate(-30 100 100)" />
      {/* Core rings */}
      <Circle cx="100" cy="100" r="26" fill="none" stroke={`${NEON_GREEN}60`} strokeWidth="1.2" />
      <Circle cx="100" cy="100" r="22" fill="none" stroke={`${NEON_AQUA}80`} strokeWidth="1.5" />
      {/* Main core */}
      <Circle cx="100" cy="100" r="20" fill="url(#simpleCoreGrad)" />
      {/* Bright center */}
      <Circle cx="100" cy="100" r="10" fill="#ffffff" opacity={0.9} />
      <Circle cx="100" cy="100" r="6" fill="#ffffff" />
      {/* Highlight */}
      <Circle cx="96" cy="96" r="4" fill="#ffffff" opacity={0.7} />
    </Svg>
  </View>
);

const AlienQuantumIcon: React.FC<AlienQuantumIconProps> = ({
  size = 80,
  showGlow = true,
  inGlassSphere = false,
  sphereGlowIntensity = 'medium',
  simplified = false,
}) => {
  // Calculate sizes for glass sphere mode
  const iconSize = inGlassSphere ? size * 0.75 : size;
  const actualShowGlow = inGlassSphere ? false : showGlow;

  // For simplified mode, render the lightweight version
  if (simplified) {
    if (inGlassSphere) {
      return (
        <GlassSphere
          size={size}
          showShineSweep={false}
          glowColor={NEON_GREEN}
          glowIntensity={sphereGlowIntensity}
        >
          <SimplifiedIcon size={iconSize} showGlow={false} />
        </GlassSphere>
      );
    }
    return <SimplifiedIcon size={iconSize} showGlow={actualShowGlow} />;
  }

  // Core pulse animation - faster, more dramatic
  const corePulse = useSharedValue(0);

  useEffect(() => {
    corePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: easeInOutQuad }),
        withTiming(0, { duration: 600, easing: easeInOutQuad })
      ),
      -1,
      true
    );
  }, []);

  // BIGGER core: radius 20 (was 12), pulses to 24
  const coreAnimatedProps = useAnimatedProps(() => ({
    r: 20 * interpolate(corePulse.value, [0, 1], [1, 1.2]),
    opacity: interpolate(corePulse.value, [0, 1], [0.85, 1]),
  }));

  // Inner halo pulse (new - extra glow layer around core)
  const haloAnimatedProps = useAnimatedProps(() => ({
    r: 30 * interpolate(corePulse.value, [0, 1], [1, 1.15]),
    opacity: interpolate(corePulse.value, [0, 1], [0.15, 0.35]),
  }));

  // ULTRA ALIEN - Massive particle count for otherworldly appearance
  const orbitRings = [
    // Layer 1: Outermost (10 rings with 4-5 particles each)
    { rx: 96, ry: 22, rotation: 0, strokeColor: `${NEON_GREEN}45`, strokeWidth: 1.0, duration: 12000, particles: [{ angle: 0, r: 3.5, fill: NEON_GREEN }, { angle: 90, r: 2.5, fill: NEON_AQUA }, { angle: 180, r: 3, fill: NEON_CYAN }, { angle: 270, r: 2.5, fill: NEON_WHITE }] },
    { rx: 94, ry: 20, rotation: 18, strokeColor: `${NEON_GREEN}40`, strokeWidth: 1.0, duration: 13333, reverse: true, particles: [{ angle: 0, r: 3, fill: NEON_AQUA }, { angle: 72, r: 2.5, fill: NEON_GREEN }, { angle: 144, r: 2, fill: NEON_CYAN }, { angle: 216, r: 2.5, fill: NEON_WHITE }, { angle: 288, r: 2, fill: NEON_AQUA }] },
    { rx: 92, ry: 24, rotation: 36, strokeColor: `${NEON_CYAN}38`, strokeWidth: 0.9, duration: 11000, particles: [{ angle: 0, r: 3, fill: NEON_CYAN }, { angle: 90, r: 2.5, fill: NEON_WHITE }, { angle: 180, r: 2.5, fill: NEON_GREEN }, { angle: 270, r: 3, fill: NEON_AQUA }] },
    { rx: 90, ry: 18, rotation: 54, strokeColor: `${NEON_GREEN}42`, strokeWidth: 0.9, duration: 10667, reverse: true, particles: [{ angle: 0, r: 2.5, fill: NEON_GREEN }, { angle: 60, r: 2, fill: NEON_AQUA }, { angle: 120, r: 2.5, fill: NEON_CYAN }, { angle: 180, r: 2, fill: NEON_WHITE }, { angle: 240, r: 2.5, fill: NEON_GREEN }, { angle: 300, r: 2, fill: NEON_AQUA }] },
    { rx: 88, ry: 26, rotation: 72, strokeColor: `${NEON_AQUA}36`, strokeWidth: 0.9, duration: 14000, particles: [{ angle: 0, r: 3, fill: NEON_AQUA }, { angle: 90, r: 2, fill: NEON_CYAN }, { angle: 180, r: 2.5, fill: NEON_GREEN }, { angle: 270, r: 2, fill: NEON_WHITE }] },
    { rx: 86, ry: 16, rotation: 90, strokeColor: `${NEON_GREEN}40`, strokeWidth: 0.9, duration: 12667, reverse: true, particles: [{ angle: 0, r: 2.5, fill: NEON_GREEN }, { angle: 72, r: 2, fill: NEON_CYAN }, { angle: 144, r: 2.5, fill: NEON_AQUA }, { angle: 216, r: 2, fill: NEON_WHITE }, { angle: 288, r: 2.5, fill: NEON_GREEN }] },
    { rx: 84, ry: 20, rotation: 108, strokeColor: `${NEON_CYAN}35`, strokeWidth: 0.8, duration: 15000, particles: [{ angle: 0, r: 2, fill: NEON_CYAN }, { angle: 90, r: 2.5, fill: NEON_AQUA }, { angle: 180, r: 2, fill: NEON_GREEN }, { angle: 270, r: 2.5, fill: NEON_WHITE }] },
    { rx: 82, ry: 14, rotation: 126, strokeColor: `${NEON_AQUA}38`, strokeWidth: 0.8, duration: 11500, reverse: true, particles: [{ angle: 0, r: 2.5, fill: NEON_AQUA }, { angle: 60, r: 2, fill: NEON_GREEN }, { angle: 120, r: 2.5, fill: NEON_CYAN }, { angle: 180, r: 2, fill: NEON_WHITE }, { angle: 240, r: 2.5, fill: NEON_AQUA }, { angle: 300, r: 2, fill: NEON_GREEN }] },
    { rx: 80, ry: 18, rotation: 144, strokeColor: `${NEON_GREEN}36`, strokeWidth: 0.8, duration: 13000, particles: [{ angle: 0, r: 2.5, fill: NEON_GREEN }, { angle: 90, r: 2, fill: NEON_AQUA }, { angle: 180, r: 2.5, fill: NEON_CYAN }, { angle: 270, r: 2, fill: NEON_WHITE }] },
    { rx: 78, ry: 22, rotation: 162, strokeColor: `${NEON_CYAN}34`, strokeWidth: 0.8, duration: 14500, reverse: true, particles: [{ angle: 0, r: 2, fill: NEON_CYAN }, { angle: 72, r: 2.5, fill: NEON_GREEN }, { angle: 144, r: 2, fill: NEON_AQUA }, { angle: 216, r: 2.5, fill: NEON_WHITE }, { angle: 288, r: 2, fill: NEON_CYAN }] },

    // Layer 2: Outer (8 rings with 4-6 particles each)
    { rx: 75, ry: 30, rotation: 0, strokeColor: `${NEON_GREEN}50`, strokeWidth: 1.2, duration: 9000, reverse: true, particles: [{ angle: 0, r: 4, fill: NEON_AQUA }, { angle: 60, r: 3, fill: NEON_GREEN }, { angle: 120, r: 2.5, fill: NEON_WHITE }, { angle: 180, r: 3.5, fill: NEON_CYAN }, { angle: 240, r: 3, fill: NEON_AQUA }, { angle: 300, r: 2.5, fill: NEON_GREEN }] },
    { rx: 72, ry: 26, rotation: 22, strokeColor: `${NEON_CYAN}48`, strokeWidth: 1.1, duration: 8000, particles: [{ angle: 0, r: 3.5, fill: NEON_CYAN }, { angle: 72, r: 2.5, fill: NEON_GREEN }, { angle: 144, r: 3, fill: NEON_AQUA }, { angle: 216, r: 2.5, fill: NEON_WHITE }, { angle: 288, r: 3, fill: NEON_CYAN }] },
    { rx: 70, ry: 32, rotation: 45, strokeColor: `${NEON_GREEN}52`, strokeWidth: 1.2, duration: 6667, reverse: true, particles: [{ angle: 0, r: 4, fill: NEON_GREEN }, { angle: 90, r: 3, fill: NEON_AQUA }, { angle: 180, r: 3.5, fill: NEON_CYAN }, { angle: 270, r: 3, fill: NEON_WHITE }] },
    { rx: 68, ry: 24, rotation: 67, strokeColor: `${NEON_AQUA}46`, strokeWidth: 1.1, duration: 10000, particles: [{ angle: 0, r: 3, fill: NEON_CYAN }, { angle: 60, r: 2.5, fill: NEON_GREEN }, { angle: 120, r: 3, fill: NEON_AQUA }, { angle: 180, r: 2.5, fill: NEON_WHITE }, { angle: 240, r: 3, fill: NEON_CYAN }, { angle: 300, r: 2.5, fill: NEON_GREEN }] },
    { rx: 66, ry: 28, rotation: 90, strokeColor: `${NEON_GREEN}50`, strokeWidth: 1.0, duration: 7500, reverse: true, particles: [{ angle: 0, r: 3.5, fill: NEON_GREEN }, { angle: 90, r: 3, fill: NEON_WHITE }, { angle: 180, r: 3.5, fill: NEON_AQUA }, { angle: 270, r: 3, fill: NEON_CYAN }] },
    { rx: 64, ry: 22, rotation: 112, strokeColor: `${NEON_CYAN}44`, strokeWidth: 1.0, duration: 9500, particles: [{ angle: 0, r: 3, fill: NEON_AQUA }, { angle: 72, r: 2.5, fill: NEON_GREEN }, { angle: 144, r: 3, fill: NEON_CYAN }, { angle: 216, r: 2.5, fill: NEON_WHITE }, { angle: 288, r: 3, fill: NEON_AQUA }] },
    { rx: 62, ry: 26, rotation: 135, strokeColor: `${NEON_AQUA}48`, strokeWidth: 1.0, duration: 8500, reverse: true, particles: [{ angle: 0, r: 3.5, fill: NEON_AQUA }, { angle: 60, r: 3, fill: NEON_GREEN }, { angle: 120, r: 2.5, fill: NEON_CYAN }, { angle: 180, r: 3, fill: NEON_WHITE }, { angle: 240, r: 3.5, fill: NEON_AQUA }, { angle: 300, r: 2.5, fill: NEON_GREEN }] },
    { rx: 60, ry: 20, rotation: 157, strokeColor: `${NEON_GREEN}46`, strokeWidth: 1.0, duration: 7000, particles: [{ angle: 0, r: 3, fill: NEON_GREEN }, { angle: 90, r: 2.5, fill: NEON_AQUA }, { angle: 180, r: 3, fill: NEON_CYAN }, { angle: 270, r: 2.5, fill: NEON_WHITE }] },

    // Layer 3: Middle (7 rings with 5-6 particles each)
    { rx: 58, ry: 50, rotation: 15, strokeColor: `${NEON_GREEN}55`, strokeWidth: 1.0, duration: 7000, particles: [{ angle: 0, r: 4.5, fill: NEON_AQUA }, { angle: 60, r: 3.5, fill: NEON_GREEN }, { angle: 120, r: 3, fill: NEON_CYAN }, { angle: 180, r: 4, fill: NEON_WHITE }, { angle: 240, r: 3.5, fill: NEON_AQUA }, { angle: 300, r: 3, fill: NEON_GREEN }] },
    { rx: 55, ry: 45, rotation: -15, strokeColor: `${NEON_CYAN}52`, strokeWidth: 1.0, duration: 6000, reverse: true, particles: [{ angle: 0, r: 4, fill: NEON_CYAN }, { angle: 72, r: 3, fill: NEON_WHITE }, { angle: 144, r: 3.5, fill: NEON_GREEN }, { angle: 216, r: 3, fill: NEON_AQUA }, { angle: 288, r: 4, fill: NEON_CYAN }] },
    { rx: 52, ry: 42, rotation: 40, strokeColor: `${NEON_GREEN}56`, strokeWidth: 1.0, duration: 8000, particles: [{ angle: 0, r: 4, fill: NEON_GREEN }, { angle: 60, r: 3, fill: NEON_AQUA }, { angle: 120, r: 3.5, fill: NEON_CYAN }, { angle: 180, r: 3, fill: NEON_WHITE }, { angle: 240, r: 4, fill: NEON_GREEN }, { angle: 300, r: 3, fill: NEON_AQUA }] },
    { rx: 50, ry: 38, rotation: -40, strokeColor: `${NEON_AQUA}50`, strokeWidth: 0.9, duration: 7500, reverse: true, particles: [{ angle: 0, r: 3.5, fill: NEON_AQUA }, { angle: 72, r: 2.5, fill: NEON_CYAN }, { angle: 144, r: 3, fill: NEON_GREEN }, { angle: 216, r: 2.5, fill: NEON_WHITE }, { angle: 288, r: 3.5, fill: NEON_AQUA }] },
    { rx: 48, ry: 44, rotation: 65, strokeColor: `${NEON_GREEN}48`, strokeWidth: 0.9, duration: 6500, particles: [{ angle: 0, r: 3, fill: NEON_GREEN }, { angle: 60, r: 3.5, fill: NEON_AQUA }, { angle: 120, r: 2.5, fill: NEON_CYAN }, { angle: 180, r: 3.5, fill: NEON_WHITE }, { angle: 240, r: 3, fill: NEON_GREEN }, { angle: 300, r: 3.5, fill: NEON_AQUA }] },
    { rx: 46, ry: 35, rotation: -65, strokeColor: `${NEON_CYAN}52`, strokeWidth: 0.9, duration: 5500, reverse: true, particles: [{ angle: 0, r: 3.5, fill: NEON_CYAN }, { angle: 90, r: 3, fill: NEON_GREEN }, { angle: 180, r: 3.5, fill: NEON_AQUA }, { angle: 270, r: 3, fill: NEON_WHITE }] },
    { rx: 44, ry: 40, rotation: 85, strokeColor: `${NEON_AQUA}50`, strokeWidth: 0.9, duration: 7000, particles: [{ angle: 0, r: 3, fill: NEON_AQUA }, { angle: 72, r: 3.5, fill: NEON_GREEN }, { angle: 144, r: 3, fill: NEON_CYAN }, { angle: 216, r: 3.5, fill: NEON_WHITE }, { angle: 288, r: 3, fill: NEON_AQUA }] },

    // Layer 4: Inner-middle (6 rings with 5-6 particles each)
    { rx: 42, ry: 18, rotation: 0, strokeColor: `${NEON_AQUA}65`, strokeWidth: 1.4, duration: 5000, reverse: true, particles: [{ angle: 0, r: 4.5, fill: NEON_AQUA }, { angle: 60, r: 3.5, fill: NEON_GREEN }, { angle: 120, r: 4, fill: NEON_WHITE }, { angle: 180, r: 3.5, fill: NEON_CYAN }, { angle: 240, r: 4.5, fill: NEON_AQUA }, { angle: 300, r: 3.5, fill: NEON_GREEN }] },
    { rx: 40, ry: 16, rotation: 30, strokeColor: `${NEON_CYAN}60`, strokeWidth: 1.4, duration: 4500, particles: [{ angle: 0, r: 4, fill: NEON_CYAN }, { angle: 72, r: 3, fill: NEON_WHITE }, { angle: 144, r: 3.5, fill: NEON_GREEN }, { angle: 216, r: 3, fill: NEON_AQUA }, { angle: 288, r: 4, fill: NEON_CYAN }] },
    { rx: 38, ry: 20, rotation: 60, strokeColor: `${NEON_GREEN}62`, strokeWidth: 1.3, duration: 5500, reverse: true, particles: [{ angle: 0, r: 4, fill: NEON_GREEN }, { angle: 60, r: 3, fill: NEON_AQUA }, { angle: 120, r: 3.5, fill: NEON_CYAN }, { angle: 180, r: 3, fill: NEON_WHITE }, { angle: 240, r: 4, fill: NEON_GREEN }, { angle: 300, r: 3, fill: NEON_AQUA }] },
    { rx: 36, ry: 14, rotation: 90, strokeColor: `${NEON_AQUA}58`, strokeWidth: 1.3, duration: 4000, particles: [{ angle: 0, r: 3.5, fill: NEON_AQUA }, { angle: 90, r: 3, fill: NEON_GREEN }, { angle: 180, r: 3.5, fill: NEON_CYAN }, { angle: 270, r: 3, fill: NEON_WHITE }] },
    { rx: 34, ry: 18, rotation: 120, strokeColor: `${NEON_CYAN}55`, strokeWidth: 1.2, duration: 6000, reverse: true, particles: [{ angle: 0, r: 3, fill: NEON_CYAN }, { angle: 72, r: 3.5, fill: NEON_GREEN }, { angle: 144, r: 3, fill: NEON_AQUA }, { angle: 216, r: 3.5, fill: NEON_WHITE }, { angle: 288, r: 3, fill: NEON_CYAN }] },
    { rx: 32, ry: 12, rotation: 150, strokeColor: `${NEON_GREEN}60`, strokeWidth: 1.2, duration: 4500, particles: [{ angle: 0, r: 3.5, fill: NEON_GREEN }, { angle: 60, r: 3, fill: NEON_AQUA }, { angle: 120, r: 3.5, fill: NEON_CYAN }, { angle: 180, r: 3, fill: NEON_WHITE }, { angle: 240, r: 3.5, fill: NEON_GREEN }, { angle: 300, r: 3, fill: NEON_AQUA }] },

    // Layer 5: Inner (6 rings with 5-6 particles each)
    { rx: 30, ry: 12, rotation: 0, strokeColor: `${NEON_AQUA}75`, strokeWidth: 1.8, duration: 3800, particles: [{ angle: 0, r: 5, fill: NEON_AQUA }, { angle: 60, r: 4, fill: NEON_GREEN }, { angle: 120, r: 4.5, fill: NEON_WHITE }, { angle: 180, r: 4, fill: NEON_CYAN }, { angle: 240, r: 5, fill: NEON_AQUA }, { angle: 300, r: 4, fill: NEON_GREEN }] },
    { rx: 28, ry: 10, rotation: 36, strokeColor: `${NEON_CYAN}72`, strokeWidth: 1.7, duration: 3500, reverse: true, particles: [{ angle: 0, r: 4.5, fill: NEON_CYAN }, { angle: 72, r: 3.5, fill: NEON_WHITE }, { angle: 144, r: 4, fill: NEON_GREEN }, { angle: 216, r: 3.5, fill: NEON_AQUA }, { angle: 288, r: 4.5, fill: NEON_CYAN }] },
    { rx: 26, ry: 8, rotation: 72, strokeColor: `${NEON_GREEN}76`, strokeWidth: 1.7, duration: 4200, particles: [{ angle: 0, r: 4.5, fill: NEON_GREEN }, { angle: 60, r: 3.5, fill: NEON_AQUA }, { angle: 120, r: 4, fill: NEON_CYAN }, { angle: 180, r: 3.5, fill: NEON_WHITE }, { angle: 240, r: 4.5, fill: NEON_GREEN }, { angle: 300, r: 3.5, fill: NEON_AQUA }] },
    { rx: 24, ry: 12, rotation: 108, strokeColor: `${NEON_AQUA}70`, strokeWidth: 1.6, duration: 3200, reverse: true, particles: [{ angle: 0, r: 4, fill: NEON_AQUA }, { angle: 90, r: 3.5, fill: NEON_GREEN }, { angle: 180, r: 4, fill: NEON_CYAN }, { angle: 270, r: 3.5, fill: NEON_WHITE }] },
    { rx: 22, ry: 6, rotation: 144, strokeColor: `${NEON_CYAN}68`, strokeWidth: 1.6, duration: 4500, particles: [{ angle: 0, r: 3.5, fill: NEON_CYAN }, { angle: 72, r: 4, fill: NEON_GREEN }, { angle: 144, r: 3.5, fill: NEON_AQUA }, { angle: 216, r: 4, fill: NEON_WHITE }, { angle: 288, r: 3.5, fill: NEON_CYAN }] },
    { rx: 20, ry: 10, rotation: 170, strokeColor: `${NEON_GREEN}72`, strokeWidth: 1.6, duration: 3800, reverse: true, particles: [{ angle: 0, r: 4, fill: NEON_GREEN }, { angle: 60, r: 3.5, fill: NEON_AQUA }, { angle: 120, r: 4, fill: NEON_CYAN }, { angle: 180, r: 3.5, fill: NEON_WHITE }, { angle: 240, r: 4, fill: NEON_GREEN }, { angle: 300, r: 3.5, fill: NEON_AQUA }] },

    // Layer 6: Core rings (6 rings with 5-6 particles each) - THICKER, BRIGHTER, MORE PARTICLES
    { rx: 18, ry: 6, rotation: 0, strokeColor: `${NEON_AQUA}E0`, strokeWidth: 2.2, duration: 3000, reverse: true, particles: [{ angle: 0, r: 5, fill: NEON_AQUA }, { angle: 60, r: 4, fill: NEON_WHITE }, { angle: 120, r: 5, fill: NEON_GREEN }, { angle: 180, r: 4, fill: NEON_CYAN }, { angle: 240, r: 5, fill: NEON_AQUA }, { angle: 300, r: 4, fill: NEON_WHITE }] },
    { rx: 16, ry: 8, rotation: 30, strokeColor: `${NEON_GREEN}D0`, strokeWidth: 2.0, duration: 2800, particles: [{ angle: 0, r: 4.5, fill: NEON_GREEN }, { angle: 72, r: 3.5, fill: NEON_CYAN }, { angle: 144, r: 4.5, fill: NEON_AQUA }, { angle: 216, r: 3.5, fill: NEON_WHITE }, { angle: 288, r: 4.5, fill: NEON_GREEN }] },
    { rx: 14, ry: 5, rotation: 60, strokeColor: `${NEON_CYAN}E0`, strokeWidth: 2.2, duration: 2600, reverse: true, particles: [{ angle: 0, r: 5, fill: NEON_CYAN }, { angle: 60, r: 4, fill: NEON_AQUA }, { angle: 120, r: 5, fill: NEON_GREEN }, { angle: 180, r: 4, fill: NEON_WHITE }, { angle: 240, r: 5, fill: NEON_CYAN }, { angle: 300, r: 4, fill: NEON_AQUA }] },
    { rx: 12, ry: 6, rotation: 90, strokeColor: `${NEON_GREEN}D8`, strokeWidth: 2.0, duration: 3200, particles: [{ angle: 0, r: 4, fill: NEON_GREEN }, { angle: 90, r: 4.5, fill: NEON_AQUA }, { angle: 180, r: 4, fill: NEON_CYAN }, { angle: 270, r: 4.5, fill: NEON_WHITE }] },
    { rx: 10, ry: 4, rotation: 120, strokeColor: `${NEON_AQUA}E8`, strokeWidth: 2.2, duration: 2400, reverse: true, particles: [{ angle: 0, r: 4.5, fill: NEON_AQUA }, { angle: 72, r: 3.5, fill: NEON_WHITE }, { angle: 144, r: 4.5, fill: NEON_GREEN }, { angle: 216, r: 3.5, fill: NEON_CYAN }, { angle: 288, r: 4.5, fill: NEON_AQUA }] },
    { rx: 8, ry: 5, rotation: 150, strokeColor: `${NEON_CYAN}F0`, strokeWidth: 2.4, duration: 2000, particles: [{ angle: 0, r: 4, fill: NEON_CYAN }, { angle: 60, r: 4.5, fill: NEON_GREEN }, { angle: 120, r: 4, fill: NEON_AQUA }, { angle: 180, r: 4.5, fill: NEON_WHITE }, { angle: 240, r: 4, fill: NEON_CYAN }, { angle: 300, r: 4.5, fill: NEON_GREEN }] },
  ];

  // The core icon component
  const iconContent = (
    <View
      style={[
        styles.container,
        { width: iconSize, height: iconSize },
        actualShowGlow && {
          shadowColor: NEON_GREEN,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: iconSize * 0.4,
        },
      ]}
    >
      {/* Pulsing outer glow layer */}
      {actualShowGlow && <OuterGlowRing iconSize={iconSize} />}

      {/* Background and core layer */}
      <Svg width={iconSize} height={iconSize} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="15%" stopColor={NEON_WHITE} />
            <Stop offset="35%" stopColor="#00ffee" />
            <Stop offset="65%" stopColor={NEON_GREEN} />
            <Stop offset="100%" stopColor="#00aa55" />
          </RadialGradient>
          <RadialGradient id="glowField" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={NEON_GREEN} stopOpacity={0.35} />
            <Stop offset="30%" stopColor={NEON_GREEN} stopOpacity={0.18} />
            <Stop offset="60%" stopColor={NEON_AQUA} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={NEON_GREEN} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="innerHalo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={NEON_GREEN} stopOpacity={0.5} />
            <Stop offset="60%" stopColor={NEON_AQUA} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={NEON_GREEN} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Background energy field - BRIGHTER */}
        <Circle cx="100" cy="100" r="98" fill="url(#glowField)" />
      </Svg>

      {/* Rotating orbit rings - DOUBLED */}
      {orbitRings.map((ring, index) => (
        <OrbitRing
          key={index}
          size={iconSize}
          rx={ring.rx}
          ry={ring.ry}
          rotation={ring.rotation}
          strokeColor={ring.strokeColor}
          strokeWidth={ring.strokeWidth}
          duration={ring.duration}
          reverse={ring.reverse}
          particles={ring.particles}
        />
      ))}

      {/* Core layer - BIGGER core, more glow rings, pulsing halo */}
      <Svg width={iconSize} height={iconSize} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        {/* Outer halo glow (new) */}
        <AnimatedCircle cx="100" cy="100" fill="url(#innerHalo)" animatedProps={haloAnimatedProps} />

        {/* Outer core ring - BIGGER */}
        <Circle cx="100" cy="100" r="26" fill="none" stroke={`${NEON_GREEN}60`} strokeWidth="1.2" />
        <Circle cx="100" cy="100" r="22" fill="none" stroke={`${NEON_AQUA}80`} strokeWidth="1.5" />

        {/* Main pulsing core - BIGGER (r=20, was 12) */}
        <AnimatedCircle cx="100" cy="100" fill="url(#coreGrad)" animatedProps={coreAnimatedProps} />

        {/* Bright center - BIGGER */}
        <Circle cx="100" cy="100" r="10" fill="#ffffff" opacity={0.9} />
        <Circle cx="100" cy="100" r="6" fill="#ffffff" />

        {/* Highlight reflection - BIGGER */}
        <Circle cx="96" cy="96" r="4" fill="#ffffff" opacity={0.7} />
        <Circle cx="94" cy="94" r="2" fill="#ffffff" opacity={0.5} />

      </Svg>

      {/* Orbiting accent particles around core (invisible rings, visible particles) - TRIPLED for alien effect */}
      {/* Outer floating particles */}
      <OrbitRing size={iconSize} rx={42} ry={42} rotation={0} strokeColor="transparent" strokeWidth={0} duration={5000} particles={[{ angle: 0, r: 3, fill: NEON_AQUA }, { angle: 60, r: 2.5, fill: NEON_GREEN }, { angle: 120, r: 3, fill: NEON_CYAN }, { angle: 180, r: 2.5, fill: NEON_WHITE }, { angle: 240, r: 3, fill: NEON_AQUA }, { angle: 300, r: 2.5, fill: NEON_GREEN }]} />
      <OrbitRing size={iconSize} rx={42} ry={42} rotation={30} strokeColor="transparent" strokeWidth={0} duration={5500} reverse particles={[{ angle: 0, r: 2.5, fill: NEON_GREEN }, { angle: 72, r: 3, fill: NEON_AQUA }, { angle: 144, r: 2.5, fill: NEON_CYAN }, { angle: 216, r: 3, fill: NEON_WHITE }, { angle: 288, r: 2.5, fill: NEON_GREEN }]} />
      <OrbitRing size={iconSize} rx={40} ry={40} rotation={60} strokeColor="transparent" strokeWidth={0} duration={4500} particles={[{ angle: 0, r: 3, fill: NEON_CYAN }, { angle: 90, r: 2.5, fill: NEON_AQUA }, { angle: 180, r: 3, fill: NEON_GREEN }, { angle: 270, r: 2.5, fill: NEON_WHITE }]} />

      {/* Middle floating particles */}
      <OrbitRing size={iconSize} rx={36} ry={36} rotation={0} strokeColor="transparent" strokeWidth={0} duration={4000} particles={[{ angle: 0, r: 3.5, fill: NEON_AQUA }, { angle: 60, r: 3, fill: NEON_GREEN }, { angle: 120, r: 3.5, fill: NEON_CYAN }, { angle: 180, r: 3, fill: NEON_WHITE }, { angle: 240, r: 3.5, fill: NEON_AQUA }, { angle: 300, r: 3, fill: NEON_GREEN }]} />
      <OrbitRing size={iconSize} rx={36} ry={36} rotation={45} strokeColor="transparent" strokeWidth={0} duration={4200} reverse particles={[{ angle: 0, r: 3, fill: NEON_GREEN }, { angle: 72, r: 3.5, fill: NEON_AQUA }, { angle: 144, r: 3, fill: NEON_CYAN }, { angle: 216, r: 3.5, fill: NEON_WHITE }, { angle: 288, r: 3, fill: NEON_GREEN }]} />
      <OrbitRing size={iconSize} rx={34} ry={34} rotation={90} strokeColor="transparent" strokeWidth={0} duration={3800} particles={[{ angle: 0, r: 3.5, fill: NEON_CYAN }, { angle: 90, r: 3, fill: NEON_AQUA }, { angle: 180, r: 3.5, fill: NEON_GREEN }, { angle: 270, r: 3, fill: NEON_WHITE }]} />
      <OrbitRing size={iconSize} rx={34} ry={34} rotation={135} strokeColor="transparent" strokeWidth={0} duration={4000} reverse particles={[{ angle: 0, r: 3, fill: NEON_AQUA }, { angle: 60, r: 3.5, fill: NEON_GREEN }, { angle: 120, r: 3, fill: NEON_WHITE }, { angle: 180, r: 3.5, fill: NEON_CYAN }, { angle: 240, r: 3, fill: NEON_AQUA }, { angle: 300, r: 3.5, fill: NEON_GREEN }]} />

      {/* Inner floating particles - dense and glowing */}
      <OrbitRing size={iconSize} rx={30} ry={30} rotation={0} strokeColor="transparent" strokeWidth={0} duration={3500} particles={[{ angle: 0, r: 4, fill: NEON_AQUA }, { angle: 45, r: 3, fill: NEON_GREEN }, { angle: 90, r: 4, fill: NEON_CYAN }, { angle: 135, r: 3, fill: NEON_WHITE }, { angle: 180, r: 4, fill: NEON_AQUA }, { angle: 225, r: 3, fill: NEON_GREEN }, { angle: 270, r: 4, fill: NEON_CYAN }, { angle: 315, r: 3, fill: NEON_WHITE }]} />
      <OrbitRing size={iconSize} rx={30} ry={30} rotation={22} strokeColor="transparent" strokeWidth={0} duration={3700} reverse particles={[{ angle: 0, r: 3, fill: NEON_GREEN }, { angle: 60, r: 4, fill: NEON_AQUA }, { angle: 120, r: 3, fill: NEON_CYAN }, { angle: 180, r: 4, fill: NEON_WHITE }, { angle: 240, r: 3, fill: NEON_GREEN }, { angle: 300, r: 4, fill: NEON_AQUA }]} />
      <OrbitRing size={iconSize} rx={28} ry={28} rotation={45} strokeColor="transparent" strokeWidth={0} duration={3200} particles={[{ angle: 0, r: 3.5, fill: NEON_WHITE }, { angle: 72, r: 3, fill: NEON_GREEN }, { angle: 144, r: 3.5, fill: NEON_AQUA }, { angle: 216, r: 3, fill: NEON_CYAN }, { angle: 288, r: 3.5, fill: NEON_WHITE }]} />
      <OrbitRing size={iconSize} rx={28} ry={28} rotation={67} strokeColor="transparent" strokeWidth={0} duration={3400} reverse particles={[{ angle: 0, r: 3, fill: NEON_CYAN }, { angle: 60, r: 3.5, fill: NEON_AQUA }, { angle: 120, r: 3, fill: NEON_GREEN }, { angle: 180, r: 3.5, fill: NEON_WHITE }, { angle: 240, r: 3, fill: NEON_CYAN }, { angle: 300, r: 3.5, fill: NEON_AQUA }]} />

      {/* Core floating particles - brightest and most active */}
      <OrbitRing size={iconSize} rx={24} ry={24} rotation={0} strokeColor="transparent" strokeWidth={0} duration={2800} particles={[{ angle: 0, r: 4, fill: NEON_AQUA }, { angle: 45, r: 3.5, fill: NEON_GREEN }, { angle: 90, r: 4, fill: NEON_WHITE }, { angle: 135, r: 3.5, fill: NEON_CYAN }, { angle: 180, r: 4, fill: NEON_AQUA }, { angle: 225, r: 3.5, fill: NEON_GREEN }, { angle: 270, r: 4, fill: NEON_WHITE }, { angle: 315, r: 3.5, fill: NEON_CYAN }]} />
      <OrbitRing size={iconSize} rx={24} ry={24} rotation={22} strokeColor="transparent" strokeWidth={0} duration={3000} reverse particles={[{ angle: 0, r: 3.5, fill: NEON_GREEN }, { angle: 60, r: 4, fill: NEON_AQUA }, { angle: 120, r: 3.5, fill: NEON_CYAN }, { angle: 180, r: 4, fill: NEON_WHITE }, { angle: 240, r: 3.5, fill: NEON_GREEN }, { angle: 300, r: 4, fill: NEON_AQUA }]} />
      <OrbitRing size={iconSize} rx={20} ry={20} rotation={0} strokeColor="transparent" strokeWidth={0} duration={2500} particles={[{ angle: 0, r: 4.5, fill: NEON_AQUA }, { angle: 60, r: 4, fill: NEON_WHITE }, { angle: 120, r: 4.5, fill: NEON_GREEN }, { angle: 180, r: 4, fill: NEON_CYAN }, { angle: 240, r: 4.5, fill: NEON_AQUA }, { angle: 300, r: 4, fill: NEON_WHITE }]} />
      <OrbitRing size={iconSize} rx={20} ry={20} rotation={30} strokeColor="transparent" strokeWidth={0} duration={2700} reverse particles={[{ angle: 0, r: 4, fill: NEON_CYAN }, { angle: 72, r: 4.5, fill: NEON_GREEN }, { angle: 144, r: 4, fill: NEON_AQUA }, { angle: 216, r: 4.5, fill: NEON_WHITE }, { angle: 288, r: 4, fill: NEON_CYAN }]} />
      <OrbitRing size={iconSize} rx={16} ry={16} rotation={45} strokeColor="transparent" strokeWidth={0} duration={2200} particles={[{ angle: 0, r: 4.5, fill: NEON_WHITE }, { angle: 90, r: 4, fill: NEON_AQUA }, { angle: 180, r: 4.5, fill: NEON_GREEN }, { angle: 270, r: 4, fill: NEON_CYAN }]} />
      <OrbitRing size={iconSize} rx={16} ry={16} rotation={135} strokeColor="transparent" strokeWidth={0} duration={2400} reverse particles={[{ angle: 0, r: 4, fill: NEON_AQUA }, { angle: 60, r: 4.5, fill: NEON_GREEN }, { angle: 120, r: 4, fill: NEON_WHITE }, { angle: 180, r: 4.5, fill: NEON_CYAN }, { angle: 240, r: 4, fill: NEON_AQUA }, { angle: 300, r: 4.5, fill: NEON_GREEN }]} />
    </View>
  );

  // Wrap in glass sphere if enabled
  if (inGlassSphere) {
    return (
      <GlassSphere
        size={size}
        showShineSweep={true}
        glowColor={NEON_GREEN}
        glowIntensity={sphereGlowIntensity}
      >
        {iconContent}
      </GlassSphere>
    );
  }

  return iconContent;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default AlienQuantumIcon;
