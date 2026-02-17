/**
 * Date Presets Service Tests
 */

import {
  getBuiltInPresetDateRange,
  parseNaturalDate,
  BUILT_IN_PRESETS,
} from '../datePresets';

// Helper to format date using toISOString (matching the service behavior)
function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

describe('Date Presets Service', () => {
  describe('BUILT_IN_PRESETS', () => {
    it('should have all required presets', () => {
      const presetIds = BUILT_IN_PRESETS.map((p) => p.id);

      expect(presetIds).toContain('today');
      expect(presetIds).toContain('yesterday');
      expect(presetIds).toContain('last-7-days');
      expect(presetIds).toContain('last-30-days');
      expect(presetIds).toContain('this-month');
      expect(presetIds).toContain('last-month');
      expect(presetIds).toContain('this-year');
    });
  });

  describe('getBuiltInPresetDateRange', () => {
    it('should return correct range for today', () => {
      const range = getBuiltInPresetDateRange('today');
      // Service sets hours to 0,0,0,0 then uses toISOString
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(range.startDate).toBe(formatISODate(today));
      expect(range.endDate).toBe(formatISODate(today));
    });

    it('should return correct range for yesterday', () => {
      const range = getBuiltInPresetDateRange('yesterday');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(range.startDate).toBe(formatISODate(yesterday));
      expect(range.endDate).toBe(formatISODate(yesterday));
    });

    it('should return correct range for last-7-days', () => {
      const range = getBuiltInPresetDateRange('last-7-days');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(today);
      start.setDate(start.getDate() - 6);

      expect(range.startDate).toBe(formatISODate(start));
      expect(range.endDate).toBe(formatISODate(today));
    });

    it('should return correct range for last-30-days', () => {
      const range = getBuiltInPresetDateRange('last-30-days');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(today);
      start.setDate(start.getDate() - 29);

      expect(range.startDate).toBe(formatISODate(start));
      expect(range.endDate).toBe(formatISODate(today));
    });

    it('should return correct range for this-month', () => {
      const range = getBuiltInPresetDateRange('this-month');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      expect(range.startDate).toBe(formatISODate(startOfMonth));
      expect(range.endDate).toBe(formatISODate(endOfMonth));
    });

    it('should return correct range for last-month', () => {
      const range = getBuiltInPresetDateRange('last-month');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      expect(range.startDate).toBe(formatISODate(startOfLastMonth));
      expect(range.endDate).toBe(formatISODate(endOfLastMonth));
    });

    it('should return correct range for this-year', () => {
      const range = getBuiltInPresetDateRange('this-year');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);

      expect(range.startDate).toBe(formatISODate(startOfYear));
      expect(range.endDate).toBe(formatISODate(endOfYear));
    });

    it('should return correct range for last-year', () => {
      const range = getBuiltInPresetDateRange('last-year');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);

      expect(range.startDate).toBe(formatISODate(startOfLastYear));
      expect(range.endDate).toBe(formatISODate(endOfLastYear));
    });

    it('should throw error for unknown preset', () => {
      expect(() => getBuiltInPresetDateRange('invalid-preset' as any)).toThrow(
        'Unknown preset: invalid-preset'
      );
    });
  });

  describe('parseNaturalDate', () => {
    it('should parse "last N days"', () => {
      const range = parseNaturalDate('last 5 days');
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 5);

      expect(range).not.toBeNull();
      expect(range!.startDate).toBe(formatISODate(start));
      expect(range!.endDate).toBe(formatISODate(today));
    });

    it('should parse "last N weeks"', () => {
      const range = parseNaturalDate('last 2 weeks');
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 14);

      expect(range).not.toBeNull();
      expect(range!.startDate).toBe(formatISODate(start));
      expect(range!.endDate).toBe(formatISODate(today));
    });

    it('should parse "last N months"', () => {
      const range = parseNaturalDate('last 3 months');
      const today = new Date();
      const start = new Date(today);
      start.setMonth(start.getMonth() - 3);

      expect(range).not.toBeNull();
      expect(range!.startDate).toBe(formatISODate(start));
      expect(range!.endDate).toBe(formatISODate(today));
    });

    it('should parse "past N days" (alias for last)', () => {
      const range = parseNaturalDate('past 7 days');
      const today = new Date();

      expect(range).not.toBeNull();
      expect(range!.endDate).toBe(formatISODate(today));
    });

    it('should parse month names with year', () => {
      const range = parseNaturalDate('january 2024');

      expect(range).not.toBeNull();
      // January 2024 - service uses toISOString which may shift dates
      const startOfJan = new Date(2024, 0, 1);
      const endOfJan = new Date(2024, 1, 0);
      expect(range!.startDate).toBe(formatISODate(startOfJan));
      expect(range!.endDate).toBe(formatISODate(endOfJan));
    });

    it('should parse short month names', () => {
      const range = parseNaturalDate('jan 2024');

      expect(range).not.toBeNull();
      const startOfJan = new Date(2024, 0, 1);
      const endOfJan = new Date(2024, 1, 0);
      expect(range!.startDate).toBe(formatISODate(startOfJan));
      expect(range!.endDate).toBe(formatISODate(endOfJan));
    });

    it('should parse year only', () => {
      const range = parseNaturalDate('2023');

      expect(range).not.toBeNull();
      // Year-only returns hardcoded strings in the service
      expect(range!.startDate).toBe('2023-01-01');
      expect(range!.endDate).toBe('2023-12-31');
    });

    it('should return null for unrecognized input', () => {
      const range = parseNaturalDate('gibberish');

      expect(range).toBeNull();
    });

    it('should return null for empty input', () => {
      const range = parseNaturalDate('');

      expect(range).toBeNull();
    });
  });
});
