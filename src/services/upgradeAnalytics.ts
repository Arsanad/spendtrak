/**
 * SpendTrak Contextual Upgrade Engine
 * Analytics - Queue-and-sync pattern (matches offline queue pattern)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { isDevMode } from '@/utils/devMode';
import { logger } from '@/utils/logger';
import type {
  UpgradeEventType,
  UpgradeAnalyticsEvent,
  FrictionType,
} from '@/types/upgrade';

// ============================================
// CONSTANTS
// ============================================

const ANALYTICS_QUEUE_KEY = 'spendtrak_upgrade_analytics_queue';
const MAX_QUEUE_SIZE = 100;
const SYNC_BATCH_SIZE = 20;

// ============================================
// TRACK EVENT
// ============================================

export async function trackUpgradeEvent(
  eventType: UpgradeEventType,
  frictionType: FrictionType | null,
  promptId: string | null,
  metadata: Record<string, string | number> = {}
): Promise<void> {
  try {
    const event: UpgradeAnalyticsEvent = {
      id: `ue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      frictionType,
      promptId,
      timestamp: new Date().toISOString(),
      metadata,
      synced: false,
    };

    if (__DEV__) {
      console.log('[UpgradeAnalytics]', eventType, frictionType, promptId);
    }

    // Append to AsyncStorage queue
    const stored = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    const queue: UpgradeAnalyticsEvent[] = stored ? JSON.parse(stored) : [];

    // Enforce max size (drop oldest)
    queue.push(event);
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    }

    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logger.general.error?.('Failed to track upgrade event:', error);
  }
}

// ============================================
// SYNC QUEUE
// ============================================

export async function syncAnalyticsQueue(): Promise<void> {
  if (isDevMode()) {
    // Dev mode: no Supabase sync, just mark as synced
    if (__DEV__) console.log('[UpgradeAnalytics] Dev mode — skipping sync');
    return;
  }

  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!stored) return;

    const queue: UpgradeAnalyticsEvent[] = JSON.parse(stored);
    const unsynced = queue.filter((e) => !e.synced);

    if (unsynced.length === 0) return;

    // Batch sync
    const batch = unsynced.slice(0, SYNC_BATCH_SIZE);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const rows = batch.map((e) => ({
      user_id: session.user.id,
      event_type: e.eventType,
      friction_type: e.frictionType,
      prompt_id: e.promptId,
      metadata: e.metadata,
      created_at: e.timestamp,
    }));

    const { error } = await supabase
      .from('upgrade_analytics')
      .insert(rows);

    if (error) {
      logger.general.error?.('Upgrade analytics sync failed:', error);
      return;
    }

    // Mark synced events
    const syncedIds = new Set(batch.map((e) => e.id));
    const updatedQueue = queue.map((e) =>
      syncedIds.has(e.id) ? { ...e, synced: true } : e
    );

    // Remove old synced events (keep last 20 synced for dedup)
    const synced = updatedQueue.filter((e) => e.synced);
    const remaining = updatedQueue.filter((e) => !e.synced);
    const trimmedQueue = [...remaining, ...synced.slice(-20)];

    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(trimmedQueue));

    if (__DEV__) {
      console.log(`[UpgradeAnalytics] Synced ${batch.length} events`);
    }
  } catch (error) {
    logger.general.error?.('Upgrade analytics sync error:', error);
  }
}

// ============================================
// DEV UTILITY
// ============================================

export async function getLocalAnalytics(): Promise<UpgradeAnalyticsEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
