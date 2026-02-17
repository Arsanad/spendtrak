/**
 * Budget Calculator
 * Pure function: income + pain points → budget suggestions
 */

import type {
  IncomeFrequency,
  FinancialSituation,
  BudgetSuggestion,
} from '@/types/onboarding';
import { FINANCIAL_SITUATION_CONFIG } from '@/types/onboarding';
import { DEFAULT_CATEGORIES } from '@/config/categories';

/** Category weight map – percentages of allocable income */
const CATEGORY_WEIGHTS: Record<string, number> = {
  'food-dining': 0.25,
  'transportation': 0.15,
  'shopping': 0.12,
  'entertainment': 0.08,
  'bills-utilities': 0.15,
  'health': 0.08,
  'travel': 0.05,
  'education': 0.05,
  'personal-care': 0.04,
  'housing': 0.00, // Typically handled separately
  'family': 0.03,
  'other': 0.00,
};

/**
 * Normalize any income frequency to a monthly amount
 */
function normalizeToMonthly(income: number, frequency: IncomeFrequency): number {
  switch (frequency) {
    case 'weekly':
      return income * 4.33;
    case 'biweekly':
      return income * 2.167;
    case 'yearly':
      return income / 12;
    case 'monthly':
    default:
      return income;
  }
}

/**
 * Round to nearest $5
 */
function roundToFive(n: number): number {
  return Math.round(n / 5) * 5;
}

/**
 * Calculate budget suggestions based on user input
 */
export function calculateBudgets(
  income: number,
  frequency: IncomeFrequency,
  situation: FinancialSituation,
  painPoints: string[],
): BudgetSuggestion[] {
  const monthlyIncome = normalizeToMonthly(income, frequency);
  if (monthlyIncome <= 0) return [];

  const savingsRate = FINANCIAL_SITUATION_CONFIG[situation].savingsRate;
  const allocable = monthlyIncome * (1 - savingsRate);

  // Only create budgets for selected pain-point categories
  const selected = painPoints.length > 0 ? painPoints : ['food-dining', 'transportation', 'shopping'];

  // Calculate total weight of selected categories
  const totalWeight = selected.reduce((sum, id) => sum + (CATEGORY_WEIGHTS[id] ?? 0.05), 0);

  // Generate suggestions
  const suggestions: BudgetSuggestion[] = selected.map((categoryId) => {
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    const rawWeight = CATEGORY_WEIGHTS[categoryId] ?? 0.05;
    // Normalize weight so selected categories fill the allocable budget
    const normalizedWeight = rawWeight / totalWeight;
    const rawAmount = allocable * normalizedWeight;
    const amount = Math.max(roundToFive(rawAmount), 5);

    return {
      categoryId,
      categoryName: cat?.name ?? categoryId,
      categoryIcon: cat?.icon ?? 'ellipsis-horizontal',
      amount,
      percentage: Math.round(normalizedWeight * 100),
    };
  });

  // Constraint: total must never exceed monthly income
  const total = suggestions.reduce((s, b) => s + b.amount, 0);
  if (total > monthlyIncome) {
    const scale = monthlyIncome / total;
    suggestions.forEach((b) => {
      b.amount = Math.max(roundToFive(b.amount * scale), 5);
    });
  }

  return suggestions;
}
