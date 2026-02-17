// GlassSphere.tsx
// Premium transparent glass sphere/orb effect wrapper
// Creates a crystal ball effect for icons floating inside

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Ellipse,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { easeInOutQuad } from '../../config/easingFunctions';

const NEON_GREEN = '#00ff88';

interface GlassSphereProps {
  size: number;
  children: React.ReactNode;
  showShineSweep?: boolean;
  glowColor?: string;
  glowIntensity?: 'subtle' | 'medium' | 'strong';
}

// Animated shine sweep component
const ShineSweep: React.FC<{ size: number }> = ({ size }) => {
  const translateX = useSharedValue(-size);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withDelay(
          3500,
          withTiming(size * 1.2, {
            duration: 1200,
            easing: easeInOutQuad,
          })
        ),
        withTiming(-size, { duration: 0 })
      ),
      -1,
      false
    );
  }, [size]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: '25deg' }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -size * 0.2,
          width: size * 0.15,
          height: size * 1.5,
          borderRadius: size * 0.1,
          overflow: 'hidden',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.25)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
};

export const GlassSphere: React.FC<GlassSphereProps> = ({
  size,
  children,
  showShineSweep = true,
  glowColor = NEON_GREEN,
  glowIntensity = 'medium',
}) => {
  const glowOpacity = {
    subtle: 0.2,
    medium: 0.35,
    strong: 0.5,
  }[glowIntensity];

  const glowRadius = {
    subtle: size * 0.1,
    medium: size * 0.15,
    strong: size * 0.2,
  }[glowIntensity];

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      {/* Outer glow effect */}
      <View
        style={[
          styles.outerGlow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: glowColor,
            shadowOpacity: glowOpacity,
            shadowRadius: glowRadius,
          },
        ]}
      />

      {/* Main glass sphere container */}
      <View
        style={[
          styles.sphereContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {/* SVG Glass effects */}
        <Svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            {/* Glass gradient - depth effect - NO BLACK */}
            <RadialGradient id="glassDepth" cx="35%" cy="35%" r="65%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
              <Stop offset="25%" stopColor={glowColor} stopOpacity={0.12} />
              <Stop offset="50%" stopColor={glowColor} stopOpacity={0.06} />
              <Stop offset="75%" stopColor={glowColor} stopOpacity={0.08} />
              <Stop offset="100%" stopColor={glowColor} stopOpacity={0.05} />
            </RadialGradient>

            {/* Top highlight gradient - BRIGHTER */}
            <SvgLinearGradient id="topHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
              <Stop offset="30%" stopColor="#ffffff" stopOpacity={0.15} />
              <Stop offset="60%" stopColor="#ffffff" stopOpacity={0.05} />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </SvgLinearGradient>

            {/* Bottom shadow gradient - SUBTLE, no heavy black */}
            <SvgLinearGradient id="bottomShadow" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
              <Stop offset="60%" stopColor="#000000" stopOpacity={0} />
              <Stop offset="85%" stopColor="#000000" stopOpacity={0.05} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0.1} />
            </SvgLinearGradient>

            {/* Rim light gradient - MORE VISIBLE */}
            <SvgLinearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
              <Stop offset="25%" stopColor="#ffffff" stopOpacity={0.1} />
              <Stop offset="50%" stopColor={glowColor} stopOpacity={0.08} />
              <Stop offset="75%" stopColor={glowColor} stopOpacity={0.1} />
              <Stop offset="100%" stopColor={glowColor} stopOpacity={0.15} />
            </SvgLinearGradient>
          </Defs>

          {/* Main glass fill */}
          <Circle cx="100" cy="100" r="98" fill="url(#glassDepth)" />

          {/* Outer border - MORE VISIBLE */}
          <Circle
            cx="100"
            cy="100"
            r="97"
            fill="none"
            stroke={`${glowColor}40`}
            strokeWidth="1.5"
          />

          {/* Inner border - MORE VISIBLE */}
          <Circle
            cx="100"
            cy="100"
            r="91"
            fill="none"
            stroke={`${glowColor}25`}
            strokeWidth="1"
          />

          {/* Top highlight - main reflection - BRIGHTER */}
          <Ellipse
            cx="65"
            cy="45"
            rx="45"
            ry="22"
            fill="url(#topHighlight)"
            transform="rotate(-15 65 45)"
          />

          {/* Secondary smaller highlight - BRIGHTER */}
          <Ellipse
            cx="58"
            cy="38"
            rx="22"
            ry="8"
            fill="rgba(255, 255, 255, 0.25)"
            transform="rotate(-15 58 38)"
          />

          {/* Tiny bright spot - BRIGHTER */}
          <Circle cx="50" cy="35" r="5" fill="rgba(255, 255, 255, 0.35)" />

          {/* Additional bright spot */}
          <Circle cx="55" cy="42" r="3" fill="rgba(255, 255, 255, 0.2)" />

          {/* Bottom caustic reflection - MORE VISIBLE */}
          <Ellipse
            cx="140"
            cy="155"
            rx="30"
            ry="10"
            fill={`${glowColor}18`}
            transform="rotate(15 140 155)"
          />

          {/* Additional bottom-right glow */}
          <Ellipse
            cx="150"
            cy="145"
            rx="15"
            ry="6"
            fill={`${glowColor}12`}
            transform="rotate(20 150 145)"
          />

          {/* Bottom shadow overlay */}
          <Circle cx="100" cy="100" r="98" fill="url(#bottomShadow)" />

          {/* Rim light effect - top edge - STRONGER */}
          <Circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke="url(#rimLight)"
            strokeWidth="3"
          />
        </Svg>

        {/* Animated shine sweep */}
        {showShineSweep && <ShineSweep size={size} />}

        {/* Content container - the icon goes here */}
        <View style={styles.contentContainer}>{children}</View>

        {/* Inner shadow overlay for depth */}
        <View
          style={[
            styles.innerShadow,
            {
              borderRadius: size / 2,
            },
          ]}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
  },
  sphereContainer: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'transparent',
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    borderRightColor: 'rgba(0, 0, 0, 0.02)',
  },
});

export default GlassSphere;
