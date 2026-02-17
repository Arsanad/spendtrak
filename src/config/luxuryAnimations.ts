// SPENDTRAK LUXURY ANIMATIONS
// Premium, cinematic, slow and deliberate transitions
// Inspired by: Rolls Royce, private banking apps, luxury watch brands

import { Easing } from 'react-native-reanimated';

// FADE THROUGH BLACK - Premium cinematic transition for ALL navigation
// Like theater lights dimming between scenes - slow, deliberate, luxurious
export const FADE_THROUGH_BLACK = {
  // Phase 1: Fade to black - slow, deliberate shutdown
  fadeOutDuration: 400,

  // Phase 2: Hold at complete darkness while screen loads
  blackHoldDuration: 200,

  // Phase 3: Reveal new screen - slow, elegant awakening
  fadeInDuration: 500,

  // Total: ~1020ms - premium, unhurried feel
  get totalDuration() {
    return this.fadeOutDuration + this.blackHoldDuration + this.fadeInDuration;
  },
};

// TIMING - Fast and responsive
export const LUXURY_DURATION = {
  // Screen level - quick and snappy
  screenEnter: 200,
  screenExit: 150,
  tabSwitch: 150,
  modalEnter: 250,
  modalExit: 200,

  // Content level - fast reveals
  contentReveal: 250,
  staggerDelay: 40,
  listItemEnter: 150,

  // Micro level - instant feedback
  buttonPress: 50,
  buttonRelease: 100,
  iconTransition: 150,
  glowPulse: 2000,
};

// EASING - Smooth, no sudden movements
// These curves create the "luxury car braking" feel
export const LUXURY_EASING = {
  // Primary - smooth deceleration
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1.0),

  // Enter - gentle acceleration then smooth stop
  enter: Easing.bezier(0.0, 0.0, 0.2, 1.0),

  // Exit - smooth start then fade away
  exit: Easing.bezier(0.4, 0.0, 1.0, 1.0),

  // Cinematic - very smooth, almost lazy
  cinematic: Easing.bezier(0.16, 1, 0.3, 1),

  // Subtle - barely noticeable acceleration
  subtle: Easing.bezier(0.4, 0.0, 0.6, 1.0),

  // Fade through black - premium shutdown/awakening curves
  // fadeOut: Smooth deceleration like dimming theater lights
  fadeOut: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  // fadeIn: Gentle acceleration then smooth reveal
  fadeIn: Easing.bezier(0.0, 0.0, 0.1, 1.0),
};

// SCALE - Always subtle, barely noticeable
export const LUXURY_SCALE = {
  screenEnter: { from: 0.97, to: 1 },
  screenExit: { from: 1, to: 0.98 },
  buttonPress: { from: 1, to: 0.98 },
  cardFocus: { from: 1, to: 1.01 },
};

// OPACITY
export const LUXURY_OPACITY = {
  hidden: 0,
  dimmed: 0.4,
  normal: 1,
  buttonPressed: 0.8,
};

// Navigation animation durations for expo-router
export const NAV_ANIMATION = {
  // Tab switch - smooth crossfade
  tabSwitch: LUXURY_DURATION.tabSwitch,
  // Stack push - slow fade
  stackPush: LUXURY_DURATION.screenEnter,
  stackPop: LUXURY_DURATION.screenExit,
  // Modal - elegant rise
  modalPresent: LUXURY_DURATION.modalEnter,
  modalDismiss: LUXURY_DURATION.modalExit,
  // Fade
  fade: LUXURY_DURATION.screenEnter,
};

// Helper to get stagger delay for indexed items
export const getStaggerDelay = (index: number) => index * LUXURY_DURATION.staggerDelay;
