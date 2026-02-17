/**
 * Reset Onboarding Utility
 * Use this for testing the intro video and onboarding flow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const INTRO_VIDEO_COMPLETE_KEY = '@intro_video_complete';
const BEHAVIORAL_ONBOARDING_KEY = '@behavioral_onboarding_complete';
const MAIN_ONBOARDING_KEY = 'spendtrak_onboarding_complete';
const ONBOARDING_TUNNEL_KEY = 'onboarding-tunnel';

/**
 * Resets all onboarding state to simulate first launch
 * Call this and restart the app to test the full flow
 */
export async function resetAllOnboarding(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      INTRO_VIDEO_COMPLETE_KEY,
      BEHAVIORAL_ONBOARDING_KEY,
      MAIN_ONBOARDING_KEY,
      ONBOARDING_TUNNEL_KEY,
    ]);
  } catch (error) {
    logger.general.error('Failed to reset onboarding:', error);
  }
}

/**
 * Resets only the intro video state
 */
export async function resetIntroVideo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(INTRO_VIDEO_COMPLETE_KEY);
  } catch (error) {
    logger.general.error('Failed to reset intro video:', error);
  }
}

/**
 * Resets only the behavioral onboarding state
 */
export async function resetBehavioralOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BEHAVIORAL_ONBOARDING_KEY);
  } catch (error) {
    logger.general.error('Failed to reset behavioral onboarding:', error);
  }
}

/**
 * Resets only the main onboarding slides
 */
export async function resetMainOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MAIN_ONBOARDING_KEY);
  } catch (error) {
    logger.general.error('Failed to reset main onboarding:', error);
  }
}

/**
 * Check current onboarding status
 */
export async function checkOnboardingStatus(): Promise<{
  introVideoComplete: boolean;
  behavioralOnboardingComplete: boolean;
  mainOnboardingComplete: boolean;
  tunnelComplete: boolean;
}> {
  const introVideo = await AsyncStorage.getItem(INTRO_VIDEO_COMPLETE_KEY);
  const behavioral = await AsyncStorage.getItem(BEHAVIORAL_ONBOARDING_KEY);
  const mainOnboarding = await AsyncStorage.getItem(MAIN_ONBOARDING_KEY);
  const tunnel = await AsyncStorage.getItem(ONBOARDING_TUNNEL_KEY);

  let tunnelComplete = false;
  if (tunnel) {
    try {
      const parsed = JSON.parse(tunnel);
      tunnelComplete = parsed?.state?.isComplete === true;
    } catch {}
  }

  const status = {
    introVideoComplete: introVideo === 'true',
    behavioralOnboardingComplete: behavioral === 'true',
    mainOnboardingComplete: mainOnboarding === 'true',
    tunnelComplete,
  };

  return status;
}

/**
 * Resets only the onboarding tunnel state
 */
export async function resetOnboardingTunnel(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_TUNNEL_KEY);
  } catch (error) {
    logger.general.error('Failed to reset onboarding tunnel:', error);
  }
}
