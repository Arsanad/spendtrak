/**
 * Storage Utilities
 * Includes storage quota checks for device health
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

const LOW_STORAGE_THRESHOLD_MB = 50; // Warn when less than 50MB free

/**
 * Check if device has enough storage space
 * Returns true if storage is OK, false if low
 */
export async function checkStorageQuota(): Promise<boolean> {
  try {
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    const freeSpaceMB = freeSpace / (1024 * 1024);

    if (freeSpaceMB < LOW_STORAGE_THRESHOLD_MB) {
      Alert.alert(
        'Low Storage',
        'Your device is running low on storage. SpendTrak may not function properly. Please free up some space.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch {
    // Can't check — assume OK
    return true;
  }
}

export default {
  checkStorageQuota,
};
