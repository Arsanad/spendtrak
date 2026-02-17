/**
 * usePreventDoubleTap Hook
 * Prevents rapid double-taps on buttons to avoid duplicate form submissions
 */

import { useRef, useCallback } from 'react';

/**
 * Hook to prevent double-tap issues on submit buttons
 *
 * @param callback - The function to execute on tap
 * @param delayMs - Minimum time between taps (default 1000ms)
 * @returns A wrapped callback that prevents rapid re-execution
 *
 * @example
 * const handleSubmit = usePreventDoubleTap(async () => {
 *   await saveTransaction();
 * });
 */
export function usePreventDoubleTap(
  callback: () => void | Promise<void>,
  delayMs: number = 1000
): () => Promise<void> {
  const isProcessing = useRef(false);

  return useCallback(async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      await callback();
    } finally {
      setTimeout(() => {
        isProcessing.current = false;
      }, delayMs);
    }
  }, [callback, delayMs]);
}

export default usePreventDoubleTap;
