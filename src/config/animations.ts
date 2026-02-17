// SPENDTRAK CINEMATIC EDITION - Animation Configuration
// Premium smooth animations for navigation and UI
// Brand: Cold, Slow, Smooth, Luxury

import { withTiming, withSpring, Easing } from 'react-native-reanimated';
import { easeOutCubic } from './easingFunctions';

/**
 * Timing durations - deliberately slow for luxury feel
 */
export const TIMING = {
  // Page transitions (slower = more luxurious)
  pageTransition: 400,
  modalOpen: 350,
  modalClose: 300,

  // Element animations
  fadeIn: 300,
  fadeOut: 250,
  slideIn: 350,
  slideOut: 300,

  // Micro-interactions
  buttonPress: 100,
  hapticDelay: 50,

  // List animations
  listItemStagger: 50,
  listItemDuration: 250,
} as const;

/**
 * Easing curves - smooth, organic feel
 */
export const EASING = {
  // Primary easing - smooth deceleration
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  // Enter animations - ease out
  enter: Easing.bezier(0.0, 0.0, 0.2, 1),
  // Exit animations - ease in
  exit: Easing.bezier(0.4, 0.0, 1, 1),
  // Spring-like but controlled
  gentle: Easing.bezier(0.34, 1.56, 0.64, 1),
  // Linear for continuous animations
  linear: Easing.linear,
} as const;

/**
 * Spring configurations for react-native-reanimated
 */
export const SPRING = {
  // Smooth, slow spring for page transitions
  page: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },
  // Gentle spring for modals
  modal: {
    damping: 25,
    stiffness: 120,
    mass: 0.8,
  },
  // Soft spring for elements
  soft: {
    damping: 15,
    stiffness: 100,
    mass: 0.5,
  },
  // Bouncy but controlled
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 0.5,
  },
} as const;

/**
 * Opacity values
 */
export const OPACITY = {
  visible: 1,
  dimmed: 0.7,
  disabled: 0.4,
  hidden: 0,
  overlay: 0.6,
  scrim: 0.85,
} as const;

/**
 * Transform values
 */
export const TRANSFORM = {
  slideDistance: 30,
  scalePressed: 0.97,
  scaleActive: 1.02,
} as const;

// Legacy configs - kept for backwards compatibility
export const TIMING_CONFIG = {
  // Ultra fast - instant feedback
  instant: { duration: 100, easing: easeOutCubic },
  // Fast - quick transitions
  fast: { duration: 200, easing: easeOutCubic },
  // Normal - standard animations
  normal: { duration: 280, easing: easeOutCubic },
  // Smooth - premium feel
  smooth: { duration: 350, easing: EASING.smooth },
  // Cinematic - dramatic effect
  cinematic: { duration: 450, easing: Easing.bezier(0.16, 1, 0.3, 1) },
};

// Spring configurations for different animation feels
export const SPRING_CONFIG = {
  // Snappy - quick and responsive
  snappy: { damping: 18, stiffness: 180, mass: 0.5 },
  // Smooth - balanced feel
  smooth: SPRING.soft,
  // Bouncy - playful effect
  bouncy: SPRING.bouncy,
  // Gentle - soft transitions
  gentle: { damping: 25, stiffness: 80, mass: 1 },
};

// Navigation animation durations - Subtle, refined, premium
export const NAV_ANIMATION = {
  // Tab switch - gentle crossfade
  tabSwitch: 200,
  // Stack push/pop - smooth and controlled
  stackPush: TIMING.pageTransition,
  stackPop: 250,
  // Modal present/dismiss - elegant rise
  modalPresent: TIMING.modalOpen,
  modalDismiss: TIMING.modalClose,
  // Fade transitions - soft and refined
  fade: TIMING.fadeIn,
};

// Helper functions for common animations
export const smoothTiming = (toValue: number, config = TIMING_CONFIG.smooth) =>
  withTiming(toValue, config);

export const fastTiming = (toValue: number) =>
  withTiming(toValue, TIMING_CONFIG.fast);

export const smoothSpring = (toValue: number) =>
  withSpring(toValue, SPRING_CONFIG.smooth);

export const snappySpring = (toValue: number) =>
  withSpring(toValue, SPRING_CONFIG.snappy);

// Stagger animation helpers
export const STAGGER_DELAY = TIMING.listItemStagger;

export const getStaggerDelay = (index: number, baseDelay = STAGGER_DELAY) =>
  index * baseDelay;
