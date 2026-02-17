// SPENDTRAK CINEMATIC EDITION - CosmicEye (AI Avatar)
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Defs, RadialGradient, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing, interpolate } from 'react-native-reanimated';
import { Colors } from '../../design/cinematic';

export interface CosmicEyeProps { size?: number; active?: boolean; blinking?: boolean; glowing?: boolean; }

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedView = Animated.createAnimatedComponent(View);

export const CosmicEye: React.FC<CosmicEyeProps> = ({ size = 64, active = true, blinking = true, glowing = true }) => {
  const irisRot = useSharedValue(0), innerRot = useSharedValue(0), blinkProg = useSharedValue(0), glowOp = useSharedValue(0.3), pupilScale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      irisRot.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
      innerRot.value = withRepeat(withTiming(-360, { duration: 15000, easing: Easing.linear }), -1, false);
      if (blinking) blinkProg.value = withRepeat(withSequence(withDelay(3000, withTiming(0, { duration: 0 })), withTiming(1, { duration: 80, easing: Easing.out(Easing.ease) }), withTiming(0, { duration: 120, easing: Easing.in(Easing.ease) })), -1, false);
      if (glowing) glowOp.value = withRepeat(withSequence(withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }), withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })), -1, false);
      pupilScale.value = withRepeat(withSequence(withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), withTiming(0.95, { duration: 1500, easing: Easing.inOut(Easing.ease) })), -1, false);
    }
  }, [active, blinking, glowing]);

  const irisProps = useAnimatedProps(() => ({ transform: [{ rotate: `${irisRot.value}deg` }] }));
  const innerProps = useAnimatedProps(() => ({ transform: [{ rotate: `${innerRot.value}deg` }] }));
  const lidProps = useAnimatedProps(() => ({ ry: interpolate(blinkProg.value, [0, 1], [0, size * 0.5]), opacity: blinkProg.value }));
  const pupilProps = useAnimatedProps(() => ({ r: (size * 0.08) * pupilScale.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  const eyeR = size * 0.45, irisR = size * 0.32, pupilR = size * 0.08, cx = size / 2, cy = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {glowing && (
        <AnimatedView style={[styles.glowContainer, { width: size * 1.5, height: size * 1.5 }, glowStyle]}>
          <Svg width={size * 1.5} height={size * 1.5}>
            <Defs><RadialGradient id="eyeGlow" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor={Colors.neon} stopOpacity="0.6" /><Stop offset="50%" stopColor={Colors.primary} stopOpacity="0.2" /><Stop offset="100%" stopColor={Colors.void} stopOpacity="0" /></RadialGradient></Defs>
            <Circle cx={size * 0.75} cy={size * 0.75} r={size * 0.6} fill="url(#eyeGlow)" />
          </Svg>
        </AnimatedView>
      )}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="irisGrad" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor={Colors.neon} /><Stop offset="40%" stopColor={Colors.primary} /><Stop offset="70%" stopColor={Colors.deep} /><Stop offset="100%" stopColor={Colors.darker} /></RadialGradient>
          <LinearGradient id="outerRing" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={Colors.neon} /><Stop offset="50%" stopColor={Colors.deep} /><Stop offset="100%" stopColor={Colors.neon} /></LinearGradient>
          <RadialGradient id="sclera" cx="50%" cy="40%" r="50%"><Stop offset="0%" stopColor="#1a1a1a" /><Stop offset="80%" stopColor="#0a0a0a" /><Stop offset="100%" stopColor={Colors.void} /></RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={eyeR} fill="url(#sclera)" stroke={Colors.darker} strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={eyeR - 1} fill="none" stroke="url(#outerRing)" strokeWidth={2} strokeDasharray={`${Math.PI * 2} ${Math.PI * 4}`} />
        <AnimatedG animatedProps={irisProps} origin={`${cx}, ${cy}`}>
          <Circle cx={cx} cy={cy} r={irisR} fill="url(#irisGrad)" />
          {Array.from({ length: 24 }).map((_, i) => { const a = (i * 15) * Math.PI / 180, ir = irisR * 0.3, or = irisR * 0.9; return <Path key={i} d={`M${cx + Math.cos(a) * ir} ${cy + Math.sin(a) * ir} L${cx + Math.cos(a) * or} ${cy + Math.sin(a) * or}`} stroke={i % 2 === 0 ? Colors.neon : Colors.deep} strokeWidth={0.5} opacity={0.5} />; })}
          <Circle cx={cx} cy={cy} r={irisR * 0.6} fill="none" stroke={Colors.neon} strokeWidth={0.5} opacity={0.3} />
        </AnimatedG>
        <AnimatedG animatedProps={innerProps} origin={`${cx}, ${cy}`}>
          {Array.from({ length: 8 }).map((_, i) => { const a = (i * 45) * Math.PI / 180, r = irisR * 0.25; return <Circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={1} fill={Colors.neon} opacity={0.6} />; })}
        </AnimatedG>
        <AnimatedCircle animatedProps={pupilProps} cx={cx} cy={cy} fill={Colors.void} />
        <Circle cx={cx - irisR * 0.25} cy={cy - irisR * 0.25} r={size * 0.03} fill="#ffffff" opacity={0.8} />
        <Circle cx={cx + irisR * 0.15} cy={cy - irisR * 0.35} r={size * 0.015} fill="#ffffff" opacity={0.5} />
        <AnimatedEllipse animatedProps={lidProps} cx={cx} cy={cy} rx={eyeR + 2} fill={Colors.void} />
      </Svg>
    </View>
  );
};

export const MiniCosmicEye: React.FC<{ size?: number; active?: boolean }> = ({ size = 24, active = true }) => {
  const rot = useSharedValue(0);
  useEffect(() => { if (active) rot.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1, false); }, [active]);
  const rotProps = useAnimatedProps(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs><RadialGradient id="miniIris" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor={Colors.neon} /><Stop offset="70%" stopColor={Colors.deep} /><Stop offset="100%" stopColor={Colors.darker} /></RadialGradient></Defs>
      <Circle cx="12" cy="12" r="10" fill="#0a0a0a" stroke={Colors.darker} strokeWidth={1} />
      <AnimatedG animatedProps={rotProps} origin="12, 12">
        <Circle cx="12" cy="12" r="7" fill="url(#miniIris)" />
        {Array.from({ length: 8 }).map((_, i) => <Path key={i} d={`M12 12 L${12 + Math.cos(i * Math.PI / 4) * 7} ${12 + Math.sin(i * Math.PI / 4) * 7}`} stroke={Colors.neon} strokeWidth={0.3} opacity={0.5} />)}
      </AnimatedG>
      <Circle cx="12" cy="12" r="2" fill={Colors.void} />
      <Circle cx="10.5" cy="10.5" r="1" fill="#ffffff" opacity={0.7} />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glowContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});

export default CosmicEye;
