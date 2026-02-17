/**
 * ScreenSkeleton - Loading placeholder for lazily loaded screens
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { easeInOutQuad } from '../../config/easingFunctions';

const PulsingBlock: React.FC<{ height: number; style?: object }> = ({ height, style }) => {
  const opacity = useSharedValue(0.05);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.15, { duration: 900, easing: easeInOutQuad }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,255,136,${opacity.value})`,
  }));

  return <Animated.View style={[styles.block, { height }, animatedStyle, style]} />;
};

export const ScreenSkeleton: React.FC = () => (
  <View style={styles.container}>
    <PulsingBlock height={40} style={styles.header} />
    <PulsingBlock height={120} />
    <PulsingBlock height={80} />
    <PulsingBlock height={120} />
    <PulsingBlock height={60} />
  </View>
);

export const ChartSkeleton: React.FC = () => (
  <View style={styles.chartContainer}>
    <PulsingBlock height={200} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    gap: 12,
  },
  header: {
    marginBottom: 4,
  },
  block: {
    borderRadius: 8,
  },
  chartContainer: {
    padding: 16,
  },
});
