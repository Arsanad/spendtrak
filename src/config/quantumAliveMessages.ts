/**
 * Quantum Alive Messages
 * Message pools for the Quantum Reactor micro-response system.
 * Quantum's voice: observant, minimal, mirror-like. Max 8 words per message.
 *
 * DO NOT USE interventionMessages.ts messages here — those are for the
 * behavioral engine's 8-gate framework only.
 */

import type { EventName } from '@/services/eventBus';

// ============================================
// Message Pools by Event Type
// ============================================

export const ALIVE_MESSAGES: Partial<Record<EventName, string[]>> = {
  'transaction:created': [
    'Noted.',
    'Logged.',
    'Recorded.',
    'Got it.',
    'Captured.',
    'Tracked.',
    'Added to the ledger.',
    'Another one recorded.',
  ],
  'transaction:updated': [
    'Updated.',
    'Change noted.',
    'Adjusted.',
    'Correction recorded.',
    'Refined.',
  ],
  'transaction:deleted': [
    'Removed.',
    'Gone.',
    'Erased from the ledger.',
    'Cleared.',
  ],
  'budget:created': [
    'New boundary set.',
    'Budget established.',
    'Limits defined.',
    'A plan takes shape.',
  ],
  'budget:exceeded': [
    'Over the line.',
    'Budget breached.',
    'Past the boundary.',
    'Limit exceeded.',
  ],
  'budget:warning': [
    'Getting close.',
    'Watch this one.',
    'Nearing the edge.',
    'Pace yourself.',
  ],
  'goal:created': [
    'Goal set.',
    'A destination chosen.',
    'The journey begins.',
    'Target locked.',
  ],
  'goal:progress': [
    'Moving forward.',
    'Progress.',
    'Gaining ground.',
    'Closer.',
  ],
  'goal:completed': [
    'Goal reached.',
    'You did it.',
    'Target achieved.',
    'Mission complete.',
    'Victory.',
  ],
  'bill:created': [
    'Bill tracked.',
    'Reminder set.',
    'On the calendar.',
    'Watching this one.',
  ],
  'bill:paid': [
    'Bill settled.',
    'One less to worry about.',
    'Paid.',
    'Done.',
  ],
  'debt:created': [
    'Debt logged.',
    'Now I see it.',
    'Added to the picture.',
  ],
  'debt:payment': [
    'Payment recorded.',
    'Chipping away.',
    'Progress on debt.',
    'Less to carry.',
  ],
  'debt:paid_off': [
    'Debt cleared!',
    'Free from this one.',
    'Gone. Well done.',
    'Zero balance.',
  ],
  'subscription:created': [
    'Subscription tracked.',
    'Recurring cost noted.',
    'I see it repeating.',
  ],
  'subscription:cancelled': [
    'One less subscription.',
    'Cancelled.',
    'That cost stops here.',
  ],
  'asset:created': [
    'Asset logged.',
    'Building the picture.',
    'Added to your worth.',
  ],
  'liability:created': [
    'Liability noted.',
    'Tracking it.',
    'Part of the picture.',
  ],
  'networth:updated': [
    'Net worth recalculated.',
    'The picture shifts.',
    'Numbers updated.',
  ],
  'category:created': [
    'New category.',
    'Organized.',
    'A new bucket.',
  ],
  'category:updated': [
    'Category updated.',
    'Adjusted.',
  ],
  'settings:changed': [
    'Preference saved.',
    'Updated.',
    'Noted.',
  ],
  'streak:updated': [
    'Streak continues.',
    'Consistent.',
    'Day after day.',
  ],
  'level:up': [
    'Level up!',
    'New level reached!',
    'Growing stronger.',
    'Advancing.',
  ],
  'achievement:unlocked': [
    'Achievement unlocked!',
    'New badge earned!',
    'Milestone reached.',
  ],
  'points:earned': [
    'Points earned.',
    'Adding up.',
    'Rewarded.',
  ],
};

// ============================================
// Time-of-day Greetings
// ============================================

export const TIME_GREETINGS = {
  // 5am - 11am
  morning: [
    'Good morning.',
    'Morning.',
    'Fresh start.',
    'Early bird.',
    'Dawn of a new day.',
  ],
  // 12pm - 4pm
  afternoon: [
    'Good afternoon.',
    'Afternoon.',
    'Midday check.',
    'Still going strong.',
  ],
  // 5pm - 8pm
  evening: [
    'Good evening.',
    'Evening.',
    'Winding down.',
    'Day in review.',
  ],
  // 9pm - 4am
  night: [
    'Late one.',
    'Still here.',
    'Night session.',
    'Burning midnight oil.',
  ],
} as const;

export type TimeOfDay = keyof typeof TIME_GREETINGS;

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getTimeGreeting(): string {
  const period = getTimeOfDay();
  const pool = TIME_GREETINGS[period];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================
// Celebration Messages (high priority)
// ============================================

export const CELEBRATION_MESSAGES = {
  goal_completed: [
    'Goal achieved!',
    'You did it!',
    'Target reached!',
    'Mission complete!',
    'Victory!',
  ],
  debt_paid_off: [
    'Debt cleared!',
    'Free from this one!',
    'Gone. Well done!',
    'Zero balance!',
  ],
  level_up: [
    'Level up!',
    'New level!',
    'Growing stronger!',
    'Advancing!',
  ],
  achievement: [
    'Achievement unlocked!',
    'New badge!',
    'Milestone reached!',
    'Well earned!',
  ],
  streak_milestone: [
    'Streak milestone!',
    'Consistency pays off!',
    'Impressive dedication!',
    'On fire!',
  ],
} as const;

// ============================================
// Message Selection Helper
// ============================================

let recentMessages: string[] = [];
const MEMORY_SIZE = 6;

export function getAliveMessage(event: EventName): string {
  const pool = ALIVE_MESSAGES[event];
  if (!pool || pool.length === 0) return 'Noted.';

  // Filter out recently used
  const available = pool.filter(m => !recentMessages.includes(m));
  const finalPool = available.length > 0 ? available : pool;

  const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

  recentMessages.push(selected);
  if (recentMessages.length > MEMORY_SIZE) {
    recentMessages.shift();
  }

  return selected;
}

export function getCelebrationMessage(type: keyof typeof CELEBRATION_MESSAGES): string {
  const pool = CELEBRATION_MESSAGES[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function resetAliveMessageMemory(): void {
  recentMessages = [];
}
