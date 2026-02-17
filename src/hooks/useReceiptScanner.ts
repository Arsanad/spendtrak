/**
 * useReceiptScanner Hook
 * React hook for receipt scanning with loading, error, and result states
 */

import { useState, useCallback, useRef } from 'react';
import {
  scanReceipt,
  scanReceiptFromBase64,
  clearScanCache,
} from '@/services/receiptScanner';
import type { ReceiptData, ReceiptScanOptions } from '@/types/receipt';
import { getErrorMessage } from '@/utils/errors';

interface UseReceiptScannerOptions extends ReceiptScanOptions {
  onSuccess?: (data: ReceiptData) => void;
  onError?: (error: string) => void;
}

interface UseReceiptScannerReturn {
  // State
  isScanning: boolean;
  error: string | null;
  result: ReceiptData | null;

  // Actions
  scanFromUri: (imageUri: string) => Promise<ReceiptData | null>;
  scanFromBase64: (base64: string) => Promise<ReceiptData | null>;
  reset: () => void;
  clearCache: () => void;

  // Helpers
  retryLastScan: () => Promise<ReceiptData | null>;
}

export function useReceiptScanner(
  options: UseReceiptScannerOptions = {}
): UseReceiptScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptData | null>(null);

  // Store last scan params for retry
  const lastScanRef = useRef<{
    type: 'uri' | 'base64';
    data: string;
  } | null>(null);

  const { onSuccess, onError, ...scanOptions } = options;

  /**
   * Scan receipt from image URI
   */
  const scanFromUri = useCallback(
    async (imageUri: string): Promise<ReceiptData | null> => {
      setIsScanning(true);
      setError(null);
      lastScanRef.current = { type: 'uri', data: imageUri };

      try {
        const scanResult = await scanReceipt(imageUri, scanOptions);

        if (scanResult.success && scanResult.data) {
          setResult(scanResult.data);
          onSuccess?.(scanResult.data);
          return scanResult.data;
        } else {
          const errorMsg = scanResult.error || 'Failed to scan receipt';
          setError(errorMsg);
          onError?.(errorMsg);
          return null;
        }
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err);
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      } finally {
        setIsScanning(false);
      }
    },
    [scanOptions, onSuccess, onError]
  );

  /**
   * Scan receipt from base64 image
   */
  const scanFromBase64 = useCallback(
    async (base64: string): Promise<ReceiptData | null> => {
      setIsScanning(true);
      setError(null);
      lastScanRef.current = { type: 'base64', data: base64 };

      try {
        const scanResult = await scanReceiptFromBase64(base64, scanOptions);

        if (scanResult.success && scanResult.data) {
          setResult(scanResult.data);
          onSuccess?.(scanResult.data);
          return scanResult.data;
        } else {
          const errorMsg = scanResult.error || 'Failed to scan receipt';
          setError(errorMsg);
          onError?.(errorMsg);
          return null;
        }
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err);
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      } finally {
        setIsScanning(false);
      }
    },
    [scanOptions, onSuccess, onError]
  );

  /**
   * Retry the last scan
   */
  const retryLastScan = useCallback(async (): Promise<ReceiptData | null> => {
    if (!lastScanRef.current) {
      setError('No previous scan to retry');
      return null;
    }

    const { type, data } = lastScanRef.current;
    if (type === 'uri') {
      return scanFromUri(data);
    } else {
      return scanFromBase64(data);
    }
  }, [scanFromUri, scanFromBase64]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsScanning(false);
    setError(null);
    setResult(null);
    lastScanRef.current = null;
  }, []);

  /**
   * Clear the scan cache
   */
  const clearCache = useCallback(() => {
    clearScanCache();
  }, []);

  return {
    isScanning,
    error,
    result,
    scanFromUri,
    scanFromBase64,
    reset,
    clearCache,
    retryLastScan,
  };
}

export default useReceiptScanner;
