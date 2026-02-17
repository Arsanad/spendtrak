/**
 * Receipt Scanner Service
 * Secure receipt OCR via Supabase Edge Functions
 *
 * SECURITY: All AI API calls are proxied through Edge Functions.
 * The API key is stored server-side in Supabase secrets, never in client code.
 */

import * as FileSystemModule from 'expo-file-system';

// Cast to any to handle API differences across expo-file-system versions
const FileSystem = FileSystemModule as any;
import { logger } from '@/utils/logger';
import { supabase } from './supabase';
import type { ReceiptData, ReceiptScanResult, ReceiptScanOptions } from '@/types/receipt';
import { getErrorMessage, isErrorWithName } from '@/utils/errors';
import { getCurrentTier, hasPremiumAccess } from '@/stores/tierStore';

// Default options
const DEFAULT_OPTIONS: Required<ReceiptScanOptions> = {
  maxRetries: 2,
  timeout: 30000,
  compressImage: true,
  maxImageSizeKB: 1024, // 1MB max
};

// System prompt for receipt extraction
const RECEIPT_EXTRACTION_PROMPT = `You are a receipt data extraction expert. Analyze the receipt image and extract all information into the exact JSON schema provided.

Rules:
- Extract ALL visible line items, don't summarize
- Auto-categorize each item based on name (food, grocery, transport, entertainment, utilities, healthcare, shopping, other)
- Convert all prices to numbers (remove currency symbols)
- Detect currency from symbols or context ($ = USD, د.إ = AED, € = EUR, £ = GBP, ¥ = JPY/CNY)
- Date format: YYYY-MM-DD (convert from any format)
- If a field is not visible/readable, omit it (don't guess)
- Set confidence_score based on image quality and extraction certainty
- For unclear items, make best effort but lower confidence_score

Return ONLY valid JSON matching this exact schema:
{
  "merchant": {
    "name": "string",
    "address": "string (optional)",
    "phone": "string (optional)"
  },
  "transaction": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM (optional)",
    "receipt_number": "string (optional)"
  },
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit_price": number,
      "total_price": number,
      "category": "food|grocery|transport|entertainment|utilities|healthcare|shopping|other"
    }
  ],
  "payment": {
    "subtotal": number,
    "tax": number (optional),
    "tip": number (optional),
    "discount": number (optional),
    "total": number,
    "method": "cash|credit|debit|mobile (optional)",
    "card_last_four": "string (optional)"
  },
  "currency": "USD|AED|EUR|GBP|etc",
  "confidence_score": 0.0-1.0
}

No explanations, only valid JSON.`;

// Cache for recent scans to avoid duplicate processing
const scanCache = new Map<string, { result: ReceiptData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ==========================================
// FEATURE GATING FOR RECEIPT SCANS
// ==========================================

export interface ScanQuotaResult {
  allowed: boolean;
  remaining: number | 'unlimited';
  limit: number | 'unlimited';
  message?: string;
}

/**
 * Check if user has receipt scan access
 * AI receipt scanning is a premium-only feature
 */
export function checkScanQuota(): ScanQuotaResult {
  if (hasPremiumAccess()) {
    return {
      allowed: true,
      remaining: 'unlimited',
      limit: 'unlimited',
    };
  }

  return {
    allowed: false,
    remaining: 0,
    limit: 0,
    message: 'AI receipt scanning is a Premium feature. Upgrade to scan receipts.',
  };
}

/**
 * Track a receipt scan usage
 * Premium users have unlimited scans, no tracking needed
 */
export function trackScanUsage(): { newCount: number; remaining: number | 'unlimited' } {
  return { newCount: 0, remaining: 'unlimited' };
}

/**
 * Get current scan usage stats
 */
export function getScanUsageStats(): {
  used: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
  percentage: number;
} {
  // Premium users: unlimited scans
  if (hasPremiumAccess()) {
    return {
      used: 0,
      limit: 'unlimited',
      remaining: 'unlimited',
      percentage: 0,
    };
  }

  // Free users: AI scanning not available
  return {
    used: 0,
    limit: 0,
    remaining: 0,
    percentage: 100,
  };
}

/**
 * Generate a simple hash for cache key
 */
function generateCacheKey(base64: string): string {
  // Use first and last 100 chars + length as a simple hash
  const start = base64.substring(0, 100);
  const end = base64.substring(base64.length - 100);
  return `${start}-${end}-${base64.length}`;
}

/**
 * Check if a cached result exists and is valid
 */
function getCachedResult(cacheKey: string): ReceiptData | null {
  const cached = scanCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  if (cached) {
    scanCache.delete(cacheKey);
  }
  return null;
}

/**
 * Cache a scan result
 */
function cacheResult(cacheKey: string, result: ReceiptData): void {
  scanCache.set(cacheKey, { result, timestamp: Date.now() });

  // Clean up old entries
  const now = Date.now();
  for (const [key, value] of scanCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      scanCache.delete(key);
    }
  }
}

/**
 * Convert image URI to base64
 */
async function uriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    logger.receipt.error('Error converting URI to base64:', error);
    throw new Error('Failed to read image');
  }
}

/**
 * Compress image before sending to API
 * Reduces bandwidth and API costs while maintaining OCR quality
 * Uses dynamic import to handle missing native module gracefully
 */
async function compressImage(uri: string): Promise<string> {
  try {
    // Dynamic import to avoid crash when native module is not available
    const ImageManipulator = await import('expo-image-manipulator');
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // 1200px wide - good balance for OCR
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  } catch (error) {
    // Native module not available or compression failed - use original image
    // Gemini API handles large images well, so this is acceptable
    logger.receipt.warn('Image compression unavailable, using original image');
    return uri;
  }
}

/**
 * Call receipt scanning Edge Function
 *
 * SECURITY: This function calls our Edge Function which holds the API key server-side.
 * The client never has access to the Gemini API key.
 */
async function callGeminiAPI(
  base64Image: string,
  timeout: number
): Promise<ReceiptData> {
  try {
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Please sign in to scan receipts.');
    }

    // Call Edge Function with timeout using Promise.race
    const edgeFunctionPromise = supabase.functions.invoke('scan-receipt', {
      body: { image: base64Image, mimeType: 'image/jpeg' },
    });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({
        data: null,
        error: new Error('TIMEOUT'),
      }), timeout)
    );

    const { data, error } = await Promise.race([edgeFunctionPromise, timeoutPromise]);

    if (error) {
      if (error.message === 'TIMEOUT') {
        throw new Error('TIMEOUT');
      }
      logger.receipt.error('Receipt scan Edge Function error:', error);
      throw new Error(error.message || 'Failed to scan receipt');
    }

    if (!data || !data.success) {
      const errorMsg = data?.error || 'Failed to scan receipt';
      if (errorMsg === 'RATE_LIMIT') {
        throw new Error('RATE_LIMIT');
      }
      throw new Error(errorMsg);
    }

    return data.data as ReceiptData;
  } catch (error: unknown) {
    if (isErrorWithName(error) && error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw error;
  }
}

/**
 * Main receipt scanning function
 * Checks subscription quota before scanning
 */
export async function scanReceipt(
  imageUri: string,
  options: ReceiptScanOptions = {}
): Promise<ReceiptScanResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let base64Image: string;

  // Check subscription quota first
  const quotaCheck = checkScanQuota();
  if (!quotaCheck.allowed) {
    logger.receipt.warn('Receipt scan quota exceeded');
    return {
      success: false,
      error: quotaCheck.message || 'Receipt scan limit reached. Please upgrade to continue.',
      quotaExceeded: true,
    } as ReceiptScanResult & { quotaExceeded: boolean };
  }

  try {
    // Compress image before processing (reduces API costs and upload time)
    const compressedUri = opts.compressImage ? await compressImage(imageUri) : imageUri;

    // Convert URI to base64
    base64Image = await uriToBase64(compressedUri);

    // Check cache (cached results don't count against quota)
    const cacheKey = generateCacheKey(base64Image);
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      return { success: true, data: cachedResult };
    }

    // Retry logic with Edge Function
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const result = await callGeminiAPI(base64Image, opts.timeout);

        // Track usage on successful scan
        const usageResult = trackScanUsage();
        logger.receipt.info(`Receipt scan successful. Remaining this month: ${usageResult.remaining}`);

        // Cache successful result
        cacheResult(cacheKey, result);

        return { success: true, data: result };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(getErrorMessage(error));
        logger.receipt.error(`Scan attempt ${attempt + 1} failed:`, getErrorMessage(error));

        // Handle specific errors
        const msg = getErrorMessage(error);
        if (msg === 'RATE_LIMIT') {
          // Exponential backoff for rate limits
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (msg === 'TIMEOUT') {
          if (attempt < opts.maxRetries) {
            continue; // Retry on timeout
          }
          return {
            success: false,
            error: 'Request timed out. Please try again.',
          };
        }

        // Don't retry on other errors
        if (attempt === opts.maxRetries) {
          break;
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: lastError?.message || 'Failed to scan receipt',
    };
  } catch (error: unknown) {
    logger.receipt.error('Receipt scan error:', error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Failed to process image',
    };
  }
}

/**
 * Scan receipt from base64 directly
 * Checks subscription quota before scanning
 */
export async function scanReceiptFromBase64(
  base64Image: string,
  options: ReceiptScanOptions = {}
): Promise<ReceiptScanResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options, compressImage: false };
  let lastError: Error | null = null;

  // Check subscription quota first
  const quotaCheck = checkScanQuota();
  if (!quotaCheck.allowed) {
    logger.receipt.warn('Receipt scan quota exceeded');
    return {
      success: false,
      error: quotaCheck.message || 'Receipt scan limit reached. Please upgrade to continue.',
      quotaExceeded: true,
    } as ReceiptScanResult & { quotaExceeded: boolean };
  }

  try {
    // Check cache (cached results don't count against quota)
    const cacheKey = generateCacheKey(base64Image);
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      return { success: true, data: cachedResult };
    }

    // Retry logic
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {

        const result = await callGeminiAPI(base64Image, opts.timeout);

        // Track usage on successful scan
        const usageResult = trackScanUsage();
        logger.receipt.info(`Receipt scan successful. Remaining this month: ${usageResult.remaining}`);

        // Cache successful result
        cacheResult(cacheKey, result);

        return { success: true, data: result };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(getErrorMessage(error));
        logger.receipt.error(`Scan attempt ${attempt + 1} failed:`, getErrorMessage(error));

        const msg = getErrorMessage(error);
        if (msg === 'RATE_LIMIT') {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (msg === 'TIMEOUT') {
          if (attempt < opts.maxRetries) {
            continue;
          }
          return {
            success: false,
            error: 'Request timed out. Please try again.',
          };
        }

        if (attempt === opts.maxRetries) {
          break;
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to scan receipt',
    };
  } catch (error: unknown) {
    logger.receipt.error('Receipt scan error:', error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Failed to process image',
    };
  }
}

/**
 * Clear the scan cache
 */
export function clearScanCache(): void {
  scanCache.clear();
}

/**
 * Get estimated cost for a scan (for display purposes)
 * Gemini Flash 2.0 pricing: ~$0.00001875/1K input tokens, ~$0.000075/1K output tokens
 * Average receipt: ~1500 input tokens (image + prompt), ~500 output tokens
 */
export function getEstimatedScanCost(): number {
  const inputTokens = 1500;
  const outputTokens = 500;
  const inputCost = (inputTokens / 1000) * 0.00001875;
  const outputCost = (outputTokens / 1000) * 0.000075;
  return inputCost + outputCost; // ~$0.00006 per scan
}

export default {
  scanReceipt,
  scanReceiptFromBase64,
  clearScanCache,
  getEstimatedScanCost,
  checkScanQuota,
  trackScanUsage,
  getScanUsageStats,
};
