/**
 * Quantum Event Bus
 * Lightweight typed event emitter for the Quantum Alive Experience.
 * Sits ON TOP of existing stores — stores emit events AFTER their logic succeeds.
 * The Quantum Reactor listens and maps events to micro-responses.
 *
 * NO new npm packages — inline implementation.
 */

// ============================================
// Event Type Definitions
// ============================================

export type EventMap = {
  // Transaction events
  'transaction:created': { amount: number; category?: string; merchant?: string; source?: string };
  'transaction:updated': { id: string; changes: string[] };
  'transaction:deleted': { id: string };

  // Budget events
  'budget:created': { name: string; amount: number; categoryId?: string };
  'budget:exceeded': { name: string; percentUsed: number };
  'budget:warning': { name: string; percentUsed: number };

  // Goal events
  'goal:created': { name: string; target: number };
  'goal:progress': { name: string; percentComplete: number };
  'goal:completed': { name: string };

  // Bill events
  'bill:created': { name: string; amount: number };
  'bill:paid': { name: string; amount: number };
  'bill:overdue': { name: string };

  // Debt events
  'debt:created': { name: string; amount: number };
  'debt:payment': { name: string; amount: number; remaining: number };
  'debt:paid_off': { name: string };

  // Subscription events
  'subscription:created': { name: string; amount: number };
  'subscription:cancelled': { name: string };

  // Net worth events
  'networth:updated': { total: number; change: number };
  'asset:created': { name: string; value: number };
  'liability:created': { name: string; value: number };

  // Category events
  'category:created': { name: string };
  'category:updated': { name: string };

  // Settings events
  'settings:changed': { key: string; value: unknown };

  // Gamification events
  'streak:updated': { current: number; isNew: boolean };
  'level:up': { newLevel: number; previousLevel: number };
  'achievement:unlocked': { name: string; id: string };
  'points:earned': { amount: number; reason: string };

  // App lifecycle events
  'app:opened': { timestamp: number };
  'app:resumed': { timestamp: number };
  'tab:changed': { from: string; to: string };
};

export type EventName = keyof EventMap;

// ============================================
// Event Bus Implementation
// ============================================

type Listener<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<any>>>();

  on<K extends EventName>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  off<K extends EventName>(event: K, listener: Listener<EventMap[K]>): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit<K extends EventName>(event: K, payload: EventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          // Never let listener errors crash the emitting store
          if (__DEV__) {
            console.warn(`[EventBus] Listener error for "${event}":`, error);
          }
        }
      });
    }
  }

  /** Remove all listeners (for testing/cleanup) */
  clear(): void {
    this.listeners.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();
