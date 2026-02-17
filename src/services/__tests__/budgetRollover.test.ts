/**
 * Budget Rollover Service Tests
 */

import {
  getBudgetPeriodDates,
  getPreviousPeriodDates,
  getEffectiveBudget,
} from '../budgetRollover';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Budget Rollover Service', () => {
  describe('getBudgetPeriodDates', () => {
    // Mock date: January 15, 2024 (Monday)
    const testDate = new Date('2024-01-15T12:00:00Z');

    it('should return correct monthly period dates', () => {
      const { start, end } = getBudgetPeriodDates('monthly', testDate);

      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(0); // January
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(0); // January
      expect(end.getDate()).toBe(31);
    });

    it('should return correct weekly period dates', () => {
      const { start, end } = getBudgetPeriodDates('weekly', testDate);

      // Week starts on Sunday
      expect(start.getDay()).toBe(0); // Sunday
      expect(end.getDay()).toBe(6); // Saturday
    });

    it('should return correct yearly period dates', () => {
      const { start, end } = getBudgetPeriodDates('yearly', testDate);

      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(0); // January
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(11); // December
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getPreviousPeriodDates', () => {
    const testDate = new Date('2024-01-15T12:00:00Z');

    it('should return previous month for monthly period', () => {
      const { start, end } = getPreviousPeriodDates('monthly', testDate);

      expect(start.getFullYear()).toBe(2023);
      expect(start.getMonth()).toBe(11); // December
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2023);
      expect(end.getMonth()).toBe(11); // December
      expect(end.getDate()).toBe(31);
    });

    it('should return previous week for weekly period', () => {
      const { start, end } = getPreviousPeriodDates('weekly', testDate);

      // Should be 7 days before
      const expectedStart = new Date(testDate);
      expectedStart.setDate(expectedStart.getDate() - 7);

      expect(start.getDate()).toBeLessThan(testDate.getDate());
    });

    it('should return previous year for yearly period', () => {
      const { start, end } = getPreviousPeriodDates('yearly', testDate);

      expect(start.getFullYear()).toBe(2023);
      expect(start.getMonth()).toBe(0); // January
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2023);
      expect(end.getMonth()).toBe(11); // December
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getEffectiveBudget', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should calculate effective budget with rollover', async () => {
      const mockBudget = {
        id: 'budget-1',
        user_id: 'user-123',
        amount: 500,
        rollover_enabled: true,
        rollover_amount: 100,
        max_rollover: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockBudget, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getEffectiveBudget('budget-1');

      expect(result.baseBudget).toBe(500);
      expect(result.rolloverAmount).toBe(100);
      expect(result.effectiveTotal).toBe(600); // 500 + 100
    });

    it('should return zero rollover when disabled', async () => {
      const mockBudget = {
        id: 'budget-1',
        user_id: 'user-123',
        amount: 500,
        rollover_enabled: false,
        rollover_amount: 100, // Should be ignored
        max_rollover: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockBudget, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getEffectiveBudget('budget-1');

      expect(result.baseBudget).toBe(500);
      expect(result.rolloverAmount).toBe(0);
      expect(result.effectiveTotal).toBe(500);
    });

    it('should throw error when budget not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(getEffectiveBudget('nonexistent')).rejects.toThrow(
        'Budget not found'
      );
    });
  });
});
