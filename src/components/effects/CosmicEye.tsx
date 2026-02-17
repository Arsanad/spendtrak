// SPENDTRAK CINEMATIC EDITION - CosmicEye (Realistic Human Eye)
// Westworld/Ex Machina aesthetic - supernatural neon green iris
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Path,
  Ellipse,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  ClipPath,
  G,
  Mask,
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
import { easeOutQuad, easeInQuad, easeInOutQuad } from '../../config/easingFunctions';
import { Colors } from '../../design/cinematic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export interface CosmicEyeProps {
  size?: number;
  active?: boolean;
  blinking?: boolean;
  glowing?: boolean;
}

export const CosmicEye: React.FC<CosmicEyeProps> = ({
  size = 64,
  active = true,
  blinking = true,
  glowing = true,
}) => {
  // Animation values
  const blinkScale = useSharedValue(1);
  const pupilDilation = useSharedValue(1);
  const glowIntensity = useSharedValue(0.3);
  const microMovementX = useSharedValue(0);
  const microMovementY = useSharedValue(0);

  // Blink animation
  useEffect(() => {
    if (blinking) {
      blinkScale.value = withRepeat(
        withSequence(
          withDelay(3500, withTiming(1, { duration: 0 })),
          withTiming(0.05, { duration: 70, easing: easeOutQuad }),
          withTiming(1, { duration: 100, easing: easeInQuad })
        ),
        -1,
        false
      );
    }
  }, [blinking]);

  // Pupil dilation animation (slow breathing)
  useEffect(() => {
    if (active) {
      pupilDilation.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 2000, easing: easeInOutQuad }),
          withTiming(0.9, { duration: 2000, easing: easeInOutQuad })
        ),
        -1,
        true
      );
    }
  }, [active]);

  // Glow pulse animation
  useEffect(() => {
    if (glowing) {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500, easing: easeInOutQuad }),
          withTiming(0.25, { duration: 1500, easing: easeInOutQuad })
        ),
        -1,
        true
      );
    }
  }, [glowing]);

  // Subtle micro-movements (looking animation)
  useEffect(() => {
    if (active) {
      microMovementX.value = withRepeat(
        withSequence(
          withDelay(2000, withTiming(0, { duration: 0 })),
          withTiming(0.5, { duration: 300, easing: easeInOutQuad }),
          withDelay(1500, withTiming(0.5, { duration: 0 })),
          withTiming(-0.3, { duration: 400, easing: easeInOutQuad }),
          withDelay(2000, withTiming(-0.3, { duration: 0 })),
          withTiming(0, { duration: 350, easing: easeInOutQuad })
        ),
        -1,
        false
      );
      microMovementY.value = withRepeat(
        withSequence(
          withDelay(2500, withTiming(0, { duration: 0 })),
          withTiming(-0.3, { duration: 350, easing: easeInOutQuad }),
          withDelay(1800, withTiming(-0.3, { duration: 0 })),
          withTiming(0.2, { duration: 300, easing: easeInOutQuad }),
          withDelay(2200, withTiming(0.2, { duration: 0 })),
          withTiming(0, { duration: 400, easing: easeInOutQuad })
        ),
        -1,
        false
      );
    }
  }, [active]);

  // Animated styles
  const blinkStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blinkScale.value }],
    backgroundColor: 'transparent',
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  const irisMovementStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: microMovementX.value },
      { translateY: microMovementY.value },
    ],
  }));

  // Dimensions
  const cx = size / 2;
  const cy = size / 2;
  const eyeballRadius = size * 0.46;
  const irisRadius = size * 0.32;
  const pupilBaseRadius = size * 0.11;
  const limbalRingWidth = size * 0.025;

  // Generate realistic iris fibers
  const generateIrisFibers = () => {
    const fibers = [];
    const fiberCount = 48;

    for (let i = 0; i < fiberCount; i++) {
      const angle = (i * 360 / fiberCount) * Math.PI / 180;
      const variation = Math.sin(i * 3.7) * 0.15 + 1;
      const innerR = pupilBaseRadius * 1.3;
      const outerR = irisRadius * 0.95 * variation;

      // Create wavy fiber path
      const midR = (innerR + outerR) / 2;
      const waviness = Math.sin(i * 2.3) * size * 0.015;

      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const xMid = cx + Math.cos(angle) * midR + Math.cos(angle + Math.PI/2) * waviness;
      const yMid = cy + Math.sin(angle) * midR + Math.sin(angle + Math.PI/2) * waviness;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;

      // Vary fiber opacity and color
      const opacity = 0.3 + Math.sin(i * 1.7) * 0.2;
      const isHighlight = i % 7 === 0;
      const color = isHighlight ? '#00ffaa' : (i % 3 === 0 ? Colors.neon : Colors.primary);

      fibers.push(
        <Path
          key={`fiber-${i}`}
          d={`M${x1} ${y1} Q${xMid} ${yMid} ${x2} ${y2}`}
          stroke={color}
          strokeWidth={size * 0.008}
          strokeOpacity={opacity}
          fill="none"
        />
      );
    }
    return fibers;
  };

  // Generate iris crypts (darker spots)
  const generateIrisCrypts = () => {
    const crypts = [];
    const cryptCount = 12;

    for (let i = 0; i < cryptCount; i++) {
      const angle = (i * 30 + 15) * Math.PI / 180;
      const radius = irisRadius * (0.5 + Math.sin(i * 2.1) * 0.2);
      const cryptX = cx + Math.cos(angle) * radius;
      const cryptY = cy + Math.sin(angle) * radius;
      const cryptSize = size * 0.015 * (0.8 + Math.sin(i * 1.3) * 0.4);

      crypts.push(
        <Circle
          key={`crypt-${i}`}
          cx={cryptX}
          cy={cryptY}
          r={cryptSize}
          fill={Colors.deep}
          fillOpacity={0.4 + Math.sin(i * 1.8) * 0.2}
        />
      );
    }
    return crypts;
  };

  // Animated pupil props
  const animatedPupilProps = useAnimatedProps(() => ({
    r: pupilBaseRadius * pupilDilation.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow effect */}
      {glowing && (
        <Animated.View style={[styles.glowContainer, { width: size * 1.3, height: size * 1.3 }, glowStyle]}>
          <View style={[styles.glow, {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            shadowColor: Colors.neon,
            shadowRadius: size * 0.3,
          }]} />
        </Animated.View>
      )}

      {/* Main eye with blink animation */}
      <Animated.View style={blinkStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            {/* Sclera gradient - pure black to blend with void background */}
            <RadialGradient id="scleraGrad" cx="45%" cy="35%" r="60%">
              <Stop offset="0%" stopColor="#000000" />
              <Stop offset="40%" stopColor="#000000" />
              <Stop offset="70%" stopColor="#000000" />
              <Stop offset="100%" stopColor="#000000" />
            </RadialGradient>

            {/* Iris base gradient - rich neon green */}
            <RadialGradient id="irisBaseGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={Colors.neon} stopOpacity="0.9" />
              <Stop offset="35%" stopColor={Colors.primary} stopOpacity="0.85" />
              <Stop offset="60%" stopColor="#00995a" stopOpacity="0.8" />
              <Stop offset="85%" stopColor={Colors.deep} stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#004d2e" stopOpacity="1" />
            </RadialGradient>

            {/* Iris highlight gradient */}
            <RadialGradient id="irisHighlight" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#66ffbb" stopOpacity="0.4" />
              <Stop offset="50%" stopColor={Colors.neon} stopOpacity="0.1" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>

            {/* Limbal ring gradient */}
            <RadialGradient id="limbalGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="85%" stopColor="transparent" />
              <Stop offset="92%" stopColor="#003322" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#001a11" stopOpacity="1" />
            </RadialGradient>

            {/* Pupil gradient - deep black with subtle edge */}
            <RadialGradient id="pupilGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#000000" />
              <Stop offset="70%" stopColor="#020202" />
              <Stop offset="100%" stopColor="#0a0a0a" />
            </RadialGradient>

            {/* Corneal reflection gradient */}
            <LinearGradient id="cornealReflect" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <Stop offset="50%" stopColor="#ccffee" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#00ff88" stopOpacity="0.3" />
            </LinearGradient>

            {/* Eye shape mask for realistic almond shape */}
            <ClipPath id="eyeShape">
              <Ellipse
                cx={cx}
                cy={cy}
                rx={eyeballRadius}
                ry={eyeballRadius * 0.85}
              />
            </ClipPath>
          </Defs>

          {/* Sclera (white of eye - dark themed) */}
          <Circle
            cx={cx}
            cy={cy}
            r={eyeballRadius}
            fill="url(#scleraGrad)"
          />

          {/* Subtle blood vessels in sclera - very faint */}
          <Path
            d={`M${cx - eyeballRadius * 0.9} ${cy - eyeballRadius * 0.1}
                Q${cx - eyeballRadius * 0.5} ${cy - eyeballRadius * 0.15} ${cx - irisRadius * 1.05} ${cy - eyeballRadius * 0.05}`}
            stroke="#110005"
            strokeWidth={0.5}
            strokeOpacity={0.15}
            fill="none"
          />
          <Path
            d={`M${cx + eyeballRadius * 0.85} ${cy + eyeballRadius * 0.15}
                Q${cx + eyeballRadius * 0.5} ${cy + eyeballRadius * 0.1} ${cx + irisRadius * 1.02} ${cy + eyeballRadius * 0.02}`}
            stroke="#110005"
            strokeWidth={0.4}
            strokeOpacity={0.1}
            fill="none"
          />

          {/* Limbal ring (dark ring around iris) */}
          <Circle
            cx={cx}
            cy={cy}
            r={irisRadius + limbalRingWidth}
            fill="none"
            stroke="#001108"
            strokeWidth={limbalRingWidth * 2}
            strokeOpacity={0.7}
          />

          {/* Iris - base color */}
          <Circle
            cx={cx}
            cy={cy}
            r={irisRadius}
            fill="url(#irisBaseGrad)"
          />

          {/* Iris texture - fibers */}
          <G>
            {generateIrisFibers()}
          </G>

          {/* Iris crypts (darker spots) */}
          <G>
            {generateIrisCrypts()}
          </G>

          {/* Iris collarette (ring around pupil) */}
          <Circle
            cx={cx}
            cy={cy}
            r={pupilBaseRadius * 1.8}
            fill="none"
            stroke={Colors.neon}
            strokeWidth={size * 0.01}
            strokeOpacity={0.4}
            strokeDasharray={`${size * 0.02} ${size * 0.015}`}
          />

          {/* Inner iris ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={irisRadius * 0.6}
            fill="none"
            stroke={Colors.primary}
            strokeWidth={size * 0.006}
            strokeOpacity={0.3}
          />

          {/* Iris highlight overlay */}
          <Circle
            cx={cx}
            cy={cy}
            r={irisRadius}
            fill="url(#irisHighlight)"
          />

          {/* Pupil with dilation animation */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            animatedProps={animatedPupilProps}
            fill="url(#pupilGrad)"
          />

          {/* Pupil edge detail */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            animatedProps={animatedPupilProps}
            fill="none"
            stroke="#001a0d"
            strokeWidth={size * 0.008}
            strokeOpacity={0.6}
          />

          {/* Main catchlight (top-left) - large window reflection */}
          <Ellipse
            cx={cx - irisRadius * 0.3}
            cy={cy - irisRadius * 0.35}
            rx={size * 0.055}
            ry={size * 0.045}
            fill="url(#cornealReflect)"
            transform={`rotate(-15, ${cx - irisRadius * 0.3}, ${cy - irisRadius * 0.35})`}
          />

          {/* Secondary catchlight (smaller) */}
          <Circle
            cx={cx + irisRadius * 0.25}
            cy={cy - irisRadius * 0.4}
            r={size * 0.02}
            fill="#ffffff"
            fillOpacity={0.6}
          />

          {/* Tertiary catchlight (tiny accent) */}
          <Circle
            cx={cx - irisRadius * 0.15}
            cy={cy + irisRadius * 0.35}
            r={size * 0.012}
            fill="#aaffdd"
            fillOpacity={0.35}
          />

          {/* Inner shadow for depth - pure black to blend */}
          <Circle
            cx={cx}
            cy={cy}
            r={eyeballRadius}
            fill="none"
            stroke="#000000"
            strokeWidth={size * 0.02}
            strokeOpacity={0.5}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Mini version for smaller displays
export const MiniCosmicEye: React.FC<{ size?: number; active?: boolean }> = ({
  size = 24,
  active = true,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const eyeballR = size * 0.46;
  const irisR = size * 0.32;
  const pupilR = size * 0.1;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="miniScleraGrad" cx="45%" cy="35%" r="60%">
          <Stop offset="0%" stopColor="#1a1a1a" />
          <Stop offset="100%" stopColor="#0a0a0a" />
        </RadialGradient>
        <RadialGradient id="miniIrisGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={Colors.neon} />
          <Stop offset="50%" stopColor={Colors.primary} />
          <Stop offset="100%" stopColor={Colors.deep} />
        </RadialGradient>
      </Defs>

      {/* Sclera */}
      <Circle
        cx={cx}
        cy={cy}
        r={eyeballR}
        fill="url(#miniScleraGrad)"
      />

      {/* Limbal ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={irisR + size * 0.02}
        fill="none"
        stroke="#002211"
        strokeWidth={size * 0.04}
        strokeOpacity={0.8}
      />

      {/* Iris */}
      <Circle
        cx={cx}
        cy={cy}
        r={irisR}
        fill="url(#miniIrisGrad)"
      />

      {/* Pupil */}
      <Circle
        cx={cx}
        cy={cy}
        r={pupilR}
        fill="#000000"
      />

      {/* Catchlight */}
      <Circle
        cx={cx - size * 0.1}
        cy={cy - size * 0.1}
        r={size * 0.05}
        fill="#ffffff"
        fillOpacity={0.8}
      />

      {/* Secondary catchlight */}
      <Circle
        cx={cx + size * 0.08}
        cy={cy - size * 0.12}
        r={size * 0.025}
        fill="#ffffff"
        fillOpacity={0.5}
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  glow: {
    backgroundColor: 'transparent',
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});

export default CosmicEye;
