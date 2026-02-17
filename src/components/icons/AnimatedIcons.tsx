// ============================================
// SPENDTRAK CINEMATIC EDITION
// Animated Icons (11 unique animations)
// Location: src/components/icons/AnimatedIcons.tsx
// ============================================
//
// Each icon has a UNIQUE animation:
// - Home: Chimney smoke wisps
// - Scan: Laser sweep line
// - Plus: Heartbeat pulse
// - Bills: Clock hands ticking
// - Stats: Pie slice rotation
// - Food: Steam rising
// - Transport: Wheels spinning
// - Shopping: Bag bounce
// - Settings: Gear rotation
// - Salary: Coin drop
// - Budgets: Ring fill pulse
//
// ============================================

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Mask,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  useDerivedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { easeOutQuad, easeInQuad, easeInOutQuad } from '../../config/easingFunctions';
import { Colors } from '../../design/cinematic';

// ==========================================
// TYPES
// ==========================================

export interface AnimatedIconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

// Animated SVG components
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ==========================================
// GRADIENT DEFINITION
// ==========================================

const IconGradient: React.FC<{ id: string; active?: boolean }> = ({ id, active }) => (
  <Defs>
    <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor={active ? Colors.neon : Colors.deep} />
      <Stop offset="100%" stopColor={active ? Colors.primary : Colors.dark} />
    </LinearGradient>
  </Defs>
);

// ==========================================
// 1. HOME ICON - Chimney Smoke Animation
// ==========================================

export const AnimatedHomeIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const smoke1Y = useSharedValue(0);
  const smoke2Y = useSharedValue(0);
  const smoke3Y = useSharedValue(0);
  const smoke1Opacity = useSharedValue(0);
  const smoke2Opacity = useSharedValue(0);
  const smoke3Opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      // Staggered smoke wisps
      smoke1Y.value = withRepeat(
        withTiming(-8, { duration: 2000, easing: easeOutQuad }),
        -1,
        false
      );
      smoke1Opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        false
      );

      smoke2Y.value = withDelay(
        400,
        withRepeat(
          withTiming(-10, { duration: 2200, easing: easeOutQuad }),
          -1,
          false
        )
      );
      smoke2Opacity.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 600 }),
            withTiming(0, { duration: 1600 })
          ),
          -1,
          false
        )
      );

      smoke3Y.value = withDelay(
        800,
        withRepeat(
          withTiming(-7, { duration: 1800, easing: easeOutQuad }),
          -1,
          false
        )
      );
      smoke3Opacity.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(0.4, { duration: 400 }),
            withTiming(0, { duration: 1400 })
          ),
          -1,
          false
        )
      );
    } else {
      smoke1Y.value = 0;
      smoke2Y.value = 0;
      smoke3Y.value = 0;
      smoke1Opacity.value = 0;
      smoke2Opacity.value = 0;
      smoke3Opacity.value = 0;
    }

    return () => {
      cancelAnimation(smoke1Y);
      cancelAnimation(smoke2Y);
      cancelAnimation(smoke3Y);
      cancelAnimation(smoke1Opacity);
      cancelAnimation(smoke2Opacity);
      cancelAnimation(smoke3Opacity);
    };
  }, [active]);

  const smoke1Props = useAnimatedProps(() => ({
    translateY: smoke1Y.value,
    opacity: smoke1Opacity.value,
  }));

  const smoke2Props = useAnimatedProps(() => ({
    translateY: smoke2Y.value,
    opacity: smoke2Opacity.value,
  }));

  const smoke3Props = useAnimatedProps(() => ({
    translateY: smoke3Y.value,
    opacity: smoke3Opacity.value,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="homeAnimGrad" active={active} />
      
      {/* House */}
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Chimney */}
      <Rect x="16" y="4" width="2" height="4" stroke={strokeColor} strokeWidth={1} />
      
      {/* Smoke wisps */}
      <AnimatedG animatedProps={smoke1Props}>
        <Circle cx="17" cy="3" r="0.8" fill={Colors.neon} />
      </AnimatedG>
      <AnimatedG animatedProps={smoke2Props}>
        <Circle cx="16.3" cy="2.5" r="0.6" fill={Colors.primary} />
      </AnimatedG>
      <AnimatedG animatedProps={smoke3Props}>
        <Circle cx="17.7" cy="2.8" r="0.5" fill={Colors.bright} />
      </AnimatedG>
    </Svg>
  );
};

// ==========================================
// 2. SCAN ICON - Laser Sweep Animation
// ==========================================

export const AnimatedScanIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const laserY = useSharedValue(8);
  const laserOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      laserY.value = withRepeat(
        withSequence(
          withTiming(16, { duration: 1000, easing: easeInOutQuad }),
          withTiming(8, { duration: 1000, easing: easeInOutQuad })
        ),
        -1,
        false
      );
      laserOpacity.value = withTiming(1, { duration: 200 });
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      laserY.value = 12;
      laserOpacity.value = 0;
      glowScale.value = 1;
    }

    return () => {
      cancelAnimation(laserY);
      cancelAnimation(laserOpacity);
      cancelAnimation(glowScale);
    };
  }, [active]);

  const laserProps = useAnimatedProps(() => ({
    y1: laserY.value,
    y2: laserY.value,
    opacity: laserOpacity.value,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="scanAnimGrad" active={active} />
      
      {/* Frame corners */}
      <Path d="M4 7V5a2 2 0 012-2h2" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M16 3h2a2 2 0 012 2v2" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M20 17v2a2 2 0 01-2 2h-2" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 21H6a2 2 0 01-2-2v-2" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      
      {/* Laser scan line */}
      <AnimatedLine
        x1="6"
        x2="18"
        animatedProps={laserProps}
        stroke={Colors.neon}
        strokeWidth={2}
        strokeLinecap="round"
      />
      
      {/* Glow effect dots at ends */}
      {active && (
        <>
          <Circle cx="6" cy="12" r="2" fill={Colors.neon} fillOpacity={0.3} />
          <Circle cx="18" cy="12" r="2" fill={Colors.neon} fillOpacity={0.3} />
        </>
      )}
    </Svg>
  );
};

// ==========================================
// 3. PLUS ICON - Heartbeat Pulse Animation
// ==========================================

export const AnimatedPlusIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 150, easing: easeOutQuad }),
          withTiming(0.95, { duration: 100, easing: easeInQuad }),
          withTiming(1.1, { duration: 100, easing: easeOutQuad }),
          withTiming(1, { duration: 150, easing: easeInQuad }),
          withDelay(600, withTiming(1, { duration: 0 }))
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 150 }),
          withTiming(0.2, { duration: 100 }),
          withTiming(0.6, { duration: 100 }),
          withTiming(0, { duration: 150 }),
          withDelay(600, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
    };
  }, [active]);

  const groupProps = useAnimatedProps(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="plusAnimGrad" active={active} />
      
      {/* Glow circle */}
      <AnimatedCircle
        cx="12"
        cy="12"
        r="10"
        fill={Colors.neon}
        animatedProps={glowProps}
      />
      
      {/* Plus sign */}
      <G transform="translate(12, 12)">
        <AnimatedG animatedProps={groupProps}>
          <G transform="translate(-12, -12)">
            <Line
              x1="12" y1="5" x2="12" y2="19"
              stroke={strokeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Line
              x1="5" y1="12" x2="19" y2="12"
              stroke={strokeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </G>
        </AnimatedG>
      </G>
    </Svg>
  );
};

// ==========================================
// 4. BILLS ICON - Clock Hands Ticking
// ==========================================

export const AnimatedBillsIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const minuteRotation = useSharedValue(0);
  const hourRotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      minuteRotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
      hourRotation.value = withRepeat(
        withTiming(30, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      minuteRotation.value = withTiming(0, { duration: 300 });
      hourRotation.value = withTiming(0, { duration: 300 });
    }

    return () => {
      cancelAnimation(minuteRotation);
      cancelAnimation(hourRotation);
    };
  }, [active]);

  const minuteProps = useAnimatedProps(() => ({
    transform: `rotate(${minuteRotation.value}, 12, 12)`,
  }));

  const hourProps = useAnimatedProps(() => ({
    transform: `rotate(${hourRotation.value}, 12, 12)`,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="billsAnimGrad" active={active} />
      
      {/* Clock face */}
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      
      {/* Hour hand */}
      <AnimatedLine
        x1="12"
        y1="12"
        x2="12"
        y2="8"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        animatedProps={hourProps}
      />
      
      {/* Minute hand */}
      <AnimatedLine
        x1="12"
        y1="12"
        x2="12"
        y2="6"
        stroke={active ? Colors.neon : strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        animatedProps={minuteProps}
      />
      
      {/* Center dot */}
      <Circle cx="12" cy="12" r="1.5" fill={strokeColor} />
      
      {/* Dollar sign */}
      <Path
        d="M12 16v1M12 7v1M14 9.5c-.5-1-1.5-1.5-2-1.5s-2 .5-2 1.5 1 1.5 2 2 2 1 2 2-1 1.5-2 1.5-1.5-.5-2-1.5"
        stroke={strokeColor}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
};

// ==========================================
// 5. STATS ICON - Pie Slice Rotation
// ==========================================

export const AnimatedStatsIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const rotation = useSharedValue(0);
  const sliceOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (active) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      sliceOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 750 }),
          withTiming(0.3, { duration: 750 })
        ),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
      sliceOpacity.value = 0.3;
    }

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(sliceOpacity);
    };
  }, [active]);

  const pieProps = useAnimatedProps(() => ({
    transform: `rotate(${rotation.value}, 12, 12)`,
  }));

  const sliceProps = useAnimatedProps(() => ({
    fillOpacity: sliceOpacity.value,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="statsAnimGrad" active={active} />
      
      {/* Outer circle */}
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      
      {/* Animated pie slice */}
      <AnimatedG animatedProps={pieProps}>
        <AnimatedPath
          d="M12 12 L12 3 A9 9 0 0 1 21 12 Z"
          fill={active ? Colors.neon : Colors.primary}
          animatedProps={sliceProps}
        />
      </AnimatedG>
      
      {/* Center line */}
      <Path
        d="M12 3v9l6 3"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// ==========================================
// 6. FOOD ICON - Steam Rising
// ==========================================

export const AnimatedFoodIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const steam1Y = useSharedValue(0);
  const steam2Y = useSharedValue(0);
  const steam3Y = useSharedValue(0);
  const steamOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      steamOpacity.value = withTiming(1, { duration: 300 });
      
      steam1Y.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1500, easing: easeOutQuad }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
      
      steam2Y.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 1800, easing: easeOutQuad }),
            withTiming(0, { duration: 0 })
          ),
          -1,
          false
        )
      );
      
      steam3Y.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 1200, easing: easeOutQuad }),
            withTiming(0, { duration: 0 })
          ),
          -1,
          false
        )
      );
    } else {
      steamOpacity.value = withTiming(0, { duration: 200 });
      steam1Y.value = 0;
      steam2Y.value = 0;
      steam3Y.value = 0;
    }

    return () => {
      cancelAnimation(steamOpacity);
      cancelAnimation(steam1Y);
      cancelAnimation(steam2Y);
      cancelAnimation(steam3Y);
    };
  }, [active]);

  const steam1Props = useAnimatedProps(() => ({
    translateY: steam1Y.value,
    opacity: interpolate(steam1Y.value, [0, -6], [0.8, 0]),
  }));

  const steam2Props = useAnimatedProps(() => ({
    translateY: steam2Y.value,
    opacity: interpolate(steam2Y.value, [0, -8], [0.6, 0]),
  }));

  const steam3Props = useAnimatedProps(() => ({
    translateY: steam3Y.value,
    opacity: interpolate(steam3Y.value, [0, -5], [0.7, 0]),
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="foodAnimGrad" active={active} />
      
      {/* Cup */}
      <Path d="M18 8h1a4 4 0 010 8h-1" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke={strokeColor} strokeWidth={1.5} />
      
      {/* Steam wisps */}
      <AnimatedG animatedProps={steam1Props}>
        <Path d="M6 4c0-1 1-2 1-2s1 1 1 2" stroke={Colors.neon} strokeWidth={1} strokeLinecap="round" fill="none" />
      </AnimatedG>
      <AnimatedG animatedProps={steam2Props}>
        <Path d="M10 3c0-1 1-2 1-2s1 1 1 2" stroke={Colors.primary} strokeWidth={1} strokeLinecap="round" fill="none" />
      </AnimatedG>
      <AnimatedG animatedProps={steam3Props}>
        <Path d="M14 4.5c0-1 1-2 1-2s1 1 1 2" stroke={Colors.bright} strokeWidth={1} strokeLinecap="round" fill="none" />
      </AnimatedG>
    </Svg>
  );
};

// ==========================================
// 7. TRANSPORT ICON - Wheels Spinning
// ==========================================

export const AnimatedTransportIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const wheelRotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      wheelRotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      wheelRotation.value = withTiming(0, { duration: 300 });
    }

    return () => {
      cancelAnimation(wheelRotation);
    };
  }, [active]);

  const wheel1Props = useAnimatedProps(() => ({
    transform: `rotate(${wheelRotation.value}, 7, 17)`,
  }));

  const wheel2Props = useAnimatedProps(() => ({
    transform: `rotate(${wheelRotation.value}, 17, 17)`,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="transportAnimGrad" active={active} />
      
      {/* Car body */}
      <Path
        d="M5 17H3v-6l2-5h9l4 5h3v6h-2"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Front wheel with spokes */}
      <AnimatedG animatedProps={wheel1Props}>
        <Circle cx="7" cy="17" r="2" stroke={strokeColor} strokeWidth={1.5} fill="none" />
        <Line x1="7" y1="15.5" x2="7" y2="18.5" stroke={strokeColor} strokeWidth={0.5} />
        <Line x1="5.5" y1="17" x2="8.5" y2="17" stroke={strokeColor} strokeWidth={0.5} />
      </AnimatedG>
      
      {/* Rear wheel with spokes */}
      <AnimatedG animatedProps={wheel2Props}>
        <Circle cx="17" cy="17" r="2" stroke={strokeColor} strokeWidth={1.5} fill="none" />
        <Line x1="17" y1="15.5" x2="17" y2="18.5" stroke={strokeColor} strokeWidth={0.5} />
        <Line x1="15.5" y1="17" x2="18.5" y2="17" stroke={strokeColor} strokeWidth={0.5} />
      </AnimatedG>
      
      {/* Axle line */}
      <Line x1="9" y1="17" x2="15" y2="17" stroke={strokeColor} strokeWidth={1.5} />
    </Svg>
  );
};

// ==========================================
// 8. SHOPPING ICON - Bag Bounce
// ==========================================

export const AnimatedShoppingIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const bounceY = useSharedValue(0);
  const squash = useSharedValue(1);

  useEffect(() => {
    if (active) {
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 200, easing: easeOutQuad }),
          withTiming(0, { duration: 200, easing: Easing.bounce })
        ),
        -1,
        false
      );
      squash.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 200 }),
          withTiming(1.05, { duration: 100 }),
          withTiming(1, { duration: 100 })
        ),
        -1,
        false
      );
    } else {
      bounceY.value = withTiming(0, { duration: 200 });
      squash.value = withTiming(1, { duration: 200 });
    }

    return () => {
      cancelAnimation(bounceY);
      cancelAnimation(squash);
    };
  }, [active]);

  const bagProps = useAnimatedProps(() => ({
    transform: `translate(0, ${bounceY.value}) scale(1, ${squash.value})`,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="shopAnimGrad" active={active} />
      
      <AnimatedG animatedProps={bagProps}>
        {/* Shopping bag */}
        <Path d="M6 6h15l-1.5 9h-12z" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" />
        
        {/* Wheels */}
        <Circle cx="9" cy="20" r="1" stroke={strokeColor} strokeWidth={1.5} />
        <Circle cx="18" cy="20" r="1" stroke={strokeColor} strokeWidth={1.5} />
        
        {/* Handle */}
        <Path d="M6 6L5 3H2" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </AnimatedG>
    </Svg>
  );
};

// ==========================================
// 9. SETTINGS ICON - Gear Rotation
// ==========================================

export const AnimatedSettingsIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 500 });
    }

    return () => {
      cancelAnimation(rotation);
    };
  }, [active]);

  const gearProps = useAnimatedProps(() => ({
    transform: `rotate(${rotation.value}, 12, 12)`,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="settingsAnimGrad" active={active} />
      
      <AnimatedG animatedProps={gearProps}>
        {/* Gear teeth */}
        <Path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </AnimatedG>
      
      {/* Center circle (doesn't rotate) */}
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={strokeColor}
        strokeWidth={1.5}
      />
    </Svg>
  );
};

// ==========================================
// 10. SALARY/INCOME ICON - Coin Drop
// ==========================================

export const AnimatedSalaryIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const coinY = useSharedValue(-8);
  const coinOpacity = useSharedValue(0);
  const coinScale = useSharedValue(0.5);

  useEffect(() => {
    if (active) {
      coinY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(12, { duration: 600, easing: easeInQuad }),
          withDelay(400, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      );
      coinOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(500, withTiming(0, { duration: 100 })),
          withDelay(400, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      );
      coinScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(700, withTiming(0.5, { duration: 100 }))
        ),
        -1,
        false
      );
    } else {
      coinY.value = -8;
      coinOpacity.value = 0;
      coinScale.value = 0.5;
    }

    return () => {
      cancelAnimation(coinY);
      cancelAnimation(coinOpacity);
      cancelAnimation(coinScale);
    };
  }, [active]);

  const coinProps = useAnimatedProps(() => ({
    translateY: coinY.value,
    opacity: coinOpacity.value,
    scale: coinScale.value,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="salaryAnimGrad" active={active} />
      
      {/* Arrow pointing up */}
      <Line x1="12" y1="19" x2="12" y2="5" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M5 12l7-7 7 7" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Falling coin */}
      <AnimatedG animatedProps={coinProps}>
        <Circle cx="12" cy="3" r="2.5" fill={Colors.neon} stroke={Colors.primary} strokeWidth={1} />
        <Path d="M12 1.5v3M11 3h2" stroke={Colors.void} strokeWidth={0.5} />
      </AnimatedG>
      
      {/* Base line */}
      <Line x1="5" y1="19" x2="19" y2="19" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
};

// ==========================================
// 11. BUDGETS ICON - Ring Fill Pulse
// ==========================================

export const AnimatedBudgetsIcon: React.FC<AnimatedIconProps> = ({
  size = 24,
  color,
  active = false,
}) => {
  const fillProgress = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      fillProgress.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 1500, easing: easeInOutQuad }),
          withTiming(0.25, { duration: 1500, easing: easeInOutQuad })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 750 }),
          withTiming(0.2, { duration: 750 })
        ),
        -1,
        false
      );
    } else {
      fillProgress.value = withTiming(0.5, { duration: 500 });
      pulseOpacity.value = 0;
    }

    return () => {
      cancelAnimation(fillProgress);
      cancelAnimation(pulseOpacity);
    };
  }, [active]);

  // Calculate arc path based on fill progress
  const arcEndAngle = useDerivedValue(() => {
    return fillProgress.value * 360;
  });

  const arcProps = useAnimatedProps(() => {
    const angle = arcEndAngle.value;
    const radians = (angle - 90) * (Math.PI / 180);
    const x = 12 + 7 * Math.cos(radians);
    const y = 12 + 7 * Math.sin(radians);
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      d: angle > 0 
        ? `M 12 5 A 7 7 0 ${largeArc} 1 ${x} ${y}`
        : 'M 12 5 A 7 7 0 0 1 12 5',
    };
  });

  const pulseProps = useAnimatedProps(() => ({
    opacity: pulseOpacity.value,
  }));

  const strokeColor = color || (active ? Colors.neon : Colors.deep);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconGradient id="budgetsAnimGrad" active={active} />
      
      {/* Pulse glow */}
      <AnimatedCircle
        cx="12"
        cy="12"
        r="9"
        fill={Colors.neon}
        animatedProps={pulseProps}
      />
      
      {/* Background ring */}
      <Circle
        cx="12"
        cy="12"
        r="7"
        stroke={Colors.darker}
        strokeWidth={3}
        fill="none"
      />
      
      {/* Animated fill arc */}
      <AnimatedPath
        animatedProps={arcProps}
        stroke={active ? Colors.neon : Colors.primary}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Center text/icon */}
      <Circle cx="12" cy="12" r="3" fill={strokeColor} />
    </Svg>
  );
};

