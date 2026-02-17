/**
 * SpendTrak Behavioral Engine v2.0
 * Message Validator - Ensures messages follow language rules
 */

const FORBIDDEN = {
  advice: ['you should', 'you could', 'try to', 'consider', 'maybe', 'perhaps', 'i suggest', 'i recommend'],
  motivation: ['great job', 'well done', 'good job', 'awesome', 'keep it up', 'keep going', 'you can do it'],
  judgment: ['bad', 'wrong', 'mistake', 'error', 'problem', 'issue', 'careful', 'warning'],
  aiTells: ['i understand', 'i see', 'i notice', 'i can see', 'based on your', 'according to'],
};

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  sanitized: string;
}

export function validateMessage(message: string): ValidationResult {
  const violations: string[] = [];
  const lower = message.toLowerCase();

  const wordCount = message.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 12) violations.push(`Too many words: ${wordCount}/12`);
  if (message.length > 60) violations.push(`Too long: ${message.length}/60 chars`);

  Object.values(FORBIDDEN).flat().forEach(phrase => {
    if (lower.includes(phrase)) violations.push(`Forbidden: "${phrase}"`);
  });

  if (message.includes('!')) violations.push('Contains exclamation');
  if (message.includes('?')) violations.push('Contains question');
  if (/[\u{1F600}-\u{1F64F}]/u.test(message)) violations.push('Contains emoji');
  if (message.trim().match(/^I\s|^I'/i)) violations.push('Starts with "I"');

  return {
    isValid: violations.length === 0,
    violations,
    sanitized: violations.length > 0 ? sanitize(message) : message,
  };
}

function sanitize(message: string): string {
  let s = message.replace(/!/g, '.').replace(/\?/g, '.').replace(/\.+/g, '.');
  const words = s.split(/\s+/);
  if (words.length > 12) s = words.slice(0, 12).join(' ');
  if (!s.trim().endsWith('.')) s = s.trim() + '.';
  return s;
}
