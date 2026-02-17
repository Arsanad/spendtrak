/**
 * SpendTrak Behavioral Engine v2.0
 * AI Guardrails - Validates AI responses and provides fallbacks
 */

import type { BehaviorType } from '../config/behavioralConstants';

export interface AIValidationResult {
  isValid: boolean;
  violations: string[];
  shouldBlock: boolean;
}

export function validateAIResponse(response: string): AIValidationResult {
  const violations: string[] = [];
  const lower = response.toLowerCase();

  const wordCount = response.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 25) violations.push(`Response too long: ${wordCount} words`);

  const forbidden = ['you should', 'try to', 'consider', 'great job', 'keep it up', 'i understand', 'i see', 'i notice'];
  forbidden.forEach(phrase => {
    if (lower.includes(phrase)) violations.push(`Forbidden: "${phrase}"`);
  });

  if ((response.match(/!/g) || []).length > 0) violations.push('Contains exclamation');
  if (/[\u{1F600}-\u{1F64F}]/gu.test(response)) violations.push('Contains emoji');
  if (/\d+\.\s/.test(response) || /^\s*[-•]\s/m.test(response)) violations.push('Contains list');

  const shouldBlock = violations.some(v =>
    v.includes('advice') || v.includes('motivation') || v.includes('emoji') || v.includes('list')
  );

  return { isValid: violations.length === 0, violations, shouldBlock };
}

export const AI_FALLBACK_RESPONSES: Record<string, string[]> = {
  default: ['Noted.', 'Watching.', 'Patterns emerge.'],
  small_recurring: ['The habit continues.', 'Same pattern.', 'Familiar territory.'],
  stress_spending: ['Late hours.', 'Comfort seeking.', 'The pattern shows.'],
  end_of_month: ['End of month.', 'The cycle continues.', 'Familiar timing.'],
};

export function getAIFallbackResponse(behavior: BehaviorType | null): string {
  const pool = behavior
    ? AI_FALLBACK_RESPONSES[behavior] || AI_FALLBACK_RESPONSES.default
    : AI_FALLBACK_RESPONSES.default;
  return pool[Math.floor(Math.random() * pool.length)];
}
