/**
 * SpendTrak Behavioral Engine v2.0
 * BehavioralOnboarding - Multi-screen onboarding explaining behavioral philosophy
 *
 * Key message: Mirror, not mentor
 *
 * Design: Full-screen cinematic experience with Cinzel font and premium dark theme
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, StatusBar, useWindowDimensions, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { easeOutCubic, easeInCubic, easeInOutQuad, easeOutQuad, easeOutBack } from '../../config/easingFunctions';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontFamily } from '../../design/cinematic';

const SCREENS = [
  { id: 'hook', headline: "This app doesn't give advice.", sublines: [], animation: 'glow' },
  { id: 'mirror', headline: 'It shows you yourself.', sublines: ['Your patterns. Your moments.', 'Nothing more.'], animation: 'mirror' },
  { id: 'silence', headline: 'Sometimes it stays quiet.', sublines: ["That's not a problem.", "That's the design."], animation: 'wave' },
  { id: 'moment', headline: 'When it speaks, pay attention.', sublines: ['It chose that moment', 'for a reason.'], animation: 'pulse' },
  { id: 'commitment', headline: 'One simple promise:', sublines: ['No judgment. No lectures.', 'Just reflection.'], animation: 'handshake' },
];

// Transition timing
const FADE_DURATION = 200;

export interface BehavioralOnboardingProps {
  onComplete: () => void;
}

export function BehavioralOnboarding({ onComplete }: BehavioralOnboardingProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useSharedValue(0); // Start at 0 for fade-in from black
  const blackOverlayOpacity = useSharedValue(1); // Start with black overlay visible

  const currentScreen = SCREENS[currentIndex];
  const isLastScreen = currentIndex === SCREENS.length - 1;

  // Fade in from black on mount (completing fade-through-black from video)
  useEffect(() => {
    // Small delay then fade in
    const timer = setTimeout(() => {
      blackOverlayOpacity.value = withTiming(0, {
        duration: 300,
        easing: easeOutCubic,
      });
      fadeAnim.value = withTiming(1, {
        duration: 300,
        easing: easeOutCubic,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isLastScreen) {
      // Fade to black before completing
      fadeAnim.value = withTiming(0, { duration: FADE_DURATION, easing: easeOutCubic });
      blackOverlayOpacity.value = withTiming(1, { duration: FADE_DURATION, easing: easeOutCubic });

      setTimeout(async () => {
        await AsyncStorage.setItem('@behavioral_onboarding_complete', 'true');
        onComplete();
      }, FADE_DURATION + 100);
    } else {
      // Fade out current screen
      fadeAnim.value = withTiming(0, { duration: FADE_DURATION, easing: easeOutCubic });

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        // Fade in next screen
        fadeAnim.value = withTiming(1, { duration: FADE_DURATION, easing: easeInCubic });
      }, FADE_DURATION);
    }
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const blackOverlayStyle = useAnimatedStyle(() => ({
    opacity: blackOverlayOpacity.value,
  }));

  // Responsive styles for landscape
  const landscapeContent = isLandscape ? {
    flexDirection: 'row' as const,
    paddingHorizontal: 60,
  } : {};

  const landscapeAnimation = isLandscape ? {
    marginBottom: 0,
    marginRight: 40,
    height: 100,
  } : {};

  const landscapeText = isLandscape ? {
    marginBottom: 20,
    flex: 1,
  } : {};

  const landscapeHeadline = isLandscape ? {
    fontSize: 22,
  } : {};

  const landscapeSubline = isLandscape ? {
    fontSize: 14,
  } : {};

  return (
    <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
      {/* Hide status bar and navigation bar for true full screen */}
      <StatusBar hidden translucent backgroundColor="transparent" />

      <Animated.View style={[styles.content, contentStyle, landscapeContent]}>
        {isLandscape ? (
          // Landscape layout: side by side
          <>
            <View style={[styles.animationContainer, landscapeAnimation]}>
              <OnboardingAnimation type={currentScreen.animation} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={[styles.textContainer, landscapeText]}>
                <Text style={[styles.headline, landscapeHeadline]}>{currentScreen.headline}</Text>
                {currentScreen.sublines.map((line, i) => (
                  <Text key={i} style={[styles.subline, landscapeSubline]}>{line}</Text>
                ))}
              </View>
              <View style={styles.dotsContainer}>
                {SCREENS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentIndex && styles.dotActive,
                      i < currentIndex && styles.dotCompleted,
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
                <Text style={styles.buttonText}>{isLastScreen ? "LET'S BEGIN" : 'CONTINUE'}</Text>
                {!isLastScreen && <Text style={styles.arrow}>→</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Portrait layout: stacked
          <>
            <View style={styles.animationContainer}>
              <OnboardingAnimation type={currentScreen.animation} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.headline}>{currentScreen.headline}</Text>
              {currentScreen.sublines.map((line, i) => (
                <Text key={i} style={styles.subline}>{line}</Text>
              ))}
            </View>
            <View style={styles.dotsContainer}>
              {SCREENS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentIndex && styles.dotActive,
                    i < currentIndex && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{isLastScreen ? "LET'S BEGIN" : 'CONTINUE'}</Text>
              {!isLastScreen && <Text style={styles.arrow}>→</Text>}
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Black overlay for fade-through-black transitions */}
      <Animated.View style={[styles.blackOverlay, blackOverlayStyle]} pointerEvents="none" />
    </View>
  );
}

interface OnboardingAnimationProps {
  type: string;
}

// Icon size constants
const ICON_SIZE = 90;
const STROKE_COLOR = '#00FF88';
const STROKE_WIDTH = 1.8;

// ============================================
// SCREEN 1: No Advice - Speech Bubble with X
// ============================================
function NoAdviceIcon() {
  const fadeIn = useSharedValue(0);
  const xScale = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 600, easing: easeOutCubic });
    xScale.value = withDelay(300, withTiming(1, { duration: 400, easing: easeOutBack }));
  }, []);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const xStyle = useAnimatedStyle(() => ({
    opacity: xScale.value,
    transform: [{ scale: xScale.value }],
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.iconGlow, bubbleStyle]} />
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90">
        {/* Speech bubble */}
        <Path
          d="M 15 20
             Q 15 10, 25 10
             L 65 10
             Q 75 10, 75 20
             L 75 50
             Q 75 60, 65 60
             L 35 60
             L 25 75
             L 28 60
             L 25 60
             Q 15 60, 15 50
             Z"
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinejoin="round"
        />
        {/* X mark */}
        <Animated.View style={xStyle}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            <Line x1="32" y1="25" x2="58" y2="45" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
            <Line x1="58" y1="25" x2="32" y2="45" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </Svg>
    </View>
  );
}

// ============================================
// SCREEN 2: Mirror - Ornate Frame with Shimmer
// ============================================
function MirrorIcon() {
  const shimmerPos = useSharedValue(-1);
  const glowPulse = useSharedValue(0.2);

  useEffect(() => {
    // Shimmer effect
    shimmerPos.value = withRepeat(
      withTiming(1, { duration: 2500, easing: easeInOutQuad }),
      -1,
      true
    );
    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500, easing: easeInOutQuad }),
        withTiming(0.2, { duration: 1500, easing: easeInOutQuad })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerPos.value, [-1, 0, 1], [0, 0.6, 0]),
    transform: [{ translateX: shimmerPos.value * 30 }],
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.iconGlow, innerGlowStyle]} />
      <Svg width={ICON_SIZE} height={ICON_SIZE + 10} viewBox="0 0 90 100">
        {/* Ornate mirror frame - outer decorative border */}
        <Path
          d="M 45 5
             Q 75 5, 80 20
             L 82 45
             Q 82 75, 65 85
             L 45 90
             L 25 85
             Q 8 75, 8 45
             L 10 20
             Q 15 5, 45 5 Z"
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Inner mirror surface */}
        <Path
          d="M 45 15
             Q 65 15, 70 25
             L 72 45
             Q 72 68, 58 77
             L 45 80
             L 32 77
             Q 18 68, 18 45
             L 20 25
             Q 25 15, 45 15 Z"
          fill="rgba(0, 255, 136, 0.08)"
          stroke={STROKE_COLOR}
          strokeWidth={1}
          opacity={0.5}
        />
        {/* Mirror handle */}
        <Line x1="45" y1="90" x2="45" y2="98" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
        {/* Decorative top ornament */}
        <Circle cx="45" cy="5" r="3" fill={STROKE_COLOR} opacity={0.6} />
        {/* Side ornaments */}
        <Circle cx="10" cy="45" r="2" fill={STROKE_COLOR} opacity={0.4} />
        <Circle cx="80" cy="45" r="2" fill={STROKE_COLOR} opacity={0.4} />
      </Svg>
      {/* Shimmer effect overlay */}
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
}

// ============================================
// SCREEN 3: Silence - Fading Sound Waves
// ============================================
function SilenceIcon() {
  const wave1 = useSharedValue(1);
  const wave2 = useSharedValue(1);
  const wave3 = useSharedValue(1);
  const wave4 = useSharedValue(1);

  useEffect(() => {
    // Waves fade out in sequence, then reset
    const duration = 800;
    const fadeWaves = () => {
      wave1.value = 1;
      wave2.value = 1;
      wave3.value = 1;
      wave4.value = 1;

      wave4.value = withDelay(0, withTiming(0, { duration, easing: easeOutQuad }));
      wave3.value = withDelay(200, withTiming(0, { duration, easing: easeOutQuad }));
      wave2.value = withDelay(400, withTiming(0, { duration, easing: easeOutQuad }));
      wave1.value = withDelay(600, withTiming(0, { duration, easing: easeOutQuad }));
    };

    fadeWaves();
    const interval = setInterval(fadeWaves, 3000);
    return () => clearInterval(interval);
  }, []);

  const wave1Style = useAnimatedStyle(() => ({ opacity: wave1.value }));
  const wave2Style = useAnimatedStyle(() => ({ opacity: wave2.value }));
  const wave3Style = useAnimatedStyle(() => ({ opacity: wave3.value }));
  const wave4Style = useAnimatedStyle(() => ({ opacity: wave4.value * 0.5 }));

  return (
    <View style={styles.iconContainer}>
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90">
        {/* Speaker/source dot */}
        <Circle cx="20" cy="45" r="6" fill={STROKE_COLOR} opacity={0.8} />

        {/* Sound waves - arcs emanating from source */}
        <Animated.View style={wave1Style}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            <Path
              d="M 32 30 Q 42 45, 32 60"
              fill="none"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={wave2Style}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            <Path
              d="M 42 22 Q 58 45, 42 68"
              fill="none"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              opacity={0.8}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={wave3Style}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            <Path
              d="M 52 15 Q 72 45, 52 75"
              fill="none"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray="4 4"
              opacity={0.6}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={wave4Style}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            <Path
              d="M 62 10 Q 85 45, 62 80"
              fill="none"
              stroke={STROKE_COLOR}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeDasharray="2 6"
              opacity={0.4}
            />
          </Svg>
        </Animated.View>
      </Svg>
    </View>
  );
}

// ============================================
// SCREEN 4: Attention - Elegant Eye Opening
// ============================================
function AttentionIcon() {
  const eyeOpen = useSharedValue(0);
  const pupilScale = useSharedValue(0.8);
  const glowIntensity = useSharedValue(0.2);

  useEffect(() => {
    // Eye slowly opens
    eyeOpen.value = withDelay(200, withTiming(1, { duration: 1200, easing: easeOutCubic }));

    // Pupil dilates
    pupilScale.value = withDelay(800, withSequence(
      withTiming(1.2, { duration: 400, easing: easeOutQuad }),
      withTiming(1, { duration: 300, easing: easeInOutQuad })
    ));

    // Glow pulses after eye opens
    setTimeout(() => {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500, easing: easeInOutQuad }),
          withTiming(0.2, { duration: 1500, easing: easeInOutQuad })
        ),
        -1,
        false
      );
    }, 1400);
  }, []);

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeOpen.value }],
  }));

  const pupilStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pupilScale.value }],
    opacity: eyeOpen.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.iconGlow, glowStyle]} />
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90">
        {/* Eye outline - almond shape */}
        <Path
          d="M 10 45
             Q 45 15, 80 45
             Q 45 75, 10 45 Z"
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinejoin="round"
        />

        {/* Iris */}
        <Circle
          cx="45"
          cy="45"
          r="18"
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={1.2}
          opacity={0.6}
        />

        {/* Pupil */}
        <Animated.View style={pupilStyle}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            <Circle cx="45" cy="45" r="8" fill={STROKE_COLOR} />
            {/* Highlight */}
            <Circle cx="49" cy="41" r="3" fill="#000" opacity={0.4} />
          </Svg>
        </Animated.View>

        {/* Subtle eyelashes - top */}
        <Line x1="25" y1="28" x2="28" y2="23" stroke={STROKE_COLOR} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
        <Line x1="45" y1="22" x2="45" y2="17" stroke={STROKE_COLOR} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
        <Line x1="65" y1="28" x2="62" y2="23" stroke={STROKE_COLOR} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// ============================================
// SCREEN 5: Promise - Hand Over Heart
// ============================================
function PromiseIcon() {
  const heartBeat = useSharedValue(1);
  const glowPulse = useSharedValue(0.3);
  const handFade = useSharedValue(0);

  useEffect(() => {
    // Hand fades in
    handFade.value = withTiming(1, { duration: 800, easing: easeOutCubic });

    // Heart beats gently
    setTimeout(() => {
      heartBeat.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 300, easing: easeOutQuad }),
          withTiming(1, { duration: 300, easing: easeInOutQuad }),
          withTiming(1.05, { duration: 250, easing: easeOutQuad }),
          withTiming(1, { duration: 800, easing: easeInOutQuad })
        ),
        -1,
        false
      );

      glowPulse.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 300, easing: easeOutQuad }),
          withTiming(0.3, { duration: 300, easing: easeInOutQuad }),
          withTiming(0.5, { duration: 250, easing: easeOutQuad }),
          withTiming(0.3, { duration: 800, easing: easeInOutQuad })
        ),
        -1,
        false
      );
    }, 600);
  }, []);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartBeat.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const handStyle = useAnimatedStyle(() => ({
    opacity: handFade.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.iconGlow, glowStyle]} />
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90">
        {/* Heart */}
        <Animated.View style={heartStyle}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            <Path
              d="M 45 75
                 L 20 50
                 Q 10 38, 15 28
                 Q 20 18, 32 18
                 Q 40 18, 45 28
                 Q 50 18, 58 18
                 Q 70 18, 75 28
                 Q 80 38, 70 50
                 Z"
              fill="none"
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>

        {/* Hand silhouette over heart */}
        <Animated.View style={handStyle}>
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 90 90" style={StyleSheet.absoluteFill}>
            {/* Simplified elegant hand - palm covering heart */}
            <Path
              d="M 28 55
                 Q 25 45, 30 38
                 L 35 35
                 Q 38 32, 42 35
                 L 45 38
                 Q 48 32, 52 35
                 L 55 38
                 Q 58 32, 62 35
                 L 65 40
                 Q 68 45, 65 55
                 L 60 65
                 Q 55 72, 45 72
                 Q 35 72, 30 65
                 Z"
              fill="rgba(0, 255, 136, 0.15)"
              stroke={STROKE_COLOR}
              strokeWidth={1.2}
              opacity={0.7}
            />
            {/* Finger lines */}
            <Line x1="38" y1="38" x2="38" y2="50" stroke={STROKE_COLOR} strokeWidth={1} opacity={0.4} />
            <Line x1="48" y1="36" x2="48" y2="48" stroke={STROKE_COLOR} strokeWidth={1} opacity={0.4} />
            <Line x1="57" y1="38" x2="57" y2="50" stroke={STROKE_COLOR} strokeWidth={1} opacity={0.4} />
          </Svg>
        </Animated.View>
      </Svg>
    </View>
  );
}

function OnboardingAnimation({ type }: OnboardingAnimationProps) {
  switch (type) {
    case 'glow':
      return <NoAdviceIcon />;
    case 'mirror':
      return <MirrorIcon />;
    case 'wave':
      return <SilenceIcon />;
    case 'pulse':
      return <AttentionIcon />;
    case 'handshake':
      return <PromiseIcon />;
    default:
      return null;
  }
}

export async function checkBehavioralOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem('@behavioral_onboarding_complete');
  return value === 'true';
}

export async function resetBehavioralOnboarding(): Promise<void> {
  await AsyncStorage.removeItem('@behavioral_onboarding_complete');
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'android' ? 24 : 0, // Account for gesture navigation
  },

  // Animation container
  animationContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  // Premium icon container
  iconContainer: {
    width: 100,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Subtle glow behind icons
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },

  // Shimmer effect for mirror
  shimmer: {
    position: 'absolute',
    width: 20,
    height: 80,
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    borderRadius: 10,
    transform: [{ skewX: '-20deg' }],
  },

  // Text styles
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  headline: {
    fontFamily: FontFamily.semiBold,
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  subline: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.3,
  },

  // Progress dots
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 50,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: Colors.neon,
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  dotCompleted: {
    backgroundColor: 'rgba(0, 255, 136, 0.5)',
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.neon,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    minWidth: 200,
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.neon,
    letterSpacing: 1,
  },
  arrow: {
    color: Colors.neon,
    fontSize: 20,
    marginLeft: 10,
    fontWeight: '300',
  },

  // Black overlay for fade-through-black transitions
  blackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
});

export default BehavioralOnboarding;
