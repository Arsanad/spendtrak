/**
 * Supabase Client Configuration
 * Secure token storage with expo-secure-store
 */

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { logger } from '@/utils/logger';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Log Supabase config status only in development
if (__DEV__) {
  console.log('[Supabase] Configuration:', {
    urlConfigured: !!supabaseUrl,
    urlSource: Constants.expoConfig?.extra?.supabaseUrl ? 'expoConfig.extra' : 'process.env',
    keyConfigured: !!supabaseAnonKey,
    keySource: Constants.expoConfig?.extra?.supabaseAnonKey ? 'expoConfig.extra' : 'process.env',
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  // Log critical error in dev, rely on ErrorBoundary/Sentry in production
  if (__DEV__) {
    console.error('[Supabase] CRITICAL: Missing configuration!', {
      supabaseUrl: supabaseUrl ? 'present' : 'MISSING',
      supabaseAnonKey: supabaseAnonKey ? 'present' : 'MISSING',
    });
  }
}

// In-memory fallback storage for when SecureStore fails (e.g., storage full)
// This allows the session to work for the current app run even if persistence fails
// On next app restart, user may need to re-authenticate
const memoryFallback: Record<string, string> = {};

// SecureStore has a 2048-byte limit per item. Supabase auth tokens (JWT + refresh
// token JSON) regularly exceed this, causing the warning:
//   "WARN: Value being stored in SecureStore is larger than 2048 bytes"
// and random sign-outs when the write silently fails on some devices.
// We split large values into chunks and reassemble on read.
const SECURE_STORE_CHUNK_LIMIT = 2000; // Leave headroom below the 2048 hard limit

/**
 * Store a value in SecureStore, splitting into chunks if it exceeds the limit.
 * Chunk keys follow the pattern: `${key}__chunk_0`, `${key}__chunk_1`, etc.
 * A metadata key `${key}__chunks` stores the total chunk count.
 */
async function secureStoreSet(key: string, value: string): Promise<void> {
  if (value.length <= SECURE_STORE_CHUNK_LIMIT) {
    // Small enough to store directly — clean up any old chunks first
    await secureStoreDeleteChunks(key);
    await SecureStore.setItemAsync(key, value);
    return;
  }

  // Split into chunks
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += SECURE_STORE_CHUNK_LIMIT) {
    chunks.push(value.slice(i, i + SECURE_STORE_CHUNK_LIMIT));
  }

  // Write chunk count first
  await SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length));

  // Write each chunk
  for (let i = 0; i < chunks.length; i++) {
    await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunks[i]);
  }

  // Remove the plain key if it existed from a previous non-chunked write
  await SecureStore.deleteItemAsync(key).catch(() => {});
}

/**
 * Read a value from SecureStore, reassembling chunks if needed.
 */
async function secureStoreGet(key: string): Promise<string | null> {
  // Check for chunked storage first
  const chunkCountStr = await SecureStore.getItemAsync(`${key}__chunks`);
  if (chunkCountStr) {
    const chunkCount = parseInt(chunkCountStr, 10);
    if (chunkCount > 0) {
      const parts: string[] = [];
      for (let i = 0; i < chunkCount; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
        if (chunk === null) {
          // Chunk missing — data is corrupted, fall through to plain key
          break;
        }
        parts.push(chunk);
      }
      if (parts.length === chunkCount) {
        return parts.join('');
      }
    }
  }

  // Fall back to plain (non-chunked) read
  return SecureStore.getItemAsync(key);
}

/**
 * Remove a value and any associated chunks from SecureStore.
 */
async function secureStoreDelete(key: string): Promise<void> {
  await secureStoreDeleteChunks(key);
  await SecureStore.deleteItemAsync(key).catch(() => {});
}

/**
 * Remove chunk keys for a given key.
 */
async function secureStoreDeleteChunks(key: string): Promise<void> {
  const chunkCountStr = await SecureStore.getItemAsync(`${key}__chunks`).catch(() => null);
  if (chunkCountStr) {
    const chunkCount = parseInt(chunkCountStr, 10);
    const deletes: Promise<void>[] = [];
    for (let i = 0; i < chunkCount; i++) {
      deletes.push(SecureStore.deleteItemAsync(`${key}__chunk_${i}`).catch(() => {}));
    }
    deletes.push(SecureStore.deleteItemAsync(`${key}__chunks`).catch(() => {}));
    await Promise.all(deletes);
  }
}

// Custom storage adapter for React Native using SecureStore with chunking + fallback
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      // SECURITY: Use in-memory storage for web, NOT localStorage
      // localStorage is vulnerable to XSS attacks and should never store auth tokens
      return memoryFallback[key] ?? null;
    }
    try {
      const value = await secureStoreGet(key);
      // Check memory fallback if SecureStore returns null
      return value ?? memoryFallback[key] ?? null;
    } catch (error) {
      logger.supabase.error('SecureStore getItem error:', error);
      // Return from memory fallback if SecureStore fails
      return memoryFallback[key] ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      // SECURITY: Use in-memory storage for web, NOT localStorage
      memoryFallback[key] = value;
      return;
    }
    try {
      await secureStoreSet(key, value);
      // Also store in memory fallback for redundancy
      memoryFallback[key] = value;
    } catch (error) {
      logger.supabase.error('SecureStore setItem error:', key, error);
      // Last resort: store in memory so session works for this app run
      memoryFallback[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      delete memoryFallback[key];
      return;
    }
    try {
      await secureStoreDelete(key);
      delete memoryFallback[key];
    } catch (error) {
      logger.supabase.error('SecureStore removeItem error:', error);
      // Still remove from memory fallback
      delete memoryFallback[key];
    }
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types helper for type-safe queries
export type Database = {
  public: {
    Tables: {
      users: {
        Row: import('@/types').User;
        Insert: import('@/types').UserInsert;
        Update: import('@/types').UserUpdate;
      };
      transactions: {
        Row: import('@/types').Transaction;
        Insert: import('@/types').TransactionInsert;
        Update: import('@/types').TransactionUpdate;
      };
      subscriptions: {
        Row: import('@/types').Subscription;
        Insert: import('@/types').SubscriptionInsert;
        Update: import('@/types').SubscriptionUpdate;
      };
      alerts: {
        Row: import('@/types').Alert;
        Insert: import('@/types').AlertInsert;
        Update: import('@/types').AlertUpdate;
      };
      categories: {
        Row: import('@/types').Category;
        Insert: import('@/types').CategoryInsert;
        Update: import('@/types').CategoryUpdate;
      };
      user_cards: {
        Row: import('@/types').UserCard;
        Insert: import('@/types').UserCardInsert;
        Update: import('@/types').UserCardUpdate;
      };
      financial_goals: {
        Row: import('@/types').FinancialGoal;
        Insert: import('@/types').FinancialGoalInsert;
        Update: import('@/types').FinancialGoalUpdate;
      };
      budgets: {
        Row: import('@/types').Budget;
        Insert: import('@/types').BudgetInsert;
        Update: import('@/types').BudgetUpdate;
      };
      email_connections: {
        Row: import('@/types').EmailConnection;
        Insert: import('@/types').EmailConnectionInsert;
        Update: import('@/types').EmailConnectionUpdate;
      };
      ai_conversations: {
        Row: import('@/types').AIConversation;
        Insert: import('@/types').AIConversationInsert;
        Update: import('@/types').AIConversationUpdate;
      };
    };
  };
};

export default supabase;
