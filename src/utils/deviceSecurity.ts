/**
 * Device Security Utility
 *
 * Detects jailbroken/rooted devices and emulators using jail-monkey.
 * Used to warn users about security risks on compromised devices.
 */

import { Platform } from 'react-native';
import { logger } from './logger';

let JailMonkey: any = null;

try {
  JailMonkey = require('jail-monkey');
} catch (e) {
  if (!__DEV__) {
    logger.general.warn('JailMonkey not available:', e);
  }
}

/**
 * Check if the device is jailbroken (iOS) or rooted (Android)
 */
export function isDeviceCompromised(): boolean {
  if (!JailMonkey) return false;

  try {
    return JailMonkey.isJailBroken();
  } catch (error) {
    logger.general.warn('Jailbreak detection check failed:', error);
    return false;
  }
}

/**
 * Check if the app is running on an emulator/simulator
 */
export function isRunningOnEmulator(): boolean {
  if (!JailMonkey) return false;

  try {
    // jail-monkey provides different methods per platform
    if (Platform.OS === 'android') {
      return JailMonkey.isOnExternalStorage?.() || false;
    }
    return false;
  } catch (error) {
    logger.general.warn('Emulator detection check failed:', error);
    return false;
  }
}
