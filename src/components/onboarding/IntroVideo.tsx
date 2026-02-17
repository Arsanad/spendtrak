/**
 * SpendTrak Scramble Intro — Premium Cinematic Edition
 *
 * Eight-phase "luxury startup sequence" text reveal and cinematic exit:
 *   Phase 1 — Matrix decode (0–2s):        All chars scramble rapidly (40–80ms each)
 *   Phase 2 — Sequential reveal (2–3.4s):  Chars lock left-to-right with flash
 *   Phase 3 — Power surge (3.4s):          Scale pulse on the completed text
 *   Phase 5 — Afterglow (4–5.1s):          Glow intensifies, subtle scale up
 *   Phase 6 — Slow shutdown (5.1–6.6s):    Diminishing glow pulses, edge-inward char dim
 *   Phase 7 — Black void (6.6–7.1s):       Pure black screen, cinematic pause (500ms)
 *   Phase 8 — App emergence (7.1–7.9s):    Black overlay fades out, revealing the app
 *
 * Each character is its own <Animated.View> so it can animate independently.
 * A scan-line sweeps down during Phase 1 for extra atmosphere.
 * Overlay is SOLID BLACK — no background content visible during intro.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  type SharedValue,
  interpolateColor,
} from 'react-native-reanimated';

const TARGET = 'SPENDTRAK';
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Timing (ms from mount) ─────────────────────────────────────────
const PHASE2_START = 2000;
const CHAR_LOCK_DELAY = 155;
const LAST_LOCK = PHASE2_START + (TARGET.length - 1) * CHAR_LOCK_DELAY; // ~3240
const PHASE3_START = LAST_LOCK + 200; // ~3440

// Phase 5 — Afterglow
const PHASE5_START = 4000;
const PHASE5_GLOW_START = PHASE5_START + 500; // hold 500ms, then glow
const PHASE5_GLOW_DURATION = 600;

// Phase 6 — Slow shutdown
const PHASE6_START = PHASE5_GLOW_START + PHASE5_GLOW_DURATION; // ~5100
const PHASE6_DURATION = 1500;

// Edge-inward dim order: [S,K] → [P,A] → [E,R] → [N,T] → [D]
const DIM_PAIRS: number[][] = [[0, 8], [1, 7], [2, 6], [3, 5], [4]];
const DIM_GROUP_STAGGER = 150;
const DIM_CHAR_DURATION = 400;

function getCharDimDelay(charIndex: number): number {
  for (let g = 0; g < DIM_PAIRS.length; g++) {
    if (DIM_PAIRS[g].includes(charIndex)) return g * DIM_GROUP_STAGGER;
  }
  return 0;
}

// Phase 7 — Black void (500ms solid black pause)
const PHASE7_START = PHASE6_START + PHASE6_DURATION; // ~6600
const PHASE7_DURATION = 500;

// Phase 8 — App emergence (overlay fades out over 800ms)
const PHASE8_START = PHASE7_START + PHASE7_DURATION; // ~7100
const PHASE8_DURATION = 800;
const TOTAL_DURATION = PHASE8_START + PHASE8_DURATION; // ~7900

let hasPlayedThisSession = false;

export function resetIntroVideo() {
  hasPlayedThisSession = false;
}

export interface IntroVideoProps {
  /** Called at Phase 8 start — content should begin rendering underneath */
  onComplete: () => void;
  /** Called when Phase 8 ends — safe to unmount IntroVideo */
  onDismiss?: () => void;
}

// Monospace font for scramble phase — stable character widths
const MONOSPACE_FONT = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

// ─── Individual character ────────────────────────────────────────────
interface ScrambleCharProps {
  targetChar: string;
  lockTime: number;
  dimTime: number;
  glowRadius: SharedValue<number>;
  glowColorProgress: SharedValue<number>;
}

const ScrambleChar = React.memo(function ScrambleChar({
  targetChar,
  lockTime,
  dimTime,
  glowRadius,
  glowColorProgress,
}: ScrambleCharProps) {
  const [char, setChar] = useState(
    () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
  );
  const [locked, setLocked] = useState(false);
  const scale = useSharedValue(1);
  const charOpacity = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    const speed = 40 + Math.floor(Math.random() * 40);

    intervalRef.current = setInterval(() => {
      if (lockedRef.current) return;

      if (Date.now() >= lockTime) {
        lockedRef.current = true;
        setLocked(true);
        setChar(targetChar);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        scale.value = withSequence(
          withTiming(1.35, { duration: 60, easing: Easing.out(Easing.cubic) }),
          withTiming(1.0, { duration: 100, easing: Easing.inOut(Easing.cubic) })
        );
      } else {
        setChar(
          SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        );
      }
    }, speed);

    // Phase 6: individual character dim (edges inward)
    const msUntilDim = dimTime - Date.now();
    if (msUntilDim > 0) {
      dimTimerRef.current = setTimeout(() => {
        charOpacity.value = withTiming(0, {
          duration: DIM_CHAR_DURATION,
          easing: Easing.out(Easing.cubic),
        });
      }, msUntilDim);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (dimTimerRef.current) {
        clearTimeout(dimTimerRef.current);
        dimTimerRef.current = null;
      }
    };
  }, [lockTime, dimTime, targetChar, scale, charOpacity]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: charOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => {
    const shadowColor = interpolateColor(
      glowColorProgress.value,
      [0, 1],
      ['rgba(0,255,136,0.6)', 'rgba(57,255,20,0.8)']
    );
    return {
      textShadowColor: shadowColor,
      textShadowRadius: glowRadius.value,
      textShadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <Animated.View style={[styles.charWrapper, wrapperStyle]}>
      <Animated.Text
        style={[
          locked ? styles.charTextResolved : styles.charTextScramble,
          textStyle,
        ]}
      >
        {char}
      </Animated.Text>
    </Animated.View>
  );
});

// ─── Main intro component ────────────────────────────────────────────
function ScrambleIntro({ onComplete, onDismiss }: IntroVideoProps) {
  const hasCompleted = useRef(false);
  const mountTime = useRef(Date.now());

  // Animated values
  const overallScale = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const glowRadius = useSharedValue(20);
  const glowColorProgress = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  // Scan-line
  const scanLineY = useSharedValue(0);
  const scanLineOpacity = useSharedValue(0.7);

  // Pre-compute absolute lock timestamps
  const lockTimes = useRef(
    TARGET.split('').map(
      (_, i) => mountTime.current + PHASE2_START + i * CHAR_LOCK_DELAY
    )
  ).current;

  // Pre-compute absolute dim timestamps (Phase 6, edge-inward)
  const dimTimes = useRef(
    TARGET.split('').map(
      (_, i) => mountTime.current + PHASE6_START + getCharDimDelay(i)
    )
  ).current;

  const triggerCompletion = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    hasPlayedThisSession = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    SplashScreen.hideAsync();

    if (!__DEV__ && hasPlayedThisSession) {
      triggerCompletion();
      onDismiss?.();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: scan-line sweeps top → bottom (0–2s)
    scanLineY.value = withTiming(SCREEN_HEIGHT, {
      duration: 2000,
      easing: Easing.linear,
    });
    timers.push(setTimeout(() => {
      scanLineOpacity.value = withTiming(0, { duration: 400 });
    }, 1600));

    // Phase 3: power-surge scale pulse
    timers.push(setTimeout(() => {
      overallScale.value = withSequence(
        withTiming(1.06, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(1.0, { duration: 150, easing: Easing.inOut(Easing.cubic) })
      );
    }, PHASE3_START));

    // Phase 5: Afterglow — glow intensifies + subtle scale up
    timers.push(setTimeout(() => {
      glowRadius.value = withTiming(60, {
        duration: PHASE5_GLOW_DURATION,
        easing: Easing.inOut(Easing.quad),
      });
      glowColorProgress.value = withTiming(1, {
        duration: PHASE5_GLOW_DURATION,
        easing: Easing.inOut(Easing.quad),
      });
      overallScale.value = withTiming(1.08, {
        duration: PHASE5_GLOW_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
    }, PHASE5_GLOW_START));

    // Phase 6: Slow shutdown — diminishing glow pulses + text fade
    timers.push(setTimeout(() => {
      // 3 diminishing pulses: 60→30→40→20→30→10
      glowRadius.value = withSequence(
        withTiming(30, { duration: 200, easing: Easing.inOut(Easing.quad) }),
        withTiming(40, { duration: 200, easing: Easing.inOut(Easing.quad) }),
        withTiming(20, { duration: 200, easing: Easing.inOut(Easing.quad) }),
        withTiming(30, { duration: 200, easing: Easing.inOut(Easing.quad) }),
        withTiming(10, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      );
      // Glow color returns to dim
      glowColorProgress.value = withTiming(0, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
      // Overall text opacity: 1.0 → 0
      textOpacity.value = withTiming(0, {
        duration: PHASE6_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }, PHASE6_START));

    // Phase 8: App emergence — signal content to render, fade out solid black overlay
    timers.push(setTimeout(() => {
      triggerCompletion();
      overlayOpacity.value = withTiming(0, {
        duration: PHASE8_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }, PHASE8_START));

    // Final: safe to unmount after Phase 8
    timers.push(setTimeout(() => {
      onDismiss?.();
    }, TOTAL_DURATION));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [triggerCompletion, onDismiss]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: overallScale.value }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: scanLineOpacity.value,
    transform: [{ translateY: scanLineY.value }],
  }));

  const overlayFadeStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!__DEV__ && hasPlayedThisSession && hasCompleted.current) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, overlayFadeStyle]}>
      {/* Text layer */}
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.scanLine, scanStyle]} />
        <View style={styles.charRow}>
          {TARGET.split('').map((ch, i) => (
            <ScrambleChar
              key={i}
              targetChar={ch}
              lockTime={lockTimes[i]}
              dimTime={dimTimes[i]}
              glowRadius={glowRadius}
              glowColorProgress={glowColorProgress}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function IntroVideo({ onComplete, onDismiss }: IntroVideoProps) {
  return <ScrambleIntro onComplete={onComplete} onDismiss={onDismiss} />;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#000000',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charWrapper: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charTextScramble: {
    fontFamily: MONOSPACE_FONT,
    color: '#39FF14',
    fontSize: 42,
    textAlign: 'center',
  },
  charTextResolved: {
    fontFamily: 'Cinzel_700Bold',
    color: '#39FF14',
    fontSize: 42,
    textAlign: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(57, 255, 20, 0.3)',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 5,
  },
});

export default IntroVideo;
