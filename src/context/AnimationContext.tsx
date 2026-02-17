/**
 * AnimationContext - Global animation control and preferences
 * Features: Reduced motion support, animation speed control, global toggle
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { TIMING, SPRING, EASING } from '@/config/animations';

interface AnimationConfig {
  // Timing multiplier (1.0 = normal, 0.5 = faster, 2.0 = slower)
  speedMultiplier: number;
  // Whether animations are enabled
  animationsEnabled: boolean;
  // Respect system reduced motion setting
  respectReducedMotion: boolean;
  // Whether system has reduced motion enabled
  systemReducedMotion: boolean;
}

interface AnimationContextValue extends AnimationConfig {
  // Computed values
  shouldAnimate: boolean;

  // Adjusted timing values
  getTiming: (baseDuration: number) => number;
  getSpring: (baseConfig: typeof SPRING.soft) => { damping: number; stiffness: number; mass: number };

  // Setters
  setSpeedMultiplier: (multiplier: number) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setRespectReducedMotion: (respect: boolean) => void;
}

const defaultConfig: AnimationConfig = {
  speedMultiplier: 1.0,
  animationsEnabled: true,
  respectReducedMotion: true,
  systemReducedMotion: false,
};

const AnimationContext = createContext<AnimationContextValue | null>(null);

interface AnimationProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<AnimationConfig>;
}

export function AnimationProvider({
  children,
  initialConfig = {},
}: AnimationProviderProps) {
  const [config, setConfig] = useState<AnimationConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  // Listen for system reduced motion changes
  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const isReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setConfig((prev) => ({
          ...prev,
          systemReducedMotion: isReducedMotion,
        }));
      } catch {
        // Default to false if check fails
      }
    };

    checkReducedMotion();

    // Subscribe to changes (iOS/Android)
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isReducedMotion) => {
        setConfig((prev) => ({
          ...prev,
          systemReducedMotion: isReducedMotion,
        }));
      }
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  // Compute whether animations should run
  const shouldAnimate = useMemo(() => {
    if (!config.animationsEnabled) return false;
    if (config.respectReducedMotion && config.systemReducedMotion) return false;
    return true;
  }, [config.animationsEnabled, config.respectReducedMotion, config.systemReducedMotion]);

  // Get adjusted timing duration
  const getTiming = useCallback(
    (baseDuration: number): number => {
      if (!shouldAnimate) return 0;
      return Math.round(baseDuration * config.speedMultiplier);
    },
    [shouldAnimate, config.speedMultiplier]
  );

  // Get adjusted spring config
  const getSpring = useCallback(
    (baseConfig: typeof SPRING.soft): { damping: number; stiffness: number; mass: number } => {
      if (!shouldAnimate) {
        // Return instant spring for no animation
        return {
          damping: 100,
          stiffness: 1000,
          mass: 0.1,
        };
      }

      // Adjust spring based on speed multiplier
      // Higher multiplier = slower = lower stiffness
      return {
        damping: baseConfig.damping,
        stiffness: baseConfig.stiffness / config.speedMultiplier,
        mass: baseConfig.mass * config.speedMultiplier,
      };
    },
    [shouldAnimate, config.speedMultiplier]
  );

  // Setters
  const setSpeedMultiplier = useCallback((multiplier: number) => {
    // Clamp between 0.25 (4x faster) and 4.0 (4x slower)
    const clamped = Math.max(0.25, Math.min(4.0, multiplier));
    setConfig((prev) => ({ ...prev, speedMultiplier: clamped }));
  }, []);

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, animationsEnabled: enabled }));
  }, []);

  const setRespectReducedMotion = useCallback((respect: boolean) => {
    setConfig((prev) => ({ ...prev, respectReducedMotion: respect }));
  }, []);

  const value = useMemo<AnimationContextValue>(
    () => ({
      ...config,
      shouldAnimate,
      getTiming,
      getSpring,
      setSpeedMultiplier,
      setAnimationsEnabled,
      setRespectReducedMotion,
    }),
    [
      config,
      shouldAnimate,
      getTiming,
      getSpring,
      setSpeedMultiplier,
      setAnimationsEnabled,
      setRespectReducedMotion,
    ]
  );

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

/**
 * Hook to access animation context
 * Throws if used outside AnimationProvider
 */
export function useAnimation(): AnimationContextValue {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}

/**
 * Hook to get animation-aware timing
 * Falls back to defaults if outside provider
 */
export function useAnimationTiming() {
  const context = useContext(AnimationContext);

  if (!context) {
    // Return default behavior outside provider
    return {
      shouldAnimate: true,
      getTiming: (duration: number) => duration,
      getSpring: (config: typeof SPRING.soft) => config,
    };
  }

  return {
    shouldAnimate: context.shouldAnimate,
    getTiming: context.getTiming,
    getSpring: context.getSpring,
  };
}

/**
 * Preset animation speeds
 */
export const ANIMATION_SPEEDS = {
  faster: 0.5,
  fast: 0.75,
  normal: 1.0,
  slow: 1.5,
  slower: 2.0,
} as const;

export type AnimationSpeed = keyof typeof ANIMATION_SPEEDS;
