/**
 * AES-256-GCM Encryption Utility
 * Provides secure encryption for sensitive data like email passwords
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_ALIAS = 'spendtrak_encryption_key';

/**
 * Generate or retrieve the encryption key from secure storage
 */
async function getEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  if (!key) {
    // Generate a new 256-bit key (32 bytes)
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key);
  }
  return key;
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded string containing IV + ciphertext + auth tag
 */
export async function encryptData(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = await Crypto.getRandomBytesAsync(12); // 96-bit IV for GCM

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const keyBytes = hexToBytes(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    data
  );

  // Combine IV + ciphertext (auth tag is appended by GCM)
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return bytesToBase64(combined);
}

/**
 * Decrypt data that was encrypted with encryptData
 * @param encryptedData - Base64-encoded string from encryptData
 * @returns The original plaintext string
 */
export async function decryptData(encryptedData: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = base64ToBytes(encryptedData);

  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const keyBytes = hexToBytes(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if a string appears to be encrypted (vs legacy base64 encoding)
 * Encrypted data will be longer due to IV and auth tag
 */
export function isEncrypted(data: string): boolean {
  try {
    const decoded = base64ToBytes(data);
    // Encrypted data: 12 bytes IV + at least 16 bytes auth tag + ciphertext
    // So minimum length is 28 bytes for empty plaintext
    return decoded.length >= 28;
  } catch {
    return false;
  }
}

/**
 * Migrate legacy base64-encoded password to encrypted format
 * @param legacyData - Base64-encoded password (old format)
 * @returns Encrypted password (new format)
 */
export async function migrateLegacyPassword(legacyData: string): Promise<string> {
  // Decode the legacy base64 password
  const plainPassword = atob(legacyData);
  // Re-encrypt with proper encryption
  return encryptData(plainPassword);
}
