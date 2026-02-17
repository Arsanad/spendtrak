/**
 * SPENDTRAK CINEMATIC EDITION - Bottom Green Glow / Smoke Effect
 * Green light radiates upward from the bottom screen edge.
 * Container is TRANSPARENT — only gradient layers add green.
 * Uses ONLY Expo Go compatible packages.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GLOW_HEIGHT = Math.round(SCREEN_HEIGHT * 0.45);

// ──────────────────────────────────────────────
// SVG Cloud Layer (radial gradient anchored to bottom)
// ──────────────────────────────────────────────
interface CloudProps {
  cx: string;
  cy: string;
  r: string;
  coreColor: string;
  coreOpacity: number;
  id: string;
}

const CloudLayer: React.FC<CloudProps> = ({ cx, cy, r, coreColor, coreOpacity, id }) => (
  <Svg width={SCREEN_WIDTH} height={GLOW_HEIGHT} style={StyleSheet.absoluteFill}>
    <Defs>
      <RadialGradient id={id} cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor={coreColor} stopOpacity={coreOpacity} />
        <Stop offset="0.35" stopColor={coreColor} stopOpacity={coreOpacity * 0.5} />
        <Stop offset="1" stopColor={coreColor} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width={SCREEN_WIDTH} height={GLOW_HEIGHT} fill={`url(#${id})`} />
  </Svg>
);

// ──────────────────────────────────────────────
// Bottom Glow Component
// ──────────────────────────────────────────────
export const BottomGlow: React.FC = () => {
  const cloud1Opacity = useSharedValue(1);
  const cloud2Opacity = useSharedValue(1);
  const cloud3Opacity = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Cloud 1 — slow breath (6s)
    cloud1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Cloud 2 — medium breath (5s)
    cloud2Opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Cloud 3 — fast breath (4s)
    cloud3Opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Glow pulse — slow throb (8s)
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const cloud1Style = useAnimatedStyle(() => ({ opacity: cloud1Opacity.value }));
  const cloud2Style = useAnimatedStyle(() => ({ opacity: cloud2Opacity.value }));
  const cloud3Style = useAnimatedStyle(() => ({ opacity: cloud3Opacity.value }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Layer 1: Base gradient — transparent at top, green at bottom */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(0, 255, 136, 0.03)',
          'rgba(0, 255, 136, 0.12)',
          'rgba(0, 255, 136, 0.22)',
        ]}
        locations={[0, 0.4, 0.75, 1.0]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Layer 2: Cloud 1 — large center bloom at bottom */}
      <Animated.View style={[StyleSheet.absoluteFill, cloud1Style]}>
        <CloudLayer
          id="cloud1"
          cx={`${SCREEN_WIDTH / 2}`}
          cy={`${GLOW_HEIGHT}`}
          r={`${SCREEN_WIDTH * 0.6}`}
          coreColor="#00ff88"
          coreOpacity={0.2}
        />
      </Animated.View>

      {/* Layer 3: Cloud 2 — offset left, bottom */}
      <Animated.View style={[StyleSheet.absoluteFill, cloud2Style]}>
        <CloudLayer
          id="cloud2"
          cx={`${SCREEN_WIDTH * 0.25}`}
          cy={`${GLOW_HEIGHT * 0.95}`}
          r={`${SCREEN_WIDTH * 0.4}`}
          coreColor="#00cc6a"
          coreOpacity={0.15}
        />
      </Animated.View>

      {/* Layer 4: Cloud 3 — offset right, bottom */}
      <Animated.View style={[StyleSheet.absoluteFill, cloud3Style]}>
        <CloudLayer
          id="cloud3"
          cx={`${SCREEN_WIDTH * 0.75}`}
          cy={`${GLOW_HEIGHT * 0.9}`}
          r={`${SCREEN_WIDTH * 0.35}`}
          coreColor="#00e67a"
          coreOpacity={0.12}
        />
      </Animated.View>

      {/* Layer 5: Glow pulse — soft wash from bottom */}
      <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(0, 255, 136, 0.04)', 'rgba(0, 255, 136, 0.14)']}
          locations={[0, 0.5, 1.0]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GLOW_HEIGHT,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
});

export default BottomGlow;
