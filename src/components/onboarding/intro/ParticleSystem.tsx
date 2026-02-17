/**
 * ParticleSystem - Premium Cinematic Particle Animation
 *
 * 60+ particles with:
 * - Fibonacci spiral distribution
 * - Multiple sizes (2-8px) and colors
 * - Particle trails
 * - Sparkle/flash effects
 * - Spiral OUT then spiral BACK IN
 * - Staggered timing
 * - Pulse animations
 */

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  cancelAnimation,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { PARTICLE_CONFIG, COLORS, TIMING, DIMENSIONS } from './constants';
import { easeOutExpo, easeInExpo, easeInOutCubic } from '../../../config/easingFunctions';

interface ParticleData {
  id: number;
  angle: number;
  radius: number;
  size: number;
  color: string;
  speed: number;
  hasTrail: boolean;
  pulses: boolean;
  isSparkle: boolean;
  delay: number;
}

// Generate premium particles with fibonacci spiral
const generateParticles = (): ParticleData[] => {
  const particles: ParticleData[] = [];
  const { totalCount, sizes, colors, goldenAngle, maxRadius, pulseChance, trailParticles, sparkleCount } = PARTICLE_CONFIG;

  for (let i = 0; i < totalCount; i++) {
    const angle = i * goldenAngle;
    const normalizedIndex = i / totalCount;
    const radius = maxRadius * Math.sqrt(normalizedIndex);

    particles.push({
      id: i,
      angle: angle % 360,
      radius,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: PARTICLE_CONFIG.minSpeed + Math.random() * (PARTICLE_CONFIG.maxSpeed - PARTICLE_CONFIG.minSpeed),
      hasTrail: i < trailParticles,
      pulses: Math.random() < pulseChance,
      isSparkle: i >= totalCount - sparkleCount,
      delay: i * TIMING.particleStagger,
    });
  }

  return particles;
};

// Trail segment component
const TrailSegment: React.FC<{
  particle: ParticleData;
  segmentIndex: number;
  progress: SharedValue<number>;
}> = memo(({ particle, segmentIndex, progress }) => {
  const opacity = PARTICLE_CONFIG.trailOpacityDecay * (PARTICLE_CONFIG.trailLength - segmentIndex);
  const scale = 1 - (segmentIndex * 0.15);
  const delayFactor = segmentIndex * 0.08;

  const angleRad = (particle.angle * Math.PI) / 180;
  const maxX = Math.cos(angleRad) * particle.radius;
  const maxY = Math.sin(angleRad) * particle.radius;

  const style = useAnimatedStyle(() => {
    const trailProgress = Math.max(0, progress.value - delayFactor);
    const x = maxX * trailProgress;
    const y = maxY * trailProgress;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
      ],
      opacity: trailProgress > 0.1 ? opacity : 0,
    };
  });

  return (
    <Animated.View
      style={[
        styles.trailSegment,
        {
          width: particle.size * scale,
          height: particle.size * scale,
          borderRadius: (particle.size * scale) / 2,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
});

// Single particle with optional trail
const Particle: React.FC<{
  data: ParticleData;
  phase: number;
}> = memo(({ data, phase }) => {
  const progress = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Phase 2: Spiral out
    if (phase >= 2 && phase < 6) {
      progress.value = withDelay(
        data.delay,
        withTiming(1, {
          duration: TIMING.particleSpiralDuration / data.speed,
          easing: easeOutExpo,
        })
      );

      // Sparkle effect for sparkle particles
      if (data.isSparkle) {
        sparkleOpacity.value = withDelay(
          data.delay + 200,
          withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0.3, { duration: 200 }),
            withRepeat(
              withSequence(
                withTiming(1, { duration: 150 }),
                withTiming(0.3, { duration: 150 })
              ),
              3,
              true
            )
          )
        );
      }

      // Pulse animation
      if (data.pulses) {
        pulseScale.value = withDelay(
          data.delay,
          withRepeat(
            withSequence(
              withTiming(1.4, { duration: 300, easing: easeInOutCubic }),
              withTiming(1, { duration: 300, easing: easeInOutCubic })
            ),
            -1,
            true
          )
        );
      }
    }

    // Phase 6: Spiral back in
    if (phase >= 6) {
      progress.value = withTiming(0, {
        duration: TIMING.particleConvergeDuration,
        easing: easeInExpo,
      });
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }

    return () => {
      cancelAnimation(progress);
      cancelAnimation(sparkleOpacity);
      cancelAnimation(pulseScale);
    };
  }, [phase]);

  const angleRad = (data.angle * Math.PI) / 180;
  const maxX = Math.cos(angleRad) * data.radius;
  const maxY = Math.sin(angleRad) * data.radius;

  const particleStyle = useAnimatedStyle(() => {
    const x = maxX * progress.value;
    const y = maxY * progress.value;
    const baseOpacity = progress.value > 0.05 ? 0.85 : 0;
    const sparkle = data.isSparkle ? sparkleOpacity.value : 1;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: pulseScale.value },
      ],
      opacity: baseOpacity * sparkle,
    };
  });

  return (
    <>
      {/* Trail segments */}
      {data.hasTrail && Array.from({ length: PARTICLE_CONFIG.trailLength }).map((_, i) => (
        <TrailSegment
          key={`trail-${data.id}-${i}`}
          particle={data}
          segmentIndex={i + 1}
          progress={progress}
        />
      ))}

      {/* Main particle */}
      <Animated.View
        style={[
          styles.particle,
          {
            width: data.size,
            height: data.size,
            borderRadius: data.size / 2,
            backgroundColor: data.color,
            shadowColor: data.color,
          },
          particleStyle,
        ]}
      />
    </>
  );
});

export interface ParticleSystemProps {
  phase: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = memo(({ phase }) => {
  const particles = useMemo(() => generateParticles(), []);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 2) {
      containerOpacity.value = withTiming(1, { duration: 200 });
    }
    if (phase >= 6) {
      containerOpacity.value = withDelay(
        TIMING.particleConvergeDuration - 200,
        withTiming(0, { duration: 300 })
      );
    }

    return () => cancelAnimation(containerOpacity);
  }, [phase]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (phase < 2) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Center glow */}
      <View style={styles.centerGlow} />

      {/* Particles */}
      {particles.map((p) => (
        <Particle key={p.id} data={p} phase={phase} />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  centerGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  trailSegment: {
    position: 'absolute',
  },
});

export default ParticleSystem;
