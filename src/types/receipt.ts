/**
 * Receipt Data Types
 * Structured output schema for Gemini Flash 2.0 receipt extraction
 */

export interface ReceiptMerchant {
  name: string;
  address?: string;
  phone?: string;
}

export interface ReceiptTransaction {
  date: string; // ISO format YYYY-MM-DD
  time?: string; // HH:MM format
  receipt_number?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: ReceiptItemCategory;
}

export type ReceiptItemCategory =
  | 'food'
  | 'grocery'
  | 'transport'
  | 'entertainment'
  | 'utilities'
  | 'healthcare'
  | 'shopping'
  | 'other';

export interface ReceiptPayment {
  subtotal: number;
  tax?: number;
  tip?: number;
  discount?: number;
  total: number;
  method?: 'cash' | 'credit' | 'debit' | 'mobile' | string;
  card_last_four?: string;
}

export interface ReceiptData {
  merchant: ReceiptMerchant;
  transaction: ReceiptTransaction;
  items: ReceiptItem[];
  payment: ReceiptPayment;
  currency: string; // ISO code like USD, AED, EUR
  confidence_score: number; // 0-1 how confident the extraction is
  raw_text?: string; // optional: full OCR text for debugging
}

export interface ReceiptScanResult {
  success: boolean;
  data?: ReceiptData;
  error?: string;
}

export interface ReceiptScanOptions {
  maxRetries?: number;
  timeout?: number;
  compressImage?: boolean;
  maxImageSizeKB?: number;
}

// Map receipt category to app transaction category
export const RECEIPT_TO_TRANSACTION_CATEGORY: Record<ReceiptItemCategory, string> = {
  food: 'food-dining',
  grocery: 'shopping',
  transport: 'transportation',
  entertainment: 'entertainment',
  utilities: 'bills-utilities',
  healthcare: 'health',
  shopping: 'shopping',
  other: 'other',
};
