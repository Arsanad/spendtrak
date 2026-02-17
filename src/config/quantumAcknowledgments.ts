/**
 * QUANTUM Acknowledgment System
 * Short, varied messages that make QUANTUM feel "alive" and present
 * Displayed briefly after every transaction
 */

// Core acknowledgments - neutral observations
const NEUTRAL_OBSERVATIONS = [
  "Noted.",
  "Logged.",
  "Recorded.",
  "Got it.",
  "Seen.",
  "Tracked.",
];

// Slightly alive - presence indicators
const PRESENCE_PHRASES = [
  "I see you.",
  "Still here.",
  "Watching.",
  "Present.",
  "Aware.",
  "With you.",
];

// Transaction specific
const TRANSACTION_PHRASES = [
  "Transaction logged.",
  "Added.",
  "Captured.",
  "Marked.",
  "Stored.",
];

// Pattern hints (subtle)
const PATTERN_HINTS = [
  "Familiar.",
  "This again.",
  "Routine.",
  "The usual.",
  "Known.",
];

// Time-aware phrases
const LATE_NIGHT_PHRASES = [
  "Late one.",
  "Still up.",
  "Night transaction.",
  "Burning midnight oil.",
];

const MORNING_PHRASES = [
  "Morning.",
  "Early start.",
  "Fresh day.",
  "Dawn transaction.",
];

const EVENING_PHRASES = [
  "Evening.",
  "Day winding down.",
  "End of day.",
];

// All base acknowledgments
export const QUANTUM_ACKNOWLEDGMENTS = [
  ...NEUTRAL_OBSERVATIONS,
  ...PRESENCE_PHRASES,
  ...TRANSACTION_PHRASES,
];

// Track recently used to avoid repetition
let recentlyUsed: string[] = [];
const RECENT_MEMORY = 5;

/**
 * Get a random acknowledgment, avoiding recently used ones
 * Time-aware: adjusts based on hour of day
 */
export function getRandomAcknowledgment(transaction?: { amount?: number; category_id?: string }): string {
  const hour = new Date().getHours();
  let pool: string[] = [...QUANTUM_ACKNOWLEDGMENTS];

  // Late night (10pm - 4am)
  if (hour >= 22 || hour <= 4) {
    pool = [...LATE_NIGHT_PHRASES, ...pool];
  }
  // Morning (5am - 9am)
  else if (hour >= 5 && hour <= 9) {
    pool = [...MORNING_PHRASES, ...pool];
  }
  // Evening (6pm - 9pm)
  else if (hour >= 18 && hour <= 21) {
    pool = [...EVENING_PHRASES, ...pool];
  }

  // Filter out recently used
  const available = pool.filter((msg) => !recentlyUsed.includes(msg));

  // If all filtered out, reset memory
  const finalPool = available.length > 0 ? available : pool;

  // Pick random
  const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

  // Update recent memory
  recentlyUsed.push(selected);
  if (recentlyUsed.length > RECENT_MEMORY) {
    recentlyUsed.shift();
  }

  return selected;
}

/**
 * Get a pattern-aware acknowledgment
 * Used when the transaction matches a known pattern
 */
export function getPatternAcknowledgment(): string {
  const pool = [...PATTERN_HINTS];
  const available = pool.filter((msg) => !recentlyUsed.includes(msg));
  const finalPool = available.length > 0 ? available : pool;

  const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

  recentlyUsed.push(selected);
  if (recentlyUsed.length > RECENT_MEMORY) {
    recentlyUsed.shift();
  }

  return selected;
}

/**
 * Reset the recently used memory
 * Call this on app start or when appropriate
 */
export function resetAcknowledgmentMemory(): void {
  recentlyUsed = [];
}

// ============================================
// FIX 7: Goal/Budget QUANTUM Reactions
// ============================================

// Budget reactions - different emotions based on status
const BUDGET_REACTIONS = {
  // Under budget (< 50% used)
  healthy: [
    "Budget looking healthy!",
    "Plenty of room left.",
    "Well within limits.",
    "Disciplined spending.",
    "On track.",
  ],
  // Getting close (50-80% used)
  caution: [
    "Getting closer to limit.",
    "Budget halfway there.",
    "Pace yourself.",
    "Watch this one.",
    "Mind the balance.",
  ],
  // Near limit (80-100% used)
  warning: [
    "Budget almost reached.",
    "Nearly at the limit.",
    "Careful now.",
    "Running tight.",
    "Time to slow down.",
  ],
  // Over budget (> 100% used)
  exceeded: [
    "Over budget.",
    "Limit exceeded.",
    "Beyond the line.",
    "Past the boundary.",
    "Budget breached.",
  ],
};

// Goal reactions - different emotions based on progress
const GOAL_REACTIONS = {
  // Just started (< 10%)
  started: [
    "Every journey starts with one step.",
    "The beginning.",
    "You've started!",
    "Goal in motion.",
    "Progress begins.",
  ],
  // Making progress (10-50%)
  progress: [
    "Making progress!",
    "Keep going.",
    "Building momentum.",
    "On the way.",
    "Gaining ground.",
  ],
  // Halfway there (50-75%)
  halfway: [
    "Halfway there!",
    "Middle ground reached.",
    "The peak is visible.",
    "Over the hill.",
    "Half done!",
  ],
  // Almost there (75-99%)
  almostThere: [
    "So close!",
    "Almost there!",
    "The finish line awaits.",
    "Nearly done!",
    "Final stretch.",
  ],
  // Goal achieved (100%+)
  achieved: [
    "Goal achieved! 🎉",
    "You did it!",
    "Mission accomplished!",
    "Target reached!",
    "Victory!",
  ],
};

// Saving habit reactions
const SAVING_REACTIONS = {
  // Has saving habit
  positive: [
    "Saver detected.",
    "Good habits forming.",
    "Building wealth.",
    "Consistent saver.",
    "Future you thanks you.",
  ],
  // Improving
  improving: [
    "Getting better!",
    "Progress!",
    "Improving habits.",
    "On the right track.",
    "Growth detected.",
  ],
  // Declining
  declining: [
    "Savings dipping.",
    "Watch the trend.",
    "Room for improvement.",
    "Let's refocus.",
    "Time to adjust.",
  ],
};

/**
 * Get a QUANTUM reaction to budget status
 * @param percentUsed The percentage of budget used (0-100+)
 */
export function getBudgetReaction(percentUsed: number): string {
  let pool: string[];

  if (percentUsed > 100) {
    pool = BUDGET_REACTIONS.exceeded;
  } else if (percentUsed >= 80) {
    pool = BUDGET_REACTIONS.warning;
  } else if (percentUsed >= 50) {
    pool = BUDGET_REACTIONS.caution;
  } else {
    pool = BUDGET_REACTIONS.healthy;
  }

  const available = pool.filter((msg) => !recentlyUsed.includes(msg));
  const finalPool = available.length > 0 ? available : pool;
  const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

  recentlyUsed.push(selected);
  if (recentlyUsed.length > RECENT_MEMORY) {
    recentlyUsed.shift();
  }

  return selected;
}

/**
 * Get a QUANTUM reaction to goal progress
 * @param percentComplete The percentage of goal completed (0-100+)
 */
export function getGoalReaction(percentComplete: number): string {
  let pool: string[];

  if (percentComplete >= 100) {
    pool = GOAL_REACTIONS.achieved;
  } else if (percentComplete >= 75) {
    pool = GOAL_REACTIONS.almostThere;
  } else if (percentComplete >= 50) {
    pool = GOAL_REACTIONS.halfway;
  } else if (percentComplete >= 10) {
    pool = GOAL_REACTIONS.progress;
  } else {
    pool = GOAL_REACTIONS.started;
  }

  const available = pool.filter((msg) => !recentlyUsed.includes(msg));
  const finalPool = available.length > 0 ? available : pool;
  const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

  recentlyUsed.push(selected);
  if (recentlyUsed.length > RECENT_MEMORY) {
    recentlyUsed.shift();
  }

  return selected;
}

/**
 * Get a QUANTUM reaction to saving habits
 * @param trend The saving trend: 'improving', 'stable', 'declining', or 'none'
 * @param hasSavingHabit Whether the user has a consistent saving habit
 */
export function getSavingReaction(trend: string, hasSavingHabit: boolean): string {
  let pool: string[];

  if (hasSavingHabit) {
    pool = SAVING_REACTIONS.positive;
  } else if (trend === 'improving') {
    pool = SAVING_REACTIONS.improving;
  } else {
    pool = SAVING_REACTIONS.declining;
  }

  const available = pool.filter((msg) => !recentlyUsed.includes(msg));
  const finalPool = available.length > 0 ? available : pool;
  const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

  recentlyUsed.push(selected);
  if (recentlyUsed.length > RECENT_MEMORY) {
    recentlyUsed.shift();
  }

  return selected;
}
