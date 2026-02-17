/**
 * SpendTrak Behavioral Engine v2.0
 * Intervention Messages - Max 12 words, no advice, no motivation
 */

import type { BehaviorType, InterventionType } from './behavioralConstants';
import type { BehavioralMomentType } from '../services/behavioralMoment';

export interface InterventionMessage {
  key: string;
  behavior: BehaviorType;
  type: InterventionType;
  template: string;
  momentTypes?: BehavioralMomentType[];
}

export const INTERVENTION_MESSAGES: InterventionMessage[] = [
  // SMALL RECURRING - IMMEDIATE MIRROR
  { key: 'sr_im_01', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Same place.', momentTypes: ['REPEAT_PURCHASE'] },
  { key: 'sr_im_02', behavior: 'small_recurring', type: 'immediate_mirror', template: 'The usual.', momentTypes: ['REPEAT_PURCHASE', 'HABITUAL_TIME'] },
  { key: 'sr_im_03', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Third time this week.', momentTypes: ['REPEAT_PURCHASE'] },
  { key: 'sr_im_04', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Morning ritual.', momentTypes: ['HABITUAL_TIME'] },
  { key: 'sr_im_05', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Same time again.', momentTypes: ['HABITUAL_TIME'] },
  { key: 'sr_im_06', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Here again.' },
  { key: 'sr_im_07', behavior: 'small_recurring', type: 'immediate_mirror', template: 'This one knows you.' },
  { key: 'sr_im_08', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Familiar.' },

  // SMALL RECURRING - PATTERN REFLECTION
  { key: 'sr_pr_01', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Four this week. Same category.', momentTypes: ['REPEAT_PURCHASE'] },
  { key: 'sr_pr_02', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Every morning. Same spot.', momentTypes: ['HABITUAL_TIME'] },
  { key: 'sr_pr_03', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Small amounts. They add up.' },
  { key: 'sr_pr_04', behavior: 'small_recurring', type: 'pattern_reflection', template: 'A pattern. You know this one.' },
  { key: 'sr_pr_05', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Same ritual. Different day.', momentTypes: ['HABITUAL_TIME'] },
  { key: 'sr_pr_06', behavior: 'small_recurring', type: 'pattern_reflection', template: 'The habit runs deep.' },

  // SMALL RECURRING - REINFORCEMENT
  { key: 'sr_rf_01', behavior: 'small_recurring', type: 'reinforcement', template: 'Skipped it today.' },
  { key: 'sr_rf_02', behavior: 'small_recurring', type: 'reinforcement', template: 'The pattern broke.' },
  { key: 'sr_rf_03', behavior: 'small_recurring', type: 'reinforcement', template: 'Different today.' },
  { key: 'sr_rf_04', behavior: 'small_recurring', type: 'reinforcement', template: 'Not this time.' },
  { key: 'sr_rf_05', behavior: 'small_recurring', type: 'reinforcement', template: 'Morning passed. Nothing.' },

  // STRESS SPENDING - IMMEDIATE MIRROR
  { key: 'ss_im_01', behavior: 'stress_spending', type: 'immediate_mirror', template: 'Late night.', momentTypes: ['LATE_NIGHT_COMFORT'] },
  { key: 'ss_im_02', behavior: 'stress_spending', type: 'immediate_mirror', template: 'After hours.', momentTypes: ['LATE_NIGHT_COMFORT', 'POST_WORK_RELEASE'] },
  { key: 'ss_im_03', behavior: 'stress_spending', type: 'immediate_mirror', template: 'End of day.', momentTypes: ['POST_WORK_RELEASE'] },
  { key: 'ss_im_04', behavior: 'stress_spending', type: 'immediate_mirror', template: 'Comfort purchase.', momentTypes: ['LATE_NIGHT_COMFORT', 'POST_WORK_RELEASE'] },
  { key: 'ss_im_05', behavior: 'stress_spending', type: 'immediate_mirror', template: 'Second one tonight.', momentTypes: ['STRESS_CLUSTER'] },
  { key: 'ss_im_06', behavior: 'stress_spending', type: 'immediate_mirror', template: 'The night shift.', momentTypes: ['LATE_NIGHT_COMFORT'] },
  { key: 'ss_im_07', behavior: 'stress_spending', type: 'immediate_mirror', template: 'Decompressing.', momentTypes: ['POST_WORK_RELEASE'] },
  { key: 'ss_im_08', behavior: 'stress_spending', type: 'immediate_mirror', template: 'Release valve.' },

  // STRESS SPENDING - PATTERN REFLECTION
  { key: 'ss_pr_01', behavior: 'stress_spending', type: 'pattern_reflection', template: 'Three nights this week. Same pattern.', momentTypes: ['LATE_NIGHT_COMFORT'] },
  { key: 'ss_pr_02', behavior: 'stress_spending', type: 'pattern_reflection', template: 'After work again. A habit forming.', momentTypes: ['POST_WORK_RELEASE'] },
  { key: 'ss_pr_03', behavior: 'stress_spending', type: 'pattern_reflection', template: 'Stress shows in spending.' },
  { key: 'ss_pr_04', behavior: 'stress_spending', type: 'pattern_reflection', template: 'Comfort categories. Late hours.' },
  { key: 'ss_pr_05', behavior: 'stress_spending', type: 'pattern_reflection', template: 'The pattern repeats at night.', momentTypes: ['LATE_NIGHT_COMFORT'] },
  { key: 'ss_pr_06', behavior: 'stress_spending', type: 'pattern_reflection', template: 'Two in an hour. Cluster.', momentTypes: ['STRESS_CLUSTER'] },

  // STRESS SPENDING - REINFORCEMENT
  { key: 'ss_rf_01', behavior: 'stress_spending', type: 'reinforcement', template: 'No late-night orders.' },
  { key: 'ss_rf_02', behavior: 'stress_spending', type: 'reinforcement', template: 'Quiet night.' },
  { key: 'ss_rf_03', behavior: 'stress_spending', type: 'reinforcement', template: 'Different response tonight.' },
  { key: 'ss_rf_04', behavior: 'stress_spending', type: 'reinforcement', template: 'The urge passed.' },
  { key: 'ss_rf_05', behavior: 'stress_spending', type: 'reinforcement', template: 'Stress. No spending.' },

  // END OF MONTH - IMMEDIATE MIRROR
  { key: 'eom_im_01', behavior: 'end_of_month', type: 'immediate_mirror', template: 'Day 24.', momentTypes: ['FIRST_BREACH', 'COLLAPSE_START'] },
  { key: 'eom_im_02', behavior: 'end_of_month', type: 'immediate_mirror', template: 'Last week of month.', momentTypes: ['FIRST_BREACH', 'COLLAPSE_START'] },
  { key: 'eom_im_03', behavior: 'end_of_month', type: 'immediate_mirror', template: 'End of month territory.' },
  { key: 'eom_im_04', behavior: 'end_of_month', type: 'immediate_mirror', template: 'The final stretch.' },
  { key: 'eom_im_05', behavior: 'end_of_month', type: 'immediate_mirror', template: 'Familiar timing.' },
  { key: 'eom_im_06', behavior: 'end_of_month', type: 'immediate_mirror', template: 'The pattern knows the calendar.' },

  // END OF MONTH - PATTERN REFLECTION
  { key: 'eom_pr_01', behavior: 'end_of_month', type: 'pattern_reflection', template: 'Started strong. Slipping now.', momentTypes: ['FIRST_BREACH'] },
  { key: 'eom_pr_02', behavior: 'end_of_month', type: 'pattern_reflection', template: 'Same as last month. Same days.', momentTypes: ['COLLAPSE_START'] },
  { key: 'eom_pr_03', behavior: 'end_of_month', type: 'pattern_reflection', template: 'The pattern repeats.' },
  { key: 'eom_pr_04', behavior: 'end_of_month', type: 'pattern_reflection', template: "Budget held. Then didn't.", momentTypes: ['FIRST_BREACH'] },
  { key: 'eom_pr_05', behavior: 'end_of_month', type: 'pattern_reflection', template: 'Twenty days in. Letting go.', momentTypes: ['COLLAPSE_START'] },
  { key: 'eom_pr_06', behavior: 'end_of_month', type: 'pattern_reflection', template: 'History repeating.' },

  // END OF MONTH - REINFORCEMENT
  { key: 'eom_rf_01', behavior: 'end_of_month', type: 'reinforcement', template: 'Day 25. Still holding.' },
  { key: 'eom_rf_02', behavior: 'end_of_month', type: 'reinforcement', template: 'Different this month.' },
  { key: 'eom_rf_03', behavior: 'end_of_month', type: 'reinforcement', template: 'The pattern broke.' },
  { key: 'eom_rf_04', behavior: 'end_of_month', type: 'reinforcement', template: 'End of month. Still here.' },
  { key: 'eom_rf_05', behavior: 'end_of_month', type: 'reinforcement', template: 'Past the usual breaking point.' },
];

export const WIN_MESSAGES: Record<string, string[]> = {
  pattern_break: ['The pattern broke.', 'Different today.', 'Not this time.', 'Skipped.'],
  improvement: ['Different this week.', 'Less than before.', 'Something shifted.'],
  streak_7: ['Seven days.', 'One week.'],
  streak_14: ['Two weeks.', 'Fourteen days.'],
  streak_30: ['One month.', 'Thirty days.'],
  streak_60: ['Two months.', 'Sixty days.'],
  streak_90: ['Three months.', 'Ninety days.'],
};

export function selectMessage(
  behavior: BehaviorType,
  interventionType: InterventionType,
  momentType: BehavioralMomentType | null,
  recentMessageKeys: string[]
): InterventionMessage | null {
  let candidates = INTERVENTION_MESSAGES.filter(m =>
    m.behavior === behavior && m.type === interventionType
  );

  if (candidates.length === 0) return null;

  if (momentType) {
    const matches = candidates.filter(m => m.momentTypes?.includes(momentType));
    if (matches.length > 0) candidates = matches;
  }

  const unused = candidates.filter(m => !recentMessageKeys.includes(m.key));
  const pool = unused.length > 0 ? unused : candidates;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function selectWinMessage(winType: string, streakDays?: number): string {
  let key = winType;
  if (winType === 'streak_milestone' && streakDays) key = `streak_${streakDays}`;
  const messages = WIN_MESSAGES[key];
  if (!messages?.length) return 'Something changed.';
  return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================
// FIX #4: Extended Moment Type Messages
// ============================================

export const EXTENDED_MOMENT_MESSAGES: InterventionMessage[] = [
  // WEEKEND_SPLURGE
  { key: 'ws_im_01', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Weekend mode.', momentTypes: ['WEEKEND_SPLURGE'] },
  { key: 'ws_im_02', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Saturday spending.', momentTypes: ['WEEKEND_SPLURGE'] },
  { key: 'ws_pr_01', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Weekends hit different.', momentTypes: ['WEEKEND_SPLURGE'] },

  // PAYDAY_SURGE
  { key: 'ps_im_01', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Fresh funds.', momentTypes: ['PAYDAY_SURGE'] },
  { key: 'ps_im_02', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Payday energy.', momentTypes: ['PAYDAY_SURGE'] },
  { key: 'ps_pr_01', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Money came. Money going.', momentTypes: ['PAYDAY_SURGE'] },

  // IMPULSE_CHAIN
  { key: 'ic_im_01', behavior: 'stress_spending', type: 'immediate_mirror', template: 'Another one.', momentTypes: ['IMPULSE_CHAIN'] },
  { key: 'ic_im_02', behavior: 'stress_spending', type: 'immediate_mirror', template: 'Quick succession.', momentTypes: ['IMPULSE_CHAIN'] },
  { key: 'ic_pr_01', behavior: 'stress_spending', type: 'pattern_reflection', template: 'Three in thirty minutes.', momentTypes: ['IMPULSE_CHAIN'] },

  // BOREDOM_BROWSE
  { key: 'bb_im_01', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Passing time.', momentTypes: ['BOREDOM_BROWSE'] },
  { key: 'bb_im_02', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Idle hands.', momentTypes: ['BOREDOM_BROWSE'] },
  { key: 'bb_pr_01', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Browsing became buying.', momentTypes: ['BOREDOM_BROWSE'] },

  // CATEGORY_BINGE
  { key: 'cb_im_01', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Same category again.', momentTypes: ['CATEGORY_BINGE'] },
  { key: 'cb_im_02', behavior: 'small_recurring', type: 'immediate_mirror', template: 'On a theme.', momentTypes: ['CATEGORY_BINGE'] },
  { key: 'cb_pr_01', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Deep in one category.', momentTypes: ['CATEGORY_BINGE'] },

  // BUDGET_NEAR_LIMIT
  { key: 'bnl_im_01', behavior: 'end_of_month', type: 'immediate_mirror', template: 'Getting close.', momentTypes: ['BUDGET_NEAR_LIMIT'] },
  { key: 'bnl_im_02', behavior: 'end_of_month', type: 'immediate_mirror', template: 'Near the edge.', momentTypes: ['BUDGET_NEAR_LIMIT'] },
  { key: 'bnl_pr_01', behavior: 'end_of_month', type: 'pattern_reflection', template: 'Budget watching closely.', momentTypes: ['BUDGET_NEAR_LIMIT'] },

  // SEASONAL_TRIGGER
  { key: 'st_im_01', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Tis the season.', momentTypes: ['SEASONAL_TRIGGER'] },
  { key: 'st_im_02', behavior: 'small_recurring', type: 'immediate_mirror', template: 'Holiday mode.', momentTypes: ['SEASONAL_TRIGGER'] },
  { key: 'st_pr_01', behavior: 'small_recurring', type: 'pattern_reflection', template: 'Seasonal spending activated.', momentTypes: ['SEASONAL_TRIGGER'] },
];

// Combine all messages
export const ALL_INTERVENTION_MESSAGES = [...INTERVENTION_MESSAGES, ...EXTENDED_MOMENT_MESSAGES];

// ============================================
// FIX #5: Dynamic Message Variation System
// ============================================

export interface MessageContext {
  amount?: number;
  category?: string;
  timeOfDay?: string;
  dayOfWeek?: string;
  transactionCount?: number;
  streak?: number;
}

/**
 * Dynamic message templates with placeholders
 */
export const DYNAMIC_MESSAGE_TEMPLATES: Record<string, string[]> = {
  small_recurring_immediate: [
    '{category} again.',
    '${amount} at {category}.',
    'Third {category} this week.',
    '{timeOfDay} ritual.',
  ],
  stress_spending_immediate: [
    '{timeOfDay} comfort.',
    'Another one at {hour}.',
    'Number {count} tonight.',
  ],
  end_of_month_immediate: [
    'Day {day}.',
    '{daysLeft} days left.',
    'End of month territory.',
  ],
};

/**
 * Generate a dynamic message with context
 */
export function generateDynamicMessage(
  behavior: BehaviorType,
  interventionType: InterventionType,
  context: MessageContext,
  recentMessageKeys: string[]
): string | null {
  const templateKey = `${behavior}_${interventionType}`;
  const templates = DYNAMIC_MESSAGE_TEMPLATES[templateKey];

  if (!templates || templates.length === 0) {
    return null;
  }

  // Filter out recently used templates
  const available = templates.filter((_, idx) =>
    !recentMessageKeys.includes(`${templateKey}_${idx}`)
  );

  const pool = available.length > 0 ? available : templates;
  const template = pool[Math.floor(Math.random() * pool.length)];

  // Replace placeholders with context values
  let message = template;

  if (context.amount) {
    message = message.replace('{amount}', context.amount.toFixed(2));
  }
  if (context.category) {
    message = message.replace('{category}', formatCategory(context.category));
  }
  if (context.timeOfDay) {
    message = message.replace('{timeOfDay}', context.timeOfDay);
    message = message.replace('{hour}', context.timeOfDay);
  }
  if (context.transactionCount) {
    message = message.replace('{count}', String(context.transactionCount));
  }

  // Date-based replacements
  const now = new Date();
  message = message.replace('{day}', String(now.getDate()));
  message = message.replace('{daysLeft}', String(daysLeftInMonth()));

  // Clean up any unreplaced placeholders
  message = message.replace(/\{[^}]+\}/g, '');

  return message.trim() || null;
}

function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

// ============================================
// FIX #6: A/B Testing Message Selection
// ============================================

export interface ABTestConfig {
  experimentId: string;
  variantId: string;
  messageMultiplier?: number;  // Adjust message frequency
  preferredTypes?: InterventionType[];  // Preferred intervention types
  customMessages?: InterventionMessage[];  // Custom messages for variant
}

/**
 * Select message with A/B testing support
 */
export function selectMessageWithABTest(
  behavior: BehaviorType,
  interventionType: InterventionType,
  momentType: BehavioralMomentType | null,
  recentMessageKeys: string[],
  abTestConfig?: ABTestConfig
): InterventionMessage | null {
  // If A/B test provides custom messages, use those first
  if (abTestConfig?.customMessages && abTestConfig.customMessages.length > 0) {
    const customMatches = abTestConfig.customMessages.filter(m =>
      m.behavior === behavior && m.type === interventionType
    );
    if (customMatches.length > 0) {
      const unused = customMatches.filter(m => !recentMessageKeys.includes(m.key));
      const pool = unused.length > 0 ? unused : customMatches;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // If A/B test prefers certain intervention types, check if current matches
  if (abTestConfig?.preferredTypes && !abTestConfig.preferredTypes.includes(interventionType)) {
    // Return null to skip intervention (A/B variant skips this type)
    return null;
  }

  // Fall back to standard selection
  return selectMessage(behavior, interventionType, momentType, recentMessageKeys);
}
