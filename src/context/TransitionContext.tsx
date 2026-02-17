// SPENDTRAK FADE THROUGH BLACK TRANSITION
// Global blackout overlay for cinematic screen transitions
// Like theater lights dimming between scenes

import React, { createContext, useContext, useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { FADE_THROUGH_BLACK, LUXURY_EASING } from '../config/luxuryAnimations';

interface TransitionContextType {
  triggerBlackout: (callback?: () => void) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within TransitionProvider');
  }
  return context;
};

// Convenience hook for navigation with blackout effect
// Usage: const navigateWithBlackout = useBlackoutNavigation();
//        navigateWithBlackout(() => router.push('/settings'));
export const useBlackoutNavigation = () => {
  const { triggerBlackout } = useTransition();
  return triggerBlackout;
};

interface TransitionProviderProps {
  children: React.ReactNode;
}

export const TransitionProvider: React.FC<TransitionProviderProps> = ({
  children,
}) => {
  const blackoutOpacity = useSharedValue(0);
  const isTransitioningRef = useRef(false);

  const triggerBlackout = useCallback((callback?: () => void) => {
    // Prevent overlapping transitions
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Phase 1: Fade to black (screen "shuts down")
    blackoutOpacity.value = withTiming(1, {
      duration: FADE_THROUGH_BLACK.fadeOutDuration,
      easing: LUXURY_EASING.fadeOut,
    });

    // Phase 2: At peak darkness, execute the navigation callback
    // Navigation happens while screen is fully black
    const navigationTime = FADE_THROUGH_BLACK.fadeOutDuration;
    setTimeout(() => {
      callback?.();
    }, navigationTime);

    // Phase 3: After navigation completes and screen loads, fade back out
    // Wait for blackHoldDuration to ensure new screen is ready underneath
    const fadeBackTime =
      FADE_THROUGH_BLACK.fadeOutDuration + FADE_THROUGH_BLACK.blackHoldDuration;
    setTimeout(() => {
      blackoutOpacity.value = withTiming(0, {
        duration: FADE_THROUGH_BLACK.fadeInDuration,
        easing: LUXURY_EASING.fadeIn,
      });
    }, fadeBackTime);

    // Reset transitioning flag after complete
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, FADE_THROUGH_BLACK.totalDuration + 50);
  }, []);

  const blackoutStyle = useAnimatedStyle(() => ({
    opacity: blackoutOpacity.value,
  }));

  return (
    <TransitionContext.Provider
      value={{
        triggerBlackout,
        isTransitioning: isTransitioningRef.current,
      }}
    >
      <View style={styles.container}>
        {children}

        {/* Global blackout overlay - always on top */}
        <Animated.View
          style={[styles.blackout, blackoutStyle]}
          pointerEvents="none"
        />
      </View>
    </TransitionContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blackout: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 9999,
    elevation: 9999,
  },
});

export default TransitionProvider;
