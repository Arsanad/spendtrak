// SPENDTRAK - useOfflineQueue Hook
// React hook for subscribing to offline queue status

import { useState, useEffect, useCallback } from 'react';
import { offlineQueue, QueueStatus, QueuedRequest } from '../services/offlineQueue';

/**
 * Hook to subscribe to offline queue status updates
 */
export const useOfflineQueueStatus = (): QueueStatus => {
  const [status, setStatus] = useState<QueueStatus>(offlineQueue.getStatus());

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
};

/**
 * Hook to get pending requests count
 */
export const usePendingRequestsCount = (): number => {
  const { pending } = useOfflineQueueStatus();
  return pending;
};

/**
 * Hook for offline queue operations
 */
export const useOfflineQueue = () => {
  const status = useOfflineQueueStatus();

  const addToQueue = useCallback(
    async (
      type: 'CREATE' | 'UPDATE' | 'DELETE',
      endpoint: string,
      data: unknown,
      metadata?: Record<string, unknown>
    ) => {
      return offlineQueue.add({ type, endpoint, data, metadata });
    },
    []
  );

  const removeFromQueue = useCallback(async (requestId: string) => {
    return offlineQueue.remove(requestId);
  }, []);

  const clearQueue = useCallback(async () => {
    return offlineQueue.clear();
  }, []);

  const processQueue = useCallback(async () => {
    return offlineQueue.processQueue();
  }, []);

  const getPendingRequests = useCallback((): QueuedRequest[] => {
    return offlineQueue.getPendingRequests();
  }, []);

  return {
    status,
    isProcessing: status.processing,
    pendingCount: status.pending,
    lastSyncAttempt: status.lastSyncAttempt,
    lastSuccessfulSync: status.lastSuccessfulSync,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    getPendingRequests,
  };
};

export default useOfflineQueue;
