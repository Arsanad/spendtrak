// SPENDTRAK CINEMATIC EDITION - AtmosphericFog
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Colors } from '../../design/cinematic';

export interface AtmosphericFogProps {
  intensity?: 'subtle' | 'normal' | 'intense';
  showParticles?: boolean;
  particleCount?: number;
  children?: React.ReactNode;
}

interface Particle { id: number; x: number; y: number; size: number; opacity: number; duration: number; delay: number; }

const genParticles = (n: number): Particle[] => Array.from({ length: n }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100, size: 2 + Math.random() * 6,
  opacity: 0.1 + Math.random() * 0.3, duration: 8000 + Math.random() * 12000, delay: Math.random() * 5000,
}));

const AnimParticle: React.FC<{ p: Particle; mult: number }> = ({ p, mult }) => {
  const ty = useSharedValue(0), op = useSharedValue(p.opacity);
  useEffect(() => {
    ty.value = withDelay(p.delay, withRepeat(withTiming(-50, { duration: p.duration, easing: Easing.inOut(Easing.ease) }), -1, true));
    op.value = withDelay(p.delay, withRepeat(withTiming(p.opacity * 0.3, { duration: p.duration * 0.5, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: op.value * mult }));
  return <Animated.View style={[styles.particle, { left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: p.size / 2 }, style]} />;
};

export const AtmosphericFog: React.FC<AtmosphericFogProps> = ({ intensity = 'normal', showParticles = true, particleCount = 40, children }) => {
  const particles = useMemo(() => genParticles(particleCount), [particleCount]);
  const mult = intensity === 'subtle' ? 0.5 : intensity === 'intense' ? 1.3 : 1;
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.fogLayer, { height: '35%', opacity: mult }]} pointerEvents="none">
        <LinearGradient colors={['transparent', Colors.transparent.primary10, Colors.transparent.neon15]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.fogLayer, { height: '25%', opacity: mult * 0.8 }]} pointerEvents="none">
        <LinearGradient colors={['transparent', Colors.transparent.deep10, Colors.transparent.neon10]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.fogLayer, { height: '15%', opacity: mult * 0.6 }]} pointerEvents="none">
        <LinearGradient colors={['transparent', Colors.transparent.neon20]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      </View>
      {showParticles && <View style={styles.particleContainer} pointerEvents="none">{particles.map(p => <AnimParticle key={p.id} p={p} mult={mult} />)}</View>}
      {children}
    </View>
  );
};

export const SimpleFog: React.FC<{ height?: number | string }> = ({ height = '40%' }) => (
  <View style={[styles.simpleFog, { height }]} pointerEvents="none">
    <LinearGradient colors={['transparent', Colors.transparent.primary10, Colors.transparent.neon15]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
  </View>
);

export const TopFog: React.FC<{ height?: number | string }> = ({ height = '25%' }) => (
  <View style={[styles.topFog, { height }]} pointerEvents="none">
    <LinearGradient colors={[Colors.transparent.darker40, Colors.transparent.dark20, 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
  </View>
);

export const AmbientBackground: React.FC<{ children?: React.ReactNode; intensity?: 'subtle' | 'normal' | 'intense' }> = ({ children, intensity = 'normal' }) => (
  <View style={styles.ambientContainer}>
    <View style={styles.blackBg} />
    <AtmosphericFog intensity={intensity} showParticles />
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  fogLayer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  particleContainer: { ...StyleSheet.absoluteFillObject },
  particle: { position: 'absolute', backgroundColor: Colors.neon, shadowColor: Colors.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 },
  simpleFog: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  topFog: { position: 'absolute', top: 0, left: 0, right: 0 },
  ambientContainer: { flex: 1, backgroundColor: Colors.void },
  blackBg: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.void },
});

export default AtmosphericFog;
