/**
 * Receipt Store
 * Zustand store for managing receipt scanning state and offline queue
 */

import { create } from 'zustand';
import { offlineReceiptQueue, type ReceiptQueueStatus, type PendingReceipt, type ProcessedReceipt } from '@/services/offlineReceiptQueue';
import { scanReceipt } from '@/services/receiptScanner';
import type { ReceiptData, ReceiptScanResult } from '@/types/receipt';
import { logger } from '@/utils/logger';

interface ReceiptState {
  // Queue state
  pendingReceiptsCount: number;
  processingCount: number;
  failedCount: number;
  isProcessingQueue: boolean;
  isOnline: boolean;
  lastProcessingError: string | null;

  // Active scan state
  isScanning: boolean;
  scanError: string | null;
  lastScanResult: ReceiptData | null;

  // Queued receipts
  queuedReceipts: PendingReceipt[];
  recentlyProcessed: ProcessedReceipt[];

  // Actions
  initialize: () => Promise<void>;
  cleanup: () => void;

  // Scanning
  scanReceipt: (imageUri: string) => Promise<ReceiptScanResult>;
  queueReceiptForLater: (imageUri: string) => Promise<string>;

  // Queue management
  refreshQueueStatus: () => void;
  processQueue: () => Promise<void>;
  removeFromQueue: (receiptId: string) => Promise<boolean>;
  retryFailedReceipt: (receiptId: string) => Promise<void>;
  clearFailedReceipts: () => Promise<void>;
  clearQueue: () => Promise<void>;

  // Helpers
  clearScanError: () => void;
  clearLastResult: () => void;
}

export const useReceiptStore = create<ReceiptState>((set, get) => {
  // Queue status subscription
  let unsubscribe: (() => void) | null = null;
  let processedUnsubscribe: (() => void) | null = null;

  const updateFromQueueStatus = (status: ReceiptQueueStatus) => {
    set({
      pendingReceiptsCount: status.pendingCount,
      processingCount: status.processingCount,
      failedCount: status.failedCount,
      isProcessingQueue: status.isProcessing,
      isOnline: status.isOnline,
      lastProcessingError: status.lastError,
      queuedReceipts: offlineReceiptQueue.getQueuedReceipts(),
    });
  };

  return {
    // Initial state
    pendingReceiptsCount: 0,
    processingCount: 0,
    failedCount: 0,
    isProcessingQueue: false,
    isOnline: true,
    lastProcessingError: null,

    isScanning: false,
    scanError: null,
    lastScanResult: null,

    queuedReceipts: [],
    recentlyProcessed: [],

    /**
     * Initialize the receipt store and queue
     */
    initialize: async () => {
      try {
        await offlineReceiptQueue.initialize();

        // Subscribe to queue status changes
        unsubscribe = offlineReceiptQueue.subscribe(updateFromQueueStatus);

        // Subscribe to processed receipts
        processedUnsubscribe = offlineReceiptQueue.onReceiptProcessed((receipt) => {
          set(state => ({
            recentlyProcessed: [receipt, ...state.recentlyProcessed].slice(0, 10),
            lastScanResult: receipt.data,
          }));
        });

        // Initial status update
        updateFromQueueStatus(offlineReceiptQueue.getStatus());
        set({
          recentlyProcessed: offlineReceiptQueue.getProcessedReceipts(),
        });

        logger.receipt.info('Receipt store initialized');
      } catch (error) {
        logger.receipt.error('Failed to initialize receipt store:', error);
      }
    },

    /**
     * Cleanup subscriptions
     */
    cleanup: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (processedUnsubscribe) {
        processedUnsubscribe();
        processedUnsubscribe = null;
      }
      offlineReceiptQueue.cleanup();
    },

    /**
     * Scan a receipt image
     * Will queue for later if offline
     */
    scanReceipt: async (imageUri: string): Promise<ReceiptScanResult> => {
      set({ isScanning: true, scanError: null });

      try {
        // Check if online
        const isOnline = await offlineReceiptQueue.checkNetworkStatus();

        if (!isOnline) {
          // Queue for later
          const receiptId = await offlineReceiptQueue.addToQueue(imageUri);
          set({
            isScanning: false,
            scanError: null,
            queuedReceipts: offlineReceiptQueue.getQueuedReceipts(),
          });

          return {
            success: false,
            error: 'OFFLINE_QUEUED',
          };
        }

        // Online - scan immediately
        const result = await scanReceipt(imageUri);

        if (result.success && result.data) {
          set({
            isScanning: false,
            lastScanResult: result.data,
            scanError: null,
          });
        } else {
          set({
            isScanning: false,
            scanError: result.error || 'Failed to scan receipt',
          });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to scan receipt';
        set({
          isScanning: false,
          scanError: errorMessage,
        });

        logger.receipt.error('Scan receipt error:', error);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },

    /**
     * Queue a receipt for later processing (when back online)
     */
    queueReceiptForLater: async (imageUri: string): Promise<string> => {
      try {
        const receiptId = await offlineReceiptQueue.addToQueue(imageUri);
        set({
          queuedReceipts: offlineReceiptQueue.getQueuedReceipts(),
        });
        return receiptId;
      } catch (error) {
        logger.receipt.error('Failed to queue receipt:', error);
        throw error;
      }
    },

    /**
     * Refresh queue status from the service
     */
    refreshQueueStatus: () => {
      updateFromQueueStatus(offlineReceiptQueue.getStatus());
      set({
        queuedReceipts: offlineReceiptQueue.getQueuedReceipts(),
        recentlyProcessed: offlineReceiptQueue.getProcessedReceipts(),
      });
    },

    /**
     * Manually trigger queue processing
     */
    processQueue: async () => {
      await offlineReceiptQueue.processQueue();
    },

    /**
     * Remove a receipt from the queue
     */
    removeFromQueue: async (receiptId: string): Promise<boolean> => {
      const result = await offlineReceiptQueue.removeFromQueue(receiptId);
      set({
        queuedReceipts: offlineReceiptQueue.getQueuedReceipts(),
      });
      return result;
    },

    /**
     * Retry a failed receipt
     */
    retryFailedReceipt: async (receiptId: string) => {
      await offlineReceiptQueue.retryReceipt(receiptId);
    },

    /**
     * Clear all failed receipts
     */
    clearFailedReceipts: async () => {
      await offlineReceiptQueue.clearFailedReceipts();
    },

    /**
     * Clear entire queue
     */
    clearQueue: async () => {
      await offlineReceiptQueue.clearQueue();
    },

    /**
     * Clear scan error
     */
    clearScanError: () => {
      set({ scanError: null });
    },

    /**
     * Clear last scan result
     */
    clearLastResult: () => {
      set({ lastScanResult: null });
    },
  };
});

export default useReceiptStore;
