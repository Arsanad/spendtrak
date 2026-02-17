/**
 * ExpandingRings - Premium 5-Ring System with Data Nodes
 *
 * Features:
 * - 5 different ring styles (solid, dashed, dotted, double, particles)
 * - Clockwise/counter-clockwise rotation
 * - Glow effects
 * - Data nodes with financial icons
 * - Staggered expansion
 */

import React, { memo, useEffect, useMemo } from 'react';
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
import { RING_CONFIG, COLORS, TIMING, DIMENSIONS } from './constants';
import { easeOutExpo, easeOutCubic, easeInOutCubic } from '../../../config/easingFunctions';

const { baseSize, rings, dataNodes } = RING_CONFIG;

// Type helpers for rings and data nodes
type RingType = (typeof rings)[number];
type DataNodeType = (typeof dataNodes)[number];

// Standard ring component
const Ring: React.FC<{
  config: RingType;
  phase: number;
  index: number;
}> = memo(({ config, phase, index }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (phase >= 4) {
      const delay = index * TIMING.ringStagger;

      // Scale animation
      scale.value = withDelay(
        delay,
        withTiming(config.endScale, {
          duration: TIMING.ringExpandDuration / config.speed,
          easing: easeOutExpo,
        })
      );

      // Opacity animation
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(0.9, { duration: 150 }),
          withDelay(TIMING.ringExpandDuration - 300, withTiming(0, { duration: 400 }))
        )
      );

      // Rotation animation
      if (config.rotation !== 0) {
        rotation.value = withDelay(
          delay,
          withTiming(config.rotation, {
            duration: TIMING.ringExpandDuration / config.speed,
            easing: easeOutCubic,
          })
        );
      }

      // Pulse animation for rings with pulse
      if ((config as any).pulses) {
        pulseOpacity.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(0.4, { duration: 200 }),
              withTiming(1, { duration: 200 })
            ),
            4,
            true
          )
        );
      }
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(rotation);
      cancelAnimation(pulseOpacity);
    };
  }, [phase, index, config]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value * pulseOpacity.value,
  }));

  // Skip particle rings - handled separately
  if (config.style === 'particles') return null;

  const getBorderStyle = () => {
    switch (config.style) {
      case 'dashed':
        return 'dashed';
      case 'dotted':
        return 'dotted';
      default:
        return 'solid';
    }
  };

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: baseSize,
          height: baseSize,
          borderRadius: baseSize / 2,
          borderWidth: config.strokeWidth,
          borderColor: config.color,
          borderStyle: getBorderStyle(),
          shadowColor: config.glow ? config.color : 'transparent',
          shadowOpacity: config.glow ? 0.6 : 0,
          shadowRadius: config.glow ? 8 : 0,
        },
        ringStyle,
      ]}
    />
  );
});

// Particle ring component
const ParticleRing: React.FC<{
  config: RingType;
  phase: number;
}> = memo(({ config, phase }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const particleCount = (config as any).particleCount || 24;

  useEffect(() => {
    if (phase >= 4) {
      const delay = 4 * TIMING.ringStagger;

      scale.value = withDelay(
        delay,
        withTiming(config.endScale, {
          duration: TIMING.ringExpandDuration / config.speed,
          easing: easeOutExpo,
        })
      );

      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(0.8, { duration: 150 }),
          withDelay(TIMING.ringExpandDuration - 300, withTiming(0, { duration: 400 }))
        )
      );

      rotation.value = withDelay(
        delay,
        withTiming(config.rotation, {
          duration: TIMING.ringExpandDuration / config.speed,
          easing: easeOutCubic,
        })
      );
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(rotation);
    };
  }, [phase, config]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particleRingContainer, containerStyle]}>
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * 360;
        const angleRad = (angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * (baseSize / 2 - 4);
        const y = Math.sin(angleRad) * (baseSize / 2 - 4);

        return (
          <View
            key={i}
            style={[
              styles.particleDot,
              {
                left: baseSize / 2 + x - 2,
                top: baseSize / 2 + y - 2,
                backgroundColor: config.color,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
});

// Data node component
const DataNode: React.FC<{
  node: DataNodeType;
  phase: number;
  index: number;
}> = memo(({ node, phase, index }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 4) {
      const delay = 300 + index * 80;

      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.3, { duration: 150, easing: easeOutExpo }),
          withTiming(1, { duration: 100 })
        )
      );

      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 150 }),
          withDelay(500, withTiming(0, { duration: 300 }))
        )
      );
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [phase, index]);

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Position at ring edge
  const angleRad = (node.angle * Math.PI) / 180;
  const radius = baseSize * 1.4;
  const x = Math.cos(angleRad) * radius;
  const y = Math.sin(angleRad) * radius;

  return (
    <Animated.View
      style={[
        styles.dataNode,
        {
          transform: [
            { translateX: x },
            { translateY: y },
          ],
        },
        nodeStyle,
      ]}
    >
      <View style={[styles.dataNodeCircle, { borderColor: node.color }]}>
        <Text style={[styles.dataNodeIcon, { color: node.color }]}>{node.icon}</Text>
      </View>
    </Animated.View>
  );
});

export interface ExpandingRingsProps {
  phase: number;
}

export const ExpandingRings: React.FC<ExpandingRingsProps> = memo(({ phase }) => {
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 4) {
      containerOpacity.value = withTiming(1, { duration: 100 });
    }
    if (phase >= 5) {
      containerOpacity.value = withDelay(500, withTiming(0, { duration: 300 }));
    }

    return () => cancelAnimation(containerOpacity);
  }, [phase]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (phase < 4) return null;

  const particleRingConfig = rings.find(r => r.style === 'particles');

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Standard rings */}
      {rings.filter(r => r.style !== 'particles').map((ring, i) => (
        <Ring key={ring.id} config={ring} phase={phase} index={i} />
      ))}

      {/* Particle ring */}
      {particleRingConfig && (
        <ParticleRing config={particleRingConfig} phase={phase} />
      )}

      {/* Data nodes */}
      {dataNodes.map((node, i) => (
        <DataNode key={node.angle} node={node} phase={phase} index={i} />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  ring: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
  },
  particleRingContainer: {
    position: 'absolute',
    width: baseSize,
    height: baseSize,
  },
  particleDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dataNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataNodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataNodeIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ExpandingRings;
