// SPENDTRAK - Reanimated v4 Compatible Easing Functions
// React Native Reanimated v3+ removed Easing.cubic, Easing.quad, etc.
// This file provides bezier curve equivalents

import { Easing } from 'react-native-reanimated';

// Standard easing curves as bezier functions
// These replicate the removed Easing.cubic, Easing.quad, Easing.sine

// Cubic easing
export const easeOutCubic = Easing.bezier(0.33, 1, 0.68, 1);
export const easeInCubic = Easing.bezier(0.32, 0, 0.67, 0);
export const easeInOutCubic = Easing.bezier(0.65, 0, 0.35, 1);

// Quad easing
export const easeOutQuad = Easing.bezier(0.5, 1, 0.89, 1);
export const easeInQuad = Easing.bezier(0.11, 0, 0.5, 0);
export const easeInOutQuad = Easing.bezier(0.45, 0, 0.55, 1);

// Sine easing
export const easeOutSine = Easing.bezier(0.39, 0.575, 0.565, 1);
export const easeInSine = Easing.bezier(0.47, 0, 0.745, 0.715);
export const easeInOutSine = Easing.bezier(0.37, 0, 0.63, 1);

// Expo easing
export const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInExpo = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOutExpo = Easing.bezier(0.87, 0, 0.13, 1);

// Back easing (overshoot)
export const easeOutBack = Easing.bezier(0.34, 1.56, 0.64, 1);
export const easeInBack = Easing.bezier(0.36, 0, 0.66, -0.56);
export const easeInOutBack = Easing.bezier(0.68, -0.6, 0.32, 1.6);

// Export grouped
export const EASING = {
  cubic: {
    out: easeOutCubic,
    in: easeInCubic,
    inOut: easeInOutCubic,
  },
  quad: {
    out: easeOutQuad,
    in: easeInQuad,
    inOut: easeInOutQuad,
  },
  sine: {
    out: easeOutSine,
    in: easeInSine,
    inOut: easeInOutSine,
  },
  expo: {
    out: easeOutExpo,
    in: easeInExpo,
    inOut: easeInOutExpo,
  },
};
