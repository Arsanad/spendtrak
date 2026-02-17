/**
 * Quantum Reactor
 * Listens to the Event Bus and maps events to Quantum micro-responses.
 * This is the heart of the "alive" experience.
 *
 * Rules:
 * - Max 1 visual response per 3 seconds (rate limiting)
 * - Priority queue: celebrations > acknowledgments > ambient
 * - Never interrupt an active behavioral intervention
 * - Uses existing haptics, no new packages
 */

import { eventBus, type EventName, type EventMap } from './eventBus';
import { getAliveMessage, getCelebrationMessage } from '@/config/quantumAliveMessages';
import { getBudgetReaction, getGoalReaction } from '@/config/quantumAcknowledgments';
import { lightTap, successBuzz, selectionTap } from '@/utils/haptics';
import { logger } from '@/utils/logger';

// ============================================
// Response Types
// ============================================

export type ResponsePriority = 'celebration' | 'acknowledgment' | 'ambient';

export interface QuantumResponse {
  message: string;
  priority: ResponsePriority;
  haptic: 'success' | 'light' | 'selection' | 'none';
  emotion?: string;
  duration?: number; // ms to show, default 2000
  celebration?: boolean; // triggers full celebration overlay
}

// ============================================
// Rate Limiting
// ============================================

const RATE_LIMIT_MS = 3000; // 3 seconds between visual responses
let lastResponseTime = 0;
let pendingResponse: QuantumResponse | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Response Handler (set by UI layer)
// ============================================

type ResponseHandler = (response: QuantumResponse) => void;
let responseHandler: ResponseHandler | null = null;

export function setQuantumResponseHandler(handler: ResponseHandler): () => void {
  responseHandler = handler;
  return () => {
    responseHandler = null;
  };
}

// ============================================
// Core: Process and Dispatch
// ============================================

function dispatch(response: QuantumResponse): void {
  const now = Date.now();
  const timeSinceLastResponse = now - lastResponseTime;

  // If under rate limit, queue if higher priority
  if (timeSinceLastResponse < RATE_LIMIT_MS) {
    // Celebrations always get through (with delay)
    if (response.priority === 'celebration') {
      const delay = RATE_LIMIT_MS - timeSinceLastResponse;
      if (pendingTimeout) clearTimeout(pendingTimeout);
      pendingResponse = response;
      pendingTimeout = setTimeout(() => {
        if (pendingResponse) {
          deliver(pendingResponse);
          pendingResponse = null;
          pendingTimeout = null;
        }
      }, delay);
      return;
    }

    // If pending response exists and current is lower priority, skip
    if (pendingResponse && getPriorityWeight(response.priority) <= getPriorityWeight(pendingResponse.priority)) {
      return;
    }

    // Replace pending with higher priority
    pendingResponse = response;
    if (!pendingTimeout) {
      const delay = RATE_LIMIT_MS - timeSinceLastResponse;
      pendingTimeout = setTimeout(() => {
        if (pendingResponse) {
          deliver(pendingResponse);
          pendingResponse = null;
          pendingTimeout = null;
        }
      }, delay);
    }
    return;
  }

  // Outside rate limit — deliver immediately
  deliver(response);
}

function deliver(response: QuantumResponse): void {
  lastResponseTime = Date.now();

  // Trigger haptic
  switch (response.haptic) {
    case 'success':
      successBuzz();
      break;
    case 'light':
      lightTap();
      break;
    case 'selection':
      selectionTap();
      break;
  }

  // Send to UI handler
  if (responseHandler) {
    responseHandler(response);
  }
}

function getPriorityWeight(priority: ResponsePriority): number {
  switch (priority) {
    case 'celebration': return 3;
    case 'acknowledgment': return 2;
    case 'ambient': return 1;
    default: return 0;
  }
}

// ============================================
// Event Handlers
// ============================================

function handleEvent<K extends EventName>(event: K, payload: EventMap[K]): void {
  try {
    const response = mapEventToResponse(event, payload);
    if (response) {
      dispatch(response);
    }
  } catch (error) {
    if (__DEV__) {
      logger.transaction.warn('[QuantumReactor] Error handling event:', event, error);
    }
  }
}

function mapEventToResponse<K extends EventName>(event: K, payload: EventMap[K]): QuantumResponse | null {
  // Celebration events (high priority)
  if (event === 'goal:completed') {
    return {
      message: getCelebrationMessage('goal_completed'),
      priority: 'celebration',
      haptic: 'success',
      emotion: 'celebrating',
      celebration: true,
      duration: 4000,
    };
  }

  if (event === 'debt:paid_off') {
    return {
      message: getCelebrationMessage('debt_paid_off'),
      priority: 'celebration',
      haptic: 'success',
      emotion: 'celebrating',
      celebration: true,
      duration: 4000,
    };
  }

  if (event === 'level:up') {
    const p = payload as EventMap['level:up'];
    return {
      message: `${getCelebrationMessage('level_up')} Level ${p.newLevel}`,
      priority: 'celebration',
      haptic: 'success',
      emotion: 'excited',
      celebration: true,
      duration: 4000,
    };
  }

  if (event === 'achievement:unlocked') {
    return {
      message: getCelebrationMessage('achievement'),
      priority: 'celebration',
      haptic: 'success',
      emotion: 'proud',
      celebration: true,
      duration: 3000,
    };
  }

  // Streak milestones (7, 14, 30, 60, 90, 100+ days)
  if (event === 'streak:updated') {
    const p = payload as EventMap['streak:updated'];
    const milestones = [7, 14, 30, 60, 90, 100, 200, 365];
    if (milestones.includes(p.current)) {
      return {
        message: `${getCelebrationMessage('streak_milestone')} ${p.current} days!`,
        priority: 'celebration',
        haptic: 'success',
        emotion: 'excited',
        celebration: true,
        duration: 3000,
      };
    }
    if (p.isNew && p.current > 1) {
      return {
        message: getAliveMessage(event),
        priority: 'ambient',
        haptic: 'light',
        emotion: 'happy',
      };
    }
    return null;
  }

  // Budget warnings - use rich reactions from quantumAcknowledgments
  if (event === 'budget:exceeded') {
    const p = payload as EventMap['budget:exceeded'];
    return {
      message: getBudgetReaction(p.percentUsed),
      priority: 'acknowledgment',
      haptic: 'light',
      emotion: 'alert',
      duration: 3000,
    };
  }

  if (event === 'budget:warning') {
    const p = payload as EventMap['budget:warning'];
    return {
      message: getBudgetReaction(p.percentUsed),
      priority: 'acknowledgment',
      haptic: 'selection',
      emotion: 'worried',
      duration: 2500,
    };
  }

  // Goal progress - use rich reactions from quantumAcknowledgments
  if (event === 'goal:progress') {
    const p = payload as EventMap['goal:progress'];
    return {
      message: getGoalReaction(p.percentComplete),
      priority: 'acknowledgment',
      haptic: 'light',
      emotion: p.percentComplete >= 75 ? 'excited' : p.percentComplete >= 50 ? 'happy' : 'encouraging',
    };
  }

  // Goal created
  if (event === 'goal:created') {
    return {
      message: getAliveMessage(event),
      priority: 'acknowledgment',
      haptic: 'light',
      emotion: 'encouraging',
    };
  }

  // Transaction events (standard acknowledgments)
  if (event === 'transaction:created') {
    return {
      message: getAliveMessage(event),
      priority: 'acknowledgment',
      haptic: 'light',
      emotion: 'idle',
    };
  }

  if (event === 'transaction:updated' || event === 'transaction:deleted') {
    return {
      message: getAliveMessage(event),
      priority: 'ambient',
      haptic: 'selection',
    };
  }

  // Bill events
  if (event === 'bill:paid') {
    return {
      message: getAliveMessage(event),
      priority: 'acknowledgment',
      haptic: 'success',
      emotion: 'happy',
    };
  }

  if (event === 'bill:created') {
    return {
      message: getAliveMessage(event),
      priority: 'ambient',
      haptic: 'light',
    };
  }

  // Debt events
  if (event === 'debt:payment') {
    return {
      message: getAliveMessage(event),
      priority: 'acknowledgment',
      haptic: 'light',
      emotion: 'encouraging',
    };
  }

  // Points earned
  if (event === 'points:earned') {
    const p = payload as EventMap['points:earned'];
    return {
      message: `+${p.amount} points`,
      priority: 'ambient',
      haptic: 'selection',
      emotion: 'happy',
    };
  }

  // Default: ambient acknowledgment for all other events
  const message = getAliveMessage(event);
  if (message) {
    return {
      message,
      priority: 'ambient',
      haptic: 'selection',
    };
  }

  return null;
}

// ============================================
// Initialization / Teardown
// ============================================

const unsubscribers: (() => void)[] = [];

export function initQuantumReactor(): void {
  // Subscribe to all event types
  const events: EventName[] = [
    'transaction:created',
    'transaction:updated',
    'transaction:deleted',
    'budget:created',
    'budget:exceeded',
    'budget:warning',
    'goal:created',
    'goal:progress',
    'goal:completed',
    'bill:created',
    'bill:paid',
    'debt:created',
    'debt:payment',
    'debt:paid_off',
    'subscription:created',
    'subscription:cancelled',
    'asset:created',
    'liability:created',
    'networth:updated',
    'category:created',
    'category:updated',
    'settings:changed',
    'streak:updated',
    'level:up',
    'achievement:unlocked',
    'points:earned',
    'app:opened',
    'app:resumed',
  ];

  events.forEach((event) => {
    const unsub = eventBus.on(event, (payload) => handleEvent(event, payload));
    unsubscribers.push(unsub);
  });

  if (__DEV__) {
    logger.transaction.info('[QuantumReactor] Initialized, listening to', events.length, 'events');
  }
}

export function destroyQuantumReactor(): void {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers.length = 0;
  responseHandler = null;
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  pendingResponse = null;
}
