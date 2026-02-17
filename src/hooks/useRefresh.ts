/**
 * useRefresh Hook
 * Pull-to-refresh functionality for lists
 */

import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface UseRefreshOptions {
  onRefresh: () => Promise<void>;
  minDuration?: number; // Minimum refresh animation duration
}

interface UseRefreshReturn {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function useRefresh({
  onRefresh,
  minDuration = 500,
}: UseRefreshOptions): UseRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    const startTime = Date.now();

    try {
      await onRefresh();
    } catch (error) {
      logger.general.error('Refresh error:', error);
    } finally {
      // Ensure minimum animation duration for smooth UX
      const elapsed = Date.now() - startTime;
      const remaining = minDuration - elapsed;

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setIsRefreshing(false);
    }
  }, [onRefresh, minDuration]);

  return {
    isRefreshing,
    onRefresh: handleRefresh,
  };
}

export default useRefresh;
