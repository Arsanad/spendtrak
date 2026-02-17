/**
 * Message Validator Service Tests
 * Tests for intervention message validation
 */

import { validateMessage } from '../messageValidator';

// Helper to check if violations array contains a string matching pattern
function hasViolationMatching(violations: string[], pattern: string): boolean {
  return violations.some(v => v.toLowerCase().includes(pattern.toLowerCase()));
}

describe('messageValidator', () => {
  describe('validateMessage', () => {
    describe('valid messages', () => {
      it('should accept short, neutral statement', () => {
        const result = validateMessage('Another coffee.');

        expect(result.isValid).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should accept observation without advice', () => {
        const result = validateMessage('The pattern continues.');

        expect(result.isValid).toBe(true);
      });

      it('should accept message with exactly 12 words', () => {
        // 12 words, short enough to stay under 60 chars
        const result = validateMessage('A b c d e f g h i j k l.');

        expect(result.isValid).toBe(true);
      });

      it('should accept message with 60 characters or less', () => {
        const message = 'This message is exactly sixty characters in total length.';
        expect(message.length).toBeLessThanOrEqual(60);

        const result = validateMessage(message);

        expect(result.isValid).toBe(true);
      });
    });

    describe('word count violations', () => {
      it('should reject message with more than 12 words', () => {
        const result = validateMessage('a b c d e f g h i j k l m.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'too many words')).toBe(true);
      });
    });

    describe('character length violations', () => {
      it('should reject message longer than 60 characters', () => {
        const longMessage = 'This is a very long message that exceeds the sixty character limits.';
        expect(longMessage.length).toBeGreaterThan(60);

        const result = validateMessage(longMessage);

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'too long')).toBe(true);
      });
    });

    describe('forbidden phrases - advice', () => {
      it('should reject "you should"', () => {
        const result = validateMessage('You should do this.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'you should')).toBe(true);
      });

      it('should reject "you could"', () => {
        const result = validateMessage('You could try that.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'you could')).toBe(true);
      });

      it('should reject "try to"', () => {
        const result = validateMessage('Try to save more.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'try to')).toBe(true);
      });

      it('should reject "consider"', () => {
        const result = validateMessage('Consider the options.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'consider')).toBe(true);
      });

      it('should reject "i suggest"', () => {
        // Note: The forbidden phrase is "i suggest" specifically
        const result = validateMessage('They i suggest now.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'i suggest')).toBe(true);
      });
    });

    describe('forbidden phrases - motivation', () => {
      it('should reject "great job"', () => {
        const result = validateMessage('Great job today.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'great job')).toBe(true);
      });

      it('should reject "keep it up"', () => {
        const result = validateMessage('Keep it up now.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'keep it up')).toBe(true);
      });

      it('should reject "you can do it"', () => {
        const result = validateMessage('You can do it.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'you can do it')).toBe(true);
      });
    });

    describe('forbidden phrases - judgment', () => {
      it('should reject "bad"', () => {
        const result = validateMessage('That was bad.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'bad')).toBe(true);
      });

      it('should reject "mistake"', () => {
        const result = validateMessage('A mistake here.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'mistake')).toBe(true);
      });

      it('should reject "careful"', () => {
        const result = validateMessage('Be careful now.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'careful')).toBe(true);
      });
    });

    describe('forbidden phrases - AI tells', () => {
      it('should reject "I understand"', () => {
        const result = validateMessage('I understand you.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'i understand')).toBe(true);
      });

      it('should reject "I notice"', () => {
        const result = validateMessage('I notice this.');

        expect(result.isValid).toBe(false);
        expect(hasViolationMatching(result.violations, 'i notice')).toBe(true);
      });
    });

    describe('punctuation violations', () => {
      it('should reject exclamation marks', () => {
        const result = validateMessage('Wow!');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains exclamation');
      });

      it('should reject question marks', () => {
        const result = validateMessage('Really?');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains question');
      });
    });

    describe('emoji violations', () => {
      it('should reject messages with emoji', () => {
        const result = validateMessage('Good day 😊');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Contains emoji');
      });
    });

    describe('starting with I violations', () => {
      it('should reject messages starting with "I "', () => {
        const result = validateMessage('I see patterns.');

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Starts with "I"');
      });

      it('should reject messages starting with "I\'"', () => {
        const result = validateMessage("I've noticed this.");

        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Starts with "I"');
      });
    });

    describe('sanitization', () => {
      it('should replace exclamation marks with periods', () => {
        const result = validateMessage('Wow!');

        expect(result.sanitized).toBe('Wow.');
      });

      it('should replace question marks with periods', () => {
        const result = validateMessage('Really?');

        expect(result.sanitized).toBe('Really.');
      });

      it('should truncate to 12 words', () => {
        const result = validateMessage('a b c d e f g h i j k l m n.');

        const sanitizedWords = result.sanitized.split(/\s+/).filter(w => w.length > 0);
        expect(sanitizedWords.length).toBeLessThanOrEqual(12);
      });

      it('should add period if message has violations', () => {
        // Use exclamation to trigger a violation and sanitization
        const result = validateMessage('Test message here!');

        expect(result.sanitized).toMatch(/\.$/);
      });

      it('should collapse multiple periods', () => {
        const result = validateMessage('Test...message!');

        expect(result.sanitized).not.toContain('..');
      });
    });

    describe('multiple violations', () => {
      it('should detect multiple violations', () => {
        const result = validateMessage('You should try! 😊');

        expect(result.isValid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(1);
      });
    });
  });
});
