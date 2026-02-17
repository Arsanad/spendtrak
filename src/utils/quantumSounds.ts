/**
 * QUANTUM Sound System - Haptics Only Version
 *
 * NOTE: expo-av removed due to React Native 0.81.5 compatibility issues.
 * This version uses haptics only for feedback.
 * TODO: Re-add audio when expo-av is compatible.
 */

import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';
import { logger } from './logger';

// Sound types for different QUANTUM responses
export type QuantumSoundType = 'acknowledge' | 'intervention' | 'success' | 'speak';

// Haptic patterns for each sound type
const HAPTIC_PATTERNS: Record<QuantumSoundType, () => Promise<void>> = {
  // Soft "pop" feeling when QUANTUM acknowledges
  acknowledge: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Gentle attention tap for interventions
  intervention: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Satisfying success feeling for wins
  success: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Subtle tap when QUANTUM starts speaking
  speak: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  },
};

/**
 * Pre-load all available QUANTUM sounds.
 * No-op in haptics-only mode.
 */
export async function initQuantumSounds(): Promise<void> {
  logger.quantum.debug('Haptics-only mode (expo-av removed)');
}

/**
 * Unload all pre-loaded sounds.
 * No-op in haptics-only mode.
 */
export async function unloadQuantumSounds(): Promise<void> {
  // No sounds to unload
}

/**
 * Play QUANTUM feedback (haptic only)
 * Respects the quantumSoundsEnabled user setting.
 * @param type - Type of feedback to play
 */
export async function playQuantumFeedback(type: QuantumSoundType): Promise<void> {
  const enabled = useSettingsStore.getState().quantumSoundsEnabled;
  logger.quantum.debug(`playQuantumFeedback(${type}) - enabled: ${enabled}`);

  if (!enabled) {
    logger.quantum.debug('Sounds disabled in settings');
    return;
  }

  // Play haptic feedback
  try {
    await HAPTIC_PATTERNS[type]();
    logger.quantum.debug(`Haptic played: ${type}`);
  } catch (error) {
    logger.quantum.warn('Haptic failed:', error);
  }
}

/**
 * Play a sequence of haptic pulses (for typewriter effect)
 * @param count - Number of pulses
 * @param interval - Interval between pulses in ms
 */
export async function playTypewriterHaptics(count: number, interval: number = 50): Promise<void> {
  const enabled = useSettingsStore.getState().quantumSoundsEnabled;
  if (!enabled) return;

  try {
    for (let i = 0; i < Math.min(count, 5); i++) {
      // Limit to 5 pulses to not overwhelm
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  } catch {
    // Silent fail
  }
}

/**
 * Play a double-tap haptic for emphasis
 */
export async function playEmphasisHaptic(): Promise<void> {
  const enabled = useSettingsStore.getState().quantumSoundsEnabled;
  if (!enabled) return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silent fail
  }
}
