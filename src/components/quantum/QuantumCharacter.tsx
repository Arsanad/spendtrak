/**
 * QuantumCharacter Component
 * The LIVING QUANTUM AI companion - like Duolingo's Duo owl!
 *
 * This is a FULL-SCREEN overlay that renders QUANTUM anywhere on the screen.
 * QUANTUM can fly, bounce, celebrate, and speak from ANY position!
 *
 * Features:
 * - Flies to center when acknowledging transactions
 * - Gets BIGGER for celebrations
 * - Has personality through animations
 * - Speech bubble follows QUANTUM
 * - Makes the app feel ALIVE
 * - 9 character states with auto-return timers
 * - Particle effects (confetti, Zzz, question marks)
 * - Eye blink animation in idle state
 * - Sleep detection after 30s inactivity
 */

import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { easeOutQuad, easeInOutQuad, easeInOutSine } from '../../config/easingFunctions';
import { QuantumRobotIcon } from './QuantumRobotIcon';
import { DynamicSpeechBubble } from './DynamicSpeechBubble';
import { useQuantum, QUANTUM_SIZES, QUANTUM_POSITIONS } from '@/context/QuantumContext';
import { Colors } from '@/design/cinematic';
import { zIndex } from '@/theme';
import { lightTap } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spring configurations
const SPRING_SNAPPY = { damping: 12, stiffness: 200 };
const SPRING_BOUNCY = { damping: 8, stiffness: 150 };

// Particle types
interface Particle {
  id: number;
  x: number;
  y: number;
  text?: string;
  color?: string;
}

// === Particle Effect Components ===

const ConfettiParticles = memo(function ConfettiParticles() {
  const particles = useRef<Particle[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 - 40,
      y: Math.random() * -60 - 20,
      color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#DDA0DD'][i % 6],
    }))
  ).current;

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiDot key={p.id} x={p.x} y={p.y} color={p.color!} delay={p.id * 80} />
      ))}
    </View>
  );
});

const ConfettiDot = memo(function ConfettiDot({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1500, withTiming(0, { duration: 500 })),
    ));
    translateY.value = withDelay(delay, withTiming(80 + Math.random() * 40, {
      duration: 2000,
      easing: easeOutQuad,
    }));
    scale.value = withDelay(delay, withSequence(
      withSpring(1, { damping: 6, stiffness: 200 }),
      withDelay(1200, withTiming(0, { duration: 300 })),
    ));

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x },
      { translateY: y + translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.confettiDot, { backgroundColor: color }, animStyle]} />
  );
});

const ZzzParticles = memo(function ZzzParticles() {
  const items = [
    { id: 0, text: 'Z', size: 14, delay: 0, offsetX: 15 },
    { id: 1, text: 'z', size: 11, delay: 800, offsetX: 25 },
    { id: 2, text: 'z', size: 9, delay: 1600, offsetX: 35 },
  ];

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {items.map((item) => (
        <ZzzItem key={item.id} {...item} />
      ))}
    </View>
  );
});

const ZzzItem = memo(function ZzzItem({ text, size, delay, offsetX }: { text: string; size: number; delay: number; offsetX: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-40, { duration: 2000, easing: easeOutQuad }),
      -1,
      false,
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.8, { duration: 400 }),
        withDelay(1000, withTiming(0, { duration: 600 })),
      ),
      -1,
      false,
    ));

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: offsetX },
      { translateY: -20 + translateY.value },
    ],
  }));

  return (
    <Animated.Text style={[styles.zzzText, { fontSize: size }, animStyle]}>
      {text}
    </Animated.Text>
  );
});

const ThinkingParticles = memo(function ThinkingParticles() {
  const items = [
    { id: 0, text: '?', delay: 0, offsetX: -20 },
    { id: 1, text: '?', delay: 600, offsetX: 20 },
    { id: 2, text: '?', delay: 1200, offsetX: 0 },
  ];

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {items.map((item) => (
        <ThinkingMark key={item.id} {...item} />
      ))}
    </View>
  );
});

const ThinkingMark = memo(function ThinkingMark({ text, delay, offsetX }: { text: string; delay: number; offsetX: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-30, { duration: 1500, easing: easeOutQuad }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 300 }),
        withDelay(600, withTiming(0, { duration: 600 })),
      ),
      -1,
      false,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withSpring(1, { damping: 8, stiffness: 150 }),
        withDelay(600, withTiming(0.5, { duration: 300 })),
      ),
      -1,
      false,
    ));

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: offsetX },
      { translateY: -25 + translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.Text style={[styles.thinkText, animStyle]}>
      {text}
    </Animated.Text>
  );
});

// === Heart Particles (love emotion) ===
const HeartParticles = memo(function HeartParticles() {
  const particles = useRef<Particle[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 - 40,
      y: Math.random() * -40 - 10,
      text: ['❤️', '💚', '💕', '💖'][i % 4],
    }))
  ).current;

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {particles.map((p) => (
        <FloatingEmoji key={p.id} x={p.x} y={p.y} text={p.text!} delay={p.id * 150} />
      ))}
    </View>
  );
});

// === Spark Particles (excited emotion) ===
const SparkParticles = memo(function SparkParticles() {
  const particles = useRef<Particle[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * -60 - 10,
      text: ['⚡', '✨', '🔥', '💫', '⭐'][i % 5],
    }))
  ).current;

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {particles.map((p) => (
        <FloatingEmoji key={p.id} x={p.x} y={p.y} text={p.text!} delay={p.id * 100} />
      ))}
    </View>
  );
});

// === Star Particles (proud emotion) ===
const StarParticles = memo(function StarParticles() {
  const particles = useRef<Particle[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 70 - 35,
      y: Math.random() * -50 - 10,
      text: ['🏆', '👑', '⭐', '🌟'][i % 4],
    }))
  ).current;

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {particles.map((p) => (
        <FloatingEmoji key={p.id} x={p.x} y={p.y} text={p.text!} delay={p.id * 200} />
      ))}
    </View>
  );
});

// === Reusable Floating Emoji Particle ===
const FloatingEmoji = memo(function FloatingEmoji({ x, y, text, delay }: { x: number; y: number; text: string; delay: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scaleVal = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(1200, withTiming(0, { duration: 500 })),
    ));
    translateY.value = withDelay(delay, withTiming(
      -60 - Math.random() * 40,
      { duration: 2000, easing: easeOutQuad }
    ));
    scaleVal.value = withDelay(delay, withSequence(
      withSpring(1.2, { damping: 6, stiffness: 200 }),
      withDelay(1000, withTiming(0, { duration: 400 })),
    ));

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scaleVal);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x },
      { translateY: y + translateY.value },
      { scale: scaleVal.value },
    ],
  }));

  return (
    <Animated.Text style={[styles.floatingEmoji, animStyle]}>
      {text}
    </Animated.Text>
  );
});

// === Main Component ===

export const QuantumCharacter: React.FC = () => {
  const { state, actions } = useQuantum();

  // Animation values
  const posX = useSharedValue<number>(QUANTUM_POSITIONS.corner.x);
  const posY = useSharedValue<number>(QUANTUM_POSITIONS.corner.y);
  const scale = useSharedValue<number>(1);
  const rotation = useSharedValue(0);
  const bounceOffset = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  // Idle animation refs
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Cancel all running animations - used before starting new ones
  const stopAllAnimations = () => {
    cancelAnimation(rotation);
    cancelAnimation(bounceOffset);
    cancelAnimation(scale);
    cancelAnimation(glowOpacity);
    cancelAnimation(glowScale);
  };

  // Reset to default values smoothly
  const resetToDefault = () => {
    rotation.value = withTiming(0, { duration: 200 });
    bounceOffset.value = withTiming(0, { duration: 200 });
    scale.value = withSpring(state.scale, SPRING_SNAPPY);
    glowOpacity.value = withTiming(0, { duration: 200 });
    glowScale.value = withTiming(1, { duration: 200 });
  };

  // Current size based on scale
  const currentSize = QUANTUM_SIZES.small * state.scale;

  // Update position when state changes
  useEffect(() => {
    posX.value = withSpring(state.x, SPRING_SNAPPY);
    posY.value = withSpring(state.y, SPRING_SNAPPY);
    scale.value = withSpring(state.scale, SPRING_SNAPPY);
  }, [state.x, state.y, state.scale]);

  // Handle animations based on state
  useEffect(() => {
    if (state.isAnimating) {
      // Cancel any running animations before starting new ones
      // This prevents animation buildup from infinite loops
      stopAllAnimations();

      switch (state.currentAnimation) {
        case 'bounce':
          animateBounce();
          break;
        case 'celebrate':
          animateCelebrate();
          break;
        case 'speak':
          animateSpeak();
          break;
        case 'wiggle':
          animateWiggle();
          break;
        case 'wave':
          animateWave();
          break;
        case 'think':
          animateThink();
          break;
        case 'surprise':
          animateSurprise();
          break;
        case 'encourage':
          animateEncourage();
          break;
        case 'sad':
          animateSad();
          break;
        case 'sleep':
          animateSleep();
          break;
        case 'excited':
          animateExcited();
          break;
        case 'worried':
          animateWorried();
          break;
        case 'proud':
          animateProud();
          break;
        case 'curious':
          animateCurious();
          break;
        case 'dancing':
          animateDancing();
          break;
        case 'love':
          animateLove();
          break;
        case 'angry':
          animateAngry();
          break;
        case 'tired':
          animateTired();
          break;
        case 'focused':
          animateFocused();
          break;
      }
    } else {
      // When animation stops, cancel any infinite animations and reset
      stopAllAnimations();
      resetToDefault();
    }
  }, [state.currentAnimation, state.isAnimating]);

  // Handle emotion changes (glow) - Disabled external glow, kept inside bubble
  useEffect(() => {
    glowOpacity.value = withTiming(0, { duration: 300 });
    glowScale.value = withTiming(1, { duration: 300 });
  }, [state.emotion]);

  // Idle animations when in corner (and not sleeping)
  useEffect(() => {
    if (state.position === 'corner' && !state.isAnimating && !state.isSpeaking && state.emotion === 'idle') {
      startIdleAnimations();
    } else if (state.emotion !== 'sleeping') {
      stopIdleAnimations();
    }

    return () => stopIdleAnimations();
  }, [state.position, state.isAnimating, state.isSpeaking, state.emotion]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopIdleAnimations();
      // Cancel all animations on unmount to prevent memory leaks
      cancelAnimation(posX);
      cancelAnimation(posY);
      cancelAnimation(scale);
      cancelAnimation(rotation);
      cancelAnimation(bounceOffset);
      cancelAnimation(glowOpacity);
      cancelAnimation(glowScale);
    };
  }, []);

  // === ANIMATIONS ===

  const animateBounce = () => {
    bounceOffset.value = withSequence(
      withSpring(-25, SPRING_BOUNCY),
      withSpring(0, { damping: 10, stiffness: 200 }),
      withSpring(-12, { damping: 12, stiffness: 180 }),
      withSpring(0, { damping: 15, stiffness: 150 }),
    );

    scale.value = withSequence(
      withSpring(state.scale * 1.15, SPRING_BOUNCY),
      withSpring(state.scale, { damping: 10, stiffness: 200 }),
    );

    glowOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0.6, { duration: 300 }),
    );
  };

  const animateCelebrate = () => {
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: 200, easing: easeOutQuad }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.bounce) }),
      ),
      3,
      false
    );

    rotation.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 100 }),
        withTiming(15, { duration: 100 }),
      ),
      6,
      true
    );

    glowOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(1500, withTiming(0.4, { duration: 400 })),
    );

    glowScale.value = withSequence(
      withSpring(1.5, SPRING_BOUNCY),
      withDelay(1500, withSpring(1.1, SPRING_SNAPPY)),
    );
  };

  const animateSpeak = () => {
    bounceOffset.value = withSequence(
      withSpring(-15, { damping: 10, stiffness: 300 }),
      withSpring(0, { damping: 12, stiffness: 200 }),
    );

    scale.value = withSequence(
      withSpring(state.scale * 1.08, { damping: 10, stiffness: 300 }),
      withSpring(state.scale * 1.02, { damping: 12, stiffness: 200 }),
    );

    rotation.value = withSequence(
      withTiming(-5, { duration: 80 }),
      withTiming(5, { duration: 80 }),
      withTiming(-3, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );

    glowOpacity.value = withTiming(0.7, { duration: 200 });
  };

  const animateWiggle = () => {
    rotation.value = withSequence(
      withTiming(-8, { duration: 80 }),
      withTiming(8, { duration: 80 }),
      withTiming(-5, { duration: 60 }),
      withTiming(5, { duration: 60 }),
      withTiming(0, { duration: 80 }),
    );
  };

  // New state-specific animations

  const animateWave = () => {
    // Rotation oscillation ±20deg (hand wave effect)
    rotation.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 200, easing: easeInOutQuad }),
        withTiming(-20, { duration: 200, easing: easeInOutQuad }),
      ),
      4,
      true
    );

    // Slight bounce
    bounceOffset.value = withSequence(
      withSpring(-8, { damping: 10, stiffness: 200 }),
      withSpring(0, { damping: 12, stiffness: 200 }),
    );
  };

  const animateThink = () => {
    // Slow bobbing
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: easeInOutSine }),
        withTiming(6, { duration: 1500, easing: easeInOutSine }),
      ),
      -1,
      true
    );

    // Slight tilt
    rotation.value = withTiming(8, { duration: 600, easing: easeInOutQuad });
  };

  const animateSurprise = () => {
    // Quick scale up + bounce back
    scale.value = withSequence(
      withSpring(state.scale * 1.3, { damping: 6, stiffness: 300 }),
      withSpring(state.scale * 0.9, { damping: 10, stiffness: 200 }),
      withSpring(state.scale, { damping: 12, stiffness: 200 }),
    );

    // Quick jump
    bounceOffset.value = withSequence(
      withTiming(-30, { duration: 150, easing: easeOutQuad }),
      withSpring(0, { damping: 8, stiffness: 200 }),
    );
  };

  const animateEncourage = () => {
    // Gentle bounce + nod (small rotation sequence)
    bounceOffset.value = withRepeat(
      withSequence(
        withSpring(-10, { damping: 10, stiffness: 200 }),
        withSpring(0, { damping: 12, stiffness: 200 }),
      ),
      3,
      false
    );

    // Nod: small forward-back rotation
    rotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 200 }),
        withTiming(-3, { duration: 200 }),
        withTiming(0, { duration: 150 }),
      ),
      3,
      false
    );
  };

  const animateSad = () => {
    // Slow droop (translateY down) + slight shrink
    bounceOffset.value = withTiming(12, { duration: 1000, easing: easeInOutQuad });
    scale.value = withTiming(state.scale * 0.9, { duration: 800, easing: easeInOutQuad });
    rotation.value = withTiming(-5, { duration: 800, easing: easeInOutQuad });
  };

  const animateSleep = () => {
    // Slow floating + gentle scale breathing
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2500, easing: easeInOutSine }),
        withTiming(3, { duration: 2500, easing: easeInOutSine }),
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 2000, easing: easeInOutSine }),
        withTiming(1.02, { duration: 2000, easing: easeInOutSine }),
      ),
      -1,
      true
    );

    // Slight tilt as if nodding off
    rotation.value = withTiming(10, { duration: 1500, easing: easeInOutQuad });
  };

  // === NEW EMOTION ANIMATIONS ===

  const animateExcited = () => {
    // Rapid bouncing with increasing intensity
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 150, easing: easeOutQuad }),
        withTiming(0, { duration: 150, easing: Easing.in(Easing.bounce) }),
      ),
      8,
      false
    );

    // Quick scale pulses
    scale.value = withRepeat(
      withSequence(
        withSpring(state.scale * 1.2, { damping: 5, stiffness: 300 }),
        withSpring(state.scale, { damping: 8, stiffness: 200 }),
      ),
      4,
      false
    );

    // Wiggle rotation
    rotation.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 80 }),
        withTiming(12, { duration: 80 }),
      ),
      10,
      true
    );

    // Burst glow
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(2000, withTiming(0.5, { duration: 300 })),
    );
    glowScale.value = withSpring(1.6, SPRING_BOUNCY);
  };

  const animateWorried = () => {
    // Nervous shake - small rapid horizontal
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 60 }),
        withTiming(2, { duration: 60 }),
      ),
      15,
      true
    );

    // Shrink slightly
    scale.value = withTiming(state.scale * 0.92, { duration: 400, easing: easeInOutQuad });

    // Subtle anxious tilt
    rotation.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 300, easing: easeInOutQuad }),
        withTiming(3, { duration: 300, easing: easeInOutQuad }),
      ),
      5,
      true
    );

    // Dim glow
    glowOpacity.value = withTiming(0.2, { duration: 300 });
  };

  const animateProud = () => {
    // Chest puff: scale up and hold
    scale.value = withSequence(
      withSpring(state.scale * 1.2, { damping: 10, stiffness: 200 }),
      withDelay(1500, withSpring(state.scale, { damping: 12, stiffness: 150 })),
    );

    // Rise up proudly
    bounceOffset.value = withSequence(
      withTiming(-20, { duration: 500, easing: easeOutQuad }),
      withDelay(1500, withTiming(0, { duration: 500, easing: easeInOutQuad })),
    );

    // Bright glow shine
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1500, withTiming(0.4, { duration: 500 })),
    );
    glowScale.value = withSequence(
      withSpring(1.4, { damping: 10, stiffness: 200 }),
      withDelay(1500, withSpring(1, SPRING_SNAPPY)),
    );
  };

  const animateCurious = () => {
    // Head tilt
    rotation.value = withSequence(
      withTiming(15, { duration: 400, easing: easeInOutQuad }),
      withDelay(800, withTiming(-10, { duration: 400, easing: easeInOutQuad })),
      withTiming(0, { duration: 300, easing: easeInOutQuad }),
    );

    // Lean forward (slight bounce up)
    bounceOffset.value = withSequence(
      withTiming(-8, { duration: 400, easing: easeOutQuad }),
      withDelay(1000, withTiming(0, { duration: 300 })),
    );

    // Slight scale up (leaning in)
    scale.value = withSequence(
      withTiming(state.scale * 1.08, { duration: 400 }),
      withDelay(1000, withTiming(state.scale, { duration: 300 })),
    );
  };

  const animateDancing = () => {
    // Full dance: side-to-side + up-down + rotation
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 200, easing: easeOutQuad }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.bounce) }),
      ),
      10,
      false
    );

    // Dance rotation
    rotation.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 200, easing: easeInOutQuad }),
        withTiming(20, { duration: 200, easing: easeInOutQuad }),
      ),
      10,
      true
    );

    // Scale rhythm
    scale.value = withRepeat(
      withSequence(
        withTiming(state.scale * 1.1, { duration: 200 }),
        withTiming(state.scale * 0.95, { duration: 200 }),
      ),
      10,
      true
    );

    // Full glow
    glowOpacity.value = withSequence(
      withTiming(0.8, { duration: 200 }),
      withDelay(3500, withTiming(0.3, { duration: 500 })),
    );
    glowScale.value = withSpring(1.5, SPRING_BOUNCY);
  };

  const animateLove = () => {
    // Heartbeat scale
    scale.value = withRepeat(
      withSequence(
        withSpring(state.scale * 1.15, { damping: 6, stiffness: 250 }),
        withSpring(state.scale, { damping: 10, stiffness: 200 }),
      ),
      4,
      false
    );

    // Gentle float up
    bounceOffset.value = withSequence(
      withTiming(-12, { duration: 600, easing: easeOutQuad }),
      withTiming(0, { duration: 600, easing: easeInOutQuad }),
    );

    // Warm glow
    glowOpacity.value = withSequence(
      withTiming(0.9, { duration: 300 }),
      withTiming(0.5, { duration: 500 }),
    );
  };

  const animateAngry = () => {
    // Intense shake
    rotation.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
      ),
      12,
      true
    );

    // Puff up
    scale.value = withSequence(
      withSpring(state.scale * 1.2, { damping: 8, stiffness: 300 }),
      withDelay(2000, withSpring(state.scale, { damping: 12, stiffness: 150 })),
    );

    // Stomp bounce
    bounceOffset.value = withSequence(
      withTiming(8, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 200 }),
    );

    // Red-ish glow (opacity high)
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(2000, withTiming(0.3, { duration: 500 })),
    );
  };

  const animateTired = () => {
    // Yawn: slow stretch up then droop
    scale.value = withSequence(
      withTiming(state.scale * 1.08, { duration: 800, easing: easeInOutQuad }),
      withTiming(state.scale * 0.95, { duration: 1000, easing: easeInOutQuad }),
    );

    // Droop down
    bounceOffset.value = withTiming(10, { duration: 1500, easing: easeInOutQuad });

    // Head drop
    rotation.value = withSequence(
      withTiming(0, { duration: 800 }),
      withTiming(12, { duration: 1200, easing: easeInOutQuad }),
    );

    // Dim glow
    glowOpacity.value = withTiming(0.15, { duration: 1000 });
  };

  const animateFocused = () => {
    // Still and serious: minimal movement, intense glow
    scale.value = withTiming(state.scale * 1.02, { duration: 500 });

    // Very subtle bob
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 2000, easing: easeInOutSine }),
        withTiming(2, { duration: 2000, easing: easeInOutSine }),
      ),
      -1,
      true
    );

    // Slight tilt (looking at data)
    rotation.value = withTiming(-5, { duration: 500, easing: easeInOutQuad });

    // Focused glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 }),
      ),
      -1,
      true
    );
  };

  const startIdleAnimations = () => {
    // Gentle floating
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2000, easing: easeInOutSine }),
        withTiming(4, { duration: 2000, easing: easeInOutSine }),
      ),
      -1,
      true
    );

    // Random behaviors
    idleIntervalRef.current = setInterval(() => {
      if (!isMounted.current) return;

      const rand = Math.random();
      if (rand < 0.3) {
        animateWiggle();
      } else if (rand < 0.5) {
        rotation.value = withSequence(
          withTiming(-10, { duration: 400, easing: easeInOutQuad }),
          withDelay(200, withTiming(10, { duration: 400, easing: easeInOutQuad })),
          withDelay(200, withTiming(0, { duration: 300, easing: easeInOutQuad })),
        );
      }
    }, 5000 + Math.random() * 5000);
  };

  const stopIdleAnimations = () => {
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
    cancelAnimation(bounceOffset);
    bounceOffset.value = withTiming(0, { duration: 200 });
  };

  // Animated styles
  const quantumAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value - SCREEN_WIDTH / 2 },
      { translateY: posY.value + bounceOffset.value - SCREEN_HEIGHT / 2 },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  // Handle tap on QUANTUM (haptic only, no sound)
  const handlePress = () => {
    lightTap();
    if (state.emotion === 'sleeping') {
      actions.wake();
      return;
    }
    if (state.position === 'corner' && !state.isAnimating) {
      animateWiggle();
    }
  };

  // Render particles based on emotion
  const renderParticles = () => {
    switch (state.emotion) {
      case 'celebrating':
      case 'dancing':
        return <ConfettiParticles />;
      case 'sleeping':
        return <ZzzParticles />;
      case 'thinking':
      case 'curious':
      case 'focused':
        return <ThinkingParticles />;
      case 'love':
        return <HeartParticles />;
      case 'excited':
        return <SparkParticles />;
      case 'proud':
        return <StarParticles />;
      default:
        return null;
    }
  };

  // When QUANTUM is speaking, show in a Modal with dark backdrop
  if (state.isSpeaking) {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalBackdrop}>
          {/* QUANTUM Avatar - Centered in Modal */}
          <View style={styles.modalQuantumWrapper}>
            {/* Glow effect behind QUANTUM */}
            <Animated.View
              style={[
                styles.glow,
                { width: currentSize * 1.5, height: currentSize * 1.5 },
                glowAnimatedStyle,
              ]}
            />

            {/* Particles */}
            {renderParticles()}

            {/* The QUANTUM model */}
            <QuantumRobotIcon
              size={QUANTUM_SIZES.small * state.scale}
              showGlow={false}
            />
          </View>

          {/* Speech Bubble - Below QUANTUM */}
          <DynamicSpeechBubble
            message={state.speechMessage || ''}
            type={state.speechType || 'acknowledgment'}
            visible={true}
            quantumX={SCREEN_WIDTH / 2}
            quantumY={SCREEN_HEIGHT / 2 - 60}
            quantumSize={currentSize}
          />
        </View>
      </Modal>
    );
  }

  // When not speaking, render QUANTUM in corner (idle state)
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* QUANTUM Avatar */}
      <Animated.View style={[styles.quantumWrapper, quantumAnimatedStyle]}>
        {/* Particles */}
        {renderParticles()}

        {/* The QUANTUM model - glow contained inside glass sphere */}
        <Pressable onPress={handlePress}>
          <QuantumRobotIcon
            size={QUANTUM_SIZES.small}
            showGlow={true}
            inGlassSphere={true}
            sphereGlowIntensity="medium"
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: zIndex.quantum,
  },
  quantumWrapper: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2,
    left: SCREEN_WIDTH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalQuantumWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.neon,
    borderRadius: 100,
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  // Particle styles
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zzzText: {
    position: 'absolute',
    color: '#A0A0FF',
    fontWeight: 'bold',
    opacity: 0.8,
  },
  thinkText: {
    position: 'absolute',
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 18,
  },
});

export default QuantumCharacter;
