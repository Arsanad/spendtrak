/**
 * Certificate Pinning Utility
 *
 * Provides a pinnedFetch() wrapper for HTTP requests with certificate pin validation.
 *
 * LIMITATION: True TLS certificate pinning requires native modules (e.g. react-native-ssl-pinning)
 * or a custom EAS config plugin. In a pure-JS Expo managed workflow, we cannot intercept the
 * TLS handshake to validate certificate public key hashes at the transport layer.
 *
 * This utility provides:
 * - The interface and structure for certificate pinning
 * - Pin hash storage for known hosts
 * - A fetch wrapper that enforces HTTPS and validates hosts against the pinned set
 *
 * For full enforcement, integrate a native module or EAS config plugin that performs
 * actual public key pinning at the native networking layer.
 */

import { logger } from './logger';

/**
 * SHA-256 certificate pin hashes for trusted hosts.
 * These must be updated when certificates are rotated.
 */
const PINNED_HOSTS: Record<string, string[]> = {
  'api.spendtrak.app': [
    // Primary pin (current certificate)
    'sha256/PLACEHOLDER_PRIMARY_PIN_HASH_BASE64',
    // Backup pin (next certificate — for rotation)
    'sha256/PLACEHOLDER_BACKUP_PIN_HASH_BASE64',
  ],
  'khzzyztmurvdzemlnbym.supabase.co': [
    // Primary pin
    'sha256/PLACEHOLDER_SUPABASE_PIN_HASH_BASE64',
    // Backup pin
    'sha256/PLACEHOLDER_SUPABASE_BACKUP_PIN_HASH_BASE64',
  ],
};

/**
 * Check if a host has pinned certificates configured
 */
export function isPinnedHost(hostname: string): boolean {
  return hostname in PINNED_HOSTS;
}

/**
 * Get the pinned hashes for a host
 */
export function getPinsForHost(hostname: string): string[] {
  return PINNED_HOSTS[hostname] || [];
}

/**
 * Fetch wrapper that enforces HTTPS for pinned hosts.
 *
 * In the current pure-JS implementation, this:
 * 1. Rejects non-HTTPS requests to pinned hosts
 * 2. Logs requests to pinned hosts for auditing
 * 3. Passes through to the standard fetch API
 *
 * When a native pinning module is integrated, this wrapper should delegate
 * to it for actual TLS certificate public key validation.
 */
export async function pinnedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? new URL(input) : input instanceof URL ? input : new URL(input.url);
  const hostname = url.hostname;

  if (isPinnedHost(hostname)) {
    // Enforce HTTPS for pinned hosts
    if (url.protocol !== 'https:') {
      const error = new Error(`Certificate pinning: HTTPS required for ${hostname}`);
      logger.general.error(error.message);
      throw error;
    }

    if (__DEV__) {
      logger.general.debug(`Pinned fetch to ${hostname} (${getPinsForHost(hostname).length} pins configured)`);
    }
  }

  return fetch(input, init);
}

export default pinnedFetch;
