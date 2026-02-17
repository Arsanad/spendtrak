// SPENDTRAK - Offline Queue Service
// Manages queuing of failed requests when offline and syncing when back online

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '@/utils/logger';

export type QueuedRequestType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface QueuedRequest {
  id: string;
  type: QueuedRequestType;
  endpoint: string;
  data: unknown;
  timestamp: number;
  retries: number;
  metadata?: Record<string, unknown>;
}

export interface DeadLetterItem {
  request: QueuedRequest;
  failedAt: number;
  lastError: string;
}

export interface QueueStatus {
  pending: number;
  processing: boolean;
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;
  deadLetterCount: number;
}

const QUEUE_KEY = 'spendtrak_offline_queue';
const STATUS_KEY = 'spendtrak_offline_queue_status';
const DEAD_LETTER_KEY = 'spendtrak_offline_dead_letter';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

type QueueListener = (status: QueueStatus) => void;
type RequestProcessor = (request: QueuedRequest) => Promise<void>;

/**
 * Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s, capped at 30s
 */
function getBackoffDelay(retryCount: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
  return Math.min(delay, MAX_DELAY_MS);
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private deadLetterQueue: DeadLetterItem[] = [];
  private isProcessing = false;
  private isInitialized = false;
  private listeners: Set<QueueListener> = new Set();
  private requestProcessors: Map<string, RequestProcessor> = new Map();
  private lastSyncAttempt: number | null = null;
  private lastSuccessfulSync: number | null = null;

  /**
   * Initialize the offline queue - must be called before using
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load persisted queue
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      this.queue = stored ? JSON.parse(stored) : [];

      // Load dead letter queue
      const deadLetterStored = await AsyncStorage.getItem(DEAD_LETTER_KEY);
      this.deadLetterQueue = deadLetterStored ? JSON.parse(deadLetterStored) : [];

      // Load status
      const statusStored = await AsyncStorage.getItem(STATUS_KEY);
      if (statusStored) {
        const status = JSON.parse(statusStored);
        this.lastSyncAttempt = status.lastSyncAttempt;
        this.lastSuccessfulSync = status.lastSuccessfulSync;
      }

      // Listen for network changes
      NetInfo.addEventListener((state) => {
        if (state.isConnected && state.isInternetReachable) {
          this.processQueue();
        }
      });

      this.isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      logger.api.error('Failed to initialize offline queue:', error);
    }
  }

  /**
   * Register a processor for a specific endpoint
   * The processor handles the actual API call when processing queued requests
   */
  registerProcessor(endpoint: string, processor: RequestProcessor): void {
    this.requestProcessors.set(endpoint, processor);
  }

  /**
   * Unregister a processor
   */
  unregisterProcessor(endpoint: string): void {
    this.requestProcessors.delete(endpoint);
  }

  /**
   * Add a request to the queue
   * Returns the request ID for tracking
   */
  async add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedRequest);
    await this.persist();
    this.notifyListeners();

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      this.processQueue();
    }

    return queuedRequest.id;
  }

  /**
   * Remove a specific request from the queue
   */
  async remove(requestId: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(r => r.id !== requestId);

    if (this.queue.length !== initialLength) {
      await this.persist();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Clear all pending requests
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    this.lastSyncAttempt = Date.now();
    this.notifyListeners();

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      this.isProcessing = false;
      this.notifyListeners();
      return;
    }

    // Process requests in order (FIFO)
    const toProcess = [...this.queue];
    const processedIds: string[] = [];

    for (const request of toProcess) {
      try {
        await this.processRequest(request);
        processedIds.push(request.id);
      } catch (error) {
        request.retries++;

        if (request.retries >= MAX_RETRIES) {
          // Move to dead letter queue
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.api.error(`Max retries (${MAX_RETRIES}) reached for request ${request.id}, moving to dead letter queue:`, error);
          this.deadLetterQueue.push({
            request: { ...request },
            failedAt: Date.now(),
            lastError: errorMessage,
          });
          processedIds.push(request.id); // Remove from main queue
        } else {
          // Wait with exponential backoff before next item
          const delay = getBackoffDelay(request.retries - 1);
          logger.api.warn(`Request ${request.id} failed, retry ${request.retries}/${MAX_RETRIES} (next backoff: ${delay}ms)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Remove successfully processed and dead-lettered requests from main queue
    this.queue = this.queue.filter(r => !processedIds.includes(r.id));

    if (processedIds.length > 0) {
      this.lastSuccessfulSync = Date.now();
    }

    await this.persist();
    await this.persistDeadLetterQueue();
    await this.persistStatus();

    this.isProcessing = false;
    this.notifyListeners();
  }

  /**
   * Process a single request using registered processor
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    const processor = this.requestProcessors.get(request.endpoint);

    if (!processor) {
      logger.api.warn(`No processor registered for endpoint: ${request.endpoint}`);
      throw new Error(`No processor for endpoint: ${request.endpoint}`);
    }

    await processor(request);
  }

  /**
   * Get current queue status
   */
  getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      processing: this.isProcessing,
      lastSyncAttempt: this.lastSyncAttempt,
      lastSuccessfulSync: this.lastSuccessfulSync,
      deadLetterCount: this.deadLetterQueue.length,
    };
  }

  /**
   * Get all pending requests
   */
  getPendingRequests(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get all dead letter items (permanently failed requests)
   */
  getDeadLetterItems(): DeadLetterItem[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry a specific dead letter item by moving it back to the main queue
   */
  async retryDeadLetterItem(id: string): Promise<boolean> {
    const index = this.deadLetterQueue.findIndex(item => item.request.id === id);
    if (index === -1) return false;

    const item = this.deadLetterQueue[index];
    // Reset retries and move back to main queue
    item.request.retries = 0;
    this.queue.push(item.request);
    this.deadLetterQueue.splice(index, 1);

    await this.persist();
    await this.persistDeadLetterQueue();
    this.notifyListeners();

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Remove a specific dead letter item permanently
   */
  async removeDeadLetterItem(id: string): Promise<boolean> {
    const initialLength = this.deadLetterQueue.length;
    this.deadLetterQueue = this.deadLetterQueue.filter(item => item.request.id !== id);

    if (this.deadLetterQueue.length !== initialLength) {
      await this.persistDeadLetterQueue();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Clear all dead letter items
   */
  async clearDeadLetterQueue(): Promise<void> {
    this.deadLetterQueue = [];
    await this.persistDeadLetterQueue();
    this.notifyListeners();
  }

  /**
   * Subscribe to queue status changes
   */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Persist queue to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.api.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * Persist dead letter queue to storage
   */
  private async persistDeadLetterQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(this.deadLetterQueue));
    } catch (error) {
      logger.api.error('Failed to persist dead letter queue:', error);
    }
  }

  /**
   * Persist status to storage
   */
  private async persistStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(STATUS_KEY, JSON.stringify({
        lastSyncAttempt: this.lastSyncAttempt,
        lastSuccessfulSync: this.lastSuccessfulSync,
      }));
    } catch (error) {
      logger.api.error('Failed to persist offline queue status:', error);
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

// Hook for using offline queue status in components
export const useOfflineQueueStatus = (): QueueStatus => {
  // This is a simple implementation - for React components,
  // you'd want to use useState + useEffect with subscribe
  return offlineQueue.getStatus();
};

export default offlineQueue;
