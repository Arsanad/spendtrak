/**
 * SPENDTRAK CINEMATIC EDITION - Financial Health Service
 * Calculates overall financial health score and component metrics
 */

import {
  getDevAssets,
  getDevLiabilities,
  getDevBudgets,
  getDevDebts,
} from './devStorage';
import { getCashFlowTrend, getBudgetPerformance } from './analytics';

// ============================================
// TYPES
// ============================================

export type HealthGrade = 'Excellent' | 'Good' | 'Fair' | 'Needs Work' | 'Critical';

export interface HealthScore {
  overall: number; // 0-100
  grade: HealthGrade;
  factors: {
    savingsRate: number;      // 0-100
    debtRatio: number;        // 0-100
    budgetAdherence: number;  // 0-100
    emergencyFund: number;    // 0-100
  };
  details: {
    savingsRateActual: number;     // Actual savings rate percentage
    debtToAssetRatio: number;      // Actual debt to asset ratio
    budgetAdherenceAvg: number;    // Average budget adherence
    emergencyFundMonths: number;   // Months of expenses covered
  };
  /** True if there's enough data to calculate a meaningful score */
  hasEnoughData: boolean;
  /** Message explaining what data is missing */
  dataStatus: string;
}

export interface HealthFactorDetails {
  name: string;
  score: number;
  actual: string;
  target: string;
  status: 'good' | 'warning' | 'poor';
  tip: string;
}

// ============================================
// SCORE CALCULATION WEIGHTS
// ============================================

const WEIGHTS = {
  savingsRate: 0.30,      // 30%
  debtRatio: 0.25,        // 25%
  budgetAdherence: 0.25,  // 25%
  emergencyFund: 0.20,    // 20%
};

// ============================================
// GRADE THRESHOLDS
// ============================================

function getGrade(score: number): HealthGrade {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}

// ============================================
// SAVINGS RATE SCORE
// ============================================

/**
 * Calculate savings rate score
 * Target: 20%+ savings rate = 100 points
 * Formula: (income - expenses) / income * 100
 */
async function calculateSavingsRateScore(): Promise<{ score: number; actual: number }> {
  const cashFlow = await getCashFlowTrend(3);

  // Use average of last 3 months for stability
  const totalIncome = cashFlow.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = cashFlow.reduce((sum, m) => sum + m.expenses, 0);

  if (totalIncome === 0) {
    return { score: 0, actual: 0 };
  }

  const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;

  // Score mapping:
  // 20%+ savings rate = 100 points
  // 15% = 85 points
  // 10% = 70 points
  // 5% = 50 points
  // 0% = 30 points
  // Negative = 0-30 based on how negative

  let score: number;
  if (savingsRate >= 20) {
    score = 100;
  } else if (savingsRate >= 15) {
    score = 85 + ((savingsRate - 15) / 5) * 15;
  } else if (savingsRate >= 10) {
    score = 70 + ((savingsRate - 10) / 5) * 15;
  } else if (savingsRate >= 5) {
    score = 50 + ((savingsRate - 5) / 5) * 20;
  } else if (savingsRate >= 0) {
    score = 30 + (savingsRate / 5) * 20;
  } else {
    // Negative savings rate
    score = Math.max(0, 30 + savingsRate); // -30% = 0
  }

  return { score: Math.min(100, Math.max(0, score)), actual: savingsRate };
}

// ============================================
// DEBT RATIO SCORE
// ============================================

/**
 * Calculate debt ratio score
 * Based on debt-to-asset ratio
 * Lower debt = higher score
 */
async function calculateDebtRatioScore(): Promise<{ score: number; actual: number }> {
  const [assets, liabilities, debts] = await Promise.all([
    getDevAssets(),
    getDevLiabilities(),
    getDevDebts(),
  ]);

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0);

  const totalDebt = totalLiabilities + totalDebts;

  // If no assets, check if there's debt
  if (totalAssets === 0) {
    if (totalDebt === 0) {
      return { score: 100, actual: 0 }; // No assets, no debt = neutral
    }
    return { score: 20, actual: 100 }; // Debt but no assets = poor
  }

  const debtRatio = (totalDebt / totalAssets) * 100;

  // Score mapping:
  // 0% debt ratio = 100 points
  // 10% = 90 points
  // 25% = 75 points
  // 50% = 50 points
  // 75% = 25 points
  // 100%+ = 0-10 points

  let score: number;
  if (debtRatio <= 0) {
    score = 100;
  } else if (debtRatio <= 10) {
    score = 100 - (debtRatio / 10) * 10;
  } else if (debtRatio <= 25) {
    score = 90 - ((debtRatio - 10) / 15) * 15;
  } else if (debtRatio <= 50) {
    score = 75 - ((debtRatio - 25) / 25) * 25;
  } else if (debtRatio <= 75) {
    score = 50 - ((debtRatio - 50) / 25) * 25;
  } else if (debtRatio <= 100) {
    score = 25 - ((debtRatio - 75) / 25) * 15;
  } else {
    score = Math.max(0, 10 - (debtRatio - 100) / 10);
  }

  return { score: Math.min(100, Math.max(0, score)), actual: debtRatio };
}

// ============================================
// BUDGET ADHERENCE SCORE
// ============================================

/**
 * Calculate budget adherence score
 * Based on average of all budget adherence percentages
 * Staying within budget = high score
 */
async function calculateBudgetAdherenceScore(): Promise<{ score: number; actual: number }> {
  const performance = await getBudgetPerformance();

  if (performance.length === 0) {
    // No budgets set up - give a neutral score
    return { score: 70, actual: 100 };
  }

  // Calculate average adherence
  // For budgets under limit: score based on how close to limit (using is good)
  // For budgets over limit: penalize proportionally

  const scores = performance.map(p => {
    if (p.percentage <= 100) {
      // Under budget - good!
      // 50-100% usage is optimal (using your budget)
      // Under 50% might mean budget is too high
      if (p.percentage >= 50) {
        return 100;
      }
      return 50 + p.percentage; // 0% = 50, 50% = 100
    } else {
      // Over budget - bad
      // 101-110% = 80-90
      // 111-125% = 50-80
      // 126-150% = 20-50
      // 150%+ = 0-20
      if (p.percentage <= 110) {
        return 90 - ((p.percentage - 100) / 10) * 10;
      } else if (p.percentage <= 125) {
        return 80 - ((p.percentage - 110) / 15) * 30;
      } else if (p.percentage <= 150) {
        return 50 - ((p.percentage - 125) / 25) * 30;
      } else {
        return Math.max(0, 20 - ((p.percentage - 150) / 50) * 20);
      }
    }
  });

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const avgAdherence = performance.reduce((sum, p) => sum + p.percentage, 0) / performance.length;

  return { score: Math.min(100, Math.max(0, avgScore)), actual: avgAdherence };
}

// ============================================
// EMERGENCY FUND SCORE
// ============================================

/**
 * Calculate emergency fund score
 * Target: 6 months of expenses in liquid assets
 */
async function calculateEmergencyFundScore(): Promise<{ score: number; actual: number }> {
  const [assets, cashFlow] = await Promise.all([
    getDevAssets(),
    getCashFlowTrend(3),
  ]);

  // Calculate average monthly expenses
  const avgMonthlyExpenses = cashFlow.reduce((sum, m) => sum + m.expenses, 0) / cashFlow.length;

  if (avgMonthlyExpenses === 0) {
    return { score: 100, actual: 12 }; // No expenses = infinite runway
  }

  // Liquid assets = Savings, Checking (not property, vehicles, investments)
  const liquidCategories = ['savings', 'checking', 'Savings', 'Checking'];
  const liquidAssets = assets
    .filter(a => liquidCategories.includes(a.category))
    .reduce((sum, a) => sum + a.value, 0);

  const monthsCovered = liquidAssets / avgMonthlyExpenses;

  // Score mapping:
  // 6+ months = 100 points
  // 5 months = 90 points
  // 4 months = 80 points
  // 3 months = 65 points
  // 2 months = 45 points
  // 1 month = 25 points
  // 0 months = 0 points

  let score: number;
  if (monthsCovered >= 6) {
    score = 100;
  } else if (monthsCovered >= 5) {
    score = 90 + (monthsCovered - 5) * 10;
  } else if (monthsCovered >= 4) {
    score = 80 + (monthsCovered - 4) * 10;
  } else if (monthsCovered >= 3) {
    score = 65 + (monthsCovered - 3) * 15;
  } else if (monthsCovered >= 2) {
    score = 45 + (monthsCovered - 2) * 20;
  } else if (monthsCovered >= 1) {
    score = 25 + (monthsCovered - 1) * 20;
  } else {
    score = monthsCovered * 25;
  }

  return { score: Math.min(100, Math.max(0, score)), actual: monthsCovered };
}

// ============================================
// MAIN HEALTH SCORE CALCULATION
// ============================================

/**
 * Calculate comprehensive financial health score
 */
export async function calculateHealthScore(): Promise<HealthScore> {
  // First, check what data we have
  const [cashFlow, assets, budgets] = await Promise.all([
    getCashFlowTrend(3),
    getDevAssets(),
    getDevBudgets(),
  ]);

  // Determine data availability
  const hasTransactions = cashFlow.some(m => m.income > 0 || m.expenses > 0);
  const hasAssets = assets.length > 0;
  const hasBudgets = budgets.length > 0;

  // Build status message
  const missingData: string[] = [];
  if (!hasTransactions) missingData.push('transactions');
  if (!hasAssets) missingData.push('assets');
  if (!hasBudgets) missingData.push('budgets');

  const hasEnoughData = hasTransactions || hasAssets || hasBudgets;
  let dataStatus = '';

  if (!hasEnoughData) {
    dataStatus = 'Add transactions, budgets, or assets to see your financial health score';
  } else if (missingData.length > 0) {
    dataStatus = `Add ${missingData.join(', ')} for a more accurate score`;
  } else {
    dataStatus = 'Score based on your complete financial data';
  }

  const [savingsResult, debtResult, budgetResult, emergencyResult] = await Promise.all([
    calculateSavingsRateScore(),
    calculateDebtRatioScore(),
    calculateBudgetAdherenceScore(),
    calculateEmergencyFundScore(),
  ]);

  // Calculate weighted overall score
  const overall = Math.round(
    savingsResult.score * WEIGHTS.savingsRate +
    debtResult.score * WEIGHTS.debtRatio +
    budgetResult.score * WEIGHTS.budgetAdherence +
    emergencyResult.score * WEIGHTS.emergencyFund
  );

  return {
    overall,
    grade: getGrade(overall),
    factors: {
      savingsRate: Math.round(savingsResult.score),
      debtRatio: Math.round(debtResult.score),
      budgetAdherence: Math.round(budgetResult.score),
      emergencyFund: Math.round(emergencyResult.score),
    },
    details: {
      savingsRateActual: savingsResult.actual,
      debtToAssetRatio: debtResult.actual,
      budgetAdherenceAvg: budgetResult.actual,
      emergencyFundMonths: emergencyResult.actual,
    },
    hasEnoughData,
    dataStatus,
  };
}

/**
 * Get detailed breakdown of each health factor
 */
export async function getHealthFactorDetails(): Promise<HealthFactorDetails[]> {
  const healthScore = await calculateHealthScore();

  const getStatus = (score: number): 'good' | 'warning' | 'poor' => {
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'poor';
  };

  return [
    {
      name: 'Savings Rate',
      score: healthScore.factors.savingsRate,
      actual: `${healthScore.details.savingsRateActual.toFixed(1)}%`,
      target: '20%+',
      status: getStatus(healthScore.factors.savingsRate),
      tip: healthScore.factors.savingsRate < 70
        ? 'Try to save at least 20% of your income each month'
        : 'Great job! Keep maintaining your savings rate',
    },
    {
      name: 'Debt Ratio',
      score: healthScore.factors.debtRatio,
      actual: `${healthScore.details.debtToAssetRatio.toFixed(1)}%`,
      target: '<25%',
      status: getStatus(healthScore.factors.debtRatio),
      tip: healthScore.factors.debtRatio < 70
        ? 'Focus on paying down high-interest debt first'
        : 'Your debt levels are well managed',
    },
    {
      name: 'Budget Adherence',
      score: healthScore.factors.budgetAdherence,
      actual: `${healthScore.details.budgetAdherenceAvg.toFixed(0)}%`,
      target: '≤100%',
      status: getStatus(healthScore.factors.budgetAdherence),
      tip: healthScore.factors.budgetAdherence < 70
        ? 'Review your spending categories and adjust budgets'
        : 'You\'re staying within your budgets well',
    },
    {
      name: 'Emergency Fund',
      score: healthScore.factors.emergencyFund,
      actual: `${healthScore.details.emergencyFundMonths.toFixed(1)} mo`,
      target: '6 months',
      status: getStatus(healthScore.factors.emergencyFund),
      tip: healthScore.factors.emergencyFund < 70
        ? 'Build up 6 months of expenses in accessible savings'
        : 'Your emergency fund is in good shape',
    },
  ];
}

/**
 * Get savings rate percentage
 */
export async function getSavingsRate(): Promise<number> {
  const result = await calculateSavingsRateScore();
  return result.actual;
}

/**
 * Get emergency fund ratio (months covered)
 */
export async function getEmergencyFundRatio(): Promise<number> {
  const result = await calculateEmergencyFundScore();
  return result.actual;
}

export default {
  calculateHealthScore,
  getHealthFactorDetails,
  getSavingsRate,
  getEmergencyFundRatio,
};
