/**
 * Offline Receipt Queue Service
 * Manages queuing of receipt scans when offline and processing when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { logger } from '@/utils/logger';
import { scanReceipt } from './receiptScanner';
import type { ReceiptData } from '@/types/receipt';

// Storage keys
const QUEUE_KEY = 'spendtrak_receipt_queue';
const PROCESSED_KEY = 'spendtrak_processed_receipts';
const DEAD_LETTER_KEY = 'spendtrak_receipt_dead_letter';

// Configuration
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const MAX_QUEUE_SIZE = 50;

export type PendingReceiptStatus = 'pending' | 'processing' | 'failed' | 'completed';

export interface PendingReceipt {
  id: string;
  imageUri: string;
  timestamp: number;
  retries: number;
  status: PendingReceiptStatus;
  errorMessage?: string;
  metadata?: {
    originalFileName?: string;
    fileSize?: number;
    capturedAt?: string;
  };
}

export interface ProcessedReceipt extends PendingReceipt {
  data: ReceiptData;
  processedAt: number;
}

export interface DeadLetterReceipt {
  receipt: PendingReceipt;
  failedAt: number;
  lastError: string;
}

export interface ReceiptQueueStatus {
  pendingCount: number;
  processingCount: number;
  failedCount: number;
  isProcessing: boolean;
  isOnline: boolean;
  lastProcessingTime: number | null;
  lastError: string | null;
  deadLetterCount: number;
}

type QueueListener = (status: ReceiptQueueStatus) => void;
type ReceiptProcessedCallback = (receipt: ProcessedReceipt) => void;

/**
 * Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s, capped at 30s
 */
function getBackoffDelay(retryCount: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
  return Math.min(delay, MAX_DELAY_MS);
}

class OfflineReceiptQueue {
  private queue: PendingReceipt[] = [];
  private processedReceipts: ProcessedReceipt[] = [];
  private deadLetterQueue: DeadLetterReceipt[] = [];
  private isProcessing = false;
  private isInitialized = false;
  private isOnline = true;
  private listeners: Set<QueueListener> = new Set();
  private processedCallbacks: Set<ReceiptProcessedCallback> = new Set();
  private lastProcessingTime: number | null = null;
  private lastError: string | null = null;
  private networkUnsubscribe: (() => void) | null = null;

  /**
   * Initialize the receipt queue - must be called before using
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load persisted queue
      const storedQueue = await AsyncStorage.getItem(QUEUE_KEY);
      this.queue = storedQueue ? JSON.parse(storedQueue) : [];

      // Load processed receipts
      const storedProcessed = await AsyncStorage.getItem(PROCESSED_KEY);
      this.processedReceipts = storedProcessed ? JSON.parse(storedProcessed) : [];

      // Load dead letter queue
      const storedDeadLetter = await AsyncStorage.getItem(DEAD_LETTER_KEY);
      this.deadLetterQueue = storedDeadLetter ? JSON.parse(storedDeadLetter) : [];

      // Reset any 'processing' status to 'pending' (from previous interrupted sessions)
      this.queue = this.queue.map(r =>
        r.status === 'processing' ? { ...r, status: 'pending' as const } : r
      );

      // Remove items that already exceeded retries (they should be in dead letter)
      this.queue = this.queue.filter(r => r.retries < MAX_RETRIES || r.status !== 'failed');

      // Check initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = !!(netInfo.isConnected && netInfo.isInternetReachable);

      // Listen for network changes
      this.networkUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        const wasOffline = !this.isOnline;
        this.isOnline = !!(state.isConnected && state.isInternetReachable);

        this.notifyListeners();

        // Auto-process queue when coming back online
        if (wasOffline && this.isOnline && this.queue.length > 0) {
          logger.receipt.info('Network restored, processing receipt queue...');
          this.processQueue();
        }
      });

      await this.persist();
      this.isInitialized = true;
      this.notifyListeners();

      logger.receipt.info(`Receipt queue initialized with ${this.queue.length} pending receipts`);
    } catch (error) {
      logger.receipt.error('Failed to initialize receipt queue:', error);
    }
  }

  /**
   * Cleanup when no longer needed
   */
  cleanup(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    this.listeners.clear();
    this.processedCallbacks.clear();
    this.isInitialized = false;
  }

  /**
   * Check if currently online
   */
  async checkNetworkStatus(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    this.isOnline = !!(netInfo.isConnected && netInfo.isInternetReachable);
    return this.isOnline;
  }

  /**
   * Add a receipt to the queue for processing
   */
  async addToQueue(imageUri: string, metadata?: PendingReceipt['metadata']): Promise<string> {
    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      throw new Error('Receipt queue is full. Please process existing receipts first.');
    }

    // Verify image exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }

    const pendingReceipt: PendingReceipt = {
      id: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      imageUri,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
      metadata: {
        ...metadata,
        capturedAt: new Date().toISOString(),
        fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : undefined,
      },
    };

    this.queue.push(pendingReceipt);
    await this.persist();
    this.notifyListeners();

    logger.receipt.info(`Receipt added to queue: ${pendingReceipt.id}`);

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return pendingReceipt.id;
  }

  /**
   * Remove a receipt from the queue
   */
  async removeFromQueue(receiptId: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(r => r.id !== receiptId);

    if (this.queue.length !== initialLength) {
      await this.persist();
      this.notifyListeners();
      logger.receipt.info(`Receipt removed from queue: ${receiptId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all queued receipts
   */
  getQueuedReceipts(): PendingReceipt[] {
    return [...this.queue];
  }

  /**
   * Get processed receipts (recent history)
   */
  getProcessedReceipts(): ProcessedReceipt[] {
    return [...this.processedReceipts];
  }

  /**
   * Get queue count
   */
  getQueueCount(): number {
    return this.queue.length;
  }

  /**
   * Get count by status
   */
  getCountByStatus(status: PendingReceiptStatus): number {
    return this.queue.filter(r => r.status === status).length;
  }

  /**
   * Process all queued receipts
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    // Check network before processing
    const isOnline = await this.checkNetworkStatus();
    if (!isOnline) {
      logger.receipt.info('Offline - skipping receipt queue processing');
      return;
    }

    this.isProcessing = true;
    this.lastError = null;
    this.notifyListeners();

    const pendingReceipts = this.queue.filter(r => r.status === 'pending' || r.status === 'failed');

    for (const receipt of pendingReceipts) {
      try {
        // Update status to processing
        receipt.status = 'processing';
        this.notifyListeners();

        // Check network before each scan
        if (!(await this.checkNetworkStatus())) {
          receipt.status = 'pending';
          logger.receipt.info('Lost network connection during processing');
          break;
        }

        // Attempt to scan the receipt
        const result = await scanReceipt(receipt.imageUri);

        if (result.success && result.data) {
          // Success - create processed receipt
          const processedReceipt: ProcessedReceipt = {
            ...receipt,
            status: 'completed',
            data: result.data,
            processedAt: Date.now(),
          };

          // Move to processed list
          this.processedReceipts.unshift(processedReceipt);

          // Keep only last 20 processed
          if (this.processedReceipts.length > 20) {
            this.processedReceipts = this.processedReceipts.slice(0, 20);
          }

          // Remove from queue
          this.queue = this.queue.filter(r => r.id !== receipt.id);

          // Notify callbacks
          this.processedCallbacks.forEach(cb => cb(processedReceipt));

          this.lastProcessingTime = Date.now();
          logger.receipt.info(`Receipt processed successfully: ${receipt.id}`);
        } else {
          // Failed - increment retry count
          receipt.retries++;
          receipt.errorMessage = result.error || 'Failed to scan receipt';

          if (receipt.retries >= MAX_RETRIES) {
            // Move to dead letter queue
            logger.receipt.error(`Receipt ${receipt.id} failed after ${MAX_RETRIES} attempts, moving to dead letter queue`);
            this.deadLetterQueue.push({
              receipt: { ...receipt, status: 'failed' },
              failedAt: Date.now(),
              lastError: receipt.errorMessage,
            });
            this.queue = this.queue.filter(r => r.id !== receipt.id);
            this.lastError = `Receipt ${receipt.id} moved to dead letter queue after ${MAX_RETRIES} attempts`;
          } else {
            receipt.status = 'pending';
            const delay = getBackoffDelay(receipt.retries - 1);
            logger.receipt.warn(`Receipt scan failed, retry ${receipt.retries}/${MAX_RETRIES} (backoff: ${delay}ms): ${receipt.id}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (error) {
        receipt.retries++;
        receipt.errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (receipt.retries >= MAX_RETRIES) {
          // Move to dead letter queue
          logger.receipt.error(`Receipt ${receipt.id} failed after ${MAX_RETRIES} attempts, moving to dead letter queue:`, error);
          this.deadLetterQueue.push({
            receipt: { ...receipt, status: 'failed' },
            failedAt: Date.now(),
            lastError: receipt.errorMessage,
          });
          this.queue = this.queue.filter(r => r.id !== receipt.id);
          this.lastError = receipt.errorMessage;
        } else {
          receipt.status = 'pending';
          const delay = getBackoffDelay(receipt.retries - 1);
          logger.receipt.warn(`Receipt error, retry ${receipt.retries}/${MAX_RETRIES} (backoff: ${delay}ms): ${receipt.id}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.isProcessing = false;
    await this.persist();
    await this.persistProcessed();
    await this.persistDeadLetterQueue();
    this.notifyListeners();
  }

  /**
   * Retry a specific failed receipt from the main queue
   */
  async retryReceipt(receiptId: string): Promise<void> {
    const receipt = this.queue.find(r => r.id === receiptId);
    if (receipt && receipt.status === 'failed') {
      receipt.status = 'pending';
      receipt.retries = 0;
      receipt.errorMessage = undefined;
      await this.persist();
      this.notifyListeners();

      if (this.isOnline) {
        this.processQueue();
      }
    }
  }

  /**
   * Get all dead letter items (permanently failed receipts)
   */
  getDeadLetterItems(): DeadLetterReceipt[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry a specific dead letter item by moving it back to the main queue
   */
  async retryDeadLetterItem(id: string): Promise<boolean> {
    const index = this.deadLetterQueue.findIndex(item => item.receipt.id === id);
    if (index === -1) return false;

    const item = this.deadLetterQueue[index];
    // Reset retries and status, move back to main queue
    item.receipt.retries = 0;
    item.receipt.status = 'pending';
    item.receipt.errorMessage = undefined;
    this.queue.push(item.receipt);
    this.deadLetterQueue.splice(index, 1);

    await this.persist();
    await this.persistDeadLetterQueue();
    this.notifyListeners();

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Remove a specific dead letter item permanently
   */
  async removeDeadLetterItem(id: string): Promise<boolean> {
    const initialLength = this.deadLetterQueue.length;
    this.deadLetterQueue = this.deadLetterQueue.filter(item => item.receipt.id !== id);

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
   * Clear all failed receipts from main queue
   */
  async clearFailedReceipts(): Promise<void> {
    this.queue = this.queue.filter(r => r.status !== 'failed');
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    this.lastError = null;
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Get current queue status
   */
  getStatus(): ReceiptQueueStatus {
    return {
      pendingCount: this.getCountByStatus('pending'),
      processingCount: this.getCountByStatus('processing'),
      failedCount: this.getCountByStatus('failed'),
      isProcessing: this.isProcessing,
      isOnline: this.isOnline,
      lastProcessingTime: this.lastProcessingTime,
      lastError: this.lastError,
      deadLetterCount: this.deadLetterQueue.length,
    };
  }

  /**
   * Subscribe to queue status changes
   */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to processed receipt notifications
   */
  onReceiptProcessed(callback: ReceiptProcessedCallback): () => void {
    this.processedCallbacks.add(callback);

    return () => {
      this.processedCallbacks.delete(callback);
    };
  }

  /**
   * Persist queue to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.receipt.error('Failed to persist receipt queue:', error);
    }
  }

  /**
   * Persist processed receipts to storage
   */
  private async persistProcessed(): Promise<void> {
    try {
      await AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify(this.processedReceipts));
    } catch (error) {
      logger.receipt.error('Failed to persist processed receipts:', error);
    }
  }

  /**
   * Persist dead letter queue to storage
   */
  private async persistDeadLetterQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(this.deadLetterQueue));
    } catch (error) {
      logger.receipt.error('Failed to persist receipt dead letter queue:', error);
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
export const offlineReceiptQueue = new OfflineReceiptQueue();

export default offlineReceiptQueue;
