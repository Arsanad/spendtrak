/**
 * API Call Deduplication Utility
 * Prevents duplicate concurrent API calls for the same operation
 */

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicates API requests by key
 * If a request with the same key is already in flight, returns the existing promise
 *
 * @param key - Unique identifier for this request type
 * @param requestFn - The async function to execute
 * @param ttlMs - How long to cache the pending request (default 2 seconds)
 * @returns The result of the request
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttlMs: number = 2000
): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) return existing;

  const promise = requestFn().finally(() => {
    setTimeout(() => pendingRequests.delete(key), ttlMs);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Clear a specific pending request
 */
export function clearPendingRequest(key: string): void {
  pendingRequests.delete(key);
}

/**
 * Clear all pending requests
 */
export function clearAllPendingRequests(): void {
  pendingRequests.clear();
}

export default {
  deduplicateRequest,
  clearPendingRequest,
  clearAllPendingRequests,
};
