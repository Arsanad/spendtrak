/**
 * Financial Health Service Tests
 * Tests for health score calculation
 */

import {
  calculateHealthScore,
  getHealthFactorDetails,
  getSavingsRate,
  getEmergencyFundRatio,
} from '../financialHealth';

// Mock devStorage
jest.mock('../devStorage', () => ({
  getDevAssets: jest.fn().mockResolvedValue([
    { id: '1', name: 'Savings', category: 'savings', value: 5000 },
    { id: '2', name: 'Checking', category: 'checking', value: 2000 },
    { id: '3', name: 'Investment', category: 'investment', value: 10000 },
  ]),
  getDevLiabilities: jest.fn().mockResolvedValue([
    { id: '1', name: 'Credit Card', value: 1000 },
  ]),
  getDevBudgets: jest.fn().mockResolvedValue([
    { id: '1', category: 'food', amount: 500, spent: 450 },
    { id: '2', category: 'entertainment', amount: 200, spent: 180 },
  ]),
  getDevDebts: jest.fn().mockResolvedValue([
    { id: '1', name: 'Student Loan', balance: 5000 },
  ]),
}));

// Mock analytics
jest.mock('../analytics', () => ({
  getCashFlowTrend: jest.fn().mockResolvedValue([
    { month: 'Jan', income: 5000, expenses: 4000 },
    { month: 'Feb', income: 5000, expenses: 3800 },
    { month: 'Mar', income: 5200, expenses: 4100 },
  ]),
  getBudgetPerformance: jest.fn().mockResolvedValue([
    { category: 'food', budgeted: 500, spent: 450, percentage: 90 },
    { category: 'entertainment', budgeted: 200, spent: 180, percentage: 90 },
    { category: 'transport', budgeted: 300, spent: 350, percentage: 117 },
  ]),
}));

describe('financialHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateHealthScore', () => {
    it('should return overall score between 0 and 100', async () => {
      const result = await calculateHealthScore();

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should return valid grade', async () => {
      const result = await calculateHealthScore();

      expect(['Excellent', 'Good', 'Fair', 'Needs Work', 'Critical']).toContain(result.grade);
    });

    it('should return all factor scores', async () => {
      const result = await calculateHealthScore();

      expect(result.factors).toHaveProperty('savingsRate');
      expect(result.factors).toHaveProperty('debtRatio');
      expect(result.factors).toHaveProperty('budgetAdherence');
      expect(result.factors).toHaveProperty('emergencyFund');

      // All factors should be between 0-100
      Object.values(result.factors).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should return detail values', async () => {
      const result = await calculateHealthScore();

      expect(result.details).toHaveProperty('savingsRateActual');
      expect(result.details).toHaveProperty('debtToAssetRatio');
      expect(result.details).toHaveProperty('budgetAdherenceAvg');
      expect(result.details).toHaveProperty('emergencyFundMonths');
    });

    it('should calculate correct savings rate', async () => {
      const result = await calculateHealthScore();

      // With income of ~15200 and expenses of ~11900, savings rate should be ~21.7%
      expect(result.details.savingsRateActual).toBeGreaterThan(15);
      expect(result.details.savingsRateActual).toBeLessThan(30);
    });

    it('should return Excellent grade for high scores', async () => {
      const { getDevAssets, getDevLiabilities, getDevDebts } = require('../devStorage');
      const { getCashFlowTrend, getBudgetPerformance } = require('../analytics');

      // Mock excellent financial situation
      getDevAssets.mockResolvedValueOnce([
        { id: '1', name: 'Savings', category: 'savings', value: 50000 },
        { id: '2', name: 'Checking', category: 'checking', value: 10000 },
      ]);
      getDevLiabilities.mockResolvedValueOnce([]);
      getDevDebts.mockResolvedValueOnce([]);
      getCashFlowTrend.mockResolvedValueOnce([
        { month: 'Jan', income: 10000, expenses: 5000 },
        { month: 'Feb', income: 10000, expenses: 5000 },
        { month: 'Mar', income: 10000, expenses: 5000 },
      ]);
      getBudgetPerformance.mockResolvedValueOnce([
        { category: 'food', budgeted: 500, spent: 400, percentage: 80 },
      ]);

      const result = await calculateHealthScore();

      expect(result.overall).toBeGreaterThan(80);
    });
  });

  describe('getHealthFactorDetails', () => {
    it('should return details for all factors', async () => {
      const details = await getHealthFactorDetails();

      expect(details).toHaveLength(4);
      expect(details.map(d => d.name)).toEqual([
        'Savings Rate',
        'Debt Ratio',
        'Budget Adherence',
        'Emergency Fund',
      ]);
    });

    it('should include score, actual, target, status, and tip', async () => {
      const details = await getHealthFactorDetails();

      details.forEach(detail => {
        expect(detail).toHaveProperty('name');
        expect(detail).toHaveProperty('score');
        expect(detail).toHaveProperty('actual');
        expect(detail).toHaveProperty('target');
        expect(detail).toHaveProperty('status');
        expect(detail).toHaveProperty('tip');
      });
    });

    it('should have valid status values', async () => {
      const details = await getHealthFactorDetails();

      details.forEach(detail => {
        expect(['good', 'warning', 'poor']).toContain(detail.status);
      });
    });
  });

  describe('getSavingsRate', () => {
    it('should return savings rate percentage', async () => {
      const rate = await getSavingsRate();

      expect(typeof rate).toBe('number');
    });

    it('should return positive rate when income > expenses', async () => {
      const rate = await getSavingsRate();

      expect(rate).toBeGreaterThan(0);
    });

    it('should return 0 when no income', async () => {
      const { getCashFlowTrend } = require('../analytics');
      getCashFlowTrend.mockResolvedValueOnce([
        { month: 'Jan', income: 0, expenses: 1000 },
        { month: 'Feb', income: 0, expenses: 1000 },
        { month: 'Mar', income: 0, expenses: 1000 },
      ]);

      const rate = await getSavingsRate();

      expect(rate).toBe(0);
    });
  });

  describe('getEmergencyFundRatio', () => {
    it('should return months of expenses covered', async () => {
      const ratio = await getEmergencyFundRatio();

      expect(typeof ratio).toBe('number');
      expect(ratio).toBeGreaterThanOrEqual(0);
    });

    it('should calculate based on liquid assets', async () => {
      // With savings (5000) + checking (2000) = 7000 liquid
      // Average monthly expenses = ~3967
      // Months covered = ~1.76
      const ratio = await getEmergencyFundRatio();

      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(3);
    });

    it('should return 12 when no expenses', async () => {
      const { getCashFlowTrend } = require('../analytics');
      getCashFlowTrend.mockResolvedValueOnce([
        { month: 'Jan', income: 5000, expenses: 0 },
        { month: 'Feb', income: 5000, expenses: 0 },
        { month: 'Mar', income: 5000, expenses: 0 },
      ]);

      const ratio = await getEmergencyFundRatio();

      expect(ratio).toBe(12);
    });
  });
});
