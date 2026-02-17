/**
 * Haptics Utility - Haptics Only Version
 *
 * NOTE: expo-av removed due to React Native 0.81.5 compatibility issues.
 * Sound effects are disabled. Only haptic feedback is available.
 * TODO: Re-add audio when expo-av is compatible.
 */

import * as Haptics from 'expo-haptics';
import { logger } from './logger';

// ============================================
// SOUND EFFECT SYSTEM (DISABLED)
// expo-av removed - sounds not available
// ============================================

/**
 * Initialize sounds - no-op (sounds disabled)
 */
export async function initUISounds(): Promise<void> {
  logger.haptics.debug('Sounds disabled - expo-av removed');
}

// ============================================
// HAPTIC FEEDBACK (no sounds - just vibration)
// ============================================

// Light tap - buttons, cards, navigation
export const lightTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Soft tap - primary buttons
export const softTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

// Selection - toggles, pickers
export const selectionTap = () => Haptics.selectionAsync();

// ============================================
// MAJOR ACTION FEEDBACK (haptic only)
// Sound effects disabled due to expo-av removal
// ============================================

/**
 * SUCCESS - Play when user completes a major action:
 * - Saved a transaction
 * - Created a budget/goal
 * - Completed onboarding
 * - Logged in successfully
 */
export const successBuzz = async () => {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * ERROR - Play when something goes wrong:
 * - Save failed
 * - Validation error
 * - Network error
 */
export const errorBuzz = async () => {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * DELETE - Play when user deletes something important
 */
export const deleteBuzz = async () => {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

// Legacy aliases (haptic only, no sound)
export const navigationTap = lightTap;
export const mediumTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const modalFeedback = mediumTap;
export const heavyTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// ============================================
// UNIFIED HAPTIC TRIGGER
// For components that use a simple intensity-based API
// ============================================
export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const triggerHaptic = (intensity: HapticIntensity = 'medium') => {
  switch (intensity) {
    case 'light':
      return lightTap();
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'heavy':
      return heavyTap();
    case 'success':
      return successBuzz();
    case 'warning':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    case 'error':
      return errorBuzz();
    default:
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};
