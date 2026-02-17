/**
 * AI Guardrails Service Tests
 * Tests for AI response validation and fallbacks
 */

import {
  validateAIResponse,
  getAIFallbackResponse,
  AI_FALLBACK_RESPONSES,
} from '../aiGuardrails';

// Helper to check if violations array contains a string matching pattern
function hasViolationMatching(violations: string[], pattern: string): boolean {
  return violations.some(v => v.toLowerCase().includes(pattern.toLowerCase()));
}

describe('aiGuardrails', () => {
  describe('validateAIResponse', () => {
    describe('valid responses', () => {
      it('should accept short neutral response', () => {
        const result = validateAIResponse('Noted.');

        expect(result.isValid).toBe(true);
        expect(result.violations).toHaveLength(0);
        expect(result.shouldBlock).toBe(false);
      });

      it('should accept observation within limits', () => {
        const result = validateAIResponse('The pattern continues. Same time, same place.');

        expect(result.isValid).toBe(true);
      });

      it('should accept response with exactly 25 words', () => {
        const words = Array(25).fill('word').join(' ') + '.';
        const result = validateAIResponse(words);

        expect(result.isValid).toBe(true);
      });
    });

    describe('word count violations', () => {
      it('should reject response over 25 words', () => {
        const words = Array(30).fill('word').join(' ');
        const result = validateAIResponse(words);

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'too long')).toBe(true);
      });
    });

    describe('forbidden phrases', () => {
      it('should reject "you should"', () => {
        const result = validateAIResponse('You should save more.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'you should')).toBe(true);
      });

      it('should reject "try to"', () => {
        const result = validateAIResponse('Try to spend less.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'try to')).toBe(true);
      });

      it('should reject "consider"', () => {
        const result = validateAIResponse('Consider this option.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'consider')).toBe(true);
      });

      it('should reject "great job"', () => {
        const result = validateAIResponse('Great job today.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'great job')).toBe(true);
      });

      it('should reject "keep it up"', () => {
        const result = validateAIResponse('Keep it up.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'keep it up')).toBe(true);
      });

      it('should reject "I understand"', () => {
        const result = validateAIResponse('I understand you well.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'i understand')).toBe(true);
      });

      it('should reject "I see"', () => {
        const result = validateAIResponse('I see the pattern.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'i see')).toBe(true);
      });

      it('should reject "I notice"', () => {
        const result = validateAIResponse('I notice this trend.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'i notice')).toBe(true);
      });
    });

    describe('exclamation violations', () => {
      it('should reject exclamation marks', () => {
        const result = validateAIResponse('Wow!');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains exclamation');
      });

      it('should reject multiple exclamation marks', () => {
        const result = validateAIResponse('Great! Amazing!');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains exclamation');
      });
    });

    describe('emoji violations', () => {
      it('should reject emoji in response', () => {
        const result = validateAIResponse('Good work 😊');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains emoji');
      });
    });

    describe('list violations', () => {
      it('should reject numbered lists', () => {
        const result = validateAIResponse('1. First item here.');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains list');
      });

      it('should reject bullet points', () => {
        const result = validateAIResponse('- First item');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains list');
      });

      it('should reject bullet character', () => {
        const result = validateAIResponse('• Item one');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains list');
      });
    });

    describe('shouldBlock flag', () => {
      it('should set shouldBlock for emoji violations', () => {
        const result = validateAIResponse('Test 😊');

        expect(result.shouldBlock).toBe(true);
      });

      it('should set shouldBlock for list violations', () => {
        const result = validateAIResponse('1. Item');

        expect(result.shouldBlock).toBe(true);
      });

      it('should not set shouldBlock for length violations only', () => {
        const words = Array(30).fill('word').join(' ');
        const result = validateAIResponse(words);

        expect(result.shouldBlock).toBe(false);
      });
    });

    describe('multiple violations', () => {
      it('should detect multiple issues', () => {
        const result = validateAIResponse('You should try to keep it up! 😊');

        expect(result.isValid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(2);
      });
    });
  });

  describe('getAIFallbackResponse', () => {
    it('should return string from default pool when behavior is null', () => {
      const response = getAIFallbackResponse(null);

      expect(typeof response).toBe('string');
      expect(AI_FALLBACK_RESPONSES.default).toContain(response);
    });

    it('should return string from small_recurring pool', () => {
      const response = getAIFallbackResponse('small_recurring');

      expect(typeof response).toBe('string');
      expect(AI_FALLBACK_RESPONSES.small_recurring).toContain(response);
    });

    it('should return string from stress_spending pool', () => {
      const response = getAIFallbackResponse('stress_spending');

      expect(typeof response).toBe('string');
      expect(AI_FALLBACK_RESPONSES.stress_spending).toContain(response);
    });

    it('should return string from end_of_month pool', () => {
      const response = getAIFallbackResponse('end_of_month');

      expect(typeof response).toBe('string');
      expect(AI_FALLBACK_RESPONSES.end_of_month).toContain(response);
    });

    it('should return default response for unknown behavior', () => {
      const response = getAIFallbackResponse('unknown_behavior' as any);

      expect(typeof response).toBe('string');
      expect(AI_FALLBACK_RESPONSES.default).toContain(response);
    });

    it('should return different responses (randomness)', () => {
      const responses = new Set();
      for (let i = 0; i < 20; i++) {
        responses.add(getAIFallbackResponse('small_recurring'));
      }

      // Should have gotten at least 2 different responses in 20 tries
      // (statistically very likely)
      expect(responses.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AI_FALLBACK_RESPONSES', () => {
    it('should have all required behavior keys', () => {
      expect(AI_FALLBACK_RESPONSES).toHaveProperty('default');
      expect(AI_FALLBACK_RESPONSES).toHaveProperty('small_recurring');
      expect(AI_FALLBACK_RESPONSES).toHaveProperty('stress_spending');
      expect(AI_FALLBACK_RESPONSES).toHaveProperty('end_of_month');
    });

    it('should have non-empty arrays for all keys', () => {
      Object.values(AI_FALLBACK_RESPONSES).forEach(responses => {
        expect(Array.isArray(responses)).toBe(true);
        expect(responses.length).toBeGreaterThan(0);
      });
    });

    it('should have responses that pass validation', () => {
      Object.values(AI_FALLBACK_RESPONSES).flat().forEach(response => {
        const result = validateAIResponse(response);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
