/**
 * QuantumAvatarAnimated.tsx
 * QUANTUM AI with PERSONALITY, EMOTIONS, and SHINY SPARKLE EFFECT!
 *
 * BASE LAYERS (always running):
 * - Constant floating (up/down sine wave)
 * - Shimmer effect (light moving across QUANTUM)
 * - Sparkle points (twinkling on QUANTUM surface)
 *
 * EMOTION ANIMATIONS (play on top of base):
 * - Excited Spin: 360° Y-axis spin
 * - Zoom Side: Quick zoom left/right
 * - Angry Shake: Rapid shake with red glow
 * - Happy Bounce: Bouncy jump with green glow
 * - Thinking: Wobble with blue glow
 * - Alert: Scale up + pulse with yellow glow
 * - Idle Patrol: Fly around pattern
 * - Barrel Roll: 360° Z-axis flip
 */

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withSpring,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { easeOutQuad, easeInQuad, easeInOutQuad, easeInOutSine, easeInOutCubic, easeOutCubic } from '../../config/easingFunctions';
import { QuantumRobotIcon, QuantumRobotIconProps } from './QuantumRobotIcon';
import { Colors } from '../../design/cinematic';

// Diamond/star sparkle component (same as AnimatedAddButton)
const DiamondSparkle: React.FC<{ size: number; id: string }> = ({ size, id }) => (
  <Svg width={size} height={size} viewBox="0 0 10 10">
    <Defs>
      <LinearGradient id={`sparkleGrad${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" />
        <Stop offset="100%" stopColor={Colors.neon} />
      </LinearGradient>
    </Defs>
    {/* 4-point star/diamond shape */}
    <Path
      d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z"
      fill={`url(#sparkleGrad${id})`}
    />
  </Svg>
);

// Animation types
type IdleAnimation = 'patrol' | 'spin' | 'zoomSide' | 'barrelRoll';
type MoodAnimation = 'happyBounce' | 'angryShake' | 'thinking' | 'alert';
type AllAnimation = IdleAnimation | MoodAnimation;

// Mood types
export type QuantumMood = 'idle' | 'happy' | 'angry' | 'thinking' | 'alert';

// Glow colors for mood animations
const GLOW_COLORS = {
  none: 'transparent',
  happy: 'rgba(0, 255, 136, 0.7)',
  angry: 'rgba(255, 50, 50, 0.7)',
  thinking: 'rgba(100, 150, 255, 0.6)',
  alert: 'rgba(255, 200, 50, 0.7)',
};

// Expose animation controls
export interface QuantumAnimationControls {
  playIdle: () => void;
  playHappy: () => void;
  playAngry: () => void;
  playThinking: () => void;
  playAlert: () => void;
  playExcitedSpin: () => void;
  playSpeaking: () => void; // NEW: Animation when QUANTUM speaks
  stopAll: () => void;
}

interface QuantumAvatarAnimatedProps extends QuantumRobotIconProps {
  /** Enable random idle animations */
  enableIdleAnimations?: boolean;
  /** Initial mood */
  initialMood?: QuantumMood;
  /** Called when animation completes */
  onAnimationComplete?: (animation: AllAnimation) => void;
}

export const QuantumAvatarAnimated = forwardRef<QuantumAnimationControls, QuantumAvatarAnimatedProps>(({
  enableIdleAnimations = true,
  initialMood = 'idle',
  size = 48,
  onAnimationComplete,
  ...robotProps
}, ref) => {
  // ========================================
  // BASE LAYER: CONSTANT FLOATING (never stops)
  // ========================================
  const floatProgress = useSharedValue(0);

  // ========================================
  // SHIMMER EFFECT (light moving across QUANTUM)
  // ========================================
  const shimmerProgress = useSharedValue(-1);

  // ========================================
  // SPARKLE POINTS (4 sparkles twinkling + drifting)
  // ========================================
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);
  const sparkle4 = useSharedValue(0);
  const sparkleDrift1 = useSharedValue(0);
  const sparkleDrift2 = useSharedValue(0);
  const sparkleDrift3 = useSharedValue(0);
  const sparkleDrift4 = useSharedValue(0);

  // ========================================
  // EMOTION ANIMATION VALUES
  // ========================================
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Mood glow overlay
  const moodGlowOpacity = useSharedValue(0);
  const moodGlowScale = useSharedValue(1);
  const moodGlowColorIndex = useSharedValue(0);

  // State tracking
  const isMounted = useRef(true);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingAnimation = useRef(false);
  const currentMood = useRef<QuantumMood>(initialMood);

  // ========================================
  // SPARKLE ANIMATION (same timing as AddButton)
  // ========================================
  const createSparkleAnimation = useCallback((delay: number) =>
    withRepeat(
      withSequence(
        withDelay(delay, withTiming(0, { duration: 0 })),
        withTiming(1, { duration: 200, easing: easeOutQuad }),
        withTiming(0, { duration: 400, easing: easeInQuad }),
        withDelay(2000, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    ), []);

  // ========================================
  // START BASE LAYERS (run forever)
  // ========================================
  useEffect(() => {
    // FLOATING: smooth sine wave up and down
    floatProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: easeInOutSine }),
        withTiming(0, { duration: 2000, easing: easeInOutSine })
      ),
      -1,
      false
    );

    // SHIMMER: light moving across QUANTUM
    shimmerProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: easeInOutCubic }),
        withDelay(1500, withTiming(-1, { duration: 0 })) // Reset after pause
      ),
      -1,
      false
    );

    // SPARKLES: staggered timing (same as AddButton)
    sparkle1.value = createSparkleAnimation(0);
    sparkle2.value = createSparkleAnimation(500);
    sparkle3.value = createSparkleAnimation(1000);
    sparkle4.value = createSparkleAnimation(1500);

    // SPARKLE DRIFT: each sparkle floats in a small loop
    const createDrift = (delay: number, dist: number, dur: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(dist, { duration: dur, easing: easeInOutQuad }),
            withTiming(-dist, { duration: dur, easing: easeInOutQuad })
          ),
          -1,
          true
        )
      );
    sparkleDrift1.value = createDrift(0, 5, 1800);
    sparkleDrift2.value = createDrift(400, 4, 2200);
    sparkleDrift3.value = createDrift(200, 6, 2000);
    sparkleDrift4.value = createDrift(600, 4, 2400);

    return () => {
      cancelAnimation(floatProgress);
      cancelAnimation(shimmerProgress);
      cancelAnimation(sparkle1);
      cancelAnimation(sparkle2);
      cancelAnimation(sparkle3);
      cancelAnimation(sparkle4);
      cancelAnimation(sparkleDrift1);
      cancelAnimation(sparkleDrift2);
      cancelAnimation(sparkleDrift3);
      cancelAnimation(sparkleDrift4);
    };
  }, [floatProgress, shimmerProgress, sparkle1, sparkle2, sparkle3, sparkle4, sparkleDrift1, sparkleDrift2, sparkleDrift3, sparkleDrift4, createSparkleAnimation]);

  // ========================================
  // ANIMATION 1: Excited Spin (360° Y-axis)
  // ========================================
  const playExcitedSpin = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;

    rotateY.value = withSequence(
      withTiming(360, { duration: 500, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(0, { duration: 0 })
    );

    translateY.value = withSequence(
      withTiming(-4, { duration: 250 }),
      withTiming(0, { duration: 250 })
    );

    setTimeout(() => {
      isPlayingAnimation.current = false;
      onAnimationComplete?.('spin');
    }, 500);
  }, [rotateY, translateY, onAnimationComplete]);

  // ========================================
  // ANIMATION 2: Zoom to Side & Back
  // ========================================
  const playZoomSide = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;

    const direction = Math.random() > 0.5 ? 1 : -1;

    translateX.value = withSequence(
      withTiming(12 * direction, { duration: 200, easing: easeOutCubic }),
      withDelay(200, withTiming(0, { duration: 200, easing: easeInOutCubic }))
    );

    rotateZ.value = withSequence(
      withTiming(-10 * direction, { duration: 200 }),
      withDelay(200, withTiming(0, { duration: 200 }))
    );

    setTimeout(() => {
      isPlayingAnimation.current = false;
      onAnimationComplete?.('zoomSide');
    }, 600);
  }, [translateX, rotateZ, onAnimationComplete]);

  // ========================================
  // ANIMATION 3: Angry Shake + Red Glow
  // ========================================
  const playAngryShake = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;
    currentMood.current = 'angry';

    moodGlowColorIndex.value = 2;
    moodGlowOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(350, withTiming(0, { duration: 200 }))
    );
    moodGlowScale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withDelay(350, withTiming(1, { duration: 200 }))
    );

    translateX.value = withSequence(
      withTiming(-5, { duration: 40 }),
      withTiming(5, { duration: 40 }),
      withTiming(-5, { duration: 40 }),
      withTiming(5, { duration: 40 }),
      withTiming(-4, { duration: 40 }),
      withTiming(4, { duration: 40 }),
      withTiming(-3, { duration: 40 }),
      withTiming(3, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );

    setTimeout(() => {
      isPlayingAnimation.current = false;
      currentMood.current = 'idle';
      onAnimationComplete?.('angryShake');
    }, 600);
  }, [translateX, moodGlowColorIndex, moodGlowOpacity, moodGlowScale, onAnimationComplete]);

  // ========================================
  // ANIMATION 4: Happy Bounce + Green Glow
  // ========================================
  const playHappyBounce = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;
    currentMood.current = 'happy';

    moodGlowColorIndex.value = 1;
    moodGlowOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(500, withTiming(0, { duration: 250 }))
    );
    moodGlowScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withDelay(500, withTiming(1, { duration: 250 }))
    );

    translateY.value = withSequence(
      withSpring(-10, { damping: 5, stiffness: 400 }),
      withSpring(0, { damping: 6, stiffness: 300 }),
      withSpring(-6, { damping: 6, stiffness: 350 }),
      withSpring(0, { damping: 8, stiffness: 250 })
    );

    scale.value = withSequence(
      withSpring(1.1, { damping: 5, stiffness: 400 }),
      withSpring(1, { damping: 6, stiffness: 300 }),
      withSpring(1.05, { damping: 6, stiffness: 350 }),
      withSpring(1, { damping: 8, stiffness: 250 })
    );

    setTimeout(() => {
      isPlayingAnimation.current = false;
      currentMood.current = 'idle';
      onAnimationComplete?.('happyBounce');
    }, 800);
  }, [translateY, scale, moodGlowColorIndex, moodGlowOpacity, moodGlowScale, onAnimationComplete]);

  // ========================================
  // ANIMATION 5: Thinking/Processing
  // ========================================
  const playThinking = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;
    currentMood.current = 'thinking';

    moodGlowColorIndex.value = 3;
    moodGlowOpacity.value = withTiming(0.7, { duration: 200 });

    translateY.value = withTiming(-5, { duration: 300 });

    rotateZ.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 250, easing: easeInOutSine }),
        withTiming(8, { duration: 250, easing: easeInOutSine })
      ),
      3,
      true
    );

    setTimeout(() => {
      translateY.value = withTiming(0, { duration: 250 });
      rotateZ.value = withTiming(0, { duration: 200 });
      moodGlowOpacity.value = withTiming(0, { duration: 250 });
      isPlayingAnimation.current = false;
      currentMood.current = 'idle';
      onAnimationComplete?.('thinking');
    }, 1800);
  }, [translateY, rotateZ, moodGlowColorIndex, moodGlowOpacity, onAnimationComplete]);

  // ========================================
  // ANIMATION 6: Alert/Attention
  // ========================================
  const playAlert = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;
    currentMood.current = 'alert';

    moodGlowColorIndex.value = 4;
    moodGlowOpacity.value = withTiming(0.8, { duration: 150 });

    scale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 500 }),
      withSpring(1.05, { damping: 8, stiffness: 300 })
    );

    translateY.value = withSequence(
      withSpring(-8, { damping: 6, stiffness: 500 }),
      withSpring(-3, { damping: 8, stiffness: 300 })
    );

    setTimeout(() => {
      if (!isMounted.current) return;
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400 }),
          withTiming(1.05, { duration: 400 })
        ),
        2,
        true
      );
    }, 400);

    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 10, stiffness: 200 });
      moodGlowOpacity.value = withTiming(0, { duration: 300 });
      isPlayingAnimation.current = false;
      currentMood.current = 'idle';
      onAnimationComplete?.('alert');
    }, 2000);
  }, [scale, translateY, moodGlowColorIndex, moodGlowOpacity, onAnimationComplete]);

  // ========================================
  // ANIMATION 7: Speaking (when QUANTUM talks!)
  // Bouncy, alive feeling - like Duolingo's owl
  // ========================================
  const playSpeaking = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;

    // Green glow when speaking (friendly, alive)
    moodGlowColorIndex.value = 1; // happy/green
    moodGlowOpacity.value = withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(0.4, { duration: 200 }),
    );

    // Bounce up excitedly
    translateY.value = withSequence(
      withSpring(-8, { damping: 8, stiffness: 400 }),
      withSpring(0, { damping: 10, stiffness: 200 }),
    );

    // Scale pulse (excited!)
    scale.value = withSequence(
      withSpring(1.12, { damping: 8, stiffness: 400 }),
      withSpring(1.05, { damping: 10, stiffness: 200 }),
    );

    // Slight wiggle
    rotateZ.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(-3, { duration: 80 }),
      withTiming(3, { duration: 80 }),
      withTiming(0, { duration: 100 }),
    );

    // Hold speaking state for a bit, then return to idle
    setTimeout(() => {
      if (!isMounted.current) return;
      // Gentle return to normal
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      moodGlowOpacity.value = withTiming(0, { duration: 500 });
      isPlayingAnimation.current = false;
      currentMood.current = 'idle';
    }, 600);
  }, [translateY, scale, rotateZ, moodGlowColorIndex, moodGlowOpacity]);

  // ========================================
  // ANIMATION 8: Idle Patrol
  // ========================================
  const playPatrol = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;

    translateX.value = withTiming(6, { duration: 600, easing: easeInOutCubic });
    translateY.value = withTiming(-5, { duration: 600, easing: easeInOutCubic });
    rotateZ.value = withTiming(8, { duration: 600, easing: easeInOutCubic });

    setTimeout(() => {
      if (!isMounted.current) return;
      translateX.value = withTiming(-6, { duration: 800, easing: easeInOutCubic });
      translateY.value = withTiming(5, { duration: 800, easing: easeInOutCubic });
      rotateZ.value = withTiming(-8, { duration: 800, easing: easeInOutCubic });
    }, 600);

    setTimeout(() => {
      if (!isMounted.current) return;
      translateX.value = withTiming(0, { duration: 600, easing: easeInOutCubic });
      translateY.value = withTiming(0, { duration: 600, easing: easeInOutCubic });
      rotateZ.value = withTiming(0, { duration: 600, easing: easeInOutCubic });
    }, 1400);

    setTimeout(() => {
      isPlayingAnimation.current = false;
      onAnimationComplete?.('patrol');
    }, 2000);
  }, [translateX, translateY, rotateZ, onAnimationComplete]);

  // ========================================
  // ANIMATION 8: Barrel Roll
  // ========================================
  const playBarrelRoll = useCallback(() => {
    if (!isMounted.current) return;
    isPlayingAnimation.current = true;

    rotateZ.value = withSequence(
      withTiming(360, { duration: 450, easing: easeInOutCubic }),
      withTiming(0, { duration: 0 })
    );

    translateY.value = withSequence(
      withTiming(-3, { duration: 225 }),
      withTiming(0, { duration: 225 })
    );

    setTimeout(() => {
      isPlayingAnimation.current = false;
      onAnimationComplete?.('barrelRoll');
    }, 450);
  }, [rotateZ, translateY, onAnimationComplete]);

  // ========================================
  // IDLE ANIMATION CONTROLLER
  // ========================================
  const idleAnimations: IdleAnimation[] = ['patrol', 'spin', 'zoomSide', 'barrelRoll'];

  const playRandomIdleAnimation = useCallback(() => {
    if (!isMounted.current || !enableIdleAnimations || isPlayingAnimation.current) return;
    if (currentMood.current !== 'idle') return;

    const randomAnim = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];

    switch (randomAnim) {
      case 'patrol': playPatrol(); break;
      case 'spin': playExcitedSpin(); break;
      case 'zoomSide': playZoomSide(); break;
      case 'barrelRoll': playBarrelRoll(); break;
    }
  }, [enableIdleAnimations, playPatrol, playExcitedSpin, playZoomSide, playBarrelRoll]);

  const scheduleNextIdleAnimation = useCallback(() => {
    if (!isMounted.current || !enableIdleAnimations) return;
    const delay = 4000 + Math.random() * 5000;
    idleTimeoutRef.current = setTimeout(() => {
      playRandomIdleAnimation();
      scheduleNextIdleAnimation();
    }, delay);
  }, [enableIdleAnimations, playRandomIdleAnimation]);

  // ========================================
  // MOOD CONTROLS
  // ========================================
  const stopAll = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(rotateZ);
    cancelAnimation(rotateY);
    cancelAnimation(scale);
    cancelAnimation(moodGlowOpacity);
    cancelAnimation(moodGlowScale);

    translateX.value = 0;
    translateY.value = 0;
    rotateZ.value = 0;
    rotateY.value = 0;
    scale.value = 1;
    moodGlowOpacity.value = 0;

    isPlayingAnimation.current = false;
    currentMood.current = 'idle';
  }, [translateX, translateY, rotateZ, rotateY, scale, moodGlowOpacity, moodGlowScale]);

  const playIdle = useCallback(() => {
    currentMood.current = 'idle';
    playRandomIdleAnimation();
  }, [playRandomIdleAnimation]);

  const playHappy = useCallback(() => { stopAll(); playHappyBounce(); }, [stopAll, playHappyBounce]);
  const playAngry = useCallback(() => { stopAll(); playAngryShake(); }, [stopAll, playAngryShake]);
  const playThinkingMood = useCallback(() => { stopAll(); playThinking(); }, [stopAll, playThinking]);
  const playAlertMood = useCallback(() => { stopAll(); playAlert(); }, [stopAll, playAlert]);

  useImperativeHandle(ref, () => ({
    playIdle,
    playHappy,
    playAngry,
    playThinking: playThinkingMood,
    playAlert: playAlertMood,
    playExcitedSpin,
    playSpeaking,
    stopAll,
  }), [playIdle, playHappy, playAngry, playThinkingMood, playAlertMood, playExcitedSpin, playSpeaking, stopAll]);

  // ========================================
  // LIFECYCLE
  // ========================================
  useEffect(() => {
    isMounted.current = true;

    if (enableIdleAnimations) {
      setTimeout(() => {
        if (isMounted.current) {
          playExcitedSpin();
          setTimeout(scheduleNextIdleAnimation, 1000);
        }
      }, 500);
    }

    return () => {
      isMounted.current = false;
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(rotateZ);
      cancelAnimation(rotateY);
      cancelAnimation(scale);
      cancelAnimation(moodGlowOpacity);
      cancelAnimation(moodGlowScale);
    };
  }, [enableIdleAnimations, playExcitedSpin, scheduleNextIdleAnimation]);

  // ========================================
  // ANIMATED STYLES
  // ========================================

  // Combined floating + emotion transforms
  const quantumStyle = useAnimatedStyle(() => {
    const floatY = interpolate(floatProgress.value, [0, 1], [0, -5]);
    return {
      transform: [
        { translateY: floatY + translateY.value },
        { translateX: translateX.value },
        { rotateZ: `${rotateZ.value}deg` },
        { rotateY: `${rotateY.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  // Shimmer moving across QUANTUM
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerProgress.value, [-1, 1], [-size, size]) },
    ],
    opacity: interpolate(shimmerProgress.value, [-1, -0.5, 0, 0.5, 1], [0, 0.6, 0.8, 0.6, 0]),
  }));

  // Sparkle styles (twinkle + drift)
  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1.value,
    transform: [
      { scale: interpolate(sparkle1.value, [0, 1], [0.5, 1.2]) },
      { translateX: sparkleDrift1.value },
      { translateY: -sparkleDrift1.value * 0.7 },
    ],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2.value,
    transform: [
      { scale: interpolate(sparkle2.value, [0, 1], [0.5, 1.2]) },
      { translateX: -sparkleDrift2.value * 0.6 },
      { translateY: sparkleDrift2.value },
    ],
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3.value,
    transform: [
      { scale: interpolate(sparkle3.value, [0, 1], [0.5, 1.2]) },
      { translateX: sparkleDrift3.value * 0.8 },
      { translateY: sparkleDrift3.value * 0.5 },
    ],
  }));

  const sparkle4Style = useAnimatedStyle(() => ({
    opacity: sparkle4.value,
    transform: [
      { scale: interpolate(sparkle4.value, [0, 1], [0.5, 1.2]) },
      { translateX: -sparkleDrift4.value },
      { translateY: -sparkleDrift4.value * 0.4 },
    ],
  }));

  // Mood glow overlay style
  const moodGlowStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      moodGlowColorIndex.value,
      [0, 1, 2, 3, 4],
      [GLOW_COLORS.none, GLOW_COLORS.happy, GLOW_COLORS.angry, GLOW_COLORS.thinking, GLOW_COLORS.alert]
    );
    return {
      opacity: moodGlowOpacity.value,
      backgroundColor: color,
      shadowColor: color,
      transform: [{ scale: moodGlowScale.value }],
    };
  });

  // ========================================
  // RENDER
  // ========================================
  const modelSize = 60;
  const containerScale = size / modelSize;

  return (
    <View style={[styles.container, { width: size, height: size }]}>

      {/* QUANTUM with shimmer and sparkles */}
      <Animated.View style={[styles.quantumWrapper, quantumStyle]}>

        {/* Mood glow overlay (behind QUANTUM) */}
        <Animated.View style={[
          styles.moodGlow,
          { width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4 },
          moodGlowStyle
        ]} />

        {/* QUANTUM Model */}
        <View style={[styles.modelWrapper, { transform: [{ scale: containerScale }] }]}>
          <QuantumRobotIcon
            size={modelSize}
            {...robotProps}
            autoRotate={false}
            showGlow={false}
          />
        </View>

        {/* Shimmer overlay - light moving across */}
        <Animated.View style={[styles.shimmerContainer, { width: size, height: size }]}>
          <Animated.View style={[
            styles.shimmer,
            { width: size * 0.4, height: size * 1.2 },
            shimmerStyle
          ]} />
        </Animated.View>

        {/* Diamond sparkle points on QUANTUM surface (same as Add button) */}
        <Animated.View style={[styles.sparkle, { top: size * 0.05, right: size * 0.1 }, sparkle1Style]}>
          <DiamondSparkle size={8} id="q1" />
        </Animated.View>

        <Animated.View style={[styles.sparkle, { top: size * 0.2, left: size * 0.05 }, sparkle2Style]}>
          <DiamondSparkle size={7} id="q2" />
        </Animated.View>

        <Animated.View style={[styles.sparkle, { bottom: size * 0.25, right: size * 0.02 }, sparkle3Style]}>
          <DiamondSparkle size={6} id="q3" />
        </Animated.View>

        <Animated.View style={[styles.sparkle, { bottom: size * 0.1, left: size * 0.12 }, sparkle4Style]}>
          <DiamondSparkle size={7} id="q4" />
        </Animated.View>

      </Animated.View>

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantumWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modelWrapper: {
    zIndex: 10,
  },
  // ========== SHIMMER EFFECT ==========
  shimmerContainer: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 100,
  },
  shimmer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  // ========== DIAMOND SPARKLES ==========
  sparkle: {
    position: 'absolute',
    zIndex: 20,
  },
  // ========== MOOD GLOW ==========
  moodGlow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    zIndex: 1,
  },
});

export default QuantumAvatarAnimated;
